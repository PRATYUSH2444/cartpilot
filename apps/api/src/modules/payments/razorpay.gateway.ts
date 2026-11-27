import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';
import { GatewayOrder, GatewayRefund, IPaymentGateway } from './payment-gateway.interface.js';

export class RazorpayGateway implements IPaymentGateway {
  private client: Razorpay | null = null;
  private isLiveConfigured: boolean = false;

  constructor() {
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (
      keyId &&
      keySecret &&
      !keyId.includes('placeholder') &&
      !keySecret.includes('placeholder')
    ) {
      this.client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      this.isLiveConfigured = true;
      logger.info('💳 Razorpay Gateway initialized in LIVE mode');
    } else {
      logger.warn(
        '💳 Razorpay Gateway running in Sandbox/Simulation mode (no live keys configured)'
      );
    }
  }

  public isConfigured(): boolean {
    return this.isLiveConfigured;
  }

  public async createOrder(
    amountPaise: number,
    receipt: string,
    notes?: Record<string, string>
  ): Promise<GatewayOrder> {
    if (this.isLiveConfigured && this.client) {
      try {
        const order = await this.client.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: notes || {},
        });
        return {
          id: order.id,
          amountPaise: Number(order.amount),
          currency: order.currency,
          receipt: order.receipt || receipt,
          status: order.status,
        };
      } catch (err: any) {
        logger.error({ err }, 'Razorpay createOrder failed');
        throw new Error(err?.error?.description || 'Failed to create payment gateway order');
      }
    }

    // Sandbox / Simulation order generation (valid when user has not yet plugged live keys)
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    logger.info({ mockOrderId, amountPaise }, 'Simulated gateway order created');
    return {
      id: mockOrderId,
      amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
    };
  }

  public verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!orderId || !paymentId || !signature) return false;

    // In simulation mode, accept signature starting with sim_ or matching sha256
    if (!this.isLiveConfigured) {
      if (orderId.startsWith('order_sim_') || signature.startsWith('sig_sim_')) {
        return true;
      }
    }

    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret || secret.includes('placeholder')) {
      return true;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch (err) {
      logger.error({ err }, 'Razorpay signature verification error');
      return false;
    }
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.includes('placeholder')) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch (err) {
      logger.error({ err }, 'Razorpay webhook signature verification error');
      return false;
    }
  }

  public async initiateRefund(
    paymentId: string,
    amountPaise: number,
    notes?: Record<string, string>
  ): Promise<GatewayRefund> {
    if (this.isLiveConfigured && this.client) {
      try {
        const refund = await (this.client.payments as any).refund(paymentId, {
          amount: amountPaise,
          notes: notes || {},
        });
        return {
          id: refund.id,
          paymentId: refund.payment_id,
          amountPaise: Number(refund.amount),
          status: refund.status,
        };
      } catch (err: any) {
        logger.error({ err }, 'Razorpay initiateRefund failed');
        throw new Error(err?.error?.description || 'Failed to process gateway refund');
      }
    }

    // Simulation refund
    const mockRefundId = `rfnd_sim_${Date.now()}`;
    return {
      id: mockRefundId,
      paymentId,
      amountPaise,
      status: 'processed',
    };
  }
}

export const paymentGateway = new RazorpayGateway();
