import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageSender = 'USER' | 'AGENT' | 'SYSTEM';

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sender: MessageSender;
  content: string;
  toolCalls?: Array<{
    toolName: string;
    arguments: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    durationMs?: number;
  }>;
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['USER', 'AGENT', 'SYSTEM'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    toolCalls: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    cardType: {
      type: String,
      enum: ['rules', 'items', 'cart', 'approval', 'payment', 'order', 'proof'],
      default: undefined,
    },
    cardData: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessageModel: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
