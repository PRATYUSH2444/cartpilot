import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel, UserGender, INotificationPreferences } from './user.model.js';
import { AddressModel } from './address.model.js';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../../common/errors/app-error.js';

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string | Date;
  gender?: UserGender;
  dietaryPreferences?: string[];
  notificationPreferences?: Partial<INotificationPreferences>;
  hasSeenTour?: boolean;
  experienceRating?: number;
}

export class UserService {
  public static async getProfile(userId: string): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user || !user.isActive || user.isSuspended) {
      throw new NotFoundError('User profile not found');
    }

    let defaultAddress: any = null;
    if (user.defaultAddressId) {
      defaultAddress = await AddressModel.findById(user.defaultAddressId);
    } else {
      defaultAddress = await AddressModel.findOne({ userId: user._id, isDefault: true });
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      dietaryPreferences: user.dietaryPreferences || ['VEGETARIAN'],
      notificationPreferences: user.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
        inApp: true,
      },
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      hasSeenTour: Boolean(user.hasSeenTour),
      experienceRating: user.experienceRating ?? null,
      defaultAddress,
      createdAt: user.createdAt,
    };
  }

  public static async updateProfile(userId: string, input: UpdateProfileDTO): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user || !user.isActive || user.isSuspended) {
      throw new NotFoundError('User profile not found');
    }

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) throw new BadRequestError('Name cannot be empty');
      user.name = trimmed;
    }

    if (input.phone !== undefined) {
      user.phone = input.phone.trim();
    }

    if (input.avatarUrl !== undefined) {
      user.avatarUrl = input.avatarUrl.trim();
    }

    if (input.dateOfBirth !== undefined) {
      user.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : undefined;
    }

    if (input.gender !== undefined) {
      user.gender = input.gender;
    }

    if (input.dietaryPreferences !== undefined) {
      user.dietaryPreferences = input.dietaryPreferences;
    }

    if (input.notificationPreferences !== undefined) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...input.notificationPreferences,
      };
    }

    if (input.hasSeenTour !== undefined) {
      user.hasSeenTour = Boolean(input.hasSeenTour);
    }

    if (input.experienceRating !== undefined) {
      user.experienceRating = Math.max(1, Math.min(5, Math.round(Number(input.experienceRating))));
    }

    await user.save();
    return this.getProfile(userId);
  }

  public static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<void> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestError('This account does not have a local password configured.');
    }
    const matches = await bcrypt.compare(currentPass, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError('Current password does not match');
    }

    if (newPass.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    user.passwordHash = await bcrypt.hash(newPass, 10);
    user.tokenVersion += 1; // Invalidate previous sessions
    await user.save();
  }

  public static async getWallet(userId: string): Promise<{ balancePaise: number; balanceRupees: number; currency: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const balancePaise = user.walletBalancePaise ?? 34900;
    return {
      balancePaise,
      balanceRupees: balancePaise / 100,
      currency: 'INR',
    };
  }

  public static async topUpWallet(
    userId: string,
    amountPaise: number
  ): Promise<{ balancePaise: number; balanceRupees: number; addedPaise: number; bonusPaise: number; currency: string }> {
    if (!amountPaise || amountPaise <= 0) {
      throw new BadRequestError('Invalid top-up amount');
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Limited time offer: Add ₹999 (99900 paise) or more, get ₹100 (10000 paise) instant bonus
    const bonusPaise = amountPaise >= 99900 ? 10000 : 0;
    const totalCredit = amountPaise + bonusPaise;

    user.walletBalancePaise = (user.walletBalancePaise || 0) + totalCredit;
    await user.save();

    return {
      balancePaise: user.walletBalancePaise,
      balanceRupees: user.walletBalancePaise / 100,
      addedPaise: amountPaise,
      bonusPaise,
      currency: 'INR',
    };
  }
}
