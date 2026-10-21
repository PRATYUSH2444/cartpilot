import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';
import { UserModel } from '../modules/users/user.model.js';
import { StaffInvitationModel } from '../modules/merchants/staff-invitation.model.js';
import { AuditEventModel } from '../modules/audit/audit-event.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { resetRateLimits } from '../common/middleware/rate-limiter.js';

describe('Phase 02 — Authentication, Accounts, Token Rotation & Role Behavior', () => {
  const app = createApp();

  let customerToken: string;
  let customerUser: { id: string; email: string };
  let merchantOwnerToken: string;
  let merchantStoreId: string;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Reset rate limiter windows for clean test runs
    resetRateLimits();

    // 1. Fetch seeded Customer
    const cust = await UserModel.findOne({ email: 'customer@example.com' });
    expect(cust).not.toBeNull();
    customerUser = cust;
    customerToken = AuthService.generateTokens(cust!).accessToken;

    // 2. Fetch seeded Merchant
    const merch = await UserModel.findOne({ email: 'merchant@freshgrocers.com' });
    expect(merch).not.toBeNull();
    const loginMerch = await AuthService.loginUser({
      email: 'merchant@freshgrocers.com',
      password: 'Merchant1234!',
    });
    merchantOwnerToken = loginMerch.accessToken;
    merchantStoreId = loginMerch.user.merchantId!;
    expect(merchantStoreId).toBeDefined();

    // 3. Fetch seeded Admin
    const adm = await UserModel.findOne({ email: 'admin@example.com' });
    expect(adm).not.toBeNull();
    const loginAdm = await AuthService.loginUser({
      email: 'admin@example.com',
      password: 'Admin1234!',
    });
    adminToken = loginAdm.accessToken;
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  // ==========================================
  // 1. ROLE BOUNDARIES & TENANT SEGREGATION
  // ==========================================
  describe('1. Role Boundaries & Cross-Role Isolation', () => {
    it('Customer cannot access merchant workspace routes (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/merchants/my-store')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Customer cannot access admin governance routes (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/merchants/admin/all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Merchant cannot access admin governance routes (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/merchants/admin/all')
        .set('Authorization', `Bearer ${merchantOwnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/merchants/my-store');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. TOKEN ROTATION & REUSE ATTACK DETECTION
  // ==========================================
  describe('2. Refresh Token Family Rotation & Cryptographic Reuse Detection', () => {
    it('Rotates refresh token upon refresh and revokes prior token', async () => {
      // Step A: Login to establish session and family
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@example.com',
          password: 'Customer1234!',
        });

      expect(loginRes.status).toBe(200);
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('cartpilot_refresh_token='))
        : cookies;
      expect(refreshCookie).toBeDefined();

      const initialRefreshToken = refreshCookie!.split(';')[0].split('=')[1];

      // Step B: Refresh with initial token -> should succeed and issue rotated token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`cartpilot_refresh_token=${initialRefreshToken}`])
        .send({});

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const newCookies = refreshRes.headers['set-cookie'];
      const rotatedCookie = Array.isArray(newCookies)
        ? newCookies.find((c: string) => c.startsWith('cartpilot_refresh_token='))
        : newCookies;
      const rotatedRefreshToken = rotatedCookie!.split(';')[0].split('=')[1];
      expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

      // Step C: REUSE ATTACK — Attacker attempts to replay initialRefreshToken
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`cartpilot_refresh_token=${initialRefreshToken}`])
        .send({});

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Verify tamper-evident audit event recorded
      const reuseEvent = await AuditEventModel.findOne({
        eventType: 'AUTH_TOKEN_REUSE_DETECTED',
        actorId: customerUser._id.toString(),
      });
      expect(reuseEvent).not.toBeNull();

      // Step D: Even the legitimate rotatedRefreshToken is now invalid because the family was revoked
      const subsequentRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`cartpilot_refresh_token=${rotatedRefreshToken}`])
        .send({});

      expect(subsequentRes.status).toBe(401);
    });
  });

  // ==========================================
  // 3. PROGRESSIVE ACCOUNT LOCKOUT
  // ==========================================
  describe('3. Progressive Account Lockout on Consecutive Failed Logins', () => {
    it('Locks account after 5 failed password attempts and rejects even correct password', async () => {
      const testEmail = 'lockout-test@example.com';
      await UserModel.create({
        name: 'Lockout Target',
        email: testEmail,
        passwordHash: await bcrypt.hash('CorrectPassword123!', 10),
        role: 'CUSTOMER',
        isActive: true,
        failedLoginAttempts: 0,
        tokenVersion: 0,
      });

      // Submit 4 incorrect attempts (below threshold)
      for (let i = 0; i < 4; i++) {
        const failRes = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: testEmail, password: 'WrongPassword!' });
        expect(failRes.status).toBe(401);
      }

      const userAfter4 = await UserModel.findOne({ email: testEmail });
      expect(userAfter4?.failedLoginAttempts).toBe(4);
      expect(userAfter4?.lockoutUntil).toBeFalsy();

      // 5th failed attempt triggers lockout
      const fifthRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' });
      expect(fifthRes.status).toBe(401);

      const userAfter5 = await UserModel.findOne({ email: testEmail });
      expect(userAfter5?.failedLoginAttempts).toBe(5);
      expect(userAfter5?.lockoutUntil).toBeDefined();
      expect(userAfter5!.lockoutUntil!.getTime()).toBeGreaterThan(Date.now());

      // 6th attempt with CORRECT password must fail due to active lockout
      const correctWhileLocked = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'CorrectPassword123!' });

      expect(correctWhileLocked.status).toBe(429);
      expect(correctWhileLocked.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  // ==========================================
  // 4. SIGN OUT EVERYWHERE & ACTIVE SESSIONS
  // ==========================================
  describe('4. Active Session Enumeration & Logout Everywhere', () => {
    it('Lists active user sessions and revokes all on logout-all', async () => {
      const email = 'session-test@example.com';
      const createdUser = await UserModel.create({
        name: 'Session User',
        email,
        passwordHash: await bcrypt.hash('SessionPass123!', 10),
        role: 'CUSTOMER',
        isActive: true,
        tokenVersion: 0,
      });

      // Establish session 1
      const s1 = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0')
        .send({ email, password: 'SessionPass123!' });
      const token1 = s1.body.data.accessToken;

      // Establish session 2
      const s2 = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148')
        .send({ email, password: 'SessionPass123!' });
      const token2 = s2.body.data.accessToken;

      // List active sessions
      const listRes = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);

      // Call logout-all
      const logoutAllRes = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${token1}`);

      expect(logoutAllRes.status).toBe(200);
      expect(logoutAllRes.body.success).toBe(true);

      // Verify user tokenVersion was incremented in DB
      const refreshedUser = await UserModel.findById(createdUser._id);
      expect(refreshedUser?.tokenVersion).toBeGreaterThan(0);

      // Both previous access tokens must be immediately rejected
      const verifyToken1 = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token1}`);
      expect(verifyToken1.status).toBe(401);

      const verifyToken2 = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token2}`);
      expect(verifyToken2.status).toBe(401);
    });
  });

  // ==========================================
  // 5. SINGLE-USE PASSWORD RESET
  // ==========================================
  describe('5. Cryptographic Single-Use Password Reset', () => {
    it('Dispatches reset token and invalidates token upon successful consumption', async () => {
      const email = 'reset-flow@example.com';
      await UserModel.create({
        name: 'Reset Flow User',
        email,
        passwordHash: await bcrypt.hash('OldPassword123!', 10),
        role: 'CUSTOMER',
        isActive: true,
        tokenVersion: 0,
      });

      // Request reset link
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // In test mode, devResetLink is returned for deterministic automated verification
      const devLink = forgotRes.body.data.devResetLink;
      expect(devLink).toBeDefined();
      const rawToken = new URLSearchParams(devLink.split('?')[1]).get('token')!;
      expect(rawToken).toBeDefined();

      // Consume reset token with new password
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          password: 'NewStrongPassword123!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Replaying the same token must fail (single-use constraint)
      const replayRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          password: 'AnotherPassword123!',
        });

      expect(replayRes.status).toBe(400);

      // Sign in with new credentials succeeds
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'NewStrongPassword123!',
        });

      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
    });
  });

  // ==========================================
  // 6. MERCHANT APPLICATION & LIFECYCLE
  // ==========================================
  describe('6. Merchant Application, PENDING State & Admin Governance', () => {
    let newMerchantId: string;
    let newMerchantToken: string;

    it('Rejects application if pure vegetarian declaration is missing or false', async () => {
      const res = await request(app)
        .post('/api/v1/merchants/apply')
        .send({
          storeName: 'Non-Veg Mart',
          ownerName: 'Invalid Applicant',
          email: 'invalid@example.com',
          password: 'ValidPassword123!',
          phone: '9876543210',
          street: '123 Test St',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          vegetarianDeclaration: false,
        });

      expect(res.status).toBe(400);
    });

    it('Creates merchant application in PENDING state with vegetarian compliance', async () => {
      const res = await request(app)
        .post('/api/v1/merchants/apply')
        .send({
          storeName: 'Pure Green Oasis',
          ownerName: 'Satvik Patel',
          email: 'satvik@oasisorganic.com',
          password: 'GreenPassword123!',
          phone: '9876543210',
          street: '45 Lotus Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          serviceAreaPincodes: ['560038', '560008'],
          vegetarianDeclaration: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.merchant.status).toBe('PENDING');

      newMerchantId = res.body.data.merchant._id;
      newMerchantToken = res.body.data.accessToken;

      // Merchant owner sees their store in PENDING status
      const storeRes = await request(app)
        .get('/api/v1/merchants/my-store')
        .set('Authorization', `Bearer ${newMerchantToken}`);

      expect(storeRes.status).toBe(200);
      expect(storeRes.body.data.status).toBe('PENDING');
    });

    it('Admin approves merchant application', async () => {
      const approveRes = await request(app)
        .post(`/api/v1/merchants/admin/${newMerchantId}/status/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Verify store is now APPROVED
      const checkRes = await request(app)
        .get('/api/v1/merchants/my-store')
        .set('Authorization', `Bearer ${newMerchantToken}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.status).toBe('APPROVED');
    });

    it('Admin suspends merchant with reason and restores status', async () => {
      // Suspend
      const suspendRes = await request(app)
        .post(`/api/v1/merchants/admin/${newMerchantId}/status/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Audit pending for pesticide certification' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('SUSPENDED');
      expect(suspendRes.body.data.suspensionReason).toBe('Audit pending for pesticide certification');

      // Restore
      const restoreRes = await request(app)
        .post(`/api/v1/merchants/admin/${newMerchantId}/status/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.status).toBe('APPROVED');
    });
  });

  // ==========================================
  // 7. STAFF INVITATION & PERMISSION SCOPING
  // ==========================================
  describe('7. Staff Invitation, Scoped Permissions & Revocation', () => {
    let inviteToken: string;
    let staffUserId: string;
    let staffToken: string;

    it('Merchant owner invites staff member with scoped permissions', async () => {
      const inviteRes = await request(app)
        .post('/api/v1/merchants/staff/invite')
        .set('Authorization', `Bearer ${merchantOwnerToken}`)
        .send({
          name: 'Ravi Kumar',
          email: 'ravi.staff@freshgrocers.com',
          permissions: ['orders.update'],
        });

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.success).toBe(true);
      expect(inviteRes.body.data.inviteToken).toBeDefined();
      inviteToken = inviteRes.body.data.inviteToken;

      // Verify invite stored in DB
      const invitation = await StaffInvitationModel.findOne({
        email: 'ravi.staff@freshgrocers.com',
      });
      expect(invitation).not.toBeNull();
      expect(invitation?.isAccepted).toBe(false);
    });

    it('Staff member accepts invitation and establishes credentials', async () => {
      const acceptRes = await request(app)
        .post('/api/v1/merchants/staff/accept-invite')
        .send({
          token: inviteToken,
          password: 'RaviPassword123!',
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.user.isStaff).toBe(true);
      expect(acceptRes.body.data.user.staffPermissions).toContain('orders.update');

      staffUserId = acceptRes.body.data.user.id;
      staffToken = acceptRes.body.data.accessToken;

      // Replay of accepted token is rejected
      const replayInvite = await request(app)
        .post('/api/v1/merchants/staff/accept-invite')
        .send({
          token: inviteToken,
          password: 'AnotherPassword123!',
        });

      expect(replayInvite.status).toBe(400);
    });

    it('Staff member is listed under active staff for merchant store', async () => {
      const staffListRes = await request(app)
        .get('/api/v1/merchants/staff')
        .set('Authorization', `Bearer ${merchantOwnerToken}`);

      expect(staffListRes.status).toBe(200);
      const ravi = staffListRes.body.data.staff.find(
        (s: { email: string; permissions: string[] }) => s.email === 'ravi.staff@freshgrocers.com'
      );
      expect(ravi).toBeDefined();
      expect(ravi.permissions).toContain('orders.update');
    });

    it('Merchant owner revokes staff member and terminates their access immediately', async () => {
      const revokeRes = await request(app)
        .delete(`/api/v1/merchants/staff/${staffUserId}`)
        .set('Authorization', `Bearer ${merchantOwnerToken}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);

      // Staff access token must now be rejected (suspended account throws 403, or invalid session throws 401)
      const verifyStaff = await request(app)
        .get('/api/v1/merchants/my-store')
        .set('Authorization', `Bearer ${staffToken}`);

      expect([401, 403]).toContain(verifyStaff.status);

      // Staff login is rejected (user suspended / revoked)
      const staffLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ravi.staff@freshgrocers.com',
          password: 'RaviPassword123!',
        });

      expect(staffLogin.status).toBe(403);
    });
  });

  // ==========================================
  // 8. ADMIN PROVISIONING WITH RE-AUTH
  // ==========================================
  describe('8. Admin Provisioning with Re-Authentication Guard', () => {
    it('Requires current admin password confirmation to create a new administrator', async () => {
      // Step A: Attempt with incorrect current password -> fails 401
      const failRes = await request(app)
        .post('/api/v1/auth/admin/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Junior Admin',
          email: 'junior.admin@cartpilot.in',
          password: 'TempAdminPass123!',
          currentAdminPassword: 'WrongAdminPassword!',
        });

      expect(failRes.status).toBe(401);
      expect(failRes.body.error.code).toBe('REAUTH_REQUIRED');

      // Step B: Attempt with correct current password -> succeeds
      const successRes = await request(app)
        .post('/api/v1/auth/admin/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Junior Admin',
          email: 'junior.admin@cartpilot.in',
          password: 'TempAdminPass123!',
          currentAdminPassword: 'Admin1234!',
        });

      expect(successRes.status).toBe(201);
      expect(successRes.body.success).toBe(true);
      expect(successRes.body.data.user.role).toBe('ADMIN');

      // Step C: New admin logs in and mustChangePassword flag is true
      const newAdminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'junior.admin@cartpilot.in',
          password: 'TempAdminPass123!',
        });

      expect(newAdminLogin.status).toBe(200);
      expect(newAdminLogin.body.data.user.mustChangePassword).toBe(true);

      // Step D: Force change password
      const changeRes = await request(app)
        .post('/api/v1/auth/force-change-password')
        .set('Authorization', `Bearer ${newAdminLogin.body.data.accessToken}`)
        .send({
          newPassword: 'PermanentAdminPass123!',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify flag cleared in DB
      const updatedAdmin = await UserModel.findOne({ email: 'junior.admin@cartpilot.in' });
      expect(updatedAdmin?.mustChangePassword).toBe(false);
    });
  });
});
