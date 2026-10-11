import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';
import { AuditEventModel } from './audit-event.model.js';
import { auditService, GENESIS_HASH } from './audit.service.js';

describe('Phase 04 — Cryptographic Append-Only Audit Trail Integration Tests', () => {
  const app = createApp();
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create an Admin user for audit tests
    const adminUser = await UserModel.create({
      name: 'Audit Administrator',
      email: 'audit-admin@cartpilot.internal',
      passwordHash: 'hashed_pw',
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 1,
    });

    adminId = adminUser._id.toString();

    const session = AuthService.generateTokens({
      userId: adminId,
      email: adminUser.email,
      role: 'ADMIN',
      tokenVersion: adminUser.tokenVersion,
    });
    adminToken = session.accessToken;
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should record audit events with monotonically increasing sequence numbers and hash linking', async () => {
    // Record three distinct events
    const event1 = await auditService.recordEvent({
      eventType: 'MANDATE_UPDATED',
      actorId: adminId,
      actorRole: 'ADMIN',
      resourceId: 'mandate_001',
      resourceType: 'MANDATE',
      payload: { threshold: 50000 },
    });

    const event2 = await auditService.recordEvent({
      eventType: 'POLICY_EVALUATION',
      actorId: adminId,
      actorRole: 'ADMIN',
      resourceId: 'cart_001',
      resourceType: 'POLICY',
      payload: { outcome: 'ALLOW' },
    });

    const event3 = await auditService.recordEvent({
      eventType: 'APPROVAL_REQUESTED',
      actorId: adminId,
      actorRole: 'ADMIN',
      resourceId: 'appr_001',
      resourceType: 'APPROVAL',
      payload: { totalPaise: 25000 },
    });

    // Verify sequences
    expect(event1.sequenceNumber).toBe(1);
    expect(event1.previousHash).toBe(GENESIS_HASH);

    expect(event2.sequenceNumber).toBe(2);
    expect(event2.previousHash).toBe(event1.currentHash);

    expect(event3.sequenceNumber).toBe(3);
    expect(event3.previousHash).toBe(event2.currentHash);
  });

  it('GET /api/v1/audit/verify — should cryptographically verify the unbroken ledger', async () => {
    const res = await request(app)
      .get('/api/v1/audit/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.totalEvents).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/v1/audit/events — should return paginated audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit/events?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it('Tampering detection — should detect unauthorized mutation in event payload and report compromised block', async () => {
    // 1. Ledger starts valid
    const preVerify = await auditService.verifyChain();
    expect(preVerify.valid).toBe(true);

    // 2. Adversary mutates payload of block 2 in database
    await AuditEventModel.updateOne(
      { sequenceNumber: 2 },
      { $set: { 'payload.outcome': 'MALICIOUS_OVERRIDE' } }
    );

    // 3. Chain verification must detect tampering and identify block 2
    const postVerify = await auditService.verifyChain();
    expect(postVerify.valid).toBe(false);
    expect(postVerify.compromisedAtSequence).toBe(2);
    expect(postVerify.message).toContain('Payload tampering detected at sequence 2');

    // 4. API endpoint also reports tampering
    const apiRes = await request(app)
      .get('/api/v1/audit/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(apiRes.body.data.valid).toBe(false);
    expect(apiRes.body.data.compromisedAtSequence).toBe(2);

    // 5. Restore block 2 to original payload
    await AuditEventModel.updateOne(
      { sequenceNumber: 2 },
      { $set: { 'payload.outcome': 'ALLOW' } }
    );

    // 6. Chain is now restored and valid again
    const restoredVerify = await auditService.verifyChain();
    expect(restoredVerify.valid).toBe(true);
  });
});
