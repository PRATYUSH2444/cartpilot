import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../test/setup.js';
import { ProductModel } from '../catalog/product.model.js';
import { UserModel } from '../users/user.model.js';
import { CartModel } from '../cart/cart.model.js';
import { OrderModel } from '../orders/order.model.js';
import { StockReservationModel } from '../inventory/stock-reservation.model.js';
import { PaymentModel } from './payment.model.js';
import { AuthService } from '../auth/auth.service.js';
import { env } from '../../config/env.config.js';

describe('Phase 03 — Payments & Webhook Cryptographic Verification Tests', () => {
  const app = createApp();
  let customerToken: string;
  let customerId: string;
  let potatoProduct: any;

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

    potatoProduct = await ProductModel.findOne({ slug: 'fresh-potatoes-1kg' });
    expect(potatoProduct).not.toBeNull();
  }, 60000);

  it('POST /api/v1/payments/verify — should reject invalid / tampered payment signature with 400', async () => {
    // 1. Add item & initiate checkout
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: potatoProduct._id.toString(),
        quantity: 2,
      });

    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(checkoutRes.status).toBe(201);
    const { order, razorpay } = checkoutRes.body.data;

    // 2. Submit tampered signature
    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id,
        razorpayOrderId: razorpay.orderId,
        razorpayPaymentId: 'pay_tampered_123',
        razorpaySignature: 'invalid_forged_signature_hex_digest',
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
    expect(verifyRes.body.error.code).toBe('PAYMENT_VERIFICATION_FAILED');

    // 3. Verify Order became FAILED and reservation was released
    const failedOrder = await OrderModel.findById(order._id);
    expect(failedOrder!.status).toBe('FAILED');

    const reservation = await StockReservationModel.findById(order.reservationId);
    expect(reservation!.status).toBe('RELEASED');
  });

  it('POST /api/v1/payments/verify — should accept valid HMAC-SHA256 signature, confirm order, and consume stock', async () => {
    // 1. Add item & initiate checkout
    await request(app).delete('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`);
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: potatoProduct._id.toString(),
        quantity: 2,
      });

    const checkoutRes = await request(app)
      .post('/api/v1/checkout/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    expect(checkoutRes.status).toBe(201);
    const { order, razorpay } = checkoutRes.body.data;

    // 2. Compute authentic HMAC-SHA256 signature
    const razorpayPaymentId = `pay_legit_${crypto.randomBytes(4).toString('hex')}`;
    const validSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay.orderId}|${razorpayPaymentId}`)
      .digest('hex');

    // 3. Verify payment
    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id,
        razorpayOrderId: razorpay.orderId,
        razorpayPaymentId,
        razorpaySignature: validSignature,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.order.status).toBe('CONFIRMED');

    // 4. Verify Payment record updated to PAID
    const payment = await PaymentModel.findOne({ orderId: order._id });
    expect(payment!.status).toBe('PAID');
    expect(payment!.gatewayPaymentId).toBe(razorpayPaymentId);

    // 5. Verify StockReservation is CONSUMED
    const reservation = await StockReservationModel.findById(order.reservationId);
    expect(reservation!.status).toBe('CONSUMED');

    // 6. Verify User's cart is empty
    const cart = await CartModel.findOne({ userId: customerId, status: 'ACTIVE' });
    expect(cart!.items.length).toBe(0);
  });

  it('POST /api/v1/webhooks/razorpay — should verify raw body HMAC signature and process idempotently', async () => {
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_event_999',
            order_id: 'order_webhook_mock_999',
            amount: 50000,
            status: 'captured',
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(Buffer.from(rawPayload))
      .digest('hex');

    // 1. Initial Webhook delivery
    const res1 = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validWebhookSig)
      .send(rawPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.data.status).toBe('PROCESSED');

    // 2. Duplicate replay delivery (testing idempotency guard)
    const res2 = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validWebhookSig)
      .send(rawPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBe('DUPLICATE_IGNORED');

    // 3. Tampered payload delivery
    const tamperedPayload = JSON.stringify({ event: 'hacked' });
    const res3 = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validWebhookSig)
      .send(tamperedPayload);

    expect(res3.status).toBe(400);
    expect(res3.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });
});
