import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Grocery Shopping Session',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ChatSessionSchema.index({ userId: 1, createdAt: -1 });

export const ChatSessionModel: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
