import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';

describe('Auth & Session Lifecycle Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('User Registration', () => {
    it('should register a new customer successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'newuser@example.com',
        password: 'P@ssw0rdSecure!2026',
        name: 'Aarav Gupta',
        role: 'CUSTOMER',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@example.com');
      expect(res.body.data.user.name).toBe('Aarav Gupta');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject registration with existing email (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'newuser@example.com', // Already registered
        password: 'P@ssw0rdSecure!2026',
        name: 'Duplicate Aarav',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration with weak password (400 Validation Error)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'weakpass@example.com',
        password: 'weak',
        name: 'Weak Pass User',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('User Login & Authentication', () => {
    it('should authenticate seeded customer with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer1234!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should access /auth/me with valid Bearer token', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer1234!',
      });

      const token = loginRes.body.data.accessToken;

      const profileRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.email).toBe('customer@example.com');
      expect(profileRes.body.data.name).toBe('Priya Sharma (Shopper)');
    });

    it('should reject /auth/me request without token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Session Token Rotation & Logout', () => {
    it('should refresh access token using cookie', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@cartpilot.com',
        password: 'Admin1234!',
      });

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies as unknown as string[]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();
    });

    it('should invalidate session upon logout', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer1234!',
      });

      const token = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies as unknown as string[]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh with old cookie must now fail
      const failedRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies as unknown as string[]);

      expect(failedRefresh.status).toBe(401);
      expect(['UNAUTHORIZED', 'TOKEN_REUSE_DETECTED']).toContain(failedRefresh.body.error.code);
    });
  });

  describe('Milestone 1: Identity Sync & Role-Based Access Isolation', () => {
    it('should idempotently sync a newly authenticated Clerk shopper', async () => {
      const syncRes = await request(app).post('/api/v1/auth/sync').send({
        clerkUserId: 'user_clerk_test_12345',
        email: 'clerk_shopper@example.com',
        name: 'Clerk Shopper Test',
        phone: '+919876543210',
        isEmailVerified: true,
      });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);
      expect(syncRes.body.data.user.email).toBe('clerk_shopper@example.com');
      expect(syncRes.body.data.user.role).toBe('CUSTOMER');
    });

    it('should reject a shopper attempting to access merchant-only endpoints (403 Forbidden)', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer1234!',
      });
      const customerToken = loginRes.body.data.accessToken;

      const merchantRes = await request(app)
        .get('/api/v1/merchants/my-store')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(merchantRes.status).toBe(403);
      expect(merchantRes.body.success).toBe(false);
    });

    it('should reject a shopper attempting to access admin endpoints (403 Forbidden)', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer1234!',
      });
      const customerToken = loginRes.body.data.accessToken;

      const adminRes = await request(app)
        .get('/api/v1/system/integrations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.success).toBe(false);
    });
  });
});
