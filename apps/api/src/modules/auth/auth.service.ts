import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';
import { UserModel, IUser, UserRole } from '../users/user.model.js';
import { MerchantUserModel, MerchantPermission } from '../merchants/merchant-user.model.js';
import { SessionModel, ISession } from './session.model.js';
import { auditService } from '../audit/audit.service.js';
import { emailAdapter } from '../../integrations/email/email-adapter.js';
import { parseDeviceInfo } from '../../common/utils/device-parser.js';
import { validatePasswordStrength } from '../../common/utils/password-validator.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
} from '../../common/errors/app-error.js';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
  ForceChangePasswordInput,
  CreateAdminInput,
} from './auth.schema.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: MerchantPermission[];
}

export interface RefreshTokenPayload {
  userId: string;
  familyId: string;
  sessionId: string;
  tokenVersion: number;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: MerchantPermission[];
  mustChangePassword?: boolean;
}

export interface AuthResult {
  user: AuthUserDTO;
  accessToken: string;
  refreshToken: string;
}

export interface ClientContext {
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
}

export class AuthService {
  /**
   * Generates token lifetimes based on role specification in ROLE_CONTRACT.md:
   * Customer: 30 days, Merchant: 7 days, Admin: 1 day.
   */
  public static getRefreshExpiry(role: UserRole): { expiresInStr: '1d' | '7d' | '30d'; durationMs: number } {
    switch (role) {
      case 'ADMIN':
        return { expiresInStr: '1d', durationMs: 1 * 24 * 60 * 60 * 1000 };
      case 'MERCHANT':
        return { expiresInStr: '7d', durationMs: 7 * 24 * 60 * 60 * 1000 };
      case 'CUSTOMER':
      default:
        return { expiresInStr: '30d', durationMs: 30 * 24 * 60 * 60 * 1000 };
    }
  }

  /**
   * Generates a signed 15-minute in-memory access token.
   */
  public static generateAccessToken(
    user: IUser | { _id: mongoose.Types.ObjectId | string; email: string; role: UserRole; tokenVersion: number },
    merchantId?: string,
    isStaff = false,
    staffPermissions: MerchantPermission[] = []
  ): string {
    const rawId = '_id' in user && user._id ? user._id : '';
    const userIdStr = typeof rawId === 'string' ? rawId : rawId.toString();

    const payload: TokenPayload = {
      userId: userIdStr,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      merchantId,
      isStaff,
      staffPermissions,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  }

  /**
   * Creates a tracked refresh session and returns both access and refresh tokens.
   */
  public static async createSessionTokens(
    user: IUser,
    context: ClientContext,
    existingFamilyId?: string,
    merchantId?: string,
    isStaff = false,
    staffPermissions: MerchantPermission[] = []
  ): Promise<{ accessToken: string; refreshToken: string; session: ISession }> {
    const familyId = existingFamilyId || crypto.randomUUID();
    const sessionId = new mongoose.Types.ObjectId();
    const { expiresInStr, durationMs } = this.getRefreshExpiry(user.role);
    const expiresAt = new Date(Date.now() + durationMs);

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user._id.toString(),
      familyId,
      sessionId: sessionId.toString(),
      tokenVersion: user.tokenVersion,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: expiresInStr,
    });

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const userAgent = context.userAgent || 'Unknown Device';
    const ipAddress = context.ipAddress || '127.0.0.1';
    const deviceInfo = parseDeviceInfo(userAgent);

    const session = await SessionModel.create({
      _id: sessionId,
      userId: user._id,
      familyId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      deviceInfo,
      isRevoked: false,
      expiresAt,
      lastUsedAt: new Date(),
    });

    const accessToken = this.generateAccessToken(user, merchantId, isStaff, staffPermissions);

