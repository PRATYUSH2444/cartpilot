import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.config.js';
import { ForbiddenError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Checks if a given origin (protocol + host + optional port) is permitted.
 * - Always permits configured CORS_ORIGIN and loopback addresses (localhost, 127.0.0.1).
 * - In non-production environments (development / test), permits private RFC 1918 LAN IPs
 *   (192.168.x.x, 10.x.x.x, 172.16-31.x.x) so mobile devices and LAN clients on Wi-Fi
 *   can connect and test smoothly without triggering CSRF or CORS rejections.
 * - In production environments, strictly adheres to configured production origins.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;

  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // 1. Check configured CORS_ORIGIN (supports comma-separated list)
  const configuredOrigins = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (configuredOrigins.includes(cleanOrigin)) {
    return true;
  }

  // 2. Standard loopback origins
  const standardLocalOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ];
  if (standardLocalOrigins.includes(cleanOrigin)) {
    return true;
  }

  // 3. In non-production environments, allow private network / LAN origins & localhost on any port
  if (env.NODE_ENV !== 'production') {
    try {
      const url = new URL(cleanOrigin);
      const hostname = url.hostname;

      // Allow localhost or loopback on any port
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }

      // Check RFC 1918 private IPv4 ranges:
      // 10.0.0.0 - 10.255.255.255
      // 172.16.0.0 - 172.31.255.255
      // 192.168.0.0 - 192.168.255.255
      const parts = hostname.split('.');
      if (parts.length === 4) {
        const p0 = Number(parts[0]);
        const p1 = Number(parts[1]);
        const p2 = Number(parts[2]);
        const p3 = Number(parts[3]);
        if (
          Number.isInteger(p0) && p0 >= 0 && p0 <= 255 &&
          Number.isInteger(p1) && p1 >= 0 && p1 <= 255 &&
          Number.isInteger(p2) && p2 >= 0 && p2 <= 255 &&
          Number.isInteger(p3) && p3 >= 0 && p3 <= 255
        ) {
          if (p0 === 10) return true;
          if (p0 === 192 && p1 === 168) return true;
          if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
        }
      }
    } catch {
      return false;
    }
  }

  return false;
}

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

  // 1. Origin Header Validation
  if (originHeader) {
    const originString = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    if (!isAllowedOrigin(originString)) {
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
      if (!isAllowedOrigin(refererOrigin)) {
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
