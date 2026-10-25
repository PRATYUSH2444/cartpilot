import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { MandateService } from '../modules/mandates/mandate.service.js';
import { AuditEventModel } from '../modules/audit/audit-event.model.js';

describe('S2 Addendum 4: Legacy Mandate Startup Migration & Snapshots', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('proves before/after snapshot migration of legacy mandate documents to canonical caps', async () => {
    const rawCollection = mongoose.connection.collection('mandates');

    // 1. Seed raw legacy documents bypassing Mongoose schemas to accurately simulate legacy production DB state
    const userAId = new mongoose.Types.ObjectId();
    const userBId = new mongoose.Types.ObjectId();
    const userCId = new mongoose.Types.ObjectId();

    // Document A: Default Careful under old schema (maxOrderAmountPaise: 60000, dailyBudgetPaise: 150000, missing canonical caps)
    const rawLegacyA = {
      userId: userAId,
      version: 1,
      maxOrderAmountPaise: 60000,
      dailyBudgetPaise: 150000,
      allowedMerchantIds: [],
      blockedCategories: [],
      requireExplicitApproval: false,
      isActive: true,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    };

    // Document B: Custom limit under old schema (maxOrderAmountPaise: 80000, dailyBudgetPaise: 250000, missing canonical caps)
    const rawLegacyB = {
      userId: userBId,
      version: 3,
      maxOrderAmountPaise: 80000,
      dailyBudgetPaise: 250000,
      allowedMerchantIds: [],
      blockedCategories: [],
      requireExplicitApproval: true,
      isActive: true,
      createdAt: new Date('2026-09-05T12:00:00Z'),
      updatedAt: new Date('2026-09-05T12:00:00Z'),
    };

    // Document C: Already canonical modern document
    const rawModernC = {
      userId: userCId,
      version: 2,
      maxOrderAmountPaise: 200000,
      perOrderCapPaise: 200000,
      autoApproveUpToPaise: 80000,
      dailyCapPaise: 300000,
      dailyBudgetPaise: 300000,
      allowedMerchantIds: [],
      blockedCategories: [],
      requireExplicitApproval: false,
      isActive: true,
      createdAt: new Date('2026-10-01T08:00:00Z'),
      updatedAt: new Date('2026-10-01T08:00:00Z'),
    };

    const insertResA = await rawCollection.insertOne(rawLegacyA);
    const insertResB = await rawCollection.insertOne(rawLegacyB);
    const insertResC = await rawCollection.insertOne(rawModernC);

    // 2. BEFORE SNAPSHOT
    const beforeA = await rawCollection.findOne({ _id: insertResA.insertedId });
    const beforeB = await rawCollection.findOne({ _id: insertResB.insertedId });
    const beforeC = await rawCollection.findOne({ _id: insertResC.insertedId });

    expect(beforeA).toBeDefined();
    expect(beforeA?.maxOrderAmountPaise).toBe(60000);
    expect(beforeA?.perOrderCapPaise).toBeUndefined();
    expect(beforeA?.autoApproveUpToPaise).toBeUndefined();
    expect(beforeA?.dailyCapPaise).toBeUndefined();
    expect(beforeA?.version).toBe(1);

    expect(beforeB).toBeDefined();
    expect(beforeB?.maxOrderAmountPaise).toBe(80000);
    expect(beforeB?.perOrderCapPaise).toBeUndefined();
    expect(beforeB?.autoApproveUpToPaise).toBeUndefined();
    expect(beforeB?.dailyCapPaise).toBeUndefined();
    expect(beforeB?.version).toBe(3);

    expect(beforeC).toBeDefined();
    expect(beforeC?.perOrderCapPaise).toBe(200000);
    expect(beforeC?.autoApproveUpToPaise).toBe(80000);
    expect(beforeC?.dailyCapPaise).toBe(300000);
    expect(beforeC?.version).toBe(2);

    // 3. EXECUTE STARTUP MIGRATION
    const migrationResult = await MandateService.migrateLegacyMandates();
    expect(migrationResult.scanned).toBe(2);
    expect(migrationResult.migrated).toBe(2);

    // 4. AFTER SNAPSHOT
    const afterA = await rawCollection.findOne({ _id: insertResA.insertedId });
    const afterB = await rawCollection.findOne({ _id: insertResB.insertedId });
    const afterC = await rawCollection.findOne({ _id: insertResC.insertedId });

    // Document A: 60000 migrated to canonical Careful (100000) with all caps populated and version bumped
    expect(afterA?.maxOrderAmountPaise).toBe(100000);
    expect(afterA?.perOrderCapPaise).toBe(100000);
    expect(afterA?.autoApproveUpToPaise).toBe(30000);
    expect(afterA?.dailyCapPaise).toBe(150000);
    expect(afterA?.dailyBudgetPaise).toBe(150000);
    expect(afterA?.version).toBe(2); // Bumped from 1 to 2

    // Document B: Custom limit preserved, missing caps populated, version bumped
    expect(afterB?.maxOrderAmountPaise).toBe(80000);
    expect(afterB?.perOrderCapPaise).toBe(80000);
    expect(afterB?.autoApproveUpToPaise).toBe(30000);
    expect(afterB?.dailyCapPaise).toBe(250000);
    expect(afterB?.dailyBudgetPaise).toBe(250000);
    expect(afterB?.version).toBe(4); // Bumped from 3 to 4

    // Document C: Modern document completely untouched
    expect(afterC?.maxOrderAmountPaise).toBe(200000);
    expect(afterC?.perOrderCapPaise).toBe(200000);
    expect(afterC?.autoApproveUpToPaise).toBe(80000);
    expect(afterC?.dailyCapPaise).toBe(300000);
    expect(afterC?.dailyBudgetPaise).toBe(300000);
    expect(afterC?.version).toBe(2);

    // 5. AUDIT TRAIL VERIFICATION
    const auditEvents = await AuditEventModel.find({
      'payload.action': 'MIGRATED_LEGACY_MANDATE',
    });
    expect(auditEvents.length).toBe(2);
    expect(auditEvents.some((e) => e.resourceId === insertResA.insertedId.toString())).toBe(true);
    expect(auditEvents.some((e) => e.resourceId === insertResB.insertedId.toString())).toBe(true);

    // 6. IDEMPOTENCY CHECK
    const secondRun = await MandateService.migrateLegacyMandates();
    expect(secondRun.scanned).toBe(0);
    expect(secondRun.migrated).toBe(0);
  });
});
