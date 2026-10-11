import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { AuthService } from '../auth/auth.service.js';
import { ApprovalModel } from './approval.model.js';

describe('Phase 04 — Cryptographic Human Approval Protocol Integration Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;
  let basmatiProduct: any;
  let paneerProduct: any;

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

    basmatiProduct = await ProductModel.findOne({ slug: 'royal-aged-basmati-rice-1kg' });
    paneerProduct = await ProductModel.findOne({ slug: 'fresh-malai-paneer-200g' });
    expect(basmatiProduct).not.toBeNull();
    expect(paneerProduct).not.toBeNull();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should generate pending approval and block unapproved checkout when cart exceeds threshold', async () => {
    // 1. Add 5 basmati rice -> total > ₹600.00 threshold
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: basmatiProduct._id.toString(), quantity: 5 });

    // 2. Evaluate policy
    const policyRes = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(policyRes.body.data.outcome).toBe('NEEDS_HUMAN_APPROVAL');
    expect(policyRes.body.data.approvalId).toBeDefined();

    // 3. Attempting checkout without approval should fail with 400 APPROVAL_REQUIRED
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body.error?.code || checkoutRes.body.code).toBe('APPROVAL_REQUIRED');
  });

  it('GET /api/v1/approvals/pending — should retrieve the pending approval token with hash', async () => {
    const res = await request(app)
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.approvalHash).toBeDefined();
    expect(res.body.data.approvalHash).toHaveLength(64); // SHA-256
  });

  it('POST /api/v1/approvals/:id/approve — should grant cryptographic approval', async () => {
    const pendingRes = await request(app)
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${customerToken}`);

    const approvalId = pendingRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/approvals/${approvalId}/approve`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.decidedAt).toBeDefined();
  });

  it('Mutating cart items should instantly invalidate granted approval', async () => {
    // 1. Verify approval is currently APPROVED
    const beforeCheck = await ApprovalModel.findOne({ userId: customerId, status: 'APPROVED' });
    expect(beforeCheck).not.toBeNull();

    // 2. Customer adds another item to cart
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: paneerProduct._id.toString(), quantity: 1 });

    expect(addRes.status).toBe(200);

    // 3. The approval record must now be INVALIDATED
    const updatedApproval = await ApprovalModel.findById(beforeCheck!._id);
    expect(updatedApproval?.status).toBe('INVALIDATED');

    // 4. Checkout should once again be blocked
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body.error?.code || checkoutRes.body.code).toBe('APPROVAL_REQUIRED');
  });

  it('Approval and checkout should succeed when valid approval is re-granted', async () => {
    // 1. Re-evaluate policy to generate fresh approval
    const policyRes = await request(app)
      .get('/api/v1/policy/evaluate')
      .set('Authorization', `Bearer ${customerToken}`);

    const newApprovalId = policyRes.body.data.approvalId;
    expect(newApprovalId).toBeDefined();

    // 2. Approve new token
    const approveRes = await request(app)
      .post(`/api/v1/approvals/${newApprovalId}/approve`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');

    // 3. Checkout now succeeds!
    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    expect(checkoutRes.body.data.order.status).toBe('PENDING_PAYMENT');
    expect(checkoutRes.body.data.order.approvalSnapshot).toBeDefined();
    expect(checkoutRes.body.data.order.approvalSnapshot.approvalHash).toBeDefined();
  });
});
