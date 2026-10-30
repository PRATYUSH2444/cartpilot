import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.config.js';
import { ForbiddenError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Strict CSRF Defense Middleware
 * Protects state-changing endpoints (POST, PUT, PATCH, DELETE) against Cross-Site Request Forgery
 * by validating Origin and Referer headers against trusted origins.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  // Safe read-only HTTP methods are exempt
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Webhooks are verified via HMAC-SHA256 signature payloads and do not carry browser origin headers
  if (req.path.startsWith('/api/v1/webhooks')) {
    return next();
  }

  const originHeader = req.headers['origin'];
  const refererHeader = req.headers['referer'];

  // Allowed origins
  const allowedOrigins = new Set<string>([
    env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ]);

  // 1. Origin Header Validation
  if (originHeader) {
    const originString = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    if (!allowedOrigins.has(originString)) {
      logger.warn(
        { origin: originString, path: req.path, method: req.method },
        '🚨 CSRF BLOCKED: Disallowed Origin'
      );
      return next(
        new ForbiddenError(
          `CSRF Defense: Cross-origin ${req.method} request blocked from origin ${originString}`
        )
      );
    }
    return next();
  }

  // 2. Referer Header Validation
  if (refererHeader) {
    try {
      const refererUrl = new URL(Array.isArray(refererHeader) ? refererHeader[0] : refererHeader);
      const refererOrigin = refererUrl.origin;
      if (!allowedOrigins.has(refererOrigin)) {
        logger.warn(
          { referer: refererOrigin, path: req.path, method: req.method },
          '🚨 CSRF BLOCKED: Disallowed Referer'
        );
        return next(
          new ForbiddenError(
            `CSRF Defense: Cross-origin ${req.method} request blocked from referer ${refererOrigin}`
          )
        );
      }
      return next();
    } catch {
      return next(new ForbiddenError('CSRF Defense: Invalid Referer header on state-changing request'));
    }
  }

  // 3. Neither Origin nor Referer provided
  // In production, browser requests must include origin verification
  if (env.NODE_ENV === 'production') {
    return next(
      new ForbiddenError('CSRF Defense: State-changing requests must include a valid Origin or Referer header')
    );
  }

  // In development/test, allow non-browser test runners (supertest / curl) that omit origin headers
  next();
}
