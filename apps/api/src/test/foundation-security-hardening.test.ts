import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';
import { UserModel } from '../modules/users/user.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { StockReservationModel } from '../modules/inventory/stock-reservation.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { approvalService } from '../modules/approvals/approval.service.js';
import { InventoryService } from '../modules/inventory/inventory.service.js';
import { GeminiProvider } from '../integrations/llm/gemini.provider.js';
import { resetRateLimits } from '../common/middleware/rate-limiter.js';
import { env } from '../config/env.config.js';

describe('Phase 01 — Foundation Security Hardening, Invariants & Abuse Prevention', () => {
  const app = createApp();

  let customerAToken: string;
  let customerAId: string;

  let customerBToken: string;

  let merchantAToken: string;
  let merchantAStoreId: string;

  let merchantBToken: string;
  let merchantBStoreId: string;

  let adminToken: string;

  let potatoProduct: any;

  beforeAll(async () => {
    await setupTestDatabase();

    // 1. Fetch seeded Customer A (customer@example.com)
    const custA = await UserModel.findOne({ email: 'customer@example.com' });
    expect(custA).not.toBeNull();
    customerAId = custA!._id.toString();
    customerAToken = AuthService.generateTokens(custA!).accessToken;

    // 2. Create distinct Customer B
    const custB = await UserModel.create({
      name: 'Customer B',
      email: 'customer-b@example.com',
      passwordHash: 'hashed_pw',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    customerBToken = AuthService.generateTokens(custB).accessToken;

    // 3. Fetch seeded Merchant A (Fresh Greens Organics)
    const merchA = await UserModel.findOne({ email: 'merchant@freshgrocers.com' });
    expect(merchA).not.toBeNull();
    const loginA = await AuthService.loginUser({
      email: 'merchant@freshgrocers.com',
      password: 'Merchant1234!',
    });
    merchantAToken = loginA.accessToken;
    merchantAStoreId = loginA.user.merchantId!;

    // 4. Create distinct Merchant B with its own store
    merchantBStoreId = new mongoose.Types.ObjectId().toString();
    const merchB = await UserModel.create({
      name: 'Merchant B Owner',
      email: 'merchant-b@example.com',
      passwordHash: 'hashed_pw',
      role: 'MERCHANT',
      isActive: true,
      tokenVersion: 0,
    });
    merchantBToken = AuthService.generateTokens(merchB, merchantBStoreId).accessToken;

    // 5. Fetch seeded Admin
    const admin = await UserModel.findOne({ email: 'admin@cartpilot.com' });
    adminToken = AuthService.generateTokens(admin!).accessToken;

    // 6. Find a test product
    potatoProduct = await ProductModel.findOne({ slug: 'fresh-potatoes-1kg' });
    expect(potatoProduct).not.toBeNull();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  // ---------------------------------------------------------------------------
  // 1. Customer cannot call merchant or admin routes
  // ---------------------------------------------------------------------------
  it('RBAC Enforcement — Customer cannot access Admin-only /audit/events route', async () => {
    const res = await request(app)
      .get('/api/v1/audit/events')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('RBAC Enforcement — Admin CAN access /audit/events route', async () => {
    const res = await request(app)
      .get('/api/v1/audit/events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 2. Tenant isolation: Merchant A cannot read or edit Merchant B's orders
  // ---------------------------------------------------------------------------
  it('Tenant Isolation — Merchant B cannot access or step an order belonging to Merchant A', async () => {
    // Create an order for Customer A fulfilled by Merchant A
    const orderA = await OrderModel.create({
      orderNumber: 'CP-TEST-TENANT-A',
      userId: new mongoose.Types.ObjectId(customerAId),
      merchantId: new mongoose.Types.ObjectId(merchantAStoreId),
      status: 'CONFIRMED',
      items: [
        {
          productId: potatoProduct._id,
          name: potatoProduct.name,
          category: potatoProduct.category,
          unitPricePaise: potatoProduct.pricePaise,
          quantity: 1,
          subtotalPaise: potatoProduct.pricePaise,
          packageSize: potatoProduct.packageSize,
          packageUnit: potatoProduct.packageUnit,
        },
      ],
      pricingSnapshot: {
        subtotalPaise: potatoProduct.pricePaise,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: potatoProduct.pricePaise,
      },
      shippingAddressSnapshot: {
        street: '123 Market St',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
      placedAt: new Date(),
    });

    // Merchant B attempts to fetch Order A
    const getRes = await request(app)
      .get(`/api/v1/orders/${orderA._id}`)
      .set('Authorization', `Bearer ${merchantBToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error.code).toBe('FORBIDDEN');

    // Merchant B attempts to advance Order A
    const stepRes = await request(app)
      .post(`/api/v1/orders/${orderA._id}/simulate-step`)
      .set('Authorization', `Bearer ${merchantBToken}`);

    expect(stepRes.status).toBe(403);
    expect(stepRes.body.error.code).toBe('FORBIDDEN');

    // Merchant A CAN view and manage Order A
    const getResA = await request(app)
      .get(`/api/v1/orders/${orderA._id}`)
      .set('Authorization', `Bearer ${merchantAToken}`);
    expect(getResA.status).toBe(200);
    expect(getResA.body.data.orderNumber).toBe('CP-TEST-TENANT-A');
  });

  // ---------------------------------------------------------------------------
  // 3. IDOR Checks: User A cannot access User B's orders, chat sessions, approvals
  // ---------------------------------------------------------------------------
  it('IDOR Protection — Customer B cannot view Customer A order', async () => {
    const orderA = await OrderModel.findOne({ orderNumber: 'CP-TEST-TENANT-A' });
    expect(orderA).not.toBeNull();

    const res = await request(app)
      .get(`/api/v1/orders/${orderA!._id}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('IDOR Protection — Customer B cannot access Customer A chat session', async () => {
    // Create chat session for Customer A
    const createSessionRes = await request(app)
      .post('/api/v1/chat/sessions')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ title: 'Customer A Private Cart' });

    expect(createSessionRes.status).toBe(201);
    const sessionId = createSessionRes.body.data._id;

    // Customer B attempts to view Customer A's session
    const getRes = await request(app)
      .get(`/api/v1/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error.code).toBe('FORBIDDEN');

    // Customer B attempts to send message to Customer A's session
    const sendRes = await request(app)
      .post(`/api/v1/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ content: 'Malicious injected message' });

    expect(sendRes.status).toBe(403);
  });

  it('IDOR Protection — Customer B cannot approve Customer A pending approval', async () => {
    // Create pending approval record for Customer A
    const approval = await approvalService.createOrGetPendingApproval({
      userId: customerAId,
      cartId: new mongoose.Types.ObjectId().toString(),
      cartVersion: 1,
      mandateVersion: 1,
      calculatedTotalPaise: 95000,
    });

    // Customer B attempts to approve Customer A's approval
    const approveRes = await request(app)
      .post(`/api/v1/approvals/${approval._id}/approve`)
      .set('Authorization', `Bearer ${customerBToken}`);

    expect(approveRes.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // 4. Concurrency test: Two checkouts competing for the last unit
  // ---------------------------------------------------------------------------
  it('Concurrency Invariant — Only one checkout succeeds when stock equals 1', async () => {
    // Create a product with available stock = 1
    const scarceProduct = await ProductModel.create({
      name: 'Rare Organic Saffron 1g',
      slug: `scarce-saffron-${Date.now()}`,
      category: 'SPICES',
      description: 'Extremely limited edition saffron',
      pricePaise: 20000, // ₹200.00 (total ~₹250 with delivery, within ₹300 auto-approval limit)
      packageSize: 1,
      packageUnit: 'G',
      availableStock: 1,
      reservedStock: 0,
      isVegetarian: true,
      isActive: true,
      merchantId: new mongoose.Types.ObjectId(merchantAStoreId),
    });

    // Setup Cart for Customer A
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerAToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: scarceProduct._id.toString(), quantity: 1 });

    // Setup Cart for Customer B
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerBToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ productId: scarceProduct._id.toString(), quantity: 1 });

    // Both customers initiate checkout concurrently
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/checkout/initiate')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({}),
      request(app)
        .post('/api/v1/checkout/initiate')
        .set('Authorization', `Bearer ${customerBToken}`)
        .send({}),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses.some((s) => s === 400 || s === 409)).toBe(true);

    // Verify stock was decremented to 0 and not oversold (-1)
    const updatedProduct = await ProductModel.findById(scarceProduct._id);
    expect(updatedProduct!.availableStock).toBe(0);
    expect(updatedProduct!.reservedStock).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // 5. Idempotent payment verification
  // ---------------------------------------------------------------------------
  it('Payment Idempotency — Replaying payment verification on confirmed order is rejected', async () => {
    // Find an already confirmed order
    const confirmedOrder = await OrderModel.findOne({ orderNumber: 'CP-TEST-TENANT-A' });
    expect(confirmedOrder).not.toBeNull();

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        orderId: confirmedOrder!._id,
        razorpayOrderId: 'order_any_mock',
        razorpayPaymentId: 'pay_any_mock',
        razorpaySignature: 'test_sig_mock',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Order cannot be verified in current status');
  });

  // ---------------------------------------------------------------------------
  // 6. Expired reservation release sweeper
  // ---------------------------------------------------------------------------
  it('Inventory Invariant — Expired stock reservations are released and stock restored', async () => {
    // Create product with 10 available, 2 reserved
    const holdProduct = await ProductModel.create({
      name: 'Organic Cashews 500g',
      slug: `hold-cashews-${Date.now()}`,
      description: 'Crunchy whole cashews snack pack',
      category: 'SPICES',
      pricePaise: 80000,
      packageSize: 500,
      packageUnit: 'G',
      availableStock: 8,
      reservedStock: 2,
      isVegetarian: true,
      isActive: true,
      merchantId: new mongoose.Types.ObjectId(merchantAStoreId),
    });

    // Create expired reservation (expired 5 minutes ago)
    const expiredReservation = await StockReservationModel.create({
      userId: new mongoose.Types.ObjectId(customerAId),
      cartId: new mongoose.Types.ObjectId(),
      items: [{ productId: holdProduct._id, quantity: 2 }],
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    // Run background sweeper
    const sweptCount = await InventoryService.sweepExpiredReservations();
    expect(sweptCount).toBeGreaterThanOrEqual(1);

    // Verify reservation is now EXPIRED
    const updatedRes = await StockReservationModel.findById(expiredReservation._id);
    expect(updatedRes!.status).toBe('EXPIRED');

    // Verify product available stock was restored to 10 and reserved is 0
    const updatedProduct = await ProductModel.findById(holdProduct._id);
    expect(updatedProduct!.availableStock).toBe(10);
    expect(updatedProduct!.reservedStock).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 7. Approval replay on modified checkout/cart
  // ---------------------------------------------------------------------------
  it('Approval Invariant — Mutating cart after approval invalidates approval', async () => {
    // Setup initial cart
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerAToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: potatoProduct._id.toString(), quantity: 1 });

    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerAToken}`);
    const activeCartData = cartRes.body.data;

    // Request approval for cart version 1
    const approval = await approvalService.createOrGetPendingApproval({
      userId: customerAId,
      cartId: activeCartData.id,
      cartVersion: activeCartData.version,
      mandateVersion: 1,
      calculatedTotalPaise: activeCartData.pricing.totalPaise,
    });

    // Mutate cart by adding another item (bumps cart.version to 2)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: potatoProduct._id.toString(), quantity: 1 });

    // Attempting to grant approval on stale cart must be rejected
    await expect(approvalService.approve(customerAId, approval._id.toString())).rejects.toThrow(
      /INVALIDATED|modified/
    );
  });

  // ---------------------------------------------------------------------------
  // 8. Forged client totals are ignored in checkout
  // ---------------------------------------------------------------------------
  it('Financial Integrity — Client-supplied forged prices or totals are completely ignored', async () => {
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerAToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: potatoProduct._id.toString(), quantity: 2 });

    // Client attempts to send forged 1-paise total in request body
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        totalPaise: 1,
        pricePaise: 1,
        forgedAmount: 1,
      });

    expect(checkoutRes.status).toBe(201);
    const orderTotal = checkoutRes.body.data.order.pricingSnapshot.totalPaise;
    expect(orderTotal).toBeGreaterThan(1);
    expect(checkoutRes.body.data.razorpay.amountPaise).toBe(orderTotal);
  });

  // ---------------------------------------------------------------------------
  // 9. Auth rate limiting
  // ---------------------------------------------------------------------------
  it('Security Boundary — Auth rate limiter triggers 429 after 5 failed login attempts', async () => {
    resetRateLimits();

    const attackEmail = 'brute-force-target@example.com';
    const calls = [];

    // Send 5 rapid failed attempts
    for (let i = 0; i < 5; i++) {
      calls.push(
        request(app)
          .post('/api/v1/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: attackEmail, password: 'WrongPassword!' })
      );
    }
    await Promise.all(calls);

    // 6th attempt must be rejected with 429
    const blockedRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-rate-limit', 'true')
      .send({ email: attackEmail, password: 'WrongPassword!' });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
  });

  // ---------------------------------------------------------------------------
  // 10. Forgot password & Reset password flow
  // ---------------------------------------------------------------------------
  it('Auth Lifecycle — Forgot and reset password with token invalidates prior session', async () => {
    const targetEmail = 'customer@cartpilot.com';

    // 1. Request password reset
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: targetEmail });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);
    expect(forgotRes.body.data.devResetLink).toBeDefined();

    // Extract token from dev reset link
    const tokenMatch = forgotRes.body.data.devResetLink.match(/token=([a-f0-9]+)/);
    expect(tokenMatch).not.toBeNull();
    const resetToken = tokenMatch[1];

    // 2. Submit new password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, password: 'NewSecurePassword123!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 3. Old password now fails
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: targetEmail, password: 'Customer1234!' });

    expect(oldLoginRes.status).toBe(401);

    // 4. New password succeeds
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: targetEmail, password: 'NewSecurePassword123!' });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.accessToken).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // 11. Mock LLM fallback disabled in production
  // ---------------------------------------------------------------------------
  it('AI Governance — GeminiProvider throws 503 instead of falling back to mock in production', async () => {
    const originalEnv = env.NODE_ENV;
    try {
      (env as any).NODE_ENV = 'production';
      const provider = new GeminiProvider('invalid_gemini_key_for_test');

      await expect(
        provider.generateResponse(
          [{ role: 'user', content: 'Make Paneer Pulao for 4 people' }],
          [],
          'You are a helpful assistant'
        )
      ).rejects.toThrow('Conversational AI service is temporarily unavailable');
    } finally {
      (env as any).NODE_ENV = originalEnv;
    }
  });
});
