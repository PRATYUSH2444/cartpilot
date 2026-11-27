import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { validateBody } from '../../common/middleware/validate.js';
import { CheckoutController } from './checkout.controller.js';
import { InitiateCheckoutSchema } from './checkout.schema.js';

export const checkoutRouter = Router();

// POST /api/v1/checkout/initiate (Customer only)
// GET /api/v1/checkout/quote
checkoutRouter.get('/quote', requireAuth, CheckoutController.quote);
checkoutRouter.post('/quote', requireAuth, CheckoutController.quote);

// POST /api/v1/checkout/initiate (Customer only)
checkoutRouter.post(
  '/initiate',
  requireAuth,
  validateBody(InitiateCheckoutSchema),
  CheckoutController.initiate
);