    return { accessToken, refreshToken, session };
  }

  /**
   * Helper method for generating tokens in tests or legacy callers
   */
  public static generateTokens(
    user: IUser | { _id?: mongoose.Types.ObjectId | string; userId?: string; email: string; role: UserRole; tokenVersion: number },
    merchantId?: string
  ): { accessToken: string; refreshToken: string } {
    const rawId = '_id' in user && user._id ? user._id : 'userId' in user ? (user.userId as string) : '';
    const userIdStr = typeof rawId === 'string' ? rawId : rawId?.toString() || '';

    const payload: TokenPayload = {
      userId: userIdStr,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      merchantId,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(
      { userId: userIdStr, familyId: crypto.randomUUID(), sessionId: new mongoose.Types.ObjectId().toString(), tokenVersion: user.tokenVersion },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a customer publicly.
   */
  public static async registerUser(input: RegisterInput, context: ClientContext = {}): Promise<AuthResult> {
    if ((input as { role?: string }).role === 'ADMIN') {
      throw new ForbiddenError('Self-registration as administrator is strictly forbidden');
    }

    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.isValid) {
      throw new BadRequestError(passwordCheck.message || 'Password does not meet security requirements');
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await UserModel.create({
      email: normalizedEmail,
      passwordHash,
      name: input.name.trim(),
      role: input.role,
      phone: input.phone?.trim(),
      isActive: true,
      tokenVersion: 0,
      failedLoginAttempts: 0,
      isSuspended: false,
      isEmailVerified: false,
    });

    const { accessToken, refreshToken } = await this.createSessionTokens(user, context);

    await auditService.recordEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { email: user.email, role: user.role, action: 'REGISTER' },
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Sign in with progressive lockout and account suspension checks.
   */
  public static async loginUser(input: LoginInput, context: ClientContext = {}): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Anti-enumeration: consistent message for non-existent users
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 1. Check account suspension status
    if (user.isSuspended) {
      throw new ForbiddenError(
        `Account has been suspended. ${user.suspensionReason || 'Please contact customer support.'}`
      );
    }

    // 2. Check active deactivation
    if (!user.isActive) {
      throw new ForbiddenError('Account has been deactivated. Please contact customer support.');
    }

    // 3. Check progressive lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
      await auditService.recordEvent({
        eventType: 'AUTH_LOGIN_FAILED',
        actorId: user._id.toString(),
        actorRole: user.role,
        resourceId: user._id.toString(),
        resourceType: 'USER',
        payload: { email: normalizedEmail, reason: 'LOCKED_OUT', remainingMinutes },
      });
      throw new TooManyRequestsError(
        `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        'ACCOUNT_LOCKED'
      );
    }

    // 4. Verify password
    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account after 5 consecutive failures for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await auditService.recordEvent({
          eventType: 'AUTH_ACCOUNT_LOCKED',
          actorId: user._id.toString(),
          actorRole: user.role,
          resourceId: user._id.toString(),
          resourceType: 'USER',
          payload: { email: normalizedEmail, failedAttempts: user.failedLoginAttempts },
        });
      }

      await auditService.recordEvent({
        eventType: 'AUTH_LOGIN_FAILED',
        actorId: user._id.toString(),
        actorRole: user.role,
        resourceId: user._id.toString(),
        resourceType: 'USER',
        payload: { email: normalizedEmail, reason: 'INVALID_CREDENTIALS', failedAttempts: user.failedLoginAttempts },
      });

      await user.save();
      throw new UnauthorizedError('Invalid email or password');
    }

    // 5. Successful login: reset lockout counters
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // 6. Retrieve merchant mapping and staff permissions if merchant
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

    // 7. Create tracked refresh session and tokens
    const { accessToken, refreshToken } = await this.createSessionTokens(
      user,
      context,
      undefined,
      merchantId,
      isStaff,
      staffPermissions
    );

    await auditService.recordEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { email: user.email, role: user.role, merchantId },
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId,
        isStaff,
        staffPermissions,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes access token with family-based rotation and reuse detection.
   */
  public static async refreshAccessToken(rawRefreshToken: string, context: ClientContext = {}): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Find the session record by token hash or sessionId
    const session = await SessionModel.findOne({
      $or: [{ refreshTokenHash: tokenHash }, { _id: decoded.sessionId }],
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or revoked refresh session');
    }

    // --- TOKEN REUSE DETECTION WITH CONCURRENCY GRACE WINDOW ---
    // If a revoked session is presented, verify whether it falls within the 30-second rotation grace window.
    // This allows legitimate concurrent requests (e.g. React StrictMode double-mount, multi-tab navigation)
    // to safely receive valid tokens without destructive false-positive session revocation.
    if (session.isRevoked) {
      const ROTATION_GRACE_WINDOW_MS = 30000;
      const isWithinGraceWindow =
        session.rotatedAt &&
        Date.now() - new Date(session.rotatedAt).getTime() < ROTATION_GRACE_WINDOW_MS;

      if (isWithinGraceWindow && session.rotatedToSessionId) {
        const activeSession = await SessionModel.findOne({
          _id: session.rotatedToSessionId,
          isRevoked: false,
        });

        if (activeSession && activeSession.expiresAt > new Date()) {
          const user = await UserModel.findById(session.userId);
          if (user && user.isActive && !user.isSuspended && user.tokenVersion === decoded.tokenVersion) {
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

            const accessToken = jwt.sign(
              {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                tokenVersion: user.tokenVersion,
                merchantId,
                isStaff,
                staffPermissions,
              },
              env.JWT_ACCESS_SECRET,
              { expiresIn: '15m' }
            );

            const { expiresInStr } = this.getRefreshExpiry(user.role);
            const activeRefreshToken = jwt.sign(
              {
                userId: user._id.toString(),
                familyId: activeSession.familyId,
                sessionId: activeSession._id.toString(),
                tokenVersion: user.tokenVersion,
              },
              env.JWT_REFRESH_SECRET,
              { expiresIn: expiresInStr }
            );

            return {
              user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                merchantId,
                isStaff,
                staffPermissions,
                mustChangePassword: user.mustChangePassword,
              },
              accessToken,
              refreshToken: activeRefreshToken,
            };
          }
        }
      }

      logger.warn(
        { userId: session.userId, familyId: session.familyId },
        '🚨 REFRESH TOKEN REUSE DETECTED: Revoking all sessions in token family'
      );

      // Invalidate the ENTIRE token family immediately
      await SessionModel.updateMany({ familyId: session.familyId }, { isRevoked: true });
      await UserModel.updateOne({ _id: session.userId }, { $inc: { tokenVersion: 1 } });

      await auditService.recordEvent({
        eventType: 'AUTH_TOKEN_REUSE_DETECTED',
        actorId: session.userId.toString(),
        actorRole: 'CUSTOMER',
        resourceId: session.familyId,
        resourceType: 'SESSION',
        payload: { familyId: session.familyId, attemptedSessionId: session._id.toString() },
      });

      throw new UnauthorizedError(
        'Security alert: Refresh token reuse detected. All sessions in this family have been terminated.',
        'TOKEN_REUSE_DETECTED'
      );
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      session.isRevoked = true;
      await session.save();
      throw new UnauthorizedError('Refresh token session has expired');
    }

    const user = await UserModel.findById(session.userId);
    if (!user || !user.isActive || user.isSuspended) {
      session.isRevoked = true;
      await session.save();
      throw new UnauthorizedError('User account not found, deactivated, or suspended');
    }

    // Check tokenVersion match
    if (user.tokenVersion !== decoded.tokenVersion) {
      session.isRevoked = true;
      await session.save();
      throw new UnauthorizedError('Session has been revoked due to credential changes');
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

    // 1. Issue rotated session in the SAME family
    const { accessToken, refreshToken: newRefreshToken, session: newSession } = await this.createSessionTokens(
      user,
      context,
      session.familyId,
      merchantId,
      isStaff,
      staffPermissions
    );

    // 2. Mark current session as rotated with timestamp and link to new session
    session.isRevoked = true;
    session.rotatedAt = new Date();
    session.rotatedToSessionId = newSession._id;
    await session.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId,
        isStaff,
        staffPermissions,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Log out of current session.
   */
  public static async logoutUser(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      try {
        const decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
        await SessionModel.updateOne({ _id: decoded.sessionId }, { isRevoked: true });
      } catch {
        // Fallback: search by hash
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
        await SessionModel.updateOne({ refreshTokenHash: tokenHash }, { isRevoked: true });
      }
    }

    await auditService.recordEvent({
      eventType: 'AUTH_SESSION_REVOKED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: userId,
      resourceType: 'SESSION',
      payload: { action: 'LOGOUT' },
    });
  }

  /**
   * Revoke all sessions for a user ("Sign out everywhere").
   */
  public static async logoutAllSessions(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    await SessionModel.updateMany({ userId: new mongoose.Types.ObjectId(userId) }, { isRevoked: true });
    await UserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });

    await auditService.recordEvent({
      eventType: 'AUTH_ALL_SESSIONS_REVOKED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: userId,
      resourceType: 'SESSION',
      payload: { action: 'LOGOUT_ALL' },
    });
  }

  /**
   * Lists active sessions with device info, IP, last used, and current session flag.
   */
  public static async getActiveSessions(
    userId: string,
    currentRefreshToken?: string
  ): Promise<Array<{ id: string; deviceInfo: string; ipAddress: string; lastUsedAt: Date; createdAt: Date; isCurrent: boolean }>> {
    let currentSessionId: string | null = null;
    if (currentRefreshToken) {
      try {
        const decoded = jwt.verify(currentRefreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
        currentSessionId = decoded.sessionId;
      } catch {
        // Ignored
      }
    }

    const sessions = await SessionModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1 })
      .lean();

    return sessions.map((s) => ({
      id: s._id.toString(),
      deviceInfo: s.deviceInfo || 'Browser Session',
      ipAddress: s.ipAddress || '127.0.0.1',
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: currentSessionId ? s._id.toString() === currentSessionId : false,
    }));
  }

  /**
   * Revoke an individual active session.
   */
  public static async revokeSession(userId: string, sessionId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestError('Invalid session ID');
    }

    const session = await SessionModel.findOne({
      _id: sessionId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!session) {
      throw new BadRequestError('Session not found or already terminated');
    }

    session.isRevoked = true;
    await session.save();

    await auditService.recordEvent({
      eventType: 'AUTH_SESSION_REVOKED',
      actorId: userId,
      actorRole: 'CUSTOMER',
      resourceId: sessionId,
      resourceType: 'SESSION',
      payload: { sessionId },
    });
  }

  /**
   * Change password for logged-in user and revoke other sessions.
   */
  public static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const strengthCheck = validatePasswordStrength(input.newPassword);
    if (!strengthCheck.isValid) {
      throw new BadRequestError(strengthCheck.message || 'New password does not meet security requirements');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
    user.tokenVersion += 1;
    user.mustChangePassword = false;
    await user.save();

    // Revoke all existing sessions
    await SessionModel.updateMany({ userId: user._id }, { isRevoked: true });

    await auditService.recordEvent({
      eventType: 'AUTH_PASSWORD_CHANGED',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { action: 'PASSWORD_CHANGED' },
    });
  }

  /**
   * Force change password for provisioned administrator on first login.
   */
  public static async forceChangePassword(userId: string, input: ForceChangePasswordInput): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    const strengthCheck = validatePasswordStrength(input.newPassword);
    if (!strengthCheck.isValid) {
      throw new BadRequestError(strengthCheck.message || 'Password does not meet security requirements');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
    user.mustChangePassword = false;
    user.tokenVersion += 1;
    await user.save();

    await SessionModel.updateMany({ userId: user._id }, { isRevoked: true });

    await auditService.recordEvent({
      eventType: 'AUTH_PASSWORD_CHANGED',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { action: 'FORCED_INITIAL_PASSWORD_CHANGE' },
    });
  }

  /**
   * Request password reset token. Always returns anti-enumeration generic message.
   */
  public static async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string; devResetLink?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Anti-enumeration generic success message
    if (!user || !user.isActive || user.isSuspended) {
      return {
        success: true,
        message: 'If an account exists for this email address, a password reset link has been dispatched.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Dispatch via email adapter (Console transport in dev/test)
    await emailAdapter.sendPasswordResetEmail(normalizedEmail, rawToken);

    await auditService.recordEvent({
      eventType: 'AUTH_PASSWORD_RESET_REQUESTED',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { email: normalizedEmail },
    });

    const devResetLink = env.isProduction ? undefined : `/reset-password?token=${rawToken}`;

    return {
      success: true,
      message: 'If an account exists for this email address, a password reset link has been dispatched.',
      devResetLink,
    };
  }

  /**
   * Reset password with single-use unexpired token.
   */
  public static async resetPassword(input: ResetPasswordInput): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const user = await UserModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Password reset link is invalid or has expired. Please request a new one.');
    }

    const strengthCheck = validatePasswordStrength(input.password);
    if (!strengthCheck.isValid) {
      throw new BadRequestError(strengthCheck.message || 'Password does not meet security requirements');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.password, salt);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Invalidate all existing sessions
    await SessionModel.updateMany({ userId: user._id }, { isRevoked: true });

    await auditService.recordEvent({
      eventType: 'AUTH_PASSWORD_RESET_COMPLETED',
      actorId: user._id.toString(),
      actorRole: user.role,
      resourceId: user._id.toString(),
      resourceType: 'USER',
      payload: { email: user.email },
    });

    return {
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Admin provisions another admin. Requires existing admin authentication and password re-entry.
   */
  public static async createAdminUser(
    currentAdminId: string,
    input: CreateAdminInput
  ): Promise<{ id: string; email: string; name: string; role: 'ADMIN' }> {
    const actingAdmin = await UserModel.findById(currentAdminId);
    if (!actingAdmin || actingAdmin.role !== 'ADMIN') {
      throw new ForbiddenError('Only authenticated administrators can provision new admin accounts');
    }

    // Re-authenticate acting admin with currentAdminPassword
    const isMatch = await bcrypt.compare(input.currentAdminPassword, actingAdmin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current administrator password confirmation failed', 'REAUTH_REQUIRED');
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const strengthCheck = validatePasswordStrength(input.password);
    if (!strengthCheck.isValid) {
      throw new BadRequestError(strengthCheck.message || 'Password does not meet security requirements');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newAdmin = await UserModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      tokenVersion: 0,
      mustChangePassword: true, // Force password change at first login
      failedLoginAttempts: 0,
      isSuspended: false,
    });

    await auditService.recordEvent({
      eventType: 'ADMIN_PROVISIONED',
      actorId: actingAdmin._id.toString(),
      actorRole: 'ADMIN',
      resourceId: newAdmin._id.toString(),
      resourceType: 'USER',
      payload: {
        createdAdminEmail: newAdmin.email,
        createdAdminName: newAdmin.name,
      },
    });

    return {
      id: newAdmin._id.toString(),
      email: newAdmin.email,
      name: newAdmin.name,
      role: 'ADMIN',
    };
  }

  /**
   * Fetch current user profile.
   */
  public static async getCurrentUser(userId: string): Promise<AuthUserDTO> {
    const user = await UserModel.findById(userId);
    if (!user || !user.isActive || user.isSuspended) {
      throw new UnauthorizedError('User session expired or account deactivated');
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

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      merchantId,
      isStaff,
      staffPermissions,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
