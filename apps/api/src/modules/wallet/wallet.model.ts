import mongoose, { Schema, Document } from 'mongoose';

export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balancePaise: number;
  currency: 'INR';
  status: WalletStatus;
  version: number;
  freezeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balancePaise: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    version: {
      type: Number,
      default: 0,
    },
    freezeReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Safety validation: Balance must never be negative
WalletSchema.pre('validate', function (next) {
  if (this.balancePaise < 0) {
    return next(new Error('FATAL_LEDGER_ERROR: Wallet balance cannot drop below 0 paise'));
  }
  next();
});

export const WalletModel = mongoose.model<IWallet>('Wallet', WalletSchema);
