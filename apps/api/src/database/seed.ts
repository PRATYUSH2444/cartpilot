import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { UserModel } from '../modules/users/user.model.js';
import { MerchantModel } from '../modules/merchants/merchant.model.js';
import { MerchantUserModel } from '../modules/merchants/merchant-user.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
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
      isEmailVerified: true,
      isPhoneVerified: true,
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
      isEmailVerified: true,
      isPhoneVerified: true,
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
      isEmailVerified: true,
      isPhoneVerified: true,
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
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    { upsert: true, new: true }
  );

  const customerUserPrimary = await UserModel.findOneAndUpdate(
    { email: 'customer@example.com' },
    {
      name: 'Priya Sharma (Shopper)',
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
      isEmailVerified: true,
      isPhoneVerified: true,
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
      isEmailVerified: true,
      isPhoneVerified: true,
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

  // 6. Seed Realistic Operational Orders for Fresh Greens Organics
  if (customerUserPrimary && freshGreensId) {
    const freshGreensProducts = await ProductModel.find({ merchantId: freshGreensId });
    if (freshGreensProducts.length > 0) {
      const productBySlug = new Map(freshGreensProducts.map((p) => [p.slug, p]));

      const defaultAddress = {
        street: 'Flat 402, Green Glen Layout, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
      };

      const initialOrders = [
        {
          orderNumber: 'CP-10248',
          userId: customerUserPrimary._id,
          merchantId: freshGreensId,
          status: 'CONFIRMED' as const,
          placedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
          shippingAddressSnapshot: { ...defaultAddress, street: 'Flat 101, Indiranagar 12th Main' },
          deliveryNote: 'Please ring bell and leave with security',
          items: [
            {
              productId: productBySlug.get('organic-tomatoes')?._id || freshGreensProducts[0]!._id,
              name: 'Organic Tomatoes',
              category: 'FRUITS_VEGETABLES',
              unitPricePaise: 4000,
              quantity: 2,
              subtotalPaise: 8000,
              packageSize: 500,
              packageUnit: 'G',
            },
            {
              productId: productBySlug.get('baby-spinach-palak')?._id || freshGreensProducts[1]!._id,
              name: 'Baby Spinach (Palak)',
              category: 'FRUITS_VEGETABLES',
              unitPricePaise: 2500,
              quantity: 1,
              subtotalPaise: 2500,
              packageSize: 250,
              packageUnit: 'G',
            },
            {
              productId: productBySlug.get('cow-milk')?._id || freshGreensProducts[2]!._id,
              name: 'Cow Milk',
              category: 'DAIRY_BREAKFAST',
              unitPricePaise: 10000,
              quantity: 1,
              subtotalPaise: 10000,
              packageSize: 1,
              packageUnit: 'L',
            },
          ],
          pricingSnapshot: {
            subtotalPaise: 20500,
            deliveryFeePaise: 0,
            platformFeePaise: 825,
            taxPaise: 0,
            discountPaise: 0,
            totalPaise: 21325,
          },
        },
        {
          orderNumber: 'CP-10247',
          userId: customerUserPrimary._id,
          merchantId: freshGreensId,
          status: 'PACKING' as const,
          placedAt: new Date(Date.now() - 28 * 60 * 1000), // 28 min ago
          shippingAddressSnapshot: { ...defaultAddress, street: 'A-204, Diamond District, HAL' },
          deliveryNote: 'Call before delivery',
          items: [
            {
              productId: productBySlug.get('aashirvaad-sharbati-atta')?._id || freshGreensProducts[0]!._id,
              name: 'Aashirvaad Atta',
              category: 'ATTA_RICE_DAL',
              unitPricePaise: 34000,
              quantity: 1,
              subtotalPaise: 34000,
              packageSize: 5,
              packageUnit: 'KG',
            },
            {
              productId: productBySlug.get('moong-dal')?._id || freshGreensProducts[1]!._id,
              name: 'Moong Dal',
              category: 'ATTA_RICE_DAL',
              unitPricePaise: 8000,
              quantity: 1,
              subtotalPaise: 8000,
              packageSize: 500,
              packageUnit: 'G',
            },
          ],
          pricingSnapshot: {
            subtotalPaise: 42000,
            deliveryFeePaise: 0,
            platformFeePaise: 800,
            taxPaise: 0,
            discountPaise: 0,
            totalPaise: 42800,
          },
        },
        {
          orderNumber: 'CP-10246',
          userId: customerUserPrimary._id,
          merchantId: freshGreensId,
          status: 'PACKING' as const,
          placedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
          shippingAddressSnapshot: { ...defaultAddress, street: 'House 55, Defence Colony' },
          items: [
            {
              productId: productBySlug.get('whole-wheat-bread')?._id || freshGreensProducts[2]!._id,
              name: 'Whole Wheat Bread',
              category: 'DAIRY_BREAKFAST',
              unitPricePaise: 3500,
              quantity: 2,
              subtotalPaise: 7000,
              packageSize: 400,
              packageUnit: 'G',
            },
            {
              productId: productBySlug.get('cow-milk')?._id || freshGreensProducts[2]!._id,
              name: 'Cow Milk',
              category: 'DAIRY_BREAKFAST',
              unitPricePaise: 10000,
              quantity: 1,
              subtotalPaise: 10000,
              packageSize: 1,
              packageUnit: 'L',
            },
          ],
          pricingSnapshot: {
            subtotalPaise: 17000,
            deliveryFeePaise: 0,
            platformFeePaise: 850,
            taxPaise: 0,
            discountPaise: 0,
            totalPaise: 17850,
          },
        },
        {
          orderNumber: 'CP-10245',
          userId: customerUserPrimary._id,
          merchantId: freshGreensId,
          status: 'OUT_FOR_DELIVERY' as const,
          placedAt: new Date(Date.now() - 65 * 60 * 1000), // 65 min ago
          shippingAddressSnapshot: { ...defaultAddress, street: 'B-12, Green Glen Layout' },
          items: [
            {
              productId: productBySlug.get('california-almonds')?._id || freshGreensProducts[0]!._id,
              name: 'California Almonds',
              category: 'SNACKS_MUNCHIES',
              unitPricePaise: 28000,
              quantity: 1,
              subtotalPaise: 28000,
              packageSize: 250,
              packageUnit: 'G',
            },
            {
              productId: productBySlug.get('organic-honey')?._id || freshGreensProducts[1]!._id,
              name: 'Organic Honey',
              category: 'SNACKS_MUNCHIES',
              unitPricePaise: 35000,
              quantity: 1,
              subtotalPaise: 35000,
              packageSize: 500,
              packageUnit: 'G',
            },
          ],
          pricingSnapshot: {
            subtotalPaise: 63000,
            deliveryFeePaise: 0,
            platformFeePaise: 0,
            taxPaise: 0,
            discountPaise: 0,
            totalPaise: 63000,
          },
        },
        {
          orderNumber: 'CP-10244',
          userId: customerUserPrimary._id,
          merchantId: freshGreensId,
          status: 'DELIVERED' as const,
          placedAt: new Date(Date.now() - 3 * 3600 * 1000),
          deliveredAt: new Date(Date.now() - 2 * 3600 * 1000),
          shippingAddressSnapshot: defaultAddress,
          items: [
            {
              productId: productBySlug.get('basmati-rice')?._id || freshGreensProducts[0]!._id,
              name: 'Basmati Rice',
              category: 'ATTA_RICE_DAL',
              unitPricePaise: 15000,
              quantity: 2,
              subtotalPaise: 30000,
              packageSize: 1,
              packageUnit: 'KG',
            },
          ],
          pricingSnapshot: {
            subtotalPaise: 30000,
            deliveryFeePaise: 0,
            platformFeePaise: 0,
            taxPaise: 0,
            discountPaise: 0,
            totalPaise: 30000,
          },
        },
      ];

      for (const orderData of initialOrders) {
        await OrderModel.findOneAndUpdate(
          { orderNumber: orderData.orderNumber },
          { ...orderData },
          { upsert: true, new: true }
        );
      }
      logger.info({ count: initialOrders.length }, '✅ Seeded Operational Orders for Fresh Greens Organics');
    }
  }

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
