import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
  errorCode?: string;
}

/**
 * Creates an in-memory sliding-window rate limiting middleware.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown-client',
    message = 'Too many requests. Please try again later.',
    errorCode = 'RATE_LIMIT_EXCEEDED',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing unless specifically testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      logger.warn({ key, count: record.count, max }, 'Rate limit exceeded');
      throw new AppError(errorCode, message, 429, {
        retryAfterSeconds,
      });
    }

    next();
  };
}

/**
 * Strict Rate Limiter for Authentication endpoints (/auth/login, /auth/register, /auth/forgot-password).
 * Max 5 attempts per IP/Email within a 1-minute window.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    return `auth:${ip}:${email}`;
  },
  message: 'Too many authentication attempts. Please try again after 1 minute.',
  errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
});

/**
 * Reset memory store (useful for clean unit and integration testing).
 */
export function resetRateLimits(): void {
  memoryStore.clear();
}
