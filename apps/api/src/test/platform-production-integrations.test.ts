import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';
import { UserModel } from '../modules/users/user.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { OtpVerificationModel } from '../modules/auth/otp.model.js';

describe('Production Integrations, System Status, OTP, and Location Services', () => {
  const app = createApp();

  let user: any;
  let userToken: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);
    user = await UserModel.create({
      name: 'Rohan Mehra',
      email: 'rohan.mehra@cartpilot.test',
      phone: '9876543210',
      passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    userToken = AuthService.generateTokens(user).accessToken;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('1. System Integrations Diagnostics', () => {
    it('should return live integration status for all 6 core services', async () => {
      const res = await request(app).get('/api/v1/system/integrations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.integrations)).toBe(true);

      const services = res.body.data.integrations.map((i: any) => i.category);
      expect(services).toContain('DATABASE');
      expect(services).toContain('AI');
      expect(services).toContain('PAYMENTS');
      expect(services).toContain('EMAIL');
      expect(services).toContain('SMS');
      expect(services).toContain('MAPS');
    });

    it('should allow setting runtime LLM key dynamically', async () => {
      const res = await request(app)
        .post('/api/v1/system/integrations/config')
        .send({
          provider: 'gemini',
          apiKey: 'AIzaSyFakeDynamicRuntimeKeyForTestingOnly_123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('gemini');
    });

    it('should reject invalid provider in runtime key config', async () => {
      const res = await request(app)
        .post('/api/v1/system/integrations/config')
        .send({
          provider: 'anthropic_unsupported',
          apiKey: 'test_key',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Phone OTP Verification System', () => {
    it('should send OTP and return masked phone and cooldown info', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+919876543210',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+919876543210');
      expect(res.body.data.expiresInSeconds).toBe(300);

      // Verify OTP document was stored in database
      const otpDoc = await OtpVerificationModel.findOne({
        phone: '+919876543210',
        purpose: 'PHONE_VERIFY',
      });
      expect(otpDoc).toBeDefined();
      expect(otpDoc?.otpHash).toBeDefined();
    });

    it('should enforce cooldown if OTP is requested too quickly', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+919876543210',
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Please wait');
    });

    it('should reject invalid OTP code during verification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+919876543210',
          code: '000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Real Location and Geocoding Services', () => {
    it('should geocode Bangalore landmarks to real coordinates', async () => {
      const res = await request(app)
        .get('/api/v1/location/geocode')
        .query({ q: 'Indiranagar Bangalore' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.lat).toBe('number');
      expect(typeof res.body.data.lng).toBe('number');
      // Latitude for Bangalore is ~12.9
      expect(res.body.data.lat).toBeGreaterThan(12.0);
      expect(res.body.data.lat).toBeLessThan(13.5);
    });

    it('should reverse geocode coordinates to a formatted address', async () => {
      const res = await request(app)
        .get('/api/v1/location/reverse-geocode')
        .query({ lat: 12.9716, lng: 77.5946 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.formattedAddress).toBeDefined();
      expect(res.body.data.city).toBeDefined();
    });
  });
});
