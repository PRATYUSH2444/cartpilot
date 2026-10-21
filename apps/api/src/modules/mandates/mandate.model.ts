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
  // New fields (spec §7.2)
  autoApproveUpToPaise: number;
  perOrderCapPaise: number;
  dailyCapPaise: number;
  paused: boolean;
  revoked: boolean;
  expiresAt?: Date;
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
    // New fields (spec §7.2) — defaults mirror the old fields for safe migration
    autoApproveUpToPaise: {
      type: Number,
      default: 50000, // ₹500.00 default auto-approve limit
    },
    perOrderCapPaise: {
      type: Number,
      default: 100000, // ₹1000.00 default per-order cap
    },
    dailyCapPaise: {
      type: Number,
      default: 150000, // ₹1500.00 default daily cap (same as dailyBudgetPaise)
    },
    paused: {
      type: Boolean,
      default: false,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const MandateModel = mongoose.model<MandateDocument>('Mandate', mandateSchema);
