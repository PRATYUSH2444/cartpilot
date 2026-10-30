import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';
import { UserModel } from '../modules/users/user.model.js';
import { AddressModel } from '../modules/users/address.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { ChatMessageModel } from '../modules/chat/chat-message.model.js';
import { ProductModel } from '../modules/catalog/product.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Phase 1 — Persistence Architecture, Entity Separation, and Session/Address Lifecycle', () => {
  const app = createApp();

  let customerUser: any;
  let customerToken: string;
  let customerId: string;

  let attackerUser: any;
  let attackerToken: string;

  let testProduct: any;

  beforeAll(async () => {
    await setupTestDatabase();

    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    // 1. Create Customer
    customerUser = await UserModel.create({
      name: 'Priya Sharma',
      email: 'priya@cartpilot.test',
      passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
      dietaryPreferences: ['VEGETARIAN'],
    });
    customerId = customerUser._id.toString();
    customerToken = AuthService.generateTokens(customerUser).accessToken;

    // 2. Create Attacker
    attackerUser = await UserModel.create({
      name: 'Malicious Actor',
      email: 'attacker@cartpilot.test',
      passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      tokenVersion: 0,
    });
    attackerToken = AuthService.generateTokens(attackerUser).accessToken;

    // 3. Find a seeded product
    testProduct = await ProductModel.findOne({ isActive: true, isVegetarian: true });
    expect(testProduct).toBeDefined();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('1. Chat Session Isolation & Lifecycle Management', () => {
    let session1Id: string;
    let session2Id: string;

    it('creates multiple independent chat sessions with welcome cards', async () => {
      const res1 = await request(app)
        .post('/api/v1/chat/sessions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ initialMessage: 'Order tomatoes and spinach' })
        .expect(201);

      session1Id = res1.body.data._id;
      expect(session1Id).toBeDefined();

      const res2 = await request(app)
        .post('/api/v1/chat/sessions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ initialMessage: 'Need snacks for party' })
        .expect(201);

      session2Id = res2.body.data._id;
      expect(session2Id).toBeDefined();
      expect(session1Id).not.toBe(session2Id);
    });

    it('isolates messages strictly by session ID without message bleed', async () => {
      // Add a message to session 1
      await request(app)
        .post(`/api/v1/chat/sessions/${session1Id}/messages`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Specific to Session 1 only' })
        .expect(200);

      // Add a message to session 2
      await request(app)
        .post(`/api/v1/chat/sessions/${session2Id}/messages`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Specific to Session 2 only' })
        .expect(200);

      // Verify Session 1
      const get1 = await request(app)
        .get(`/api/v1/chat/sessions/${session1Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const s1Contents = get1.body.data.messages.map((m: any) => m.content);
      expect(s1Contents).toContain('Specific to Session 1 only');
      expect(s1Contents).not.toContain('Specific to Session 2 only');

      // Verify Session 2
      const get2 = await request(app)
        .get(`/api/v1/chat/sessions/${session2Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const s2Contents = get2.body.data.messages.map((m: any) => m.content);
      expect(s2Contents).toContain('Specific to Session 2 only');
      expect(s2Contents).not.toContain('Specific to Session 1 only');
    });

    it('updates session title and archive status (PATCH /sessions/:id)', async () => {
      const renameRes = await request(app)
        .patch(`/api/v1/chat/sessions/${session1Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ title: 'Weekly Groceries' })
        .expect(200);

      expect(renameRes.body.data.title).toBe('Weekly Groceries');

      // Archive session 1
      const archiveRes = await request(app)
        .patch(`/api/v1/chat/sessions/${session1Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isArchived: true })
        .expect(200);

      expect(archiveRes.body.data.isArchived).toBe(true);

      // Listing active sessions should not include archived session 1
      const listActive = await request(app)
        .get('/api/v1/chat/sessions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const activeIds = listActive.body.data.map((s: any) => s._id);
      expect(activeIds).not.toContain(session1Id);
      expect(activeIds).toContain(session2Id);

      // Listing all sessions with includeArchived=true should include session 1
      const listAll = await request(app)
        .get('/api/v1/chat/sessions?includeArchived=true')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const allIds = listAll.body.data.map((s: any) => s._id);
      expect(allIds).toContain(session1Id);

      // Unarchive session 1 for subsequent tests
      await request(app)
        .patch(`/api/v1/chat/sessions/${session1Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isArchived: false })
        .expect(200);
    });

    it('cascades message deletion on DELETE /sessions/:id and defends against IDOR', async () => {
      // Attacker cannot delete customer's session (guarded with 403 Forbidden)
      await request(app)
        .delete(`/api/v1/chat/sessions/${session2Id}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .expect(403);

      // Customer deletes session 2
      await request(app)
        .delete(`/api/v1/chat/sessions/${session2Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      // Session 2 should not exist in DB
      const sessionInDb = await ChatSessionModel.findById(session2Id);
      expect(sessionInDb).toBeNull();

      // All messages for session 2 must be purged
      const s2Messages = await ChatMessageModel.find({ sessionId: session2Id });
      expect(s2Messages.length).toBe(0);

      // Session 1 messages remain untouched
      const s1Messages = await ChatMessageModel.find({ sessionId: session1Id });
      expect(s1Messages.length).toBeGreaterThan(0);
    });
  });

  describe('2. Order History Persistence & Session Independence', () => {
    let order1Id: string;
    let order2Id: string;

    it('persists multiple orders with integer paise arithmetic regardless of session state', async () => {
      const order1 = await OrderModel.create({
        orderNumber: 'ORD-TEST-001',
        userId: customerUser._id,
        merchantId: testProduct.merchantId,
        items: [
          {
            productId: testProduct._id,
            name: testProduct.name,
            category: testProduct.category,
            quantity: 2,
            unitPricePaise: testProduct.pricePaise,
            subtotalPaise: testProduct.pricePaise * 2,
            packageSize: testProduct.packageSize,
            packageUnit: testProduct.packageUnit,
          },
        ],
        pricingSnapshot: {
          subtotalPaise: testProduct.pricePaise * 2,
          deliveryFeePaise: 4000,
          platformFeePaise: 0,
          taxPaise: 400,
          discountPaise: 0,
          totalPaise: testProduct.pricePaise * 2 + 4400,
        },
        status: 'CONFIRMED',
        shippingAddressSnapshot: {
          street: '123 Market Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
        },
        placedAt: new Date(),
      });
      order1Id = order1._id.toString();

      const order2 = await OrderModel.create({
        orderNumber: 'ORD-TEST-002',
        userId: customerUser._id,
        merchantId: testProduct.merchantId,
        items: [
          {
            productId: testProduct._id,
            name: testProduct.name,
            category: testProduct.category,
            quantity: 1,
            unitPricePaise: testProduct.pricePaise,
            subtotalPaise: testProduct.pricePaise,
            packageSize: testProduct.packageSize,
            packageUnit: testProduct.packageUnit,
          },
        ],
        pricingSnapshot: {
          subtotalPaise: testProduct.pricePaise,
          deliveryFeePaise: 4000,
          platformFeePaise: 0,
          taxPaise: 200,
          discountPaise: 0,
          totalPaise: testProduct.pricePaise + 4200,
        },
        status: 'DELIVERED',
        shippingAddressSnapshot: {
          street: '456 Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
        },
        placedAt: new Date(Date.now() + 1000),
      });
      order2Id = order2._id.toString();

      // Retrieve customer's order history
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const orders = res.body.data;
      expect(orders.length).toBe(2);
      expect(orders[0].orderNumber).toBe('ORD-TEST-002'); // Descending order
      expect(orders[1].orderNumber).toBe('ORD-TEST-001');

      // IDOR protection: Attacker cannot retrieve customer's order by ID
      await request(app)
        .get(`/api/v1/orders/${order1Id}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .expect(403);
    });
  });

  describe('3. Customer Address Management & PIN Serviceability', () => {
    let homeAddressId: string;
    let workAddressId: string;

    it('creates home address and automatically designates it as default', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Priya Sharma',
          phone: '+919876543210',
          houseFlat: 'Flat 402, Lotus Orchid',
          apartmentStreet: 'Green Glen Layout, Bellandur',
          areaLocality: 'Outer Ring Road',
          landmark: 'Opposite Central Mall',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          addressType: 'HOME',
          deliveryInstructions: 'Leave with security if not available',
          isDefault: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isDefault).toBe(true);
      expect(res.body.data.isServiceable).toBe(true);
      homeAddressId = res.body.data._id;
    });

    it('creates work address and promotes it to default, demoting home address', async () => {
      const res = await request(app)
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Priya Sharma',
          phone: '+919876543210',
          houseFlat: 'Tower 3, 5th Floor',
          apartmentStreet: 'Prestige Tech Park',
          areaLocality: 'Marathahalli-Sarjapur ORR',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          addressType: 'WORK',
          isDefault: true,
        })
        .expect(201);

      workAddressId = res.body.data._id;
      expect(res.body.data.isDefault).toBe(true);

      // Verify home address was demoted
      const homeInDb = await AddressModel.findById(homeAddressId);
      expect(homeInDb?.isDefault).toBe(false);
    });

    it('sets home address back to default via /api/v1/addresses/:id/default', async () => {
      const res = await request(app)
        .post(`/api/v1/addresses/${homeAddressId}/default`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.data._id).toBe(homeAddressId);
      expect(res.body.data.isDefault).toBe(true);

      const workInDb = await AddressModel.findById(workAddressId);
      expect(workInDb?.isDefault).toBe(false);
    });

    it('lists all addresses for the authenticated user and guards against IDOR', async () => {
      const res = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);

      // Attacker should see empty address list
      const attackerRes = await request(app)
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${attackerToken}`)
        .expect(200);

      expect(attackerRes.body.data.length).toBe(0);

      // Attacker cannot fetch customer address by ID
      await request(app)
        .get(`/api/v1/addresses/${homeAddressId}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .expect(403);
    });

    it('validates 6-digit PIN serviceability and estimates delivery fee and time', async () => {
      // Valid serviceable PIN
      const res1 = await request(app)
        .get('/api/v1/addresses/serviceability?pincode=560103')
        .expect(200);

      expect(res1.body.data.isServiceable).toBe(true);
      expect(res1.body.data.estimatedMinutes).toBe(20);
      expect(res1.body.data.deliveryFeePaise).toBe(4000);
      expect(res1.body.data.freeDeliveryThresholdPaise).toBe(50000);

      // Invalid format PIN
      const res2 = await request(app)
        .get('/api/v1/addresses/serviceability?pincode=123')
        .expect(400);

      expect(res2.body.error.message).toContain('PIN code must be a valid 6-digit');
    });

    it('deletes work address safely', async () => {
      await request(app)
        .delete(`/api/v1/addresses/${workAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const deleted = await AddressModel.findById(workAddressId);
      expect(deleted).toBeNull();
    });
  });

  describe('4. Customer Profile & Security Session Invalidation', () => {
    it('retrieves user profile populated with default address', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.data.email).toBe('priya@cartpilot.test');
      expect(res.body.data.defaultAddress).toBeDefined();
      expect(res.body.data.defaultAddress.pincode).toBe('560103');
    });

    it('updates user profile fields cleanly (PUT /api/v1/users/profile)', async () => {
      const updateData = {
        name: 'Priya R. Sharma',
        phone: '+919876543210',
        gender: 'FEMALE',
        dietaryPreferences: ['VEGETARIAN', 'JAIN'],
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      };

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data.name).toBe('Priya R. Sharma');
      expect(res.body.data.gender).toBe('FEMALE');
      expect(res.body.data.dietaryPreferences).toEqual(['VEGETARIAN', 'JAIN']);
      expect(res.body.data.notificationPreferences.sms).toBe(false);
    });

    it('changes password and invalidates tokens via tokenVersion bump', async () => {
      // Change password
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'SecurePassword123!',
          newPassword: 'BrandNewSecurePassword456!',
        })
        .expect(200);

      // Verify that the user in DB has increased tokenVersion
      const userInDb = await UserModel.findById(customerUser._id);
      expect(userInDb?.tokenVersion).toBe(1);

      // Login with old password fails
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'priya@cartpilot.test',
          password: 'SecurePassword123!',
        })
        .expect(401);

      // Login with new password succeeds
      const newLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'priya@cartpilot.test',
          password: 'BrandNewSecurePassword456!',
        })
        .expect(200);

      expect(newLoginRes.body.data.accessToken).toBeDefined();
    });
  });
});
