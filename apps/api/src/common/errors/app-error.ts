export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(arg1: string, arg2?: number | string, arg3?: string | number, details?: unknown) {
    let message = arg1;
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';

    if (typeof arg2 === 'string' && typeof arg3 === 'number') {
      // Called as: AppError(code, message, statusCode, details)
      code = arg1;
      message = arg2;
      statusCode = arg3;
    } else {
      // Standard signature: AppError(message, statusCode, code, details)
      if (typeof arg2 === 'number') {
        statusCode = arg2;
      }
      if (typeof arg3 === 'string') {
        code = arg3;
      }
    }

    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied to target resource', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT', details?: unknown) {
    super(message, 409, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
    super(message, 429, code);
  }
}

