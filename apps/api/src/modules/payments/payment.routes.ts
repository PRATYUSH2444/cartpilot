import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { PaymentController } from './payment.controller.js';
import { VerifyPaymentSchema } from './payment.schema.js';
import { clerkWebhook, clerkSmsWebhook } from '../auth/auth.controller.js';

export const paymentRouter = Router();

// POST /api/v1/payments/verify
paymentRouter.post(
  '/verify',
  requireAuth,
  validateBody(VerifyPaymentSchema),
  PaymentController.verifyPayment
);

export const webhookRouter = Router();

// POST /api/v1/webhooks/razorpay (public endpoint for gateway)
webhookRouter.post('/razorpay', PaymentController.handleWebhook);

// POST /api/v1/webhooks/clerk (User & Session synchronization)
webhookRouter.post('/clerk', clerkWebhook);

// POST /api/v1/webhooks/clerk-sms (Twilio Programmable SMS delivery for Clerk)
webhookRouter.post('/clerk-sms', clerkSmsWebhook);
