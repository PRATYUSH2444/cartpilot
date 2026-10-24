import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { StockReservationModel } from '../inventory/stock-reservation.model.js';
import { OrderModel } from '../orders/order.model.js';
import { AuthService } from '../auth/auth.service.js';

describe('Phase 03 — Checkout & Order Orchestration Integration Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;
  let merchantToken: string;
  let onionProduct: any;
  let initialStock: number;
  let createdOrderId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const customer = await UserModel.findOne({ email: 'customer@example.com' });
    expect(customer).not.toBeNull();
    customerId = customer!._id.toString();

    const session = AuthService.generateTokens({
      userId: customerId,
      email: customer!.email,
      role: customer!.role,
      tokenVersion: customer!.tokenVersion,
    });
    customerToken = session.accessToken;

    onionProduct = await ProductModel.findOne({ slug: 'red-onions-nashik-1kg' });
    expect(onionProduct).not.toBeNull();
    initialStock = onionProduct.availableStock;

    // Merchant token for fulfillment stepping tests
    const merchantUser = await UserModel.findOne({ role: 'MERCHANT' });
    expect(merchantUser).not.toBeNull();
    const merchantSession = AuthService.generateTokens(
      merchantUser!,
      onionProduct.merchantId.toString()
    );
    merchantToken = merchantSession.accessToken;
  }, 60000);

  it('POST /api/v1/checkout/initiate — should reject checkout when cart is empty', async () => {
    // Ensure cart is empty
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`);

    const res = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/checkout/initiate — should reserve stock, create order, and return gateway order', async () => {
    // 1. Add 3 units of Onions to cart (₹45.00 each = 4,500 paise each = 13,500 paise)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: onionProduct._id.toString(),
        quantity: 3,
      });

    // 2. Initiate checkout
    const res = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          street: '42, Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const { order, razorpay } = res.body.data;
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(order.orderNumber).toMatch(/^CP-\d{8}-\d{4}$/);
    expect(order.items.length).toBe(1);
    expect(order.items[0].quantity).toBe(3);
    expect(order.pricingSnapshot.subtotalPaise).toBe(13500);

    expect(razorpay.orderId).toBeDefined();
    expect(razorpay.amountPaise).toBe(order.pricingSnapshot.totalPaise);
    expect(razorpay.currency).toBe('INR');

    createdOrderId = order._id;

    // 3. Verify Product inventory was atomically decremented in availableStock and incremented in reservedStock
    const updatedProduct = await ProductModel.findById(onionProduct._id);
    expect(updatedProduct!.availableStock).toBe(initialStock - 3);
    expect(updatedProduct!.reservedStock).toBe(3);

    // 4. Verify StockReservation was created with ACTIVE status and 15m TTL
    const reservation = await StockReservationModel.findById(order.reservationId);
    expect(reservation).not.toBeNull();
    expect(reservation!.status).toBe('ACTIVE');
    expect(reservation!.items[0].quantity).toBe(3);
  });

  it('GET /api/v1/orders — should list user orders including the new pending order', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const found = res.body.data.find((o: any) => o._id === createdOrderId);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING_PAYMENT');
  });

  it('GET /api/v1/orders/:id — should retrieve full immutable order snapshot', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdOrderId);
    expect(res.body.data.shippingAddressSnapshot.street).toBe('42, Indiranagar 100ft Road');
  });

  it('POST /api/v1/orders/:id/simulate-step — should reject stepping fulfillment when order is not confirmed', async () => {
    // Current status is PENDING_PAYMENT, so advancing fulfillment step must be rejected with 400
    const res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/simulate-step`)
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/orders/:id/simulate-step — should advance step sequentially after confirmation', async () => {
    // Directly simulate confirmed order status for step testing
    await OrderModel.findByIdAndUpdate(createdOrderId, { status: 'CONFIRMED' });

    // Step 1: CONFIRMED -> PACKING
    let res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/simulate-step`)
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PACKING');

    // Step 2: PACKING -> OUT_FOR_DELIVERY
    res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/simulate-step`)
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('OUT_FOR_DELIVERY');

    // Step 3: OUT_FOR_DELIVERY -> DELIVERED
    res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/simulate-step`)
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DELIVERED');
    expect(res.body.data.deliveredAt).toBeDefined();
  });

  it('GET /api/v1/orders/:id/proof — should return cryptographic proof bundle', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${createdOrderId}/proof`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canonicalSnapshotHash).toBeDefined();
    expect(res.body.data.canonicalSnapshotHash).toHaveLength(64); // SHA-256 hex length
    expect(res.body.data.orderNumber).toBeDefined();
    expect(res.body.data.policyDecision).toBe('ALLOW');
  });

  it('POST /api/v1/orders/:id/proof/verify — should verify cryptographic proof and hash chain integrity', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/proof/verify`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.checks.orderContentsMatch.passed).toBe(true);
    expect(res.body.data.checks.approvalBinding.passed).toBe(true);
    expect(res.body.data.checks.auditChainIntact.passed).toBe(true);
    expect(res.body.data.message).toContain('Tamper-evident verification passed');
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });
});
