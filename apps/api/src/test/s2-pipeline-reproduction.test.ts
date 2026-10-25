import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import request from 'supertest';
import { UserModel } from '../modules/users/user.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { ChatMessageModel } from '../modules/chat/chat-message.model.js';
import { MerchantModel } from '../modules/merchants/merchant.model.js';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { runSeed } from '../database/seed.js';

describe('Task S2 Pipeline Reproduction & Bug Fix Verification', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let customerUser: any;
  let merchantUser: any;
  let customerToken: string;
  let merchantToken: string;
  let merchantDoc: any;
  let products: any[];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await runSeed(false);
    app = createApp();

    // Fetch seeded merchant
    merchantDoc = await MerchantModel.findOne({ slug: 'fresh-greens-organics' });
    expect(merchantDoc).not.toBeNull();

    // Create verified test customer
    customerUser = await UserModel.create({
      name: 'Priya Verma',
      email: 'priya.pipeline@cartpilot.in',
      passwordHash: 'hashed_pw_2026',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    customerToken = AuthService.generateAccessToken(customerUser);

    // Create verified merchant user
    merchantUser = await UserModel.create({
      name: 'Fresh Greens Manager',
      email: 'manager.freshgreens@cartpilot.in',
      passwordHash: 'hashed_pw_2026',
      role: 'MERCHANT',
      merchantId: merchantDoc._id,
      isActive: true,
      tokenVersion: 0,
    });
    merchantToken = AuthService.generateAccessToken(merchantUser, merchantDoc._id.toString());

    // Setup high auto-approve mandate for automated testing
    await MandateModel.create({
      userId: customerUser._id,
      version: 1,
      autoApproveUpToPaise: 300000,
      perOrderCapPaise: 300000,
      dailyCapPaise: 500000,
      blockedCategories: [],
      requireExplicitApproval: false,
      isActive: true,
    });

    // Fetch 3 distinct products for this merchant
    products = await ProductModel.find({ merchantId: merchantDoc._id, isActive: true }).limit(3);
    expect(products.length).toBeGreaterThanOrEqual(3);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Reproduction 1: +1 on product adds it, preserved in checkout and chat payment card without disappearing', async () => {
    // 1. Add item 1 with quantity 1
    const p1 = products[0];
    const addRes1 = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: p1._id.toString(), quantity: 1 });
    expect(addRes1.status).toBe(200);

    // 2. +1 on item 1 (increment to 2)
    const updateRes = await request(app)
      .patch(`/api/v1/cart/items/${p1._id.toString()}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 2 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.items[0].quantity).toBe(2);

    // 3. Initiate checkout: creates order and reservation
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        deliveryNote: 'Leave at front door with security',
      });
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);

    const orderData = checkoutRes.body.data.order;
    expect(orderData.items).toHaveLength(1);
    expect(orderData.items[0].quantity).toBe(2);
    expect(orderData.items[0].productId).toBe(p1._id.toString());
    expect(orderData.deliveryNote).toBe('Leave at front door with security');

    // 4. Create chat session and post payment card
    const sessionRes = await request(app)
      .post('/api/v1/chat/sessions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Order Flow Session' });
    const sessionId = sessionRes.body.data._id;

    const cardRes = await request(app)
      .post(`/api/v1/chat/sessions/${sessionId}/cards`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        type: 'order',
        resourceId: orderData._id,
      });
    expect(cardRes.status).toBe(201);
    expect(cardRes.body.data.cardType).toBe('order');

    // 5. Verify the persisted chat message retains full order and line item data
    const sessionGetRes = await request(app)
      .get(`/api/v1/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(sessionGetRes.status).toBe(200);

    const orderMsg = sessionGetRes.body.data.messages.find((m: any) => m.cardType === 'order');
    expect(orderMsg).toBeDefined();
    expect(orderMsg.cardData.items).toHaveLength(1);
    expect(orderMsg.cardData.items[0].name).toBe(p1.name);
    expect(orderMsg.cardData.items[0].quantity).toBe(2);
    expect(orderMsg.cardData.deliveryNote).toBe('Leave at front door with security');
  });

  it('Reproduction 2: Merchant sees multi-item order as all distinct products with no single-product flattening', async () => {
    // Clear cart first
    await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    // Add 3 different items to cart
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: products[i]._id.toString(), quantity: i + 1 });
      expect(res.status).toBe(200);
    }

    // Set delivery note on cart
    const noteRes = await request(app)
      .patch('/api/v1/cart/delivery-note')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ deliveryNote: 'Call on arrival - gate passcode #4021' });
    expect(noteRes.status).toBe(200);
    expect(noteRes.body.data.deliveryNote).toBe('Call on arrival - gate passcode #4021');

    // Initiate checkout
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(checkoutRes.status).toBe(201);
    const orderId = checkoutRes.body.data.order._id;

    // Simulate payment confirmation so order is CONFIRMED
    await OrderModel.findByIdAndUpdate(orderId, { status: 'CONFIRMED' });

    // Merchant retrieves store orders via GET /api/v1/orders
    const merchantOrdersRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(merchantOrdersRes.status).toBe(200);
    expect(merchantOrdersRes.body.success).toBe(true);

    const retrievedOrder = merchantOrdersRes.body.data.find((o: any) => o._id === orderId);
    expect(retrievedOrder).toBeDefined();

    // Verify all 3 distinct items are present and intact (NOT flattened to 1 item)
    expect(retrievedOrder.items).toHaveLength(3);
    const names = retrievedOrder.items.map((it: any) => it.name);
    expect(names).toContain(products[0].name);
    expect(names).toContain(products[1].name);
    expect(names).toContain(products[2].name);

    // Verify quantities match
    expect(retrievedOrder.items.find((it: any) => it.name === products[0].name).quantity).toBe(1);
    expect(retrievedOrder.items.find((it: any) => it.name === products[1].name).quantity).toBe(2);
    expect(retrievedOrder.items.find((it: any) => it.name === products[2].name).quantity).toBe(3);

    // Verify delivery note is visible to merchant
    expect(retrievedOrder.deliveryNote).toBe('Call on arrival - gate passcode #4021');
  });

  it('Reproduction 3: Merchant order total reconciles mathematically with item lines and fee structure down to exact paise', async () => {
    // Fetch an existing multi-item order
    const ordersRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(ordersRes.status).toBe(200);

    const multiItemOrder = ordersRes.body.data.find((o: any) => o.items && o.items.length === 3);
    expect(multiItemOrder).toBeDefined();

    // Sum individual item line subtotals
    let calculatedSubtotalPaise = 0;
    for (const item of multiItemOrder.items) {
      expect(Number.isInteger(item.unitPricePaise)).toBe(true);
      expect(Number.isInteger(item.quantity)).toBe(true);
      expect(Number.isInteger(item.subtotalPaise)).toBe(true);

      // Verify item.subtotalPaise == unitPricePaise * quantity
      expect(item.subtotalPaise).toBe(item.unitPricePaise * item.quantity);
      calculatedSubtotalPaise += item.subtotalPaise;
    }

    const pricing = multiItemOrder.pricingSnapshot;
    expect(Number.isInteger(pricing.subtotalPaise)).toBe(true);
    expect(Number.isInteger(pricing.deliveryFeePaise)).toBe(true);
    expect(Number.isInteger(pricing.taxPaise)).toBe(true);
    expect(Number.isInteger(pricing.discountPaise)).toBe(true);
    expect(Number.isInteger(pricing.totalPaise)).toBe(true);

    // Invariant 1: pricingSnapshot.subtotalPaise MUST equal exact sum of line items
    expect(pricing.subtotalPaise).toBe(calculatedSubtotalPaise);

    // Invariant 2: totalPaise MUST reconcile with integer fee breakdown
    const platformFeePaise = pricing.platformFeePaise || 0;
    const expectedTotalPaise = Math.max(
      0,
      pricing.subtotalPaise + pricing.deliveryFeePaise + platformFeePaise + pricing.taxPaise - pricing.discountPaise
    );
    expect(pricing.totalPaise).toBe(expectedTotalPaise);
  });
});
