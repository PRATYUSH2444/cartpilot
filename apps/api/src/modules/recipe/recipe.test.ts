import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';

describe('Phase 05 — Recipe-to-SKU Resolution Engine Integration Tests', () => {
  const app = createApp();
  let customerToken: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const customer = await UserModel.findOne({ email: 'customer@example.com' });
    expect(customer).not.toBeNull();

    const session = AuthService.generateTokens({
      userId: customer!._id.toString(),
      email: customer!.email,
      role: customer!.role,
      tokenVersion: customer!.tokenVersion,
    });
    customerToken = session.accessToken;
  }, 120000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('POST /api/v1/recipe/resolve — requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/recipe/resolve')
      .send({ dishName: 'Paneer Pulao' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/recipe/resolve — successfully resolves "Paneer Pulao" for 4 servings', async () => {
    const res = await request(app)
      .post('/api/v1/recipe/resolve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dishName: 'Paneer Pulao',
        servings: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.dishName).toBe('Paneer Pulao');
    expect(data.servings).toBe(4);
    expect(data.matchedItems.length).toBeGreaterThan(0);

    // Verify key ingredients matched
    const rice = data.matchedItems.find((i: any) => i.name.toLowerCase().includes('rice'));
    const paneer = data.matchedItems.find((i: any) => i.name.toLowerCase().includes('paneer'));
    const peas = data.matchedItems.find((i: any) => i.name.toLowerCase().includes('peas'));

    expect(rice).toBeDefined();
    expect(paneer).toBeDefined();
    expect(peas).toBeDefined();

    // Verify pack calculation for paneer (4 servings * 75g = 300g needed, packs are 200g, so 2 packs = 400g)
    expect(paneer.packCount).toBe(2);
    expect(paneer.packageSize).toBe(200);
    expect(paneer.subtotalPaise).toBe(2 * paneer.unitPricePaise);

    // Verify estimated total is non-zero integer
    expect(data.estimatedTotalPaise).toBeGreaterThan(0);
    expect(Number.isInteger(data.estimatedTotalPaise)).toBe(true);
    expect(data.formattedEstimatedTotal).toContain('₹');
  });

  it('POST /api/v1/recipe/resolve — detects multiple sizes as ambiguous candidates (SC-02)', async () => {
    const res = await request(app)
      .post('/api/v1/recipe/resolve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dishName: 'Paneer Butter Masala',
        servings: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Both 200g and 500g paneer exist in seed catalog, so ambiguousItems should flag paneer
    const paneerAmbiguity = res.body.data.ambiguousItems.find((i: any) =>
      i.ingredientName.toLowerCase().includes('paneer')
    );
    expect(paneerAmbiguity).toBeDefined();
    expect(paneerAmbiguity.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/v1/recipe/resolve — detects missing ingredients not in catalog (SC-03)', async () => {
    const res = await request(app)
      .post('/api/v1/recipe/resolve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dishName: 'Exotic Kashmiri Pulao',
        servings: 4,
        ingredients: ['Basmati Rice', 'Pure Desi Cow Ghee', 'Exotic Spanish Saffron'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const missing = res.body.data.missingItems.find((i: any) =>
      i.ingredientName.toLowerCase().includes('saffron')
    );
    expect(missing).toBeDefined();
    expect(missing.reason).toContain('No matching product');
  });

  it('POST /api/v1/recipe/resolve — rejects non-vegetarian requests adhering to strictly vegetarian catalog policy', async () => {
    const res = await request(app)
      .post('/api/v1/recipe/resolve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        dishName: 'Butter Chicken Masala',
        servings: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matchedItems.length).toBe(0);
    expect(res.body.data.missingItems.length).toBeGreaterThan(0);
    expect(res.body.data.missingItems[0].isVegetarianViolation).toBe(true);
  });
});
