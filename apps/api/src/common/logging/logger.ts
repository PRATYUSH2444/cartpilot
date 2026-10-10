import pino from 'pino';
import { env } from '../../config/env.config.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'refreshToken',
      'refreshTokenHash',
      'secret',
      'razorpay_signature',
      'keySecret',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
