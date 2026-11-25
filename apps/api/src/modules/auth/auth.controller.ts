import { Request, Response, NextFunction } from 'express';
import { AuthService, ClientContext } from './auth.service.js';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { env } from '../../config/env.config.js';
import { UserRole } from '../users/user.model.js';

const REFRESH_COOKIE_NAME = 'cartpilot_refresh_token';

function getClientContext(req: Request): ClientContext {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1',
    requestId: req.headers['x-request-id'] as string,
  };
}

function setRefreshCookie(res: Response, token: string, role?: UserRole): void {
  const { durationMs } = AuthService.getRefreshExpiry(role || 'CUSTOMER');
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: durationMs,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  });
  // Also clear legacy subpath cookie if present
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const context = getClientContext(req);
    const result = await AuthService.registerUser(req.body, context);
    setRefreshCookie(res, result.refreshToken, result.user.role);

    res.status(201).json({
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

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const context = getClientContext(req);
    const result = await AuthService.loginUser(req.body, context);
    setRefreshCookie(res, result.refreshToken, result.user.role);

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

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken =
      (req.cookies && (req.cookies[REFRESH_COOKIE_NAME] as string)) ||
      (req.body.refreshToken as string);

    const context = getClientContext(req);
    const result = await AuthService.refreshAccessToken(rawToken, context);
    setRefreshCookie(res, result.refreshToken, result.user.role);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = req.cookies && (req.cookies[REFRESH_COOKIE_NAME] as string);
    if (req.user) {
      await AuthService.logoutUser(req.user.id, rawToken);
    }
    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully; session revoked.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    await AuthService.logoutAllSessions(req.user.id);
    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'All active sessions have been terminated.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const currentRefreshToken = req.cookies && (req.cookies[REFRESH_COOKIE_NAME] as string);
    const sessions = await AuthService.getActiveSessions(req.user.id, currentRefreshToken);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Session ID is required' } });
      return;
    }
    await AuthService.revokeSession(req.user.id, sessionId);

    res.status(200).json({
      success: true,
      data: {
        message: 'Session revoked successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    await AuthService.changePassword(req.user.id, req.body);
    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully. All other sessions have been terminated.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forceChangePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    await AuthService.forceChangePassword(req.user.id, req.body);

    res.status(200).json({
      success: true,
      data: {
        message: 'Initial administrator password updated successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const result = await AuthService.createAdminUser(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: {
        ...result,
        user: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    const profile = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await AuthService.resetPassword(req.body);
    clearRefreshCookie(res);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, purpose } = req.body;
    const { OtpService } = await import('./otp.service.js');
    const result = await OtpService.sendOtp(phone, purpose);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, code, purpose } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;
    const { OtpService } = await import('./otp.service.js');
    const result = await OtpService.verifyOtp(phone, code, purpose, userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginWithPhoneOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, code, name } = req.body;
    const context = getClientContext(req);
    const { OtpService } = await import('./otp.service.js');
    const result = await OtpService.verifyLoginOtp(phone, code, name, context);
    setRefreshCookie(res, result.refreshToken, result.user.role);

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

export async function getPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        permissions: req.user.staffPermissions || [],
        merchantId: req.user.merchantId,
        isStaff: req.user.isStaff || false,
      },
    });
  } catch (error) {
    next(error);
  }
}
