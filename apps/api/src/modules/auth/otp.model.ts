import mongoose, { Schema, Document } from 'mongoose';

export type OtpPurpose = 'PHONE_VERIFICATION' | 'LOGIN_2FA' | 'PASSWORD_RESET' | 'PHONE_LOGIN' | 'ADMIN_MFA';

export interface IOtpVerification extends Document {
  phone: string;
  hashedOtp: string;
  purpose: OtpPurpose;
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['PHONE_VERIFICATION', 'LOGIN_2FA', 'PASSWORD_RESET', 'PHONE_LOGIN', 'ADMIN_MFA'],
      default: 'PHONE_VERIFICATION',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL deletion
    },
  },
  {
    timestamps: true,
  }
);

export const OtpVerificationModel = mongoose.model<IOtpVerification>(
  'OtpVerification',
  OtpVerificationSchema
);
