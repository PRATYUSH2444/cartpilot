import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  familyId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  deviceInfo: string;
  isRevoked: boolean;
  rotatedAt?: Date;
  rotatedToSessionId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    deviceInfo: {
      type: String,
      default: 'Browser Session',
    },
    isRevoked: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
    rotatedToSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL auto-cleanup
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ familyId: 1, isRevoked: 1 });

export const SessionModel: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
