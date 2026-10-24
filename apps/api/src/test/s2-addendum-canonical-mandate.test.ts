import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { MandateService, MANDATE_PRESETS } from '../modules/mandates/mandate.service.js';
import { policyService } from '../modules/policy/policy.service.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { UserModel } from '../modules/users/user.model.js';

describe('S2 Addendum 3: Canonical Mandate & Presets Harmonization', () => {
  let mongoServer: MongoMemoryServer;
  const mandateService = new MandateService();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('proves perOrderCapPaise and maxOrderAmountPaise cannot diverge', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mandate = await MandateModel.create({
      userId,
      perOrderCapPaise: 120000,
      autoApproveUpToPaise: 30000,
      dailyCapPaise: 200000,
    });

    // 1. Initial creation synchronizes them
    expect(mandate.perOrderCapPaise).toBe(120000);
    expect(mandate.maxOrderAmountPaise).toBe(120000);

    // 2. Updating perOrderCapPaise updates maxOrderAmountPaise
    mandate.perOrderCapPaise = 250000;
    await mandate.save();
    const updated1 = await MandateModel.findById(mandate._id);
    expect(updated1?.perOrderCapPaise).toBe(250000);
    expect(updated1?.maxOrderAmountPaise).toBe(250000);

    // 3. Updating maxOrderAmountPaise updates perOrderCapPaise
    mandate.maxOrderAmountPaise = 350000;
    await mandate.save();
    const updated2 = await MandateModel.findById(mandate._id);
    expect(updated2?.perOrderCapPaise).toBe(350000);
    expect(updated2?.maxOrderAmountPaise).toBe(350000);
  });

  it('proves dailyCapPaise and dailyBudgetPaise cannot diverge', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mandate = await MandateModel.create({
      userId,
      dailyCapPaise: 180000,
    });

    // 1. Initial creation synchronizes them
    expect(mandate.dailyCapPaise).toBe(180000);
    expect(mandate.dailyBudgetPaise).toBe(180000);

    // 2. Updating dailyCapPaise updates dailyBudgetPaise
    mandate.dailyCapPaise = 275000;
    await mandate.save();
    const updated1 = await MandateModel.findById(mandate._id);
    expect(updated1?.dailyCapPaise).toBe(275000);
    expect(updated1?.dailyBudgetPaise).toBe(275000);

    // 3. Updating dailyBudgetPaise updates dailyCapPaise
    mandate.dailyBudgetPaise = 420000;
    await mandate.save();
    const updated2 = await MandateModel.findById(mandate._id);
    expect(updated2?.dailyCapPaise).toBe(420000);
    expect(updated2?.dailyBudgetPaise).toBe(420000);
  });

  it('proves each starter preset displayed values equal the saved mandate in the database', async () => {
    const user = await UserModel.create({
      name: 'Preset Test User',
      email: 'preset.user@cartpilot.in',
      passwordHash: 'dummyhash',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    const presetKeys = ['careful', 'everyday', 'family'] as const;

    for (const key of presetKeys) {
      const preset = MANDATE_PRESETS[key];
      expect(preset).toBeDefined();

      // Apply preset via mandate service
      await mandateService.applyPreset(user._id.toString(), key);

      // Verify the saved mandate in the database matches preset values exactly
      const savedMandate = await MandateModel.findOne({ userId: user._id });
      expect(savedMandate).not.toBeNull();
      expect(savedMandate?.autoApproveUpToPaise).toBe(preset.autoApproveUpToPaise);
      expect(savedMandate?.perOrderCapPaise).toBe(preset.perOrderCapPaise);
      expect(savedMandate?.maxOrderAmountPaise).toBe(preset.perOrderCapPaise);
      expect(savedMandate?.dailyCapPaise).toBe(preset.dailyCapPaise);
      expect(savedMandate?.dailyBudgetPaise).toBe(preset.dailyCapPaise);
    }
  });

  it('shows which fields the policy engine really reads and enforces them authoritatively', async () => {
    const user = await UserModel.create({
      name: 'Policy Field Test User',
      email: 'policy.fields@cartpilot.in',
      passwordHash: 'dummyhash',
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });

    // Create custom mandate: autoApprove: ₹300 (30,000p), perOrderCap: ₹1,000 (100,000p), dailyCap: ₹1,500 (150,000p)
    await MandateModel.create({
      userId: user._id,
      autoApproveUpToPaise: 30000,
      perOrderCapPaise: 100000,
      dailyCapPaise: 150000,
      isActive: true,
    });

    const mockItem = (amountPaise: number) => ({
      productId: new mongoose.Types.ObjectId().toString(),
      name: 'Sample Item',
      slug: 'sample-item',
      category: 'Groceries',
      pricePaise: amountPaise,
      packageSize: 1,
      packageUnit: 'kg',
      availableStock: 10,
      quantity: 1,
      itemTotalPaise: amountPaise,
      formattedItemTotal: `₹${(amountPaise / 100).toFixed(2)}`,
      addedAt: new Date(),
    });

    // Case A: Cart total = ₹250 (25,000 paise) <= autoApproveUpToPaise (30,000 paise) -> ALLOW
    const cartA: any = {
      id: new mongoose.Types.ObjectId().toString(),
      userId: user._id.toString(),
      version: 1,
      status: 'ACTIVE',
      items: [mockItem(25000)],
      pricing: {
        subtotalPaise: 25000,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 25000,
        formatted: {
          subtotal: '₹250.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹250.00',
        },
      },
      itemCount: 1,
    };

    const evalA = await policyService.evaluateCart(user._id.toString(), cartA);
    expect(evalA.outcome).toBe('ALLOW');
    expect(evalA.requiresApproval).toBe(false);

    // Case B: Cart total = ₹500 (50,000 paise) > autoApproveUpToPaise (30,000p) but <= perOrderCap (100,000p) -> NEEDS_APPROVAL
    const cartB: any = {
      id: new mongoose.Types.ObjectId().toString(),
      userId: user._id.toString(),
      version: 1,
      status: 'ACTIVE',
      items: [mockItem(50000)],
      pricing: {
        subtotalPaise: 50000,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 50000,
        formatted: {
          subtotal: '₹500.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹500.00',
        },
      },
      itemCount: 1,
    };

    const evalB = await policyService.evaluateCart(user._id.toString(), cartB);
    expect(evalB.outcome).toBe('NEEDS_APPROVAL');
    expect(evalB.requiresApproval).toBe(true);

    // Case C: Cart total = ₹1,200 (120,000 paise) > perOrderCapPaise (100,000p) -> DENY (ABOVE_ORDER_CAP)
    const cartC: any = {
      id: new mongoose.Types.ObjectId().toString(),
      userId: user._id.toString(),
      version: 1,
      status: 'ACTIVE',
      items: [mockItem(120000)],
      pricing: {
        subtotalPaise: 120000,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 120000,
        formatted: {
          subtotal: '₹1,200.00',
          deliveryFee: '₹0.00',
          tax: '₹0.00',
          discount: '₹0.00',
          total: '₹1,200.00',
        },
      },
      itemCount: 1,
    };

    const evalC = await policyService.evaluateCart(user._id.toString(), cartC);
    expect(evalC.outcome).toBe('DENY');
    expect(evalC.reasonCode).toBe('ABOVE_ORDER_CAP');
  });
});
