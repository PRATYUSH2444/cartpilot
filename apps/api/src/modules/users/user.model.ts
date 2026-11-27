import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface INotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  clerkUserId?: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: UserGender;
  dietaryPreferences: string[];
  notificationPreferences: INotificationPreferences;
  defaultAddressId?: mongoose.Types.ObjectId;
  isActive: boolean;
  refreshTokenHash?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  tokenVersion: number;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  isSuspended: boolean;
  suspensionReason?: string | null;
  isEmailVerified: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  isPhoneVerified: boolean;
  mustChangePassword: boolean;
  isStaff: boolean;
  isMasterAdmin?: boolean;
  isMfaEnforced?: boolean;
  lastMfaVerifiedAt?: Date | null;
  walletBalancePaise: number;
  themePreference?: 'LIGHT' | 'DARK';
  hasSeenTour?: boolean;
  experienceRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'MERCHANT', 'ADMIN'],
      default: 'CUSTOMER',
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    },
    dietaryPreferences: {
      type: [String],
      default: ['VEGETARIAN'],
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    defaultAddressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    refreshTokenHash: {
      type: String,
    },
    resetPasswordTokenHash: {
      type: String,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      required: true,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
      required: true,
    },
    isStaff: {
      type: Boolean,
      default: false,
      required: true,
    },
    isMasterAdmin: {
      type: Boolean,
      default: false,
    },
    isMfaEnforced: {
      type: Boolean,
      default: true,
    },
    lastMfaVerifiedAt: {
      type: Date,
      default: null,
    },
    walletBalancePaise: {
      type: Number,
      default: 34900,
      min: 0,
    },
    themePreference: {
      type: String,
      enum: ['LIGHT', 'DARK'],
      default: 'LIGHT',
    },
    hasSeenTour: {
      type: Boolean,
      default: false,
    },
    experienceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Do not return passwordHash, refreshTokenHash, or resetPasswordTokenHash in JSON transformations
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).passwordHash;
    delete (ret as unknown as Record<string, unknown>).refreshTokenHash;
    delete (ret as unknown as Record<string, unknown>).resetPasswordTokenHash;
    return ret;
  },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
