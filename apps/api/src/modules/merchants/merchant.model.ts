import mongoose, { Schema, Document, Model } from 'mongoose';

export type MerchantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface IMerchantAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface IDeliverySettings {
  standardPrepMinutes: number;
  currentPrepMinutes: number;
  estimatedTravelMinutes: number;
  totalDeliveryMinutes: number;
  orderAcceptanceMode: 'OPEN' | 'PAUSED' | 'CLOSED';
  workloadPreset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY' | 'CUSTOM';
  maxActiveOrders: number;
  autoWorkloadCalculation: boolean;
  deliveryRadiusKm: number;
  minOrderPaise: number;
  deliveryFeePaise: number;
  operatingHours?: {
    openTime: string;
    closeTime: string;
    lunchBreakStart?: string;
    lunchBreakEnd?: string;
  };
}

export interface IMerchant extends Document {
  _id: mongoose.Types.ObjectId;
  businessName: string;
  slug: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  status: MerchantStatus;
  rejectionReason?: string | null;
  suspensionReason?: string | null;
  serviceAreaPincodes: string[];
  isVegetarianCertified: boolean;
  applicationSubmittedAt: Date;
  rating: number;
  address: IMerchantAddress;
  deliverySettings?: IDeliverySettings;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema<IMerchant>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'APPROVED',
      required: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    serviceAreaPincodes: {
      type: [String],
      default: ['560001', '560034', '560102', '560103'],
    },
    isVegetarianCertified: {
      type: Boolean,
      default: true,
      required: true,
    },
    applicationSubmittedAt: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560001' },
    },
    deliverySettings: {
      standardPrepMinutes: { type: Number, default: 15 },
      currentPrepMinutes: { type: Number, default: 30 },
      estimatedTravelMinutes: { type: Number, default: 15 },
      totalDeliveryMinutes: { type: Number, default: 45 },
      orderAcceptanceMode: {
        type: String,
        enum: ['OPEN', 'PAUSED', 'CLOSED'],
        default: 'OPEN',
      },
      workloadPreset: {
        type: String,
        enum: ['NOT_BUSY', 'NORMAL', 'BUSY', 'VERY_BUSY', 'CUSTOM'],
        default: 'NORMAL',
      },
      maxActiveOrders: { type: Number, default: 8 },
      autoWorkloadCalculation: { type: Boolean, default: true },
      deliveryRadiusKm: { type: Number, default: 5 },
      minOrderPaise: { type: Number, default: 10000 },
      deliveryFeePaise: { type: Number, default: 4000 },
      operatingHours: {
        openTime: { type: String, default: '07:00' },
        closeTime: { type: String, default: '22:00' },
        lunchBreakStart: { type: String, default: '14:00' },
        lunchBreakEnd: { type: String, default: '15:30' },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const MerchantModel: Model<IMerchant> =
  mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema);
