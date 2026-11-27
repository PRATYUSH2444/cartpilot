import mongoose, { Schema, Document } from 'mongoose';

export type WalletTransactionType =
  | 'TOPUP'
  | 'ORDER_PAYMENT'
  | 'REFUND'
  | 'CASHBACK'
  | 'PROMO_CREDIT'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT'
  | 'REVERSAL';

export type TransactionDirection = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface IWalletTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: WalletTransactionType;
  direction: TransactionDirection;
  amountPaise: number;
  balanceAfterPaise: number;
  status: TransactionStatus;
  referenceType?: 'ORDER' | 'PAYMENT' | 'REFUND' | 'ADMIN' | 'PROMO';
  referenceId?: string;
  idempotencyKey: string;
  gateway: 'RAZORPAY' | 'INTERNAL';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  metadata?: Record<string, any>;
  description: string;
  createdBy: string;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'TOPUP',
        'ORDER_PAYMENT',
        'REFUND',
        'CASHBACK',
        'PROMO_CREDIT',
        'ADMIN_CREDIT',
        'ADMIN_DEBIT',
        'REVERSAL',
      ],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    balanceAfterPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['ORDER', 'PAYMENT', 'REFUND', 'ADMIN', 'PROMO'],
    },
    referenceId: {
      type: String,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'INTERNAL'],
      default: 'INTERNAL',
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent welcome bonus double-claim via partial compound unique index
WalletTransactionSchema.index(
  { userId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'PROMO_CREDIT',
      referenceId: 'WELCOME_BONUS',
      status: 'SUCCESS',
    },
  }
);

export const WalletTransactionModel = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  WalletTransactionSchema
);
