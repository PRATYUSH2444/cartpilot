import mongoose, { Schema, Document } from 'mongoose';

export type TopupIntentStatus = 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface IWalletTopupIntent extends Document {
  _id: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amountPaise: number;
  currency: string;
  status: TopupIntentStatus;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  idempotencyKey: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTopupIntentSchema = new Schema<IWalletTopupIntent>(
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
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'CREATED',
      index: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true }
);

export const WalletTopupIntentModel = mongoose.model<IWalletTopupIntent>(
  'WalletTopupIntent',
  WalletTopupIntentSchema
);
