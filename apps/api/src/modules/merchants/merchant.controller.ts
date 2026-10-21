import { Request, Response, NextFunction } from 'express';
import { MerchantService } from './merchant.service.js';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { MerchantModel } from './merchant.model.js';
import { env } from '../../config/env.config.js';

const REFRESH_COOKIE_NAME = 'cartpilot_refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export async function listMerchants(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const merchants = await MerchantService.listActiveMerchants();
    res.status(200).json({
      success: true,
      data: merchants,
      meta: { total: merchants.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const merchant = await MerchantService.getMerchantById(id as string);
    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMerchantProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const products = await MerchantService.getMerchantProducts(id as string);
    res.status(200).json({
      success: true,
      data: products,
      meta: { total: products.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function applyMerchant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
      requestId: req.headers['x-request-id'] as string,
    };

    const result = await MerchantService.applyMerchant(req.body, context);
    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        merchant: result.merchant,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyStore(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.merchantId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No merchant store linked' } });
      return;
    }

    const merchant = await MerchantService.getMerchantDetails(req.user.merchantId);
    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    next(error);
  }
}

export async function inviteStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.merchantId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No merchant store linked' } });
      return;
    }

    const result = await MerchantService.inviteStaff(req.user.merchantId, req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptStaffInvite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
      requestId: req.headers['x-request-id'] as string,
    };

    const result = await MerchantService.acceptStaffInvite(req.body, context);
    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.merchantId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No merchant store linked' } });
      return;
    }

    const result = await MerchantService.listMerchantStaff(req.user.merchantId, req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.merchantId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No merchant store linked' } });
      return;
    }

    const { staffUserId } = req.params;
    if (!staffUserId) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Staff user ID is required' } });
      return;
    }
    await MerchantService.revokeStaff(req.user.merchantId, req.user.id, staffUserId);

    res.status(200).json({
      success: true,
      data: {
        message: 'Staff access revoked and sessions terminated.',
      },
    });
  } catch (error) {
    next(error);
  }
}

// Admin endpoints for merchant management
export async function adminListMerchants(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const merchants = await MerchantModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: merchants,
      meta: { total: merchants.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateMerchantStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, action } = req.params;
    const { reason } = req.body;

    const validActions = ['APPROVE', 'REJECT', 'SUSPEND', 'RESTORE'];
    const upperAction = (action as string).toUpperCase() as 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESTORE';
    if (!validActions.includes(upperAction)) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: `Invalid action '${action}'` } });
      return;
    }

    const merchant = await MerchantService.updateMerchantStatus(
      id as string,
      upperAction,
      req.user!.id,
      reason
    );

    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    next(error);
  }
}
