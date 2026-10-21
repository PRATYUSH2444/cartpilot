import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { UserModel, UserRole } from '../../modules/users/user.model.js';
import { MerchantPermission } from '../../modules/merchants/merchant-user.model.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { TokenPayload } from '../../modules/auth/auth.service.js';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: MerchantPermission[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError('Authentication token missing'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

    // Fast database verification of revocation, token version, and suspension status
    const user = await UserModel.findById(decoded.userId).select('tokenVersion isActive isSuspended');
    if (!user || !user.isActive) {
      return next(new UnauthorizedError('User account not found or deactivated'));
    }

    if (user.isSuspended) {
      return next(new ForbiddenError('User account has been suspended'));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new UnauthorizedError('Session has been revoked due to recent security or password changes'));
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      merchantId: decoded.merchantId,
      isStaff: decoded.isStaff,
      staffPermissions: decoded.staffPermissions,
    };
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Access token has expired. Please refresh your session.'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
}

export const requireAuth = authenticate;
export const requireRole = authorize;

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

/**
 * Shared middleware for merchant staff permission enforcement.
 * Owners and Admins bypass permission checks. Staff members must hold the required permission flag.
 */
export function requireMerchantPermission(permission: MerchantPermission) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins bypass permission checks
    }

    if (req.user.role !== 'MERCHANT') {
      throw new ForbiddenError('Operation requires a merchant account');
    }

    // If staff member, check granular permission flag
    if (req.user.isStaff) {
      if (!req.user.staffPermissions || !req.user.staffPermissions.includes(permission)) {
        throw new ForbiddenError(
          `You do not have permission to perform this action. Required permission: '${permission}'.`
        );
      }
    }

    next();
  };
}
