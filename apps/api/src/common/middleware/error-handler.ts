import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';
import { env } from '../../config/env.config.js';
import { emailAdapter } from '../../integrations/email/email-adapter.js';

let lastAlertTimestamp = 0;
const ALERT_THROTTLE_MS = 60 * 1000; // Throttle: At most 1 critical email alert every 60 seconds

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred';
  const details = isAppError ? err.details : undefined;

  // Log error with context
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        requestId: (req as Request & { id?: string }).id,
      },
      'Server-side processing error'
    );

    // Asynchronously dispatch system incident alert to the configured backend admin email (praka.extra28@gmail.com)
    const now = Date.now();
    if (now - lastAlertTimestamp > ALERT_THROTTLE_MS) {
      lastAlertTimestamp = now;
      emailAdapter
        .sendSystemAlertEmail({
          title: `HTTP 500: ${req.method} ${req.originalUrl}`,
          message: err.message || 'An unexpected server exception was caught by errorHandler.',
          level: 'ERROR',
          stack: err.stack,
          context: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            requestId: (req as Request & { id?: string }).id,
          },
        })
        .catch((alertErr) => {
          logger.warn({ alertErr }, 'Failed to dispatch system incident alert email');
        });
    }
  } else {
    logger.warn(
      {
        code: errorCode,
        url: req.originalUrl,
        method: req.method,
        message,
      },
      'Client request error'
    );
  }

  const requestId = (req as Request & { id?: string }).id;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}
