import { describe, it, expect, afterAll } from 'vitest';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import request from 'supertest';
import { UserModel } from '../modules/users/user.model.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { ChatMessageModel } from '../modules/chat/chat-message.model.js';
import { runSeed } from '../database/seed.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Task S1: Persistent Database & Restart Survival Proof', () => {
  const tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartpilot-s1-persist-'));

  afterAll(async () => {
    await mongoose.disconnect();
    // Clean up temporary directory
    try {
      fs.rmSync(tempDbDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('Proves user, cart, order, chat session, and cards survive an API and database restart', async () => {
    // ==========================================
    // PROCESS 1: First Server Lifetime
    // ==========================================
    const server1 = await MongoMemoryServer.create({
      instance: {
        dbPath: tempDbDir,
        storageEngine: 'wiredTiger',
      },
    });

    await mongoose.connect(server1.getUri());
    await runSeed(false);

    // 1. Create a customer user
    const customer = await UserModel.create({
      name: 'Aditi Rao',
      email: 'aditi.persist@cartpilot.in',
      passwordHash: 'hashed_password_sample_123',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    const customerId = customer._id.toString();

    // 2. Create active cart
    const cart = await CartModel.create({
      userId: customer._id,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 3,
          addedAt: new Date(),
        },
      ],
      version: 2,
      status: 'ACTIVE',
    });
    const cartId = cart._id.toString();

    // 3. Create persistent order with full line-item snapshot
    const order = await OrderModel.create({
      orderNumber: 'CP-20261021-S1-001',
      userId: customer._id,
      merchantId: new mongoose.Types.ObjectId(),
      status: 'CONFIRMED',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Organic Malai Paneer',
          category: 'Dairy',
          unitPricePaise: 9500,
          quantity: 2,
          subtotalPaise: 19000,
          packageSize: 200,
          packageUnit: 'g',
        },
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Farm Fresh Palak',
          category: 'Vegetables',
          unitPricePaise: 4000,
          quantity: 1,
          subtotalPaise: 4000,
          packageSize: 250,
          packageUnit: 'g',
        },
      ],
      pricingSnapshot: {
        subtotalPaise: 23000,
        deliveryFeePaise: 4000,
        taxPaise: 1150,
        discountPaise: 0,
        totalPaise: 28150,
      },
      shippingAddressSnapshot: {
        street: '12th Main, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
      },
      placedAt: new Date(),
    });
    const orderId = order._id.toString();

    // 4. Create chat session and persisted cards
    const session = await ChatSessionModel.create({
      userId: customer._id,
      title: 'Dinner for Tonight',
    });
    const sessionId = session._id.toString();

    const orderCardMsg = await ChatMessageModel.create({
      sessionId: session._id,
      userId: customer._id,
      sender: 'AGENT',
      content: 'Payment verified! Order confirmation card:',
      cardType: 'order',
      cardData: {
        orderId,
        orderNumber: order.orderNumber,
        totalPaise: 28150,
      },
    });
    const cardMsgId = orderCardMsg._id.toString();

    // ==========================================
    // SIMULATE API & SERVER RESTART
    // Kill connection and shutdown server process 1
    // ==========================================
    await mongoose.disconnect();
    await server1.stop();

    // ==========================================
    // PROCESS 2: Second Server Boots up
    // Reconnecting to the exact same persistent storage path
    // ==========================================
    const server2 = await MongoMemoryServer.create({
      instance: {
        dbPath: tempDbDir,
        storageEngine: 'wiredTiger',
      },
    });

    await mongoose.connect(server2.getUri());

    // Server boots and executes idempotent seed script
    await runSeed(false);

    // ==========================================
    // VERIFY: All records survive restart intact!
    // ==========================================
    const rehydratedCustomer = await UserModel.findById(customerId);
    expect(rehydratedCustomer).not.toBeNull();
    expect(rehydratedCustomer?.email).toBe('aditi.persist@cartpilot.in');

    const rehydratedCart = await CartModel.findById(cartId);
    expect(rehydratedCart).not.toBeNull();
    expect(rehydratedCart?.items.length).toBe(1);
    expect(rehydratedCart?.items[0].quantity).toBe(3);

    const rehydratedOrder = await OrderModel.findById(orderId);
    expect(rehydratedOrder).not.toBeNull();
    expect(rehydratedOrder?.orderNumber).toBe('CP-20261021-S1-001');
    expect(rehydratedOrder?.items.length).toBe(2);
    expect(rehydratedOrder?.pricingSnapshot.totalPaise).toBe(28150);

    const rehydratedSession = await ChatSessionModel.findById(sessionId);
    expect(rehydratedSession).not.toBeNull();
    expect(rehydratedSession?.title).toBe('Dinner for Tonight');

    const rehydratedCardMsg = await ChatMessageModel.findById(cardMsgId);
    expect(rehydratedCardMsg).not.toBeNull();
    expect(rehydratedCardMsg?.cardType).toBe('order');
    expect((rehydratedCardMsg?.cardData as any).orderNumber).toBe('CP-20261021-S1-001');

    // Clean up server2
    await mongoose.disconnect();
    await server2.stop();
  }, 60000);

  it('Proves POST /api/v1/chat/sessions/:id/cards persists cards that are returned on session reload', async () => {
    const memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    await runSeed(false);

    const app = createApp();

    // Create and login user
    const user = await UserModel.create({
      name: 'Card Test User',
      email: 'cardtest@cartpilot.in',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    const token = AuthService.generateAccessToken(user);

    // Create session
    const sessionRes = await request(app)
      .post('/api/v1/chat/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card Persistence Test' });

    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.data._id;

    // Post server-verified order card per Addendum 1 security contract
    const order = await OrderModel.create({
      orderNumber: 'CP-CARD-TEST',
      userId: user._id,
      merchantId: new mongoose.Types.ObjectId(),
      status: 'CONFIRMED',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Card Test Item',
          category: 'GRAINS',
          unitPricePaise: 45000,
          quantity: 1,
          subtotalPaise: 45000,
          packageSize: 1,
          packageUnit: 'KG',
        },
      ],
      pricingSnapshot: {
        subtotalPaise: 45000,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 45000,
      },
      shippingAddressSnapshot: {
        street: '123 Market St',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
      placedAt: new Date(),
    });

    const cardRes = await request(app)
      .post(`/api/v1/chat/sessions/${sessionId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'order',
        resourceId: order._id.toString(),
      });

    expect(cardRes.status).toBe(201);
    expect(cardRes.body.success).toBe(true);
    expect(cardRes.body.data.cardType).toBe('order');

    // Simulate page reload: GET session with messages
    const reloadRes = await request(app)
      .get(`/api/v1/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(reloadRes.status).toBe(200);
    const messages = reloadRes.body.data.messages;
    expect(messages.length).toBeGreaterThanOrEqual(2); // Welcome rules card + order card

    const persistedOrderCard = messages.find((m: any) => m.cardType === 'order');
    expect(persistedOrderCard).toBeDefined();
    expect(persistedOrderCard.cardData.totalPaise).toBe(45000);

    await mongoose.disconnect();
    await memoryServer.stop();
  }, 60000);
});
