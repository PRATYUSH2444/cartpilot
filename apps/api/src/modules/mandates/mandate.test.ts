import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';

describe('Phase 04 — Mandate & Spending Rules Integration Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;

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
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('GET /api/v1/mandate — should auto-initialize and return default spending mandate', async () => {
    const res = await request(app)
      .get('/api/v1/mandate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mandate.maxOrderAmountPaise).toBe(60000); // ₹600.00
    expect(res.body.data.mandate.dailyBudgetPaise).toBe(150000); // ₹1,500.00
    expect(res.body.data.mandate.version).toBe(1);
    expect(res.body.data.todaySpentPaise).toBe(0);
    expect(res.body.data.remainingDailyBudgetPaise).toBe(150000);
  });

  it('PUT /api/v1/mandate — should update rules, increment version, and enforce validation', async () => {
    const res = await request(app)
      .put('/api/v1/mandate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        maxOrderAmountPaise: 80000, // ₹800.00
        dailyBudgetPaise: 200000, // ₹2,000.00
        blockedCategories: ['SNACKS', 'ALCOHOL'],
        requireExplicitApproval: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe(2);
    expect(res.body.data.maxOrderAmountPaise).toBe(80000);
    expect(res.body.data.dailyBudgetPaise).toBe(200000);
    expect(res.body.data.blockedCategories).toEqual(['SNACKS', 'ALCOHOL']);
  });

  it('PUT /api/v1/mandate — should reject invalid negative or fractional amounts', async () => {
    const res = await request(app)
      .put('/api/v1/mandate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        maxOrderAmountPaise: -500,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
