import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { UserRole } from '../../modules/users/user.model.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { TokenPayload } from '../../modules/auth/auth.service.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      merchantId: decoded.merchantId,
    };
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired. Please refresh your session.');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`
      );
    }

    next();
  };
}

export function requireMerchantScope(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('User authentication required');
  }

  if (req.user.role === 'ADMIN') {
    return next(); // Admins bypass merchant scope
  }

  if (req.user.role !== 'MERCHANT' || !req.user.merchantId) {
    throw new ForbiddenError('Operation requires an authorized merchant context');
  }

  next();
}
