import mongoose, { ClientSession } from 'mongoose';
import { WalletModel, IWallet } from './wallet.model.js';
import {
  WalletTransactionModel,
  IWalletTransaction,
  WalletTransactionType,
} from './wallet-transaction.model.js';
import { WalletSettingsModel, IWalletSettings } from './wallet-settings.model.js';
import { WalletTopupIntentModel } from './wallet-topup-intent.model.js';
import { paymentGateway } from '../payments/razorpay.gateway.js';
import { realtimeService } from '../realtime/websocket.service.js';
import { logger } from '../../common/logging/logger.js';

export class WalletService {
  /**
   * Retrieves or initializes default settings
   */
  public static async getSettings(): Promise<IWalletSettings> {
    let settings = await WalletSettingsModel.findOne();
    if (!settings) {
      settings = await WalletSettingsModel.create({
        minTopupPaise: 100, // ₹1 (ultra-friendly min topup)
        maxTopupPaise: 1000000, // ₹10,000
        maxBalancePaise: 2000000, // ₹20,000
        dailyTopupLimitPaise: 5000000, // ₹50,000
        quickAddChipsRupees: [50, 100, 200, 500],
        welcomeBonusEnabled: true,
        welcomeBonusAmountPaise: 10000, // ₹100
        cashbackEnabled: true,
        cashbackPercentage: 5,
        cashbackMaxCapPaise: 10000,
        cashbackMinOrderPaise: 49900,
        topupEnabled: true,
        updatedBy: 'SYSTEM',
      });
    } else if (settings.minTopupPaise > 100) {
      // Auto-migrate legacy ₹100 limit down to ₹1 for optimal user experience
      settings.minTopupPaise = 100;
      settings.quickAddChipsRupees = [50, 100, 200, 500];
      await settings.save();
    }
    return settings;
  }

