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
    const { ProductModel } = await import('./modules/catalog/product.model.js');
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0 || env.NODE_ENV !== 'production') {
      logger.info({ productCount }, '🌱 Empty database detected: seeding initial products and accounts...');
      const { runSeed } = await import('./database/seed.js');
      await runSeed(false);
    }

    // Ensure Master Admin account exists and is unblocked on every startup
    const { UserModel } = await import('./modules/users/user.model.js');
    const masterAdmin = await UserModel.findOne({ email: 'admin@cartpilot.com' });
    if (!masterAdmin) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin1234!', salt);
      await UserModel.create({
        name: 'Master System Administrator',
        email: 'admin@cartpilot.com',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        tokenVersion: 0,
        failedLoginAttempts: 0,
        isSuspended: false,
        isEmailVerified: true,
        isPhoneVerified: true,
        isMasterAdmin: true,
        isMfaEnforced: true,
      });
      logger.info('🛡️ Master Administrator account provisioned (admin@cartpilot.com)');
    } else {
      masterAdmin.role = 'ADMIN';
      masterAdmin.isActive = true;
      masterAdmin.isSuspended = false;
      masterAdmin.failedLoginAttempts = 0;
      masterAdmin.lockoutUntil = null;
      masterAdmin.isMasterAdmin = true;
      masterAdmin.isMfaEnforced = true;
      await masterAdmin.save();
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
