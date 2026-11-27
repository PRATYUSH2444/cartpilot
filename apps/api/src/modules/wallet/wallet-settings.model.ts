import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletSettings extends Document {
  minTopupPaise: number;
  maxTopupPaise: number;
  maxBalancePaise: number;
  dailyTopupLimitPaise: number;
  quickAddChipsRupees: number[];
  welcomeBonusEnabled: boolean;
  welcomeBonusAmountPaise: number;
  cashbackEnabled: boolean;
  cashbackPercentage: number;
  cashbackMaxCapPaise: number;
  cashbackMinOrderPaise: number;
  topupEnabled: boolean;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSettingsSchema = new Schema<IWalletSettings>(
  {
    minTopupPaise: { type: Number, default: 10000 }, // ₹100
    maxTopupPaise: { type: Number, default: 1000000 }, // ₹10,000
    maxBalancePaise: { type: Number, default: 2000000 }, // ₹20,000
    dailyTopupLimitPaise: { type: Number, default: 5000000 }, // ₹50,000
    quickAddChipsRupees: { type: [Number], default: [200, 500, 1000, 2000] },
    welcomeBonusEnabled: { type: Boolean, default: true },
    welcomeBonusAmountPaise: { type: Number, default: 10000 }, // ₹100
    cashbackEnabled: { type: Boolean, default: true },
    cashbackPercentage: { type: Number, default: 5 }, // 5%
    cashbackMaxCapPaise: { type: Number, default: 10000 }, // ₹100
    cashbackMinOrderPaise: { type: Number, default: 49900 }, // ₹499
    topupEnabled: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'SYSTEM' },
  },
  { timestamps: true }
);

export const WalletSettingsModel = mongoose.model<IWalletSettings>(
  'WalletSettings',
  WalletSettingsSchema
);
