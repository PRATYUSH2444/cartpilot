import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMerchantAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface IMerchant extends Document {
  _id: mongoose.Types.ObjectId;
  businessName: string;
  slug: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  rating: number;
  address: IMerchantAddress;
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const MerchantModel: Model<IMerchant> =
  mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema);
