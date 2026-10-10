import mongoose from 'mongoose';
import { env } from '../config/env.config.js';
import { logger } from '../common/logging/logger.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    logger.info(
      { uri: env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') },
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

    const conn = await mongoose.connect(env.MONGODB_URI, {
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
