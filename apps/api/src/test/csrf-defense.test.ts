import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';

describe('Preflight (d): CSRF Defense & Cross-Origin Rejection Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('rejects state-changing POST request with malicious cross-origin Origin header', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Origin', 'http://evil-attacker.com')
      .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('CSRF Defense');
  });

  it('rejects state-changing PUT request with malicious cross-origin Referer header', async () => {
    const res = await request(app)
      .put('/api/v1/mandate')
      .set('Referer', 'http://malicious-phishing-site.xyz/attack')
      .send({ maxOrderAmountPaise: 10000 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('CSRF Defense');
  });

  it('allows state-changing POST request with legitimate Origin (http://localhost:5173)', async () => {
    // This will pass CSRF check and proceed to auth check (returning 401 Unauthorized, not 403 Forbidden)
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Origin', 'http://localhost:5173')
      .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

    expect(res.status).not.toBe(403);
  });

  it('allows state-changing POST request from private network LAN mobile origins (e.g. 192.168.x.x)', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Origin', 'http://192.168.1.43:5173')
      .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

    expect(res.status).not.toBe(403);
  });

  it('rejects state-changing POST request from public unapproved external IP', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Origin', 'http://198.51.100.25:5173')
      .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows safe read-only GET requests from any origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://evil-attacker.com');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
