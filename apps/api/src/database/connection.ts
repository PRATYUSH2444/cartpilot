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
    // In dev mode, if local mongo isn't up, seamlessly auto-start embedded MongoDB server and seed data
    if (env.NODE_ENV !== 'production') {
      try {
        logger.info(
          'Local MongoDB (27017) not active; launching embedded MongoDB development instance...'
        );
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const embeddedServer = await MongoMemoryServer.create();
        const embeddedUri = embeddedServer.getUri();
        const conn = await mongoose.connect(embeddedUri);
        logger.info({ uri: embeddedUri }, '✅ Connected to embedded development MongoDB server');

        // Auto-seed initial credentials and catalog
        const { runSeed } = await import('./seed.js');
        await runSeed(false);

        return conn;
      } catch (embeddedErr) {
        logger.warn({ embeddedErr }, 'Could not initialize embedded MongoDB fallback');
      }
    }

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
