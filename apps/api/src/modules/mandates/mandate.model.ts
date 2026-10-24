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
      default: 100000, // ₹1,000.00 canonical default per-order cap (alias of perOrderCapPaise)
    },
    dailyBudgetPaise: {
      type: Number,
      required: true,
      default: 150000, // ₹1,500.00 canonical default daily cap (alias of dailyCapPaise)
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
    // Canonical fields (spec §7.2 & UX_CONTRACT)
    autoApproveUpToPaise: {
      type: Number,
      default: 30000, // ₹300.00 default autonomous limit
    },
    perOrderCapPaise: {
      type: Number,
      default: 100000, // ₹1,000.00 canonical per-order cap
    },
    dailyCapPaise: {
      type: Number,
      default: 150000, // ₹1,500.00 canonical daily cap
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

// Enforce that perOrderCapPaise <-> maxOrderAmountPaise and dailyCapPaise <-> dailyBudgetPaise can never diverge
mandateSchema.pre('validate', function (next) {
  // Synchronize per-order cap fields
  if (this.perOrderCapPaise !== undefined && (this.maxOrderAmountPaise === undefined || this.isModified('perOrderCapPaise'))) {
    this.maxOrderAmountPaise = this.perOrderCapPaise;
  } else if (this.maxOrderAmountPaise !== undefined && (this.perOrderCapPaise === undefined || this.isModified('maxOrderAmountPaise'))) {
    this.perOrderCapPaise = this.maxOrderAmountPaise;
  }

  // Synchronize daily cap fields
  if (this.dailyCapPaise !== undefined && (this.dailyBudgetPaise === undefined || this.isModified('dailyCapPaise'))) {
    this.dailyBudgetPaise = this.dailyCapPaise;
  } else if (this.dailyBudgetPaise !== undefined && (this.dailyCapPaise === undefined || this.isModified('dailyBudgetPaise'))) {
    this.dailyCapPaise = this.dailyBudgetPaise;
  }

  next();
});

mandateSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update: any = this.getUpdate();
  if (!update) return next();
  const set = update.$set || update;
  if (set.perOrderCapPaise !== undefined && set.maxOrderAmountPaise === undefined) {
    set.maxOrderAmountPaise = set.perOrderCapPaise;
  } else if (set.maxOrderAmountPaise !== undefined && set.perOrderCapPaise === undefined) {
    set.perOrderCapPaise = set.maxOrderAmountPaise;
  }
  if (set.dailyCapPaise !== undefined && set.dailyBudgetPaise === undefined) {
    set.dailyBudgetPaise = set.dailyCapPaise;
  } else if (set.dailyBudgetPaise !== undefined && set.dailyCapPaise === undefined) {
    set.dailyCapPaise = set.dailyBudgetPaise;
  }
  next();
});

export const MandateModel = mongoose.model<MandateDocument>('Mandate', mandateSchema);
