import mongoose, { Schema, Document, Model } from 'mongoose';
import { MerchantPermission } from './merchant-user.model.js';

export interface IStaffInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  invitedByUserId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  permissions: MerchantPermission[];
  tokenHash: string;
  expiresAt: Date;
  isAccepted: boolean;
  isRevoked: boolean;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StaffInvitationSchema = new Schema<IStaffInvitation>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [String],
      enum: ['orders.update', 'products.edit', 'stock.adjust', 'pricing.edit', 'settings.edit'],
      required: true,
      validate: {
        validator: (perms: string[]) => Array.isArray(perms) && perms.length > 0,
        message: 'At least one staff permission flag must be assigned',
      },
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    isAccepted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

StaffInvitationSchema.index({ merchantId: 1, email: 1, isAccepted: 1, isRevoked: 1 });

export const StaffInvitationModel: Model<IStaffInvitation> =
  mongoose.models.StaffInvitation ||
  mongoose.model<IStaffInvitation>('StaffInvitation', StaffInvitationSchema);
