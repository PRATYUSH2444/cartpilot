import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './common/middleware/request-id.js';
import { csrfGuard, isAllowedOrigin } from './common/middleware/csrf-guard.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { NotFoundError } from './common/errors/app-error.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { merchantRouter } from './modules/merchants/merchant.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { checkoutRouter } from './modules/checkout/checkout.routes.js';
import { paymentRouter, webhookRouter } from './modules/payments/payment.routes.js';
import { orderRouter } from './modules/orders/order.routes.js';
import { mandateRouter } from './modules/mandates/mandate.routes.js';
import { policyRouter } from './modules/policy/policy.routes.js';
import { approvalRouter } from './modules/approvals/approval.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { recipeRouter } from './modules/recipe/recipe.routes.js';
import { chatRouter } from './modules/chat/chat.routes.js';
import { addressRouter } from './modules/users/address.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { locationRouter } from './modules/location/location.routes.js';
import { systemRouter } from './modules/system/system.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Permit requests with no origin (e.g. mobile apps, curl, server-to-server) or verified origins
        if (!requestOrigin || isAllowedOrigin(requestOrigin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'idempotency-key'],
    })
  );

  // Request ID Tracking
  app.use(requestIdMiddleware);

  // Cookie Parser for HttpOnly Refresh Tokens
  app.use(cookieParser());

  // CSRF Protection Middleware (Validates Origin/Referer for state-changing requests)
  app.use(csrfGuard);

  // Webhook raw-body handler (preserves unaltered buffer for HMAC verification)
  app.use(
    '/api/v1/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    (req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction) => {
      req.rawBody = req.body as Buffer;
      next();
    }
  );

  // Standard JSON Body Parser for all other endpoints
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Root Diagnostic Aliases
  app.use(healthRouter);

  // API v1 Namespace Routing
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/merchants', merchantRouter);
  app.use('/api/v1/catalog', catalogRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/checkout', checkoutRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/mandate', mandateRouter);
  app.use('/api/v1/mandates', mandateRouter);
  app.use('/api/v1/policy', policyRouter);
  app.use('/api/v1/approvals', approvalRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use('/api/v1/recipe', recipeRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/addresses', addressRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/location', locationRouter);
  app.use('/api/v1/system', systemRouter);

  // 404 Catch-All Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
