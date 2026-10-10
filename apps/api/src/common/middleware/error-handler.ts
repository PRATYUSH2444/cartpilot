import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logging/logger.js';
import { env } from '../../config/env.config.js';

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

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}
