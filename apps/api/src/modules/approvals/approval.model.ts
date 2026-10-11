import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'INVALIDATED';

export interface IApproval {
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  cartVersion: number;
  mandateVersion: number;
  calculatedTotalPaise: number;
  approvalHash: string;
  status: ApprovalStatus;
  expiresAt: Date;
  decidedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalDocument extends IApproval, Document {}

const approvalSchema = new Schema<ApprovalDocument>(
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
    cartVersion: {
      type: Number,
      required: true,
    },
    mandateVersion: {
      type: Number,
      required: true,
    },
    calculatedTotalPaise: {
      type: Number,
      required: true,
    },
    approvalHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'INVALIDATED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    decidedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

approvalSchema.index({ userId: 1, cartId: 1, status: 1 });

export const ApprovalModel = mongoose.model<ApprovalDocument>('Approval', approvalSchema);
