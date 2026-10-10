import mongoose from 'mongoose';
import { env } from '../config/env.config.js';
import { logger } from '../common/logging/logger.js';

export async function connectDatabase(uriOverride?: string): Promise<typeof mongoose> {
  try {
    const targetUri = uriOverride || env.MONGODB_URI;
    logger.info(
      { uri: targetUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') },
      'Connecting to MongoDB...'
    );

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    });

    return conn;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize MongoDB connection');
    // In dev mode, don't necessarily crash immediately if local mongo isn't up, but log clearly
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected cleanly');
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
