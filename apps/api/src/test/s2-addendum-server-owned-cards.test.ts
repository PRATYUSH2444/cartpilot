import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import request from 'supertest';
import { UserModel } from '../modules/users/user.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { PaymentModel } from '../modules/payments/payment.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { runSeed } from '../database/seed.js';

describe('S2 Addendum 1: Server-Owned Chat Cards Security & Authority', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;
  let sessionA: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await runSeed(false);
    app = createApp();

    userA = await UserModel.create({
      name: 'User A',
      email: 'userA.cards@cartpilot.in',
      passwordHash: 'dummyhash123',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    tokenA = AuthService.generateAccessToken(userA);

    userB = await UserModel.create({
      name: 'User B',
      email: 'userB.cards@cartpilot.in',
      passwordHash: 'dummyhash123',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    tokenB = AuthService.generateAccessToken(userB);

    sessionA = await ChatSessionModel.create({
      userId: userA._id,
      title: 'Shopping Session A',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('rejects an unknown card type with 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'fake_spoofed_card',
        resourceId: new mongoose.Types.ObjectId().toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Invalid card resource type/i);
  });

  it('rejects an invalid resourceId format with 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'order',
        resourceId: 'not-a-valid-object-id',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an order card when order does not exist with 404 Not Found', async () => {
    const nonExistentOrderId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'order',
        resourceId: nonExistentOrderId,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/does not exist/i);
  });

  it("rejects an order card when the order belongs to another user with 403 Forbidden", async () => {
    // Create an order owned by User B
    const merchantId = new mongoose.Types.ObjectId();
    const orderB = await OrderModel.create({
      orderNumber: 'ORD-TEST-B-999',
      userId: userB._id,
      merchantId,
      status: 'CONFIRMED',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Organic Milk',
          category: 'DAIRY',
          unitPricePaise: 4500,
          quantity: 2,
          subtotalPaise: 9000,
          packageSize: 500,
          packageUnit: 'ml',
        },
      ],
      pricingSnapshot: {
        subtotalPaise: 9000,
        deliveryFeePaise: 2500,
        taxPaise: 450,
        discountPaise: 0,
        totalPaise: 11950,
      },
      shippingAddressSnapshot: {
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
      },
      placedAt: new Date(),
    });

    // User A tries to attach User B's order to User A's session
    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'order',
        resourceId: orderB._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/another user/i);
  });

  it('rejects a payment card when the payment does not exist with 404 Not Found', async () => {
    const nonExistentPaymentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'payment',
        resourceId: nonExistentPaymentId,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects a payment card when payment belongs to another user with 403 Forbidden', async () => {
    const paymentB = await PaymentModel.create({
      orderId: new mongoose.Types.ObjectId(),
      userId: userB._id,
      amountPaise: 5000,
      currency: 'INR',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_rzp_user_b_1',
      status: 'PAID',
    });

    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'payment',
        resourceId: paymentB._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/another user/i);
  });

  it('rejects a payment card when payment was NOT verified (status != PAID) with 400 Bad Request', async () => {
    const unverifiedPayment = await PaymentModel.create({
      orderId: new mongoose.Types.ObjectId(),
      userId: userA._id,
      amountPaise: 7500,
      currency: 'INR',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_rzp_unverified_1',
      status: 'CREATED', // Not verified!
    });

    const res = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'payment',
        resourceId: unverifiedPayment._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/not verified/i);
  });

  it('successfully attaches valid order and verified payment cards and authoritatively rehydrates them', async () => {
    const merchantId = new mongoose.Types.ObjectId();
    const orderA = await OrderModel.create({
      orderNumber: 'ORD-TEST-A-100',
      userId: userA._id,
      merchantId,
      status: 'CONFIRMED',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Fresh Spinach',
          category: 'VEGETABLES',
          unitPricePaise: 3000,
          quantity: 1,
          subtotalPaise: 3000,
          packageSize: 250,
          packageUnit: 'g',
        },
      ],
      pricingSnapshot: {
        subtotalPaise: 3000,
        deliveryFeePaise: 1500,
        taxPaise: 150,
        discountPaise: 0,
        totalPaise: 4650,
      },
      shippingAddressSnapshot: {
        street: '45 Green Path',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
      },
      placedAt: new Date(),
    });

    const verifiedPayment = await PaymentModel.create({
      orderId: orderA._id,
      userId: userA._id,
      amountPaise: 4650,
      currency: 'INR',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_rzp_verified_100',
      gatewayPaymentId: 'pay_rzp_verified_100',
      status: 'PAID',
    });

    // 1. Attach verified order card
    const orderCardRes = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'order',
        resourceId: orderA._id.toString(),
      });

    expect(orderCardRes.status).toBe(201);
    expect(orderCardRes.body.success).toBe(true);
    expect(orderCardRes.body.data.cardType).toBe('order');
    expect(orderCardRes.body.data.resourceType).toBe('order');
    expect(orderCardRes.body.data.resourceId).toBe(orderA._id.toString());

    // 2. Attach verified payment card
    const paymentCardRes = await request(app)
      .post(`/api/v1/chat/sessions/${sessionA._id}/cards`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'payment',
        resourceId: verifiedPayment._id.toString(),
      });

    expect(paymentCardRes.status).toBe(201);
    expect(paymentCardRes.body.success).toBe(true);
    expect(paymentCardRes.body.data.cardType).toBe('payment');
    expect(paymentCardRes.body.data.resourceType).toBe('payment');

    // 3. Fetch conversation and verify authoritative rehydration from DB
    const sessionRes = await request(app)
      .get(`/api/v1/chat/sessions/${sessionA._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(sessionRes.status).toBe(200);
    const messages = sessionRes.body.data.messages;
    const orderMsg = messages.find((m: any) => m.cardType === 'order');
    expect(orderMsg).toBeDefined();
    expect(orderMsg.cardData.orderNumber).toBe('ORD-TEST-A-100');
    expect(orderMsg.cardData.totalPaise).toBe(4650);

    const paymentMsg = messages.find((m: any) => m.cardType === 'payment');
    expect(paymentMsg).toBeDefined();
    expect(paymentMsg.cardData.status).toBe('PAID');
    expect(paymentMsg.cardData.gatewayOrderId).toBe('order_rzp_verified_100');
  });
});
