import mongoose, { Schema, Document, Model } from 'mongoose';

export type StockReservationStatus = 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'RELEASED';

export interface IStockReservationItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IStockReservation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  cartId: mongoose.Types.ObjectId;
  items: IStockReservationItem[];
  status: StockReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockReservationItemSchema = new Schema<IStockReservationItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Reservation item quantity must be an integer >= 1',
      },
    },
  },
  { _id: false }
);

const StockReservationSchema = new Schema<IStockReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cartId: {
      type: Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
      index: true,
    },
    items: {
      type: [StockReservationItemSchema],
      required: true,
      validate: {
        validator: (items: IStockReservationItem[]) => items.length > 0,
        message: 'Stock reservation must contain at least one item',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CONSUMED', 'EXPIRED', 'RELEASED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

StockReservationSchema.index({ status: 1, expiresAt: 1 });

export const StockReservationModel: Model<IStockReservation> =
  mongoose.models.StockReservation ||
  mongoose.model<IStockReservation>('StockReservation', StockReservationSchema);
