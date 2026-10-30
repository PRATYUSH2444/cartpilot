import mongoose, { Schema, Document, Model } from 'mongoose';

export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  houseFlat: string;
  apartmentStreet: string;
  areaLocality: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isServiceable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    houseFlat: {
      type: String,
      required: true,
      trim: true,
    },
    apartmentStreet: {
      type: String,
      required: true,
      trim: true,
    },
    areaLocality: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
    },
    addressType: {
      type: String,
      enum: ['HOME', 'WORK', 'OTHER'],
      default: 'HOME',
      required: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isServiceable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AddressSchema.index({ userId: 1, isDefault: -1 });

export const AddressModel: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
