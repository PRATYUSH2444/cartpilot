import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export type CartStatus = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  version: number;
  status: CartStatus;
  deliveryNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
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
        message: 'Cart item quantity must be an integer >= 1',
      },
    },
    addedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
      required: true,
      min: 1,
    },
    deliveryNote: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CONVERTED', 'ABANDONED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Only one ACTIVE cart per user at any given time (strictly unique partial index)
CartSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

// Index for user cart queries and updates
CartSchema.index({ userId: 1, updatedAt: -1 });

// TTL index for abandoned carts (expires after 30 days)
CartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'ABANDONED' } }
);

export const CartModel: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
