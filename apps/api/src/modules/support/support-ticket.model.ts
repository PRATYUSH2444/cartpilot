import mongoose, { Schema, Document, Model } from 'mongoose';

export type SupportTopic =
  | 'Order & Delivery'
  | 'Payment & Wallet'
  | 'Item Quality'
  | 'General Question';

export type SupportStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'EMAIL_SENT'
  | 'EMAIL_FAILED';

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  topic: SupportTopic;
  message: string;
  status: SupportStatus;
  emailDelivered: boolean;
  emailProvider?: string;
  emailMessageId?: string;
  emailError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    topic: {
      type: String,
      required: true,
      enum: ['Order & Delivery', 'Payment & Wallet', 'Item Quality', 'General Question'],
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'EMAIL_SENT', 'EMAIL_FAILED'],
      default: 'OPEN',
      index: true,
    },
    emailDelivered: {
      type: Boolean,
      default: false,
    },
    emailProvider: {
      type: String,
      default: null,
    },
    emailMessageId: {
      type: String,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'support_tickets',
  }
);

export const SupportTicketModel: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
