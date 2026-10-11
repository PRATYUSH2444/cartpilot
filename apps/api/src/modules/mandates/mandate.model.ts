import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMandate {
  userId: Types.ObjectId;
  version: number;
  maxOrderAmountPaise: number;
  dailyBudgetPaise: number;
  allowedMerchantIds: Types.ObjectId[];
  blockedCategories: string[];
  requireExplicitApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MandateDocument extends IMandate, Document {}

const mandateSchema = new Schema<MandateDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    maxOrderAmountPaise: {
      type: Number,
      required: true,
      default: 60000, // ₹600.00 default autonomous limit
    },
    dailyBudgetPaise: {
      type: Number,
      required: true,
      default: 150000, // ₹1500.00 default daily budget limit
    },
    allowedMerchantIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Merchant',
      },
    ],
    blockedCategories: {
      type: [String],
      default: [],
    },
    requireExplicitApproval: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MandateModel = mongoose.model<MandateDocument>('Mandate', mandateSchema);