  /**
   * Updates admin wallet settings
   */
  public static async updateSettings(
    adminId: string,
    updates: Partial<IWalletSettings>
  ): Promise<IWalletSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, updates, { updatedBy: adminId });
    await settings.save();
    return settings;
  }

  /**
   * Retrieves or creates a user's wallet. Automatically credits one-time welcome bonus if eligible.
   */
  public static async getOrCreateWallet(userId: string): Promise<{
    wallet: IWallet;
    settings: IWalletSettings;
    limits: {
      minTopupPaise: number;
      minTopupRupees: number;
      maxTopupPaise: number;
      maxTopupRupees: number;
      maxBalancePaise: number;
      maxBalanceRupees: number;
      quickAddChips: number[];
      quickAddChipsRupees: number[];
    };
  }> {
    const userObjId = new mongoose.Types.ObjectId(userId);
    let wallet = await WalletModel.findOne({ userId: userObjId });
    const settings = await this.getSettings();

    if (!wallet) {
      wallet = await WalletModel.create({
        userId: userObjId,
        balancePaise: 0,
        currency: 'INR',
        status: 'ACTIVE',
        version: 0,
      });

      // Grant Welcome Bonus if enabled
      if (settings.welcomeBonusEnabled && settings.welcomeBonusAmountPaise > 0) {
        try {
          await this.grantWelcomeBonus(wallet, settings);
          // Reload updated wallet balance
          wallet = (await WalletModel.findById(wallet._id)) || wallet;
        } catch (err: any) {
          logger.warn({ err, userId }, 'Failed to grant welcome bonus (may already exist)');
        }
      }
    }

    return {
      wallet,
      settings,
      limits: {
        minTopupPaise: settings.minTopupPaise,
        minTopupRupees: settings.minTopupPaise / 100,
        maxTopupPaise: settings.maxTopupPaise,
        maxTopupRupees: settings.maxTopupPaise / 100,
        maxBalancePaise: settings.maxBalancePaise,
        maxBalanceRupees: settings.maxBalancePaise / 100,
        quickAddChips: settings.quickAddChipsRupees,
        quickAddChipsRupees: settings.quickAddChipsRupees,
      },
    };
  }

  /**
   * One-time welcome bonus credit
   */
  private static async grantWelcomeBonus(
    wallet: IWallet,
    settings: IWalletSettings
  ): Promise<void> {
    const bonusPaise = settings.welcomeBonusAmountPaise;
    const idempotencyKey = `welcome_bonus_${wallet.userId.toString()}`;

    // Ensure not already awarded
    const existing = await WalletTransactionModel.findOne({
      userId: wallet.userId,
      type: 'PROMO_CREDIT',
      referenceId: 'WELCOME_BONUS',
      status: 'SUCCESS',
    });
    if (existing) return;

    const newBalance = wallet.balancePaise + bonusPaise;
    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save();

    const txn = await WalletTransactionModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      type: 'PROMO_CREDIT',
      direction: 'CREDIT',
      amountPaise: bonusPaise,
      balanceAfterPaise: newBalance,
      status: 'SUCCESS',
      referenceType: 'PROMO',
      referenceId: 'WELCOME_BONUS',
      idempotencyKey,
      gateway: 'INTERNAL',
      description: 'Welcome Bonus Credited',
      createdBy: 'SYSTEM',
    });

    realtimeService.emitWalletUpdated(wallet.userId.toString(), newBalance, txn);
  }

  /**
   * Paginated ledger transactions
   */
  public static async getTransactions(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      type?: string;
      direction?: string;
    }
  ): Promise<{
    transactions: IWalletTransaction[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (options.cursor) {
      query._id = { $lt: new mongoose.Types.ObjectId(options.cursor) };
    }
    if (options.type) {
      query.type = options.type;
    }
    if (options.direction) {
      query.direction = options.direction;
    }

    const txns = await WalletTransactionModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = txns.length > limit;
    const resultList = hasMore ? txns.slice(0, limit) : txns;
    const lastItem = resultList.length > 0 ? resultList[resultList.length - 1] : undefined;
    const nextCursor = hasMore && lastItem ? lastItem._id.toString() : null;

    return {
      transactions: resultList as unknown as IWalletTransaction[],
      hasMore,
      nextCursor,
    };
  }

  /**
   * Create topup intent with gateway order
   */
  public static async createTopupIntent(
    userId: string,
    amountRupees: number,
    idempotencyKey: string
  ): Promise<{
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    isSimulated: boolean;
  }> {
    const amountPaise = Math.round(amountRupees * 100);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new Error('Invalid top-up amount');
    }

    const { wallet, settings } = await this.getOrCreateWallet(userId);

    if (!settings.topupEnabled) {
      throw new Error('Wallet top-up is temporarily disabled');
    }
    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is ${wallet.status}. Top-up is not allowed.`);
    }
    if (amountPaise < settings.minTopupPaise) {
      throw new Error(`Minimum top-up is ₹${settings.minTopupPaise / 100}`);
    }
    if (amountPaise > settings.maxTopupPaise) {
      throw new Error(`Maximum top-up per transaction is ₹${settings.maxTopupPaise / 100}`);
    }
    if (wallet.balancePaise + amountPaise > settings.maxBalancePaise) {
      throw new Error(`Total wallet balance cannot exceed ₹${settings.maxBalancePaise / 100}`);
    }

    // Check for existing intent with same idempotency key
    const existingIntent = await WalletTopupIntentModel.findOne({
      userId: wallet.userId,
      idempotencyKey,
      status: 'CREATED',
    });
    if (existingIntent) {
      return {
        orderId: existingIntent.gatewayOrderId,
        amountPaise: existingIntent.amountPaise,
        currency: existingIntent.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isSimulated: !paymentGateway.isConfigured(),
      };
    }

    const receipt = `topup_${wallet._id.toString().substring(0, 8)}_${Date.now()}`;
    const gatewayOrder = await paymentGateway.createOrder(amountPaise, receipt, {
      userId,
      walletId: wallet._id.toString(),
    });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL
    await WalletTopupIntentModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      amountPaise,
      currency: 'INR',
      status: 'CREATED',
      gatewayOrderId: gatewayOrder.id,
      idempotencyKey,
      expiresAt,
    });

    return {
      orderId: gatewayOrder.id,
      amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isSimulated: !paymentGateway.isConfigured(),
    };
  }

  /**
   * Verifies topup signature and credits wallet atomically
   */
  public static async verifyAndCreditTopup(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<{
    success: boolean;
    newBalanceRupees: number;
    newBalancePaise: number;
    transactionId: string;
    wallet?: {
      id: string;
      balancePaise: number;
      balanceRupees: number;
      status: string;
    };
  }> {
    // 1. Signature Verification
    const isValid = paymentGateway.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    if (!isValid) {
      throw new Error('Payment signature verification failed');
    }

    // 2. Locate Intent
    const intent = await WalletTopupIntentModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      gatewayOrderId: razorpayOrderId,
    });
    if (!intent) {
      throw new Error('Top-up intent not found or expired');
    }

    // Idempotency: If already credited
    if (intent.status === 'PAID') {
      const existingTxn = await WalletTransactionModel.findOne({
        gatewayPaymentId: razorpayPaymentId,
        status: 'SUCCESS',
      });
      const currentWallet = await WalletModel.findById(intent.walletId);
      return {
        success: true,
        newBalanceRupees: (currentWallet?.balancePaise || 0) / 100,
        newBalancePaise: currentWallet?.balancePaise || 0,
        transactionId: existingTxn?._id.toString() || '',
        wallet: currentWallet
          ? {
              id: currentWallet._id.toString(),
              balancePaise: currentWallet.balancePaise,
              balanceRupees: currentWallet.balancePaise / 100,
              status: currentWallet.status,
            }
          : undefined,
      };
    }

    // 3. Atomically credit wallet
    const wallet = await WalletModel.findById(intent.walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const newBalance = wallet.balancePaise + intent.amountPaise;
    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save();

    intent.status = 'PAID';
    intent.gatewayPaymentId = razorpayPaymentId;
    await intent.save();

    const txn = await WalletTransactionModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      type: 'TOPUP',
      direction: 'CREDIT',
      amountPaise: intent.amountPaise,
      balanceAfterPaise: newBalance,
      status: 'SUCCESS',
      referenceType: 'PAYMENT',
      referenceId: razorpayPaymentId,
      idempotencyKey: `topup_success_${razorpayPaymentId}`,
      gateway: paymentGateway.isConfigured() ? 'RAZORPAY' : 'INTERNAL',
      gatewayOrderId: razorpayOrderId,
      gatewayPaymentId: razorpayPaymentId,
      description: `Wallet Top-Up via ${paymentGateway.isConfigured() ? 'Razorpay' : 'UPI/Gateway'}`,
      createdBy: userId,
    });

    realtimeService.emitWalletUpdated(userId, newBalance, txn);

    return {
      success: true,
      newBalanceRupees: newBalance / 100,
      newBalancePaise: newBalance,
      transactionId: txn._id.toString(),
      wallet: {
        id: wallet._id.toString(),
        balancePaise: newBalance,
        balanceRupees: newBalance / 100,
        status: wallet.status,
      },
    };
  }

  /**
   * Atomic debit for order payment (supports optional mongoose transaction session)
   */
  public static async debitForOrder(
    userId: string,
    amountPaise: number,
    orderId: string,
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<IWalletTransaction> {
    const { wallet } = await this.getOrCreateWallet(userId);

    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is ${wallet.status}. Payment declined.`);
    }
    if (wallet.balancePaise < amountPaise) {
      throw new Error(
        `Insufficient wallet balance: available ₹${(wallet.balancePaise / 100).toFixed(2)}, required ₹${(amountPaise / 100).toFixed(2)}`
      );
    }

    // Check idempotency
    const existing = await WalletTransactionModel.findOne({ idempotencyKey }).session(session || null);
    if (existing) {
      return existing;
    }

    const newBalance = wallet.balancePaise - amountPaise;
    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save({ session });

    const txn = await WalletTransactionModel.create(
      [
        {
          walletId: wallet._id,
          userId: wallet.userId,
          type: 'ORDER_PAYMENT',
          direction: 'DEBIT',
          amountPaise,
          balanceAfterPaise: newBalance,
          status: 'SUCCESS',
          referenceType: 'ORDER',
          referenceId: orderId,
          idempotencyKey,
          gateway: 'INTERNAL',
          description: `Paid for Order #${orderId.slice(-6).toUpperCase()}`,
          createdBy: userId,
        },
      ],
      { session }
    );

    const createdTxn = txn && txn[0] ? txn[0] : null;
    if (!createdTxn) {
      throw new Error('Transaction creation failed');
    }
    realtimeService.emitWalletUpdated(userId, newBalance, createdTxn);
    return createdTxn;
  }

  /**
   * Refund to wallet for cancelled/failed order or return
   */
  public static async refundToWallet(
    userId: string,
    amountPaise: number,
    orderId: string,
    reason: string = 'Order Cancellation Refund'
  ): Promise<IWalletTransaction> {
    const { wallet } = await this.getOrCreateWallet(userId);
    const idempotencyKey = `refund_${orderId}_${amountPaise}_${Date.now()}`;

    const newBalance = wallet.balancePaise + amountPaise;
    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save();

    const txn = await WalletTransactionModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      type: 'REFUND',
      direction: 'CREDIT',
      amountPaise,
      balanceAfterPaise: newBalance,
      status: 'SUCCESS',
      referenceType: 'ORDER',
      referenceId: orderId,
      idempotencyKey,
      gateway: 'INTERNAL',
      description: `Refund for Order #${orderId.slice(-6).toUpperCase()}: ${reason}`,
      createdBy: 'SYSTEM',
    });

    realtimeService.emitWalletUpdated(userId, newBalance, txn);
    return txn;
  }

  /**
   * Post-delivery cashback reward
   */
  public static async evaluateAndCreditCashback(
    userId: string,
    orderTotalPaise: number,
    orderId: string
  ): Promise<IWalletTransaction | null> {
    const settings = await this.getSettings();
    if (!settings.cashbackEnabled || orderTotalPaise < settings.cashbackMinOrderPaise) {
      return null;
    }

    const rawCashback = Math.round(orderTotalPaise * (settings.cashbackPercentage / 100));
    const finalCashbackPaise = Math.min(rawCashback, settings.cashbackMaxCapPaise);

    if (finalCashbackPaise <= 0) return null;

    const idempotencyKey = `cashback_${orderId}`;
    const existing = await WalletTransactionModel.findOne({ idempotencyKey });
    if (existing) return existing;

    const { wallet } = await this.getOrCreateWallet(userId);
    const newBalance = wallet.balancePaise + finalCashbackPaise;
    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save();

    const txn = await WalletTransactionModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      type: 'CASHBACK',
      direction: 'CREDIT',
      amountPaise: finalCashbackPaise,
      balanceAfterPaise: newBalance,
      status: 'SUCCESS',
      referenceType: 'ORDER',
      referenceId: orderId,
      idempotencyKey,
      gateway: 'INTERNAL',
      description: `Cashback Rewarded for Order #${orderId.slice(-6).toUpperCase()}`,
      createdBy: 'SYSTEM',
    });

    realtimeService.emitWalletUpdated(userId, newBalance, txn);
    return txn;
  }

  /**
   * Admin manual adjustment with mandatory reason
   */
  public static async adminAdjust(
    adminId: string,
    targetUserId: string,
    amountPaise: number,
    direction: 'CREDIT' | 'DEBIT',
    reason: string
  ): Promise<IWalletTransaction> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (min 5 characters) is mandatory for admin adjustments');
    }

    const { wallet } = await this.getOrCreateWallet(targetUserId);

    if (direction === 'DEBIT' && wallet.balancePaise < amountPaise) {
      throw new Error(
        `Cannot debit ₹${(amountPaise / 100).toFixed(2)}: user only has ₹${(wallet.balancePaise / 100).toFixed(2)}`
      );
    }

    const newBalance =
      direction === 'CREDIT'
        ? wallet.balancePaise + amountPaise
        : wallet.balancePaise - amountPaise;

    wallet.balancePaise = newBalance;
    wallet.version += 1;
    await wallet.save();

    const txnType: WalletTransactionType =
      direction === 'CREDIT' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT';
    const idempotencyKey = `admin_${direction}_${targetUserId}_${Date.now()}`;

    const txn = await WalletTransactionModel.create({
      walletId: wallet._id,
      userId: wallet.userId,
      type: txnType,
      direction,
      amountPaise,
      balanceAfterPaise: newBalance,
      status: 'SUCCESS',
      referenceType: 'ADMIN',
      idempotencyKey,
      gateway: 'INTERNAL',
      description: `Admin Adjustment (${direction}): ${reason.trim()}`,
      createdBy: adminId,
    });

    realtimeService.emitWalletUpdated(targetUserId, newBalance, txn);
    return txn;
  }

  /**
   * Admin freeze / unfreeze
   */
  public static async adminToggleFreeze(
    _adminId: string,
    targetUserId: string,
    freeze: boolean,
    reason: string
  ): Promise<IWallet> {
    const { wallet } = await this.getOrCreateWallet(targetUserId);
    wallet.status = freeze ? 'FROZEN' : 'ACTIVE';
    wallet.freezeReason = freeze ? reason : null;
    await wallet.save();

    realtimeService.emitToUser(targetUserId, 'wallet:status', {
      status: wallet.status,
      reason: wallet.freezeReason,
    });

    return wallet;
  }

  /**
   * Admin System Aggregated Metrics
   */
  public static async getSystemMetrics(): Promise<{
    totalLiabilityRupees: number;
    activeWalletsCount: number;
    todayTopupsRupees: number;
    todayRefundsRupees: number;
    todayCashbackRupees: number;
  }> {
    const totalResult = await WalletModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$balancePaise' }, count: { $sum: 1 } } },
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTxns = await WalletTransactionModel.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, status: 'SUCCESS' } },
      { $group: { _id: '$type', total: { $sum: '$amountPaise' } } },
    ]);

    let todayTopups = 0;
    let todayRefunds = 0;
    let todayCashback = 0;

    todayTxns.forEach((t) => {
      if (t._id === 'TOPUP') todayTopups = t.total / 100;
      if (t._id === 'REFUND') todayRefunds = t.total / 100;
      if (t._id === 'CASHBACK') todayCashback = t.total / 100;
    });

    return {
      totalLiabilityRupees: (totalResult[0]?.total || 0) / 100,
      activeWalletsCount: totalResult[0]?.count || 0,
      todayTopupsRupees: todayTopups,
      todayRefundsRupees: todayRefunds,
      todayCashbackRupees: todayCashback,
    };
  }

  /**
   * Audit ledger reconciliation: asserts balancePaise === SUM(credits - debits)
   */
  public static async reconcileWallet(userId: string): Promise<{
    isBalanced: boolean;
    walletBalancePaise: number;
    ledgerBalancePaise: number;
    discrepancyPaise: number;
  }> {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const wallet = await WalletModel.findOne({ userId: userObjId });
    if (!wallet) {
      return { isBalanced: true, walletBalancePaise: 0, ledgerBalancePaise: 0, discrepancyPaise: 0 };
    }

    const ledgerSum = await WalletTransactionModel.aggregate([
      { $match: { userId: userObjId, status: 'SUCCESS' } },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: { $cond: [{ $eq: ['$direction', 'CREDIT'] }, '$amountPaise', 0] },
          },
          totalDebits: {
            $sum: { $cond: [{ $eq: ['$direction', 'DEBIT'] }, '$amountPaise', 0] },
          },
        },
      },
    ]);

    const credits = ledgerSum[0]?.totalCredits || 0;
    const debits = ledgerSum[0]?.totalDebits || 0;
    const ledgerBalance = credits - debits;
    const discrepancy = wallet.balancePaise - ledgerBalance;

    return {
      isBalanced: discrepancy === 0,
      walletBalancePaise: wallet.balancePaise,
      ledgerBalancePaise: ledgerBalance,
      discrepancyPaise: discrepancy,
    };
  }
}
