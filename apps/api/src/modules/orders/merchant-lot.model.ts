import mongoose, { Schema, Document, Model } from 'mongoose';

export type MerchantLotStatus = 'CREATED' | 'NOTIFIED' | 'READY_FOR_PICKUP' | 'COLLECTED' | 'CANCELLED';

export interface IMerchantLotItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  packageSize: number;
  packageUnit: string;
  totalQuantity: number;
  unitPricePaise: number;
  subtotalPaise: number;
  orderCount: number;
  status: 'PENDING' | 'READY' | 'COLLECTED' | 'SHORTAGE';
  shortageQuantity?: number;
}

export interface IMerchantLot extends Document {
  _id: mongoose.Types.ObjectId;
  lotNumber: string; // e.g. LOT-20261128-FRESHGREENS-MORNING
  merchantId: mongoose.Types.ObjectId;
  targetDeliveryDate: Date;
  deliverySlot: 'MORNING' | 'EVENING';
  status: MerchantLotStatus;
  items: IMerchantLotItem[];
  totalUnits: number;
  totalPayoutPaise: number;
  token: string; // Ephemeral token for runner collection link
  collectedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantLotItemSchema = new Schema<IMerchantLotItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    packageSize: { type: Number, required: true },
    packageUnit: { type: String, required: true },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'totalQuantity must be an integer' },
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'unitPricePaise must be an integer' },
    },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'subtotalPaise must be an integer' },
    },
    orderCount: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'READY', 'COLLECTED', 'SHORTAGE'],
      default: 'PENDING',
    },
    shortageQuantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const MerchantLotSchema = new Schema<IMerchantLot>(
  {
    lotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    targetDeliveryDate: {
      type: Date,
      required: true,
      index: true,
    },
    deliverySlot: {
      type: String,
      enum: ['MORNING', 'EVENING'],
      required: true,
      default: 'MORNING',
    },
    status: {
      type: String,
      enum: ['CREATED', 'NOTIFIED', 'READY_FOR_PICKUP', 'COLLECTED', 'CANCELLED'],
      default: 'CREATED',
      index: true,
    },
    items: {
      type: [MerchantLotItemSchema],
      default: [],
    },
    totalUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayoutPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'totalPayoutPaise must be an integer' },
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    collectedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

MerchantLotSchema.index({ merchantId: 1, targetDeliveryDate: 1, deliverySlot: 1 });

export const MerchantLotModel: Model<IMerchantLot> =
  mongoose.models.MerchantLot || mongoose.model<IMerchantLot>('MerchantLot', MerchantLotSchema);
