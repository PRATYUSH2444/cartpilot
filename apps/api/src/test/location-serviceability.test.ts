import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { UserModel } from '../modules/users/user.model.js';
import { ServiceAreaModel, StoreModel, ServiceabilitySettingsModel, AreaWaitlistModel } from '../modules/location/models.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

describe('Live Geolocation, Dynamic Serviceability & Coming Soon Waitlist', () => {
  const app = createApp();
  let adminToken: string;

  beforeAll(async () => {
    await connectDatabase();

    // Create or find admin user
    const adminUser = await UserModel.findOneAndUpdate(
      { email: 'admin@cartpilot.com' },
      {
        name: 'System Administrator',
        email: 'admin@cartpilot.com',
        role: 'ADMIN',
        isActive: true,
        tokenVersion: 0,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      { upsert: true, new: true }
    );

    adminToken = jwt.sign(
      {
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: 'ADMIN',
        tokenVersion: 0,
        isMfaVerified: true,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // Initialize Global Settings: enforcement = 'on'
    await ServiceabilitySettingsModel.findOneAndUpdate(
      { key: 'GLOBAL' },
      {
        key: 'GLOBAL',
        enforcement: 'on',
        allowBrowseWhenUnserviceable: false,
        minDemandDisplayThreshold: 3,
        deliverySlots: [
          { id: 'morning', label: 'Morning Slot (6:00 AM – 10:00 AM)', cutoffTime: '00:00', startHour: 6, endHour: 10 },
          { id: 'evening', label: 'Evening Slot (5:00 PM – 9:00 PM)', cutoffTime: '15:00', startHour: 17, endHour: 21 },
        ],
      },
      { upsert: true }
    );

    // Seed Active Service Area: Greater Noida West (La Residencia PIN: 201308)
    await ServiceAreaModel.findOneAndUpdate(
      { pincode: '201308' },
      {
        pincode: '201308',
        city: 'Greater Noida',
        locality: 'La Residencia & Greater Noida West',
        state: 'Uttar Pradesh',
        status: 'active',
        type: 'pincode',
      },
      { upsert: true }
    );

    // Clean waitlist for fresh test run
    await AreaWaitlistModel.deleteMany({ pincode: '500001' });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('resolves serviceable location with clean locality label and no tower/flat numbers', async () => {
    const res = await request(app)
      .post('/api/v1/location/resolve')
      .send({
        lat: 28.5355,
        lng: 77.391,
        pincode: '201308',
        source: 'gps',
        accuracyM: 15,
        sessionId: 'test_session_1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { location, serviceability } = res.body.data;
    expect(location.pincode).toBe('201308');
    expect(location.label).toBeDefined();
    // Verify no unit/flat leak
    expect(location.label).not.toMatch(/tower|flat|unit|plot|#/i);
    expect(serviceability.status).toBe('serviceable');
    expect(serviceability.isServiceable).toBe(true);
    expect(serviceability.deliverySlots).toBeDefined();
    expect(serviceability.deliverySlots.length).toBeGreaterThan(0);
  });

  it('marks unserviceable PIN as not_serviceable when enforcement is on', async () => {
    const res = await request(app)
      .post('/api/v1/location/resolve')
      .send({
        pincode: '500001', // Hyderabad old city (not seeded)
        source: 'manual',
        sessionId: 'test_session_unserv',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { serviceability } = res.body.data;
    expect(serviceability.status).toBe('not_serviceable');
    expect(serviceability.isServiceable).toBe(false);
    expect(serviceability.enforcement).toBe('on');
    expect(serviceability.message).toContain('not in');
  });

  it('allows joining the waitlist for unserviceable locations with DPDP consent', async () => {
    const res = await request(app)
      .post('/api/v1/location/waitlist')
      .send({
        email: 'customer.waiting@example.com',
        phone: '+919876543210',
        pincode: '500001',
        locality: 'Abids',
        city: 'Hyderabad',
        state: 'Telangana',
        consentTextVersion: 'v1.0',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.waitlistCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.message).toContain("You're on the list");
  });

  it('allows Admin to view demand analytics, manage service areas, and notify waitlist', async () => {
    // 1. Get Demand Analytics
    const analyticsRes = await request(app)
      .get('/api/v1/location/admin/demand-analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.totalWaitlistSubscribers).toBeGreaterThanOrEqual(1);

    // 2. Admin adds 500001 to active service areas
    const createAreaRes = await request(app)
      .post('/api/v1/location/admin/areas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pincode: '500001',
        city: 'Hyderabad',
        locality: 'Abids Central Hub',
        state: 'Telangana',
        status: 'active',
        type: 'pincode',
      });

    expect(createAreaRes.status).toBe(201);
    const areaId = createAreaRes.body.data._id;

    // 3. Now 500001 resolves as serviceable!
    const recheckRes = await request(app)
      .post('/api/v1/location/resolve')
      .send({ pincode: '500001', source: 'manual' });

    expect(recheckRes.status).toBe(200);
    expect(recheckRes.body.data.serviceability.status).toBe('serviceable');
    expect(recheckRes.body.data.serviceability.isServiceable).toBe(true);

    // 4. Admin notifies waitlist subscribers
    const notifyRes = await request(app)
      .post('/api/v1/location/admin/areas/500001/notify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(notifyRes.status).toBe(200);
    expect(notifyRes.body.data.notifiedCount).toBeGreaterThanOrEqual(1);

    // Cleanup added area
    await request(app)
      .delete(`/api/v1/location/admin/areas/${areaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });
});
