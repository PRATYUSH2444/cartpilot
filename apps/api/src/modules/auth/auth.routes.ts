import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
  changePassword,
  forceChangePassword,
  createAdmin,
  getMe,
  getPermissions,
  forgotPassword,
  resetPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  loginWithPhoneOtp,
  syncClerkUser,
  clerkWebhook,
  sendEmailVerification,
  verifyEmail,
} from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { authenticate, authenticateOptional, requireRole } from '../../common/middleware/auth.js';
import { authRateLimiter } from '../../common/middleware/rate-limiter.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  forceChangePasswordSchema,
  createAdminSchema,
  phoneOtpSendSchema,
  phoneOtpLoginSchema,
} from './auth.schema.js';

export const authRouter = Router();

// Public Authentication Flow
authRouter.post('/sync', syncClerkUser);
authRouter.post('/clerk-webhook', clerkWebhook);
authRouter.post('/register', authRateLimiter, validate(registerSchema), register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), login);
authRouter.post('/refresh', validate(refreshSchema), refresh);
authRouter.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);

// Phone OTP Verification & Authentication Flow
authRouter.post('/phone/send-otp', authRateLimiter, validate(phoneOtpSendSchema), sendPhoneOtp);
authRouter.post('/phone/verify-otp', authRateLimiter, authenticateOptional, verifyPhoneOtp);
authRouter.post('/phone/login', authRateLimiter, validate(phoneOtpLoginSchema), loginWithPhoneOtp);

// Authenticated Session & Account Management (logout accepts optional auth to cleanly clear expired sessions)
authRouter.post('/email/send-verification', authenticate, sendEmailVerification);
authRouter.post('/email/verify', authenticate, verifyEmail);
authRouter.post('/logout', authenticateOptional, logout);
authRouter.post('/logout-all', authenticate, logoutAll);
authRouter.get('/me', authenticate, getMe);
authRouter.get('/permissions', authenticate, getPermissions);
authRouter.get('/sessions', authenticate, getSessions);
authRouter.delete('/sessions/:sessionId', authenticate, revokeSession);
authRouter.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
authRouter.post('/force-change-password', authenticate, validate(forceChangePasswordSchema), forceChangePassword);

// Protected Admin Provisioning with Re-authentication
authRouter.post(
  '/admin/provision',
  authenticate,
  requireRole('ADMIN'),
  validate(createAdminSchema),
  createAdmin
);
authRouter.post(
  '/admin/create-admin',
  authenticate,
  requireRole('ADMIN'),
  validate(createAdminSchema),
  createAdmin
);
