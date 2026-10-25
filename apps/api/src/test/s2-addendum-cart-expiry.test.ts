import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';

describe('S2 Addendum 2: Cart Expiry Safety & TTL Scope Proof', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Ensure indexes are built in MongoDB
    await CartModel.init();
    await OrderModel.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('proves CartModel has a 30-day TTL index with partialFilterExpression matching only ABANDONED carts', async () => {
    const indexes = await CartModel.collection.indexes();
    const ttlIndex = indexes.find((idx) => idx.expireAfterSeconds !== undefined);

    expect(ttlIndex).toBeDefined();
    // 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
    expect(ttlIndex?.expireAfterSeconds).toBe(2592000);
    expect(ttlIndex?.key).toEqual({ updatedAt: 1 });
    expect(ttlIndex?.partialFilterExpression).toEqual({ status: 'ABANDONED' });
  });

  it('proves OrderModel has NO TTL indexes (orders never expire)', async () => {
    const orderIndexes = await OrderModel.collection.indexes();
    const orderTtlIndexes = orderIndexes.filter((idx) => idx.expireAfterSeconds !== undefined);

    expect(orderTtlIndexes.length).toBe(0);
  });

  it('proves ACTIVE and CONVERTED carts are excluded by the TTL partial filter', async () => {
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();
    const userId3 = new mongoose.Types.ObjectId();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // 1. Create an ACTIVE cart with old timestamp
    const activeCart = await CartModel.create({
      userId: userId1,
      status: 'ACTIVE',
      items: [],
      pricing: {
        subtotalPaise: 0,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 0,
        formatted: {
          subtotal: '₹0.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹0.00',
        },
      },
    });
    // Manually set updatedAt to 60 days ago
    await CartModel.collection.updateOne({ _id: activeCart._id }, { $set: { updatedAt: sixtyDaysAgo } });

    // 2. Create a CONVERTED cart with old timestamp
    const convertedCart = await CartModel.create({
      userId: userId2,
      status: 'CONVERTED',
      items: [],
      pricing: {
        subtotalPaise: 0,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 0,
        formatted: {
          subtotal: '₹0.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹0.00',
        },
      },
    });
    await CartModel.collection.updateOne({ _id: convertedCart._id }, { $set: { updatedAt: sixtyDaysAgo } });

    // 3. Create an ABANDONED cart with old timestamp
    const abandonedCart = await CartModel.create({
      userId: userId3,
      status: 'ABANDONED',
      items: [],
      pricing: {
        subtotalPaise: 0,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 0,
        formatted: {
          subtotal: '₹0.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹0.00',
        },
      },
    });
    await CartModel.collection.updateOne({ _id: abandonedCart._id }, { $set: { updatedAt: sixtyDaysAgo } });

    // Verify index eligibility using MongoDB partial filter query
    const indexes = await CartModel.collection.indexes();
    const ttlIndex = indexes.find((idx) => idx.expireAfterSeconds !== undefined);
    const filter = ttlIndex?.partialFilterExpression || {};

    const eligibleForTtl = await CartModel.find({
      ...filter,
      updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).lean();

    const eligibleIds = eligibleForTtl.map((c) => c._id.toString());

    // Proves ONLY the ABANDONED cart matches the TTL criteria
    expect(eligibleIds).toContain(abandonedCart._id.toString());
    expect(eligibleIds).not.toContain(activeCart._id.toString());
    expect(eligibleIds).not.toContain(convertedCart._id.toString());

    // Double check active cart is still safely in DB
    const fetchedActiveCart = await CartModel.findById(activeCart._id);
    expect(fetchedActiveCart).not.toBeNull();
    expect(fetchedActiveCart?.status).toBe('ACTIVE');
  });
});
