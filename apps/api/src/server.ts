import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { logger } from './common/logging/logger.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Attempt database connection
  try {
    await connectDatabase();
  } catch (error) {
    logger.warn(
      { error },
      'Continuing startup without active database connection (will show NOT_READY in /ready)'
    );
  }

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        healthEndpoint: `http://localhost:${env.PORT}/api/v1/health`,
      },
      '🚀 CartPilot API Server started successfully'
    );
  });

  // Graceful shutdown handling
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal, terminating server gracefully...');

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await disconnectDatabase();
      } catch (err) {
        logger.error({ err }, 'Error during database disconnection');
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start application server');
  process.exit(1);
});
