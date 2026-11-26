import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import bcrypt from 'bcryptjs';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { UserModel } from '../users/user.model.js';
import { auditService } from '../audit/audit.service.js';

describe('Milestone 4 — Master Admin Access & MFA Guard Integration Tests', () => {
  const app = createApp();

  const adminEmail = 'master-admin@cartpilot.internal';
  const adminPassword = 'AdminMaster1234!';
  let adminId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const masterAdmin = await UserModel.create({
      name: 'Master Security Administrator',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
      isEmailVerified: true,
      isMasterAdmin: true,
      isMfaEnforced: true,
    });

    adminId = masterAdmin._id.toString();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('1. Single Master Admin Status', () => {
    it('GET /api/v1/auth/admin/status — returns Master Admin provisioning and MFA enforcement status', async () => {
      const res = await request(app).get('/api/v1/auth/admin/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isProvisioned).toBe(true);
      expect(res.body.data.masterAdminEmail).toBe(adminEmail);
      expect(res.body.data.mfaEnforcementActive).toBe(true);
      expect(res.body.data.adminCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Master Admin MFA Authentication Lifecycle', () => {
    let mfaToken: string;
    let simulatedMfaCode: string;

    it('POST /api/v1/auth/admin/login — rejects invalid administrator credentials', async () => {
      const res = await request(app).post('/api/v1/auth/admin/login').send({
        email: adminEmail,
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/admin/login — rejects non-admin accounts', async () => {
      const shopper = await UserModel.create({
        name: 'Shopper User',
        email: 'shopper-test@cartpilot.internal',
        passwordHash: await bcrypt.hash('Shopper123!', 10),
        role: 'CUSTOMER',
        isActive: true,
      });

      const res = await request(app).post('/api/v1/auth/admin/login').send({
        email: shopper.email,
        password: 'Shopper123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/admin/login — generates 6-digit MFA challenge with temporary token', async () => {
      const res = await request(app).post('/api/v1/auth/admin/login').send({
        email: adminEmail,
        password: adminPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mfaRequired).toBe(true);
      expect(res.body.data.mfaToken).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBe(300);
      expect(res.body.data.simulatedMfaCode).toBeDefined();
      expect(res.body.data.simulatedMfaCode).toHaveLength(6);

      mfaToken = res.body.data.mfaToken;
      simulatedMfaCode = res.body.data.simulatedMfaCode;
    });

    it('POST /api/v1/auth/admin/mfa/verify — rejects incorrect MFA code (400)', async () => {
      const res = await request(app).post('/api/v1/auth/admin/mfa/verify').send({
        mfaToken,
        code: '000000',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/admin/mfa/verify — successfully completes 2FA and grants full admin access', async () => {
      const res = await request(app).post('/api/v1/auth/admin/mfa/verify').send({
        mfaToken,
        code: simulatedMfaCode,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.isMfaVerified).toBe(true);

      // Verify access to protected admin endpoints
      const eventsRes = await request(app)
        .get('/api/v1/audit/events?limit=5')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`);

      expect(eventsRes.status).toBe(200);
      expect(eventsRes.body.success).toBe(true);
    });
  });

  describe('3. Admin Audit Streams & Cryptographic Export', () => {
    let verifiedAdminToken: string;

    beforeAll(async () => {
      const loginRes = await request(app).post('/api/v1/auth/admin/login').send({
        email: adminEmail,
        password: adminPassword,
      });
      const verifyRes = await request(app).post('/api/v1/auth/admin/mfa/verify').send({
        mfaToken: loginRes.body.data.mfaToken,
        code: loginRes.body.data.simulatedMfaCode,
      });
      verifiedAdminToken = verifyRes.body.data.accessToken;
    });

    it('GET /api/v1/audit/export — streams complete audit ledger as line-delimited JSON (NDJSON)', async () => {
      await auditService.recordEvent({
        eventType: 'MANDATE_UPDATED',
        actorId: adminId,
        actorRole: 'ADMIN',
        resourceId: 'mfa_test_001',
        resourceType: 'MANDATE',
        payload: { threshold: 75000 },
      });

      const res = await request(app)
        .get('/api/v1/audit/export')
        .set('Authorization', `Bearer ${verifiedAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/x-ndjson');
      expect(res.headers['content-disposition']).toContain('attachment; filename="cartpilot-audit-ledger.ndjson"');

      const lines = res.text.trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(1);

      const firstParsed = JSON.parse(lines[0]);
      expect(firstParsed.sequenceNumber).toBeDefined();
      expect(firstParsed.currentHash).toBeDefined();
    });

    it('GET /api/v1/audit/stream — accepts query token for SSE connection and emits real-time event updates', async () => {
      const server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const port = (server.address() as any).port;

      const receivedChunks: string[] = [];
      let clientReq: http.ClientRequest | null = null;

      const streamPromise = new Promise<void>((resolve, reject) => {
        clientReq = http.get(
          `http://127.0.0.1:${port}/api/v1/audit/stream?token=${verifiedAdminToken}`,
          (res) => {
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('text/event-stream');

            res.on('data', (chunk: Buffer) => {
              const text = chunk.toString();
              receivedChunks.push(text);
              if (text.includes('initial_state') || text.includes('audit_event')) {
                resolve();
              }
            });

            res.on('error', reject);
          }
        );
        clientReq.on('error', reject);
      });

      // Allow connection to establish
      await new Promise((r) => setTimeout(r, 150));

      // Await recording event before test completion to ensure db is connected
      await auditService.recordEvent({
        eventType: 'POLICY_EVALUATION',
        actorId: adminId,
        actorRole: 'ADMIN',
        resourceId: 'policy_live_stream_001',
        resourceType: 'POLICY',
        payload: { streamTest: true },
      });

      await streamPromise;

      // Clean up client and server
      clientReq?.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));

      expect(receivedChunks.length).toBeGreaterThan(0);
      expect(receivedChunks.some((c) => c.includes('initial_state') || c.includes('audit_event'))).toBe(true);
    });
  });
});
