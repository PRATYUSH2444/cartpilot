import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config.js';
import { requestIdMiddleware } from './common/middleware/request-id.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { NotFoundError } from './common/errors/app-error.js';
import { healthRouter } from './modules/health/health.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'idempotency-key'],
    })
  );

  // Request ID Tracking
  app.use(requestIdMiddleware);

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

  // Root & Versioned Diagnostic Routes
  app.use('/api/v1', healthRouter);
  app.use(healthRouter); // Also expose at /health and /ready directly

  // 404 Catch-All Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
