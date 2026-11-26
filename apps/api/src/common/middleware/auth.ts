import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
import { env } from '../../config/env.config.js';
import { UserModel, UserRole } from '../../modules/users/user.model.js';
import { MerchantUserModel, MerchantPermission } from '../../modules/merchants/merchant-user.model.js';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { TokenPayload } from '../../modules/auth/auth.service.js';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  clerkUserId?: string;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: MerchantPermission[];
  isMfaVerified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  // 1. If Clerk secret key is present, attempt Clerk token verification first
  if (env.CLERK_SECRET_KEY) {
    try {
      const clerkPayload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });

      if (clerkPayload && clerkPayload.sub) {
        const clerkUserId = clerkPayload.sub;
        let user = await UserModel.findOne({ clerkUserId });

        // If not found by clerkUserId, attempt lookup by email claim if present
        if (!user && (clerkPayload as any).email) {
          const emailClaim = String((clerkPayload as any).email).toLowerCase().trim();
          user = await UserModel.findOne({ email: emailClaim });
          if (user) {
            user.clerkUserId = clerkUserId;
            await user.save();
          }
        }

        // If newly authenticated Clerk user without MongoDB record, auto-provision as CUSTOMER
        if (!user) {
          const emailClaim = (clerkPayload as any).email || `${clerkUserId}@cartpilot.app`;
          user = await UserModel.create({
            clerkUserId,
            email: String(emailClaim).toLowerCase().trim(),
            name: (clerkPayload as any).name || 'CartPilot Shopper',
            role: 'CUSTOMER',
            isActive: true,
            isEmailVerified: true,
          });
        }

        if (!user.isActive) {
          return next(new UnauthorizedError('User account not found or deactivated'));
        }

        if (user.isSuspended) {
          return next(new ForbiddenError('User account has been suspended'));
        }

        let merchantId: string | undefined;
        let isStaff = false;
        let staffPermissions: MerchantPermission[] = [];

        if (user.role === 'MERCHANT') {
          const mapping = await MerchantUserModel.findOne({ userId: user._id });
          if (mapping) {
            merchantId = mapping.merchantId.toString();
            isStaff = mapping.role === 'STAFF';
            staffPermissions = mapping.permissions || [];
          }
        }

        req.user = {
          id: user._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          clerkUserId: user.clerkUserId,
          merchantId,
          isStaff,
          staffPermissions,
        };

        return next();
      }
    } catch {
      // Not a valid Clerk token; fall through to local JWT verification
    }
  }

  // 2. Standard JWT verification (for local development, seed scripts, and test suites)
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
      isMfaVerified: decoded.isMfaVerified !== false,
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

    if (allowedRoles.includes('ADMIN') && req.user.role === 'ADMIN') {
      if (env.ADMIN_CLERK_USER_ID && req.user.clerkUserId && req.user.clerkUserId !== env.ADMIN_CLERK_USER_ID) {
        throw new ForbiddenError('Access denied. Admin identity does not match provisioned Master Admin.');
      }

      if (req.user.isMfaVerified === false) {
        throw new ForbiddenError('Master Admin MFA verification required. Complete 2FA at /admin/login', 'MFA_REQUIRED');
      }
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

/**
 * Role & permission gate for order fulfillment simulation:
 * - Admins can advance any order.
 * - Merchant staff members must possess the 'orders.update' permission.
 * - Store owners, managers, and shoppers (for their own orders in demo simulation) are authorized.
 * - OrderService.getOrderById strictly enforces tenant isolation and owner matching.
 */
export function requireOrderFulfillmentPermission(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('User authentication required');
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role === 'MERCHANT' && req.user.isStaff) {
    if (!req.user.staffPermissions || !req.user.staffPermissions.includes('orders.update')) {
      throw new ForbiddenError(
        "You do not have permission to perform this action. Required permission: 'orders.update'."
      );
    }
  }

  next();
}

/**
 * Optional authentication middleware:
 * Populates req.user if a valid Bearer token is provided, but does not throw if missing or expired.
 * Useful for teardown/logout endpoints that should clear cookies regardless of token expiry.
 */
export async function authenticateOptional(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    const user = await UserModel.findById(decoded.userId).select('tokenVersion isActive isSuspended');
    if (user && user.isActive && !user.isSuspended && user.tokenVersion === decoded.tokenVersion) {
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        merchantId: decoded.merchantId,
        isStaff: decoded.isStaff,
        staffPermissions: decoded.staffPermissions,
      };
    }
    next();
  } catch {
    next();
  }
}
