import { env } from '../config/env.config.js';
import { logger } from '../common/logging/logger.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { runSeed } from '../database/seed.js';
import { UserModel } from '../modules/users/user.model.js';
import { CartModel } from '../modules/cart/cart.model.js';
import { OrderModel } from '../modules/orders/order.model.js';
import { ChatSessionModel } from '../modules/chat/chat-session.model.js';
import { ChatMessageModel } from '../modules/chat/chat-message.model.js';
import { MandateModel } from '../modules/mandates/mandate.model.js';
import { ApprovalModel } from '../modules/approvals/approval.model.js';
import { SessionModel } from '../modules/auth/session.model.js';
import { StockReservationModel } from '../modules/inventory/stock-reservation.model.js';
import { PaymentModel } from '../modules/payments/payment.model.js';
import { AuditEventModel } from '../modules/audit/audit-event.model.js';

async function resetDevDatabase(): Promise<void> {
  if (env.NODE_ENV === 'production' || env.isProduction) {
    logger.fatal('🚨 DANGER: reset-dev-database refuses to run in production environments.');
    process.exit(1);
  }

  logger.warn('⚠️ Initiating explicit development database reset...');

  await connectDatabase();

  logger.info('Wiping transactional, user, order, and conversation collections...');
  await Promise.all([
    CartModel.deleteMany({}),
    OrderModel.deleteMany({}),
    ChatSessionModel.deleteMany({}),
    ChatMessageModel.deleteMany({}),
    MandateModel.deleteMany({}),
    ApprovalModel.deleteMany({}),
    SessionModel.deleteMany({}),
    StockReservationModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    AuditEventModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);

  logger.info('Re-seeding reference merchants and starter accounts idempotently...');
  await runSeed(false);

  logger.info('✅ Development database reset complete. Reference catalogs and default accounts restored.');
  await disconnectDatabase();
  process.exit(0);
}

resetDevDatabase().catch((err) => {
  logger.fatal({ err }, 'Failed to reset development database');
  process.exit(1);
});
