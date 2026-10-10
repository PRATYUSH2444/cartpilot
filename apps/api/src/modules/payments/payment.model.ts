import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amountPaise: number;
  currency: 'INR';
  gateway: 'RAZORPAY';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
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
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer in paise',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    gateway: {
      type: String,
      default: 'RAZORPAY',
      required: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      trim: true,
    },
    gatewaySignature: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'CREATED',
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
