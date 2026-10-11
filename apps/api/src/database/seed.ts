import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { UserModel } from '../modules/users/user.model.js';
import { MerchantModel } from '../modules/merchants/merchant.model.js';
import { MerchantUserModel } from '../modules/merchants/merchant-user.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import {
  SEED_MERCHANTS,
  SEED_PRODUCTS_FRESH_GREENS,
  SEED_PRODUCTS_DESI_KIRANA,
} from './seed-data.js';
import { logger } from '../common/logging/logger.js';

export async function runSeed(dropExisting = false): Promise<void> {
  logger.info({ dropExisting }, '🌱 Starting CartPilot Database Seeding Process...');

  if (mongoose.connection.readyState !== 1) {
    await connectDatabase();
  }

  if (dropExisting) {
    logger.warn('Clearing existing seed collections...');
    await ProductModel.deleteMany({});
    await MerchantUserModel.deleteMany({});
    await MerchantModel.deleteMany({});
    await UserModel.deleteMany({});
  }

  // 1. Seed Users (Admin, Merchant, Customer with both @cartpilot.com/@freshgrocers.com and @example.com aliases)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin1234!', salt);
  const merchantPasswordHash = await bcrypt.hash('Merchant1234!', salt);
  const customerPasswordHash = await bcrypt.hash('Customer1234!', salt);

  await UserModel.findOneAndUpdate(
    { email: 'admin@cartpilot.com' },
    {
      name: 'System Administrator',
      email: 'admin@cartpilot.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  await UserModel.findOneAndUpdate(
    { email: 'admin@example.com' },
    {
      name: 'System Administrator',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  const merchantUserPrimary = await UserModel.findOneAndUpdate(
    { email: 'merchant@freshgrocers.com' },
    {
      name: 'Ramesh Patel (Merchant)',
      email: 'merchant@freshgrocers.com',
      passwordHash: merchantPasswordHash,
      role: 'MERCHANT',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  const merchantUserSecondary = await UserModel.findOneAndUpdate(
    { email: 'merchant@example.com' },
    {
      name: 'Ramesh Patel (Merchant)',
      email: 'merchant@example.com',
      passwordHash: merchantPasswordHash,
      role: 'MERCHANT',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  await UserModel.findOneAndUpdate(
    { email: 'customer@example.com' },
    {
      name: 'Priya Sharma (Shopper)',
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  await UserModel.findOneAndUpdate(
    { email: 'customer@cartpilot.com' },
    {
      name: 'Priya Sharma (Shopper)',
      email: 'customer@cartpilot.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );

  logger.info('✅ Seeded Core Users across all role aliases');

  // 2. Seed Merchants
  const createdMerchants: Record<string, mongoose.Types.ObjectId> = {};

  for (const merchantData of SEED_MERCHANTS) {
    const merchant = await MerchantModel.findOneAndUpdate(
      { slug: merchantData.slug },
      { ...merchantData },
      { upsert: true, new: true }
    );
    createdMerchants[merchantData.slug] = merchant._id;
  }

  logger.info({ count: Object.keys(createdMerchants).length }, '✅ Seeded Active Merchants');

  // 3. Link Merchant Users to Merchant
  const freshGreensId = createdMerchants['fresh-greens-organics'];
  if (freshGreensId) {
    await MerchantUserModel.findOneAndUpdate(
      { userId: merchantUserPrimary._id, merchantId: freshGreensId },
      { role: 'OWNER' },
      { upsert: true, new: true }
    );
    await MerchantUserModel.findOneAndUpdate(
      { userId: merchantUserSecondary._id, merchantId: freshGreensId },
      { role: 'OWNER' },
      { upsert: true, new: true }
    );
  }

  // 4. Seed Products for Merchant A (Fresh Greens Organics)
  let freshGreensProductCount = 0;
  for (const productData of SEED_PRODUCTS_FRESH_GREENS) {
    await ProductModel.findOneAndUpdate(
      { merchantId: freshGreensId, slug: productData.slug },
      {
        ...productData,
        merchantId: freshGreensId,
        isVegetarian: true,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    freshGreensProductCount++;
  }

  // 5. Seed Products for Merchant B (Desi Kirana & Spices)
  const desiKiranaId = createdMerchants['desi-kirana-spices'];
  let desiKiranaProductCount = 0;
  for (const productData of SEED_PRODUCTS_DESI_KIRANA) {
    await ProductModel.findOneAndUpdate(
      { merchantId: desiKiranaId, slug: productData.slug },
      {
        ...productData,
        merchantId: desiKiranaId,
        isVegetarian: true,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    desiKiranaProductCount++;
  }

  logger.info(
    {
      freshGreensCount: freshGreensProductCount,
      desiKiranaCount: desiKiranaProductCount,
      total: freshGreensProductCount + desiKiranaProductCount,
    },
    '✅ Seeded Strictly Vegetarian Catalog Products with Aliases'
  );

  logger.info('🎉 Database seeding completed cleanly!');
}

// If executed directly from CLI: tsx src/database/seed.ts
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed(process.argv.includes('--clean'))
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, '❌ Seeding failed with error');
      await disconnectDatabase();
      process.exit(1);
    });
}
