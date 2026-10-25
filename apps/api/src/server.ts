import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { logger } from './common/logging/logger.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { InventoryService } from './modules/inventory/inventory.service.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Attempt database connection
  try {
    await connectDatabase();
    if (env.NODE_ENV !== 'production') {
      const { runSeed } = await import('./database/seed.js');
      await runSeed(false);
    }

    // Addendum 4: Execute startup check & migration for legacy mandates
    const { MandateService } = await import('./modules/mandates/mandate.service.js');
    await MandateService.migrateLegacyMandates();
  } catch (error) {
    logger.warn(
      { error },
      'Continuing startup without active database connection (will show NOT_READY in /ready)'
    );
  }

  // Start background reservation sweeper (cleans up expired 15-minute reservation locks)
  const sweeperInterval = setInterval(async () => {
    try {
      await InventoryService.sweepExpiredReservations();
    } catch (err) {
      logger.error({ err }, 'Error during background inventory sweeper run');
    }
  }, env.RESERVATION_SWEEPER_INTERVAL_MS);
  sweeperInterval.unref();

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        healthEndpoint: `http://localhost:${env.PORT}/api/v1/health`,
        sweeperIntervalMs: env.RESERVATION_SWEEPER_INTERVAL_MS,
      },
      '🚀 CartPilot API Server started successfully'
    );
  });

  // Graceful shutdown handling
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal, terminating server gracefully...');
    clearInterval(sweeperInterval);

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
