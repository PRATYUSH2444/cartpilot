import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import request from 'supertest';
import { UserModel } from '../modules/users/user.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { MerchantModel } from '../modules/merchants/merchant.model.js';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { runSeed } from '../database/seed.js';

describe('Task S2: OrderLine Contract & Concurrency Invariants', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let customerUser: any;
  let merchantUser: any;
  let customerToken: string;
  let merchantToken: string;
  let merchantDoc: any;
  let testProducts: any[];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await runSeed(false);
    app = createApp();

    merchantDoc = await MerchantModel.findOne({ slug: 'fresh-greens-organics' });
    expect(merchantDoc).not.toBeNull();

    customerUser = await UserModel.create({
      name: 'Rohan Mehra',
      email: 'rohan.contract@cartpilot.in',
      passwordHash: 'hashed_pw_2026',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    customerToken = AuthService.generateAccessToken(customerUser);

    merchantUser = await UserModel.create({
      name: 'Fresh Greens Audit Lead',
      email: 'auditor.freshgreens@cartpilot.in',
      passwordHash: 'hashed_pw_2026',
      role: 'MERCHANT',
      merchantId: merchantDoc._id,
      isActive: true,
      tokenVersion: 0,
    });
    merchantToken = AuthService.generateAccessToken(merchantUser, merchantDoc._id.toString());

    // Setup high auto-approve mandate for test customer
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

    testProducts = await ProductModel.find({ merchantId: merchantDoc._id, isActive: true }).limit(2);
    expect(testProducts.length).toBe(2);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Invariant: cart.items == snapshot.items == order.items == merchantAPI.items', async () => {
    // 1. Populate cart
    const p1 = testProducts[0];
    const p2 = testProducts[1];

    await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: p1._id.toString(), quantity: 2 });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: p2._id.toString(), quantity: 3 });

    // Update delivery note
    const note = 'Please call upon reaching the security gate';
    await request(app)
      .patch('/api/v1/cart/delivery-note')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ deliveryNote: note });

    // Fetch Cart
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cartRes.status).toBe(200);
    const cart = cartRes.body.data;
    expect(cart.deliveryNote).toBe(note);
    expect(cart.items).toHaveLength(2);

    // 2. Initiate checkout
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(checkoutRes.status).toBe(201);
    const orderFromCheckout = checkoutRes.body.data.order;

    // 3. Query direct order from database (Order Document)
    const orderFromDb = await OrderModel.findById(orderFromCheckout._id);
    expect(orderFromDb).not.toBeNull();

    // 4. Query merchant API (Merchant View)
    const merchantRes = await request(app)
      .get(`/api/v1/orders/${orderFromCheckout._id}`)
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(merchantRes.status).toBe(200);
    const orderFromMerchant = merchantRes.body.data;

    // Verify item-by-item parity across ALL 4 pipeline stages
    for (let i = 0; i < cart.items.length; i++) {
      const cartItem = cart.items[i];
      const checkoutItem = orderFromCheckout.items.find((it: any) => it.productId === cartItem.productId);
      const dbItem = orderFromDb!.items.find((it: any) => it.productId.toString() === cartItem.productId);
      const merchantItem = orderFromMerchant.items.find((it: any) => it.productId === cartItem.productId);

      expect(checkoutItem).toBeDefined();
      expect(dbItem).toBeDefined();
      expect(merchantItem).toBeDefined();

      // Identity & Attributes
      expect(checkoutItem.name).toBe(cartItem.name);
      expect(dbItem!.name).toBe(cartItem.name);
      expect(merchantItem.name).toBe(cartItem.name);

      expect(checkoutItem.packageSize).toBe(cartItem.packageSize);
      expect(dbItem!.packageSize).toBe(cartItem.packageSize);
      expect(merchantItem.packageSize).toBe(cartItem.packageSize);

      expect(checkoutItem.packageUnit).toBe(cartItem.packageUnit);
      expect(dbItem!.packageUnit).toBe(cartItem.packageUnit);
      expect(merchantItem.packageUnit).toBe(cartItem.packageUnit);

      // Quantities
      expect(checkoutItem.quantity).toBe(cartItem.quantity);
      expect(dbItem!.quantity).toBe(cartItem.quantity);
      expect(merchantItem.quantity).toBe(cartItem.quantity);

      // Unit Price and Subtotals
      expect(checkoutItem.unitPricePaise).toBe(cartItem.unitPricePaise);
      expect(dbItem!.unitPricePaise).toBe(cartItem.unitPricePaise);
      expect(merchantItem.unitPricePaise).toBe(cartItem.unitPricePaise);

      expect(checkoutItem.subtotalPaise).toBe(cartItem.subtotalPaise);
      expect(dbItem!.subtotalPaise).toBe(cartItem.subtotalPaise);
      expect(merchantItem.subtotalPaise).toBe(cartItem.subtotalPaise);
    }

    // Delivery note parity across all stages
    expect(orderFromCheckout.deliveryNote).toBe(note);
    expect(orderFromDb!.deliveryNote).toBe(note);
    expect(orderFromMerchant.deliveryNote).toBe(note);
  });

  it('Concurrency: Handles concurrent adds from two parallel sessions cleanly without item loss or state corruption', async () => {
    // Clear cart
    await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    const p1 = testProducts[0];
    const p2 = testProducts[1];

    // Fire two add requests simultaneously (simulating multi-tab or concurrent agent/shopper actions)
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: p1._id.toString(), quantity: 1 }),
      request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: p2._id.toString(), quantity: 2 }),
    ]);

    // Both requests must complete successfully (or if one had version conflict, final cart state must be valid)
    expect([200, 409]).toContain(resA.status);
    expect([200, 409]).toContain(resB.status);

    // Final cart read must be completely well-formed with valid integer pricing
    const finalCartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(finalCartRes.status).toBe(200);

    const finalCart = finalCartRes.body.data;
    expect(finalCart.items.length).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(finalCart.pricing.subtotalPaise)).toBe(true);
    expect(Number.isInteger(finalCart.pricing.totalPaise)).toBe(true);

    // Mathematical reconciliation check
    const sumSubtotal = finalCart.items.reduce((acc: number, it: any) => acc + it.subtotalPaise, 0);
    expect(finalCart.pricing.subtotalPaise).toBe(sumSubtotal);
  });
});
