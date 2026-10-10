import mongoose, { Schema, Document, Model } from 'mongoose';

export type MerchantRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface IMerchantUser extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  role: MerchantRole;
  createdAt: Date;
}

const MerchantUserSchema = new Schema<IMerchantUser>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['OWNER', 'MANAGER', 'STAFF'],
      default: 'OWNER',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Compound Unique Index: A user can hold one role mapping per merchant
MerchantUserSchema.index({ userId: 1, merchantId: 1 }, { unique: true });

export const MerchantUserModel: Model<IMerchantUser> =
  mongoose.models.MerchantUser || mongoose.model<IMerchantUser>('MerchantUser', MerchantUserSchema);
