import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedWebhookEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  eventType: string;
  processedAt: Date;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

const ProcessedWebhookEventSchema = new Schema<IProcessedWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ProcessedWebhookEventModel: Model<IProcessedWebhookEvent> =
  mongoose.models.ProcessedWebhookEvent ||
  mongoose.model<IProcessedWebhookEvent>('ProcessedWebhookEvent', ProcessedWebhookEventSchema);
