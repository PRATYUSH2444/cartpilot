import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';

describe('Phase 03 — Cart & Pure Server Pricing Engine Integration Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;
  let paneerProduct: any;
  let basmatiProduct: any;

  beforeAll(async () => {
    await setupTestDatabase();

    // 1. Fetch customer
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

    // 2. Fetch seeded products
    paneerProduct = await ProductModel.findOne({ slug: 'fresh-malai-paneer-200g' });
    basmatiProduct = await ProductModel.findOne({ slug: 'royal-aged-basmati-rice-1kg' });

    expect(paneerProduct).not.toBeNull();
    expect(basmatiProduct).not.toBeNull();
  }, 60000);

  it('GET /api/v1/cart — should return or initialize an empty cart with version 1', async () => {
    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.pricing.subtotalPaise).toBe(0);
    expect(res.body.data.pricing.totalPaise).toBe(0);
  });

  it('POST /api/v1/cart/items — should add an item and calculate pure server-side pricing', async () => {
    // Paneer is ₹95.00 (9,500 paise). Adding 2 units = 19,000 paise subtotal.
    // Delivery fee = ₹40.00 (4,000 paise) because subtotal < ₹500 (50,000 paise).
    // Tax = 5% of 19,000 = 950 paise.
    // Total = 19,000 + 4,000 + 950 = 23,950 paise (₹239.50).

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: paneerProduct._id.toString(),
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe(2); // Incremented
    expect(res.body.data.items.length).toBe(1);

    const item = res.body.data.items[0];
    expect(item.productId).toBe(paneerProduct._id.toString());
    expect(item.quantity).toBe(2);
    expect(item.itemTotalPaise).toBe(19000);

    const pricing = res.body.data.pricing;
    expect(pricing.subtotalPaise).toBe(19000);
    expect(pricing.deliveryFeePaise).toBe(4000);
    expect(pricing.taxPaise).toBe(950);
    expect(pricing.totalPaise).toBe(23950);
    expect(pricing.formatted.total).toBe('₹239.50');
  });

  it('POST /api/v1/cart/items — should reach free delivery threshold when subtotal >= ₹500', async () => {
    // Basmati Rice is ₹140.00 (14,000 paise). Adding 3 units = 42,000 paise.
    // Subtotal will be 19,000 + 42,000 = 61,000 paise (₹610.00 >= ₹500).
    // Delivery fee becomes ₹0.
    // Tax = 5% of 61,000 = 3,050 paise.
    // Total = 61,000 + 0 + 3,050 = 64,050 paise (₹640.50).

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: basmatiProduct._id.toString(),
        quantity: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(3);
    expect(res.body.data.items.length).toBe(2);

    const pricing = res.body.data.pricing;
    expect(pricing.subtotalPaise).toBe(61000);
    expect(pricing.deliveryFeePaise).toBe(0); // FREE DELIVERY!
    expect(pricing.taxPaise).toBe(3050);
    expect(pricing.totalPaise).toBe(64050);
    expect(pricing.formatted.deliveryFee).toBe('₹0.00');
  });

  it('POST /api/v1/cart/items — should reject addition exceeding available inventory with 409', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: paneerProduct._id.toString(),
        quantity: 60, // Exceeds available stock of 50
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('PATCH /api/v1/cart/items/:productId — should update item quantity and recalculate pricing', async () => {
    // Update Basmati Rice from 3 to 1 unit.
    const res = await request(app)
      .patch(`/api/v1/cart/items/${basmatiProduct._id.toString()}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe(4);

    const basmatiItem = res.body.data.items.find(
      (i: any) => i.productId === basmatiProduct._id.toString()
    );
    expect(basmatiItem.quantity).toBe(1);

    // Subtotal: Paneer 2 (19,000) + Basmati 1 (14,000) = 33,000 paise (< 50,000 -> delivery fee 4000)
    expect(res.body.data.pricing.subtotalPaise).toBe(33000);
    expect(res.body.data.pricing.deliveryFeePaise).toBe(4000);
  });

  it('DELETE /api/v1/cart/items/:productId — should remove single item from cart', async () => {
    const res = await request(app)
      .delete(`/api/v1/cart/items/${paneerProduct._id.toString()}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].productId).toBe(basmatiProduct._id.toString());
  });

  it('DELETE /api/v1/cart — should clear all items in the cart', async () => {
    const res = await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.pricing.totalPaise).toBe(0);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });
});
