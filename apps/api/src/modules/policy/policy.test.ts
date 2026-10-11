import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';
import { MandateModel } from '../mandates/mandate.model.js';

describe('Phase 04 — Deterministic Policy Engine Integration Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;
  let paneerProduct: any;
  let basmatiProduct: any;

  beforeAll(async () => {
    await setupTestDatabase();

    const customer = await UserModel.findOne({ email: 'customer@example.com' });
    expect(customer).not.toBeNull();
    customerId = customer!._id.toString();

    const session = AuthService.generateTokens({
      userId: customerId,
      email: customer!.email,
      role: customer!.role,
      tokenVersion: customer!.tokenVersion,
    });
    customerToken = session.accessToken;

    paneerProduct = await ProductModel.findOne({ slug: 'fresh-malai-paneer-200g' });
    basmatiProduct = await ProductModel.findOne({ slug: 'royal-aged-basmati-rice-1kg' });
    expect(paneerProduct).not.toBeNull();
    expect(basmatiProduct).not.toBeNull();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('GET /api/v1/policy/evaluate — should deny when active cart is empty', async () => {
    // Clear cart first
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`);

    const res = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('DENY');
    expect(res.body.data.reasonCode).toBe('EMPTY_CART');
  });

  it('GET /api/v1/policy/evaluate — should return ALLOW for cart within autonomous threshold', async () => {
    // Add 2 paneer (2 * 9,500 = 19,000 paise subtotal + 4,000 delivery + 950 tax = 23,950 paise < 60,000 threshold)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: paneerProduct._id.toString(), quantity: 2 });

    const res = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('ALLOW');
    expect(res.body.data.reasonCode).toBe('WITHIN_LIMITS');
    expect(res.body.data.requiresApproval).toBe(false);
  });

  it('GET /api/v1/policy/evaluate — should return NEEDS_HUMAN_APPROVAL when total exceeds threshold', async () => {
    // Add 5 basmati (5 * 14,000 = 70,000 paise subtotal; total > 60,000 threshold)
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: basmatiProduct._id.toString(), quantity: 5 });

    const res = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('NEEDS_HUMAN_APPROVAL');
    expect(res.body.data.reasonCode).toBe('THRESHOLD_EXCEEDED');
    expect(res.body.data.requiresApproval).toBe(true);
    expect(res.body.data.approvalId).toBeDefined();
    expect(res.body.data.approvalHash).toBeDefined();
  });

  it('GET /api/v1/policy/evaluate — should return DENY when cart contains a blocked category', async () => {
    // Update mandate to block DAIRY
    await MandateModel.updateOne(
      { userId: customerId },
      { $set: { blockedCategories: ['DAIRY'] }, $inc: { version: 1 } }
    );

    const res = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('DENY');
    expect(res.body.data.reasonCode).toBe('BLOCKED_CATEGORY');

    // Restore mandate
    await MandateModel.updateOne({ userId: customerId }, { $set: { blockedCategories: [] } });
  });

  it('GET /api/v1/policy/evaluate — should return DENY when cart exceeds daily budget cap', async () => {
    // Set daily budget very low (e.g. ₹50 = 5,000 paise)
    await MandateModel.updateOne(
      { userId: customerId },
      { $set: { dailyBudgetPaise: 5000 }, $inc: { version: 1 } }
    );

    const res = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcome).toBe('DENY');
    expect(res.body.data.reasonCode).toBe('DAILY_BUDGET_EXCEEDED');

    // Restore daily budget to default
    await MandateModel.updateOne({ userId: customerId }, { $set: { dailyBudgetPaise: 150000 } });
  });
});
