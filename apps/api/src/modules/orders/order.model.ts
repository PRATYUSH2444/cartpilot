import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PACKING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED';

export interface IOrderItemSnapshot {
  productId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  unitPricePaise: number;
  quantity: number;
  subtotalPaise: number;
  packageSize: number;
  packageUnit: string;
}

export interface IPricingSnapshot {
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
}

export interface IShippingAddressSnapshot {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface IApprovalSnapshot {
  approvalId: mongoose.Types.ObjectId;
  approvalHash: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  status: OrderStatus;
  items: IOrderItemSnapshot[];
  pricingSnapshot: IPricingSnapshot;
  shippingAddressSnapshot: IShippingAddressSnapshot;
  approvalSnapshot?: IApprovalSnapshot;
  reservationId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  placedAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'unitPricePaise must be an integer',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer >= 1',
      },
    },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'subtotalPaise must be an integer',
      },
    },
    packageSize: {
      type: Number,
      required: true,
    },
    packageUnit: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const PricingSnapshotSchema = new Schema<IPricingSnapshot>(
  {
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'subtotalPaise must be an integer' },
    },
    deliveryFeePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'deliveryFeePaise must be an integer' },
    },
    taxPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'taxPaise must be an integer' },
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'discountPaise must be an integer' },
    },
    totalPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'totalPaise must be an integer' },
    },
  },
  { _id: false }
);

const ShippingAddressSnapshotSchema = new Schema<IShippingAddressSnapshot>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PAID',
        'CONFIRMED',
        'PACKING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'FAILED',
        'REFUNDED',
      ],
      default: 'PENDING_PAYMENT',
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSnapshotSchema],
      required: true,
      validate: {
        validator: (items: IOrderItemSnapshot[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    pricingSnapshot: {
      type: PricingSnapshotSchema,
      required: true,
    },
    shippingAddressSnapshot: {
      type: ShippingAddressSnapshotSchema,
      required: true,
    },
    approvalSnapshot: {
      type: new Schema(
        {
          approvalId: { type: Schema.Types.ObjectId, ref: 'Approval' },
          approvalHash: { type: String },
        },
        { _id: false }
      ),
      required: false,
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'StockReservation',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    placedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
