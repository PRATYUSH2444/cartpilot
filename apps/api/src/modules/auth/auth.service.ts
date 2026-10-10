import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../../config/env.config.js';
import { UserModel, IUser, UserRole } from '../users/user.model.js';
import { MerchantUserModel } from '../merchants/merchant-user.model.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../../common/errors/app-error.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  merchantId?: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    merchantId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static generateTokens(
    user: IUser,
    merchantId?: string
  ): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      merchantId,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), tokenVersion: user.tokenVersion },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: '7d',
      }
    );

    return { accessToken, refreshToken };
  }

  static async registerUser(input: RegisterInput): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await UserModel.create({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      phone: input.phone,
      isActive: true,
      tokenVersion: 0,
    });

    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store hash of refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

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

  static async loginUser(input: LoginInput): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // If merchant, retrieve associated merchantId
    let merchantId: string | undefined;
    if (user.role === 'MERCHANT') {
      const mapping = await MerchantUserModel.findOne({ userId: user._id });
      if (mapping) {
        merchantId = mapping.merchantId.toString();
      }
    }

    const { accessToken, refreshToken } = this.generateTokens(user, merchantId);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshAccessToken(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let decoded: { userId: string; tokenVersion: number };
    try {
      decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        tokenVersion: number;
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    if (user.tokenVersion !== decoded.tokenVersion || !user.refreshTokenHash) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const isMatch = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid refresh token credential');
    }

    let merchantId: string | undefined;
    if (user.role === 'MERCHANT') {
      const mapping = await MerchantUserModel.findOne({ userId: user._id });
      if (mapping) {
        merchantId = mapping.merchantId.toString();
      }
    }

    // Rotate refresh token
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user, merchantId);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logoutUser(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    await UserModel.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1 },
      $inc: { tokenVersion: 1 },
    });
  }

  static async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    merchantId?: string;
    createdAt: Date;
  }> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    let merchantId: string | undefined;
    if (user.role === 'MERCHANT') {
      const mapping = await MerchantUserModel.findOne({ userId: user._id });
      if (mapping) {
        merchantId = mapping.merchantId.toString();
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      merchantId,
      createdAt: user.createdAt,
    };
  }
}
