import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';

describe('Catalog & Product Discovery Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Alias Resolution & Text Search', () => {
    it('searching alias "pyaz" should return Red Onions', async () => {
      const res = await request(app).get('/api/v1/catalog?query=pyaz');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const onion = res.body.data.find((p: { name: string }) => p.name.includes('Onion'));
      expect(onion).toBeDefined();
      expect(onion.category).toBe('VEGETABLES');
      expect(onion.aliases).toContain('pyaz');
      expect(onion.isVegetarian).toBe(true);
      expect(onion.pricePaise).toBe(4500); // ₹45.00
    });

    it('searching alias "chenna" should return Fresh Malai Paneer', async () => {
      const res = await request(app).get('/api/v1/catalog?query=chenna');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const paneer = res.body.data.find((p: { name: string }) => p.name.includes('Paneer'));
      expect(paneer).toBeDefined();
      expect(paneer.category).toBe('DAIRY');
      expect(paneer.aliases).toContain('chenna');
    });

    it('searching alias "chawal" should return Royal Aged Basmati Rice', async () => {
      const res = await request(app).get('/api/v1/catalog?query=chawal');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const rice = res.body.data.find((p: { name: string }) => p.name.includes('Rice'));
      expect(rice).toBeDefined();
      expect(rice.category).toBe('GRAINS');
      expect(rice.aliases).toContain('chawal');
    });

    it('searching alias "haldi" should return Turmeric Powder', async () => {
      const res = await request(app).get('/api/v1/catalog?query=haldi');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const turmeric = res.body.data.find((p: { name: string }) => p.name.includes('Turmeric'));
      expect(turmeric).toBeDefined();
      expect(turmeric.category).toBe('SPICES');
    });

    it('searching alias "aloo" should return Fresh Potatoes', async () => {
      const res = await request(app).get('/api/v1/catalog?query=aloo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const potato = res.body.data.find((p: { name: string }) => p.name.includes('Potatoes'));
      expect(potato).toBeDefined();
      expect(potato.category).toBe('VEGETABLES');
    });
  });

  describe('Category Filtering & Integer Pricing Constraints', () => {
    it('should filter strictly by DAIRY category', async () => {
      const res = await request(app).get('/api/v1/catalog?category=DAIRY');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const product of res.body.data) {
        expect(product.category).toBe('DAIRY');
        expect(product.isVegetarian).toBe(true);
        expect(Number.isInteger(product.pricePaise)).toBe(true);
      }
    });

    it('should filter strictly by PULSES category', async () => {
      const res = await request(app).get('/api/v1/catalog?category=PULSES');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const product of res.body.data) {
        expect(product.category).toBe('PULSES');
      }
    });

    it('should retrieve distinct categories with count metadata', async () => {
      const res = await request(app).get('/api/v1/catalog/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const categories = res.body.data.map((c: { category: string }) => c.category);
      expect(categories).toContain('VEGETABLES');
      expect(categories).toContain('DAIRY');
      expect(categories).toContain('GRAINS');
      expect(categories).toContain('SPICES');
    });
  });

  describe('Product Details & Validation', () => {
    it('should retrieve individual product details by ID with populated merchant', async () => {
      const listRes = await request(app).get('/api/v1/catalog?limit=1');
      const firstProduct = listRes.body.data[0];

      const detailRes = await request(app).get(`/api/v1/catalog/${firstProduct._id}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.success).toBe(true);
      expect(detailRes.body.data._id).toBe(firstProduct._id);
      expect(detailRes.body.data.merchantId).toBeDefined();
      expect(detailRes.body.data.merchantId.businessName).toBeDefined();
    });

    it('should return 400 Bad Request for malformed product ID', async () => {
      const res = await request(app).get('/api/v1/catalog/invalid-id-123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should return 404 Not Found for non-existent valid ObjectId', async () => {
      const nonExistentId = '654321654321654321654321';
      const res = await request(app).get(`/api/v1/catalog/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Merchants Discovery', () => {
    it('should list all active merchants', async () => {
      const res = await request(app).get('/api/v1/merchants');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const slugs = res.body.data.map((m: { slug: string }) => m.slug);
      expect(slugs).toContain('fresh-greens-organics');
      expect(slugs).toContain('desi-kirana-spices');
    });
  });
});
