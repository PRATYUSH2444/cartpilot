import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  refreshTokenHash?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
      required: true,
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
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    refreshTokenHash: {
      type: String,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Do not return passwordHash or refreshTokenHash in JSON transformations
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).passwordHash;
    delete (ret as unknown as Record<string, unknown>).refreshTokenHash;
    return ret;
  },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
