import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { MerchantModel } from './merchant.model.js';
import { AuditEventModel } from '../audit/audit-event.model.js';

describe('Milestone 3 (M3): Merchant Onboarding, Approval Queue & Tenant Isolation Integration Tests', () => {
  const app = createApp();

  let adminToken: string;
  let shopperToken: string;
  let merchantAToken: string;
  let merchantAId: string;
  let pendingMerchantId: string;
  let pendingMerchantToken: string;
  let productAId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@cartpilot.com',
      password: 'Admin1234!',
    });
    adminToken = adminRes.body.data.accessToken;

    // Authenticate Shopper
    const shopperRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@cartpilot.com',
      password: 'Customer1234!',
    });
    shopperToken = shopperRes.body.data.accessToken;

    // Authenticate Seeded Merchant A (Fresh Greens Organics - Approved)
    const merchantARes = await request(app).post('/api/v1/auth/login').send({
      email: 'merchant@freshgrocers.com',
      password: 'Merchant1234!',
    });
    merchantAToken = merchantARes.body.data.accessToken;
    merchantAId = merchantARes.body.data.user.merchantId;
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('1. Merchant Application & Registration Flow', () => {
    it('should reject merchant application if vegetarianDeclaration is false or omitted', async () => {
      const res = await request(app).post('/api/v1/merchants/apply').send({
        storeName: 'Quick Veggies Express',
        ownerName: 'Sunil Kumar',
        email: 'sunil@quickveggies.test',
        password: 'P@ssw0rdSecure!2026',
        phone: '9876543210',
        street: '12 80 Feet Road, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        serviceAreaPincodes: ['560034'],
        vegetarianDeclaration: false, // Fails compliance check
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject merchant application with weak password', async () => {
      const res = await request(app).post('/api/v1/merchants/apply').send({
        storeName: 'Quick Veggies Express',
        ownerName: 'Sunil Kumar',
        email: 'sunil@quickveggies.test',
        password: 'weak',
        phone: '9876543210',
        street: '12 80 Feet Road, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        serviceAreaPincodes: ['560034'],
        vegetarianDeclaration: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a new merchant in PENDING status (isActive = false)', async () => {
      const res = await request(app).post('/api/v1/merchants/apply').send({
        storeName: 'Green Basket Organics',
        ownerName: 'Sunil Kumar',
        email: 'sunil@greenbasket.test',
        password: 'P@ssw0rdSecure!2026',
        phone: '9876543210',
        street: '45 100 Feet Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        serviceAreaPincodes: ['560038', '560008'],
        vegetarianDeclaration: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('MERCHANT');
      expect(res.body.data.merchant.status).toBe('PENDING');
      expect(res.body.data.merchant.isActive).toBe(false);
      expect(res.body.data.merchant.isVegetarianCertified).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      pendingMerchantId = res.body.data.merchant._id;
      pendingMerchantToken = res.body.data.accessToken;
    });

    it('should reject duplicate merchant application with existing email (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/merchants/apply').send({
        storeName: 'Duplicate Basket',
        ownerName: 'Sunil Kumar',
        email: 'sunil@greenbasket.test', // Already exists
        password: 'P@ssw0rdSecure!2026',
        phone: '9876543210',
        street: '45 100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        serviceAreaPincodes: ['560038'],
        vegetarianDeclaration: true,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('2. Pending Merchant Gating (No Active Catalog / Orders until Approved)', () => {
    it('should block pending merchant from adding products to active catalog (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/merchants/my-store/products')
        .set('Authorization', `Bearer ${pendingMerchantToken}`)
        .send({
          name: 'Organic Shimla Apple',
          description: 'Crisp mountain apples',
          category: 'FRUITS_VEGETABLES',
          pricePaise: 16000,
          packageSize: 1,
          packageUnit: 'KG',
          availableStock: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not approved/i);
    });

    it('should NOT list pending merchant in public merchants discovery (GET /api/v1/merchants)', async () => {
      const res = await request(app).get('/api/v1/merchants');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const slugs = res.body.data.map((m: any) => m._id);
      expect(slugs).not.toContain(pendingMerchantId);
    });
  });

  describe('3. Master Admin Review Queue & Approval Lifecycle', () => {
    it('should reject non-admin shoppers from accessing admin merchant queue (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/merchants/admin/all')
        .set('Authorization', `Bearer ${shopperToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow Master Admin to list all merchant applications including PENDING ones', async () => {
      const res = await request(app)
        .get('/api/v1/merchants/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((m: any) => m._id === pendingMerchantId);
      expect(found).toBeDefined();
      expect(found.status).toBe('PENDING');
    });

    it('should allow Master Admin to APPROVE the pending merchant', async () => {
      const res = await request(app)
        .post(`/api/v1/merchants/admin/${pendingMerchantId}/status/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Verified FSSAI certificate and store location',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.isActive).toBe(true);

      // Verify audit event was logged in immutable hash-chained ledger
      const auditEvent = await AuditEventModel.findOne({
        eventType: 'MERCHANT_STATUS_UPDATED',
        resourceId: pendingMerchantId,
      });
      expect(auditEvent).toBeDefined();
      expect(auditEvent?.payload?.newStatus).toBe('APPROVED');
      expect(auditEvent?.currentHash).toBeDefined();
    });

    it('should allow Master Admin to SUSPEND an active merchant with recorded reason', async () => {
      const res = await request(app)
        .post(`/api/v1/merchants/admin/${pendingMerchantId}/status/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Inventory discrepancy review in progress',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect(res.body.data.isActive).toBe(false);
    });

    it('should allow Master Admin to RESTORE a suspended merchant back to APPROVED', async () => {
      const res = await request(app)
        .post(`/api/v1/merchants/admin/${pendingMerchantId}/status/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Compliance review completed successfully',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe('4. Tenant Isolation & Store Operations Boundary', () => {
    it('should allow approved Merchant A to create a product in their own store', async () => {
      const res = await request(app)
        .post('/api/v1/merchants/my-store/products')
        .set('Authorization', `Bearer ${merchantAToken}`)
        .send({
          name: 'Hydroponic English Spinach',
          description: 'Pesticide-free fresh spinach bunches',
          category: 'FRUITS_VEGETABLES',
          pricePaise: 4500, // ₹45.00 in integer paise
          packageSize: 250,
          packageUnit: 'G',
          availableStock: 100,
          aliases: ['spinach', 'palak', 'green saag'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Hydroponic English Spinach');
      expect(res.body.data.pricePaise).toBe(4500);
      expect(res.body.data.isVegetarian).toBe(true);

      productAId = res.body.data._id;
    });

    it('should strictly reject Merchant B from updating Merchant A product (Tenant Boundary 404)', async () => {
      // PendingMerchant was restored to Approved and represents a completely separate tenant
      const res = await request(app)
        .patch(`/api/v1/merchants/my-store/products/${productAId}`)
        .set('Authorization', `Bearer ${pendingMerchantToken}`)
        .send({
          name: 'Hacked Product Name',
          pricePaise: 100,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should strictly reject Merchant B from adjusting stock on Merchant A product', async () => {
      const res = await request(app)
        .patch(`/api/v1/merchants/my-store/products/${productAId}/stock`)
        .set('Authorization', `Bearer ${pendingMerchantToken}`)
        .send({
          delta: -50,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow Merchant A to adjust stock for their own product', async () => {
      const res = await request(app)
        .patch(`/api/v1/merchants/my-store/products/${productAId}/stock`)
        .set('Authorization', `Bearer ${merchantAToken}`)
        .send({
          delta: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availableStock).toBe(125);
    });

    it('should strictly reject shoppers from invoking merchant store management (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/merchants/my-store/products/${productAId}/stock`)
        .set('Authorization', `Bearer ${shopperToken}`)
        .send({
          delta: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
