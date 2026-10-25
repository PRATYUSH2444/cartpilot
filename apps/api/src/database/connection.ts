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
    const isTestOrExplicitMemory =
      env.USE_IN_MEMORY_DB ||
      process.env.USE_IN_MEMORY_DB === 'true' ||
      env.NODE_ENV === 'test' ||
      Boolean(uriOverride);

    // In-memory server is allowed ONLY for automated tests or when explicitly requested via flag
    if (isTestOrExplicitMemory) {
      try {
        logger.info(
          'Automated test environment or USE_IN_MEMORY_DB=true detected; launching ephemeral MongoMemoryServer...'
        );
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const embeddedServer = await MongoMemoryServer.create();
        const embeddedUri = embeddedServer.getUri();
        const conn = await mongoose.connect(embeddedUri);
        logger.info({ uri: embeddedUri }, '✅ Connected to ephemeral in-memory test database');

        const { runSeed } = await import('./seed.js');
        await runSeed(false);

        return conn;
      } catch (embeddedErr) {
        logger.warn({ embeddedErr }, 'Could not initialize in-memory database fallback');
      }
    }

    const maskedUri = (uriOverride || env.MONGODB_URI).replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    logger.error(
      { error },
      `❌ Could not connect to persistent MongoDB at ${maskedUri}.\n` +
      `To ensure data survives server restarts:\n` +
      `  1. (Recommended) Set MONGODB_URI in apps/api/.env to your MongoDB Atlas cluster URI, OR\n` +
      `  2. Start the local replica-set container: 'docker compose up -d'.\n` +
      `  (To use ephemeral in-memory MongoDB for testing only, set USE_IN_MEMORY_DB=true).`
    );

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
