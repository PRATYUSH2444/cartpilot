import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from '../modules/users/user.model.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { ChatMessageModel } from '../modules/chat/chat-message.model.js';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { runSeed } from '../database/seed.js';

describe('Task S1: Persistence and Data Integrity Root Cause Tests', () => {
  let memoryServer1: MongoMemoryServer;

  beforeAll(async () => {
    // Spin up first in-memory instance to simulate initial server run
    memoryServer1 = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer1.getUri());
    await runSeed(false);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (memoryServer1) {
      await memoryServer1.stop();
    }
  });

  it('1. Confirms in-memory database wipes all user records, carts, orders, and chats on restart', async () => {
    // Create shopper
    const shopper = await UserModel.create({
      name: 'Priya Sharma',
      email: 'priya.test@cartpilot.in',
      passwordHash: 'dummyhash',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    // Create cart
    const cart = await CartModel.create({
      userId: shopper._id,
      items: [{ productId: new mongoose.Types.ObjectId(), quantity: 2, addedAt: new Date() }],
      version: 1,
      status: 'ACTIVE',
    });

    // Create order
    const order = await OrderModel.create({
      orderNumber: 'CP-TEST-REPRO-001',
      userId: shopper._id,
      merchantId: new mongoose.Types.ObjectId(),
      status: 'DELIVERED',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Fresh Paneer',
          category: 'Dairy',
          unitPricePaise: 9500,
          quantity: 2,
          subtotalPaise: 19000,
          packageSize: 200,
          packageUnit: 'g',
        },
      ],
      pricingSnapshot: {
        subtotalPaise: 19000,
        deliveryFeePaise: 4000,
        taxPaise: 950,
        discountPaise: 0,
        totalPaise: 23950,
      },
      shippingAddressSnapshot: {
        street: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
      placedAt: new Date(),
    });

    // Create chat session and message
    const chatSession = await ChatSessionModel.create({
      userId: shopper._id,
      title: 'Weekly Grocery Run',
    });
    const chatMsg = await ChatMessageModel.create({
      sessionId: chatSession._id,
      userId: shopper._id,
      sender: 'AGENT',
      content: 'Here is your order summary',
      cardType: 'order',
      cardData: { orderNumber: order.orderNumber, totalPaise: 23950 },
    });

    expect(await UserModel.findById(shopper._id)).not.toBeNull();
    expect(await CartModel.findById(cart._id)).not.toBeNull();
    expect(await OrderModel.findById(order._id)).not.toBeNull();
    expect(await ChatSessionModel.findById(chatSession._id)).not.toBeNull();
    expect(await ChatMessageModel.findById(chatMsg._id)).not.toBeNull();

    // SIMULATE PROCESS RESTART WITH IN-MEMORY DB:
    await mongoose.disconnect();
    await memoryServer1.stop();

    // New process starts a new in-memory instance
    const memoryServer2 = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer2.getUri());

    // Run seed as server.ts does on startup
    await runSeed(false);

    // PROVE SYMPTOMS: Everything from previous process is GONE
    const shopperAfter = await UserModel.findById(shopper._id);
    const cartAfter = await CartModel.findById(cart._id);
    const orderAfter = await OrderModel.findById(order._id);
    const sessionAfter = await ChatSessionModel.findById(chatSession._id);

    expect(shopperAfter).toBeNull();
    expect(cartAfter).toBeNull();
    expect(orderAfter).toBeNull();
    expect(sessionAfter).toBeNull();

    // Clean up second server
    await mongoose.disconnect();
    await memoryServer2.stop();
  });

  it('2. Confirms seed script is idempotent and does not delete user data when run on an existing persistent DB', async () => {
    // Reconnect to a fresh server for this test
    const persistentMockServer = await MongoMemoryServer.create();
    await mongoose.connect(persistentMockServer.getUri());

    // First seed
    await runSeed(false);

    // Create user data
    const user = await UserModel.create({
      name: 'Persistent User',
      email: 'persistent@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    const userCart = await CartModel.create({
      userId: user._id,
      items: [],
      status: 'ACTIVE',
      version: 1,
    });

    // Run seed second time (as happens on API restart with persistent DB)
    await runSeed(false);

    // Verify user and cart STILL EXIST
    const foundUser = await UserModel.findById(user._id);
    const foundCart = await CartModel.findById(userCart._id);

    expect(foundUser).not.toBeNull();
    expect(foundCart).not.toBeNull();
    expect(foundUser?.email).toBe('persistent@example.com');

    await mongoose.disconnect();
    await persistentMockServer.stop();
  });
});
