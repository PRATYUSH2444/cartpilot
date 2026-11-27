import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { WalletService } from './wallet.service.js';
import { paymentGateway } from '../payments/razorpay.gateway.js';
import { logger } from '../../common/logging/logger.js';

export class WalletController {
  /**
   * GET /api/v1/wallet
   */
  public static async getWallet(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await WalletService.getOrCreateWallet(userId);

      res.status(200).json({
        success: true,
        data: {
          balancePaise: data.wallet.balancePaise,
          balanceRupees: data.wallet.balancePaise / 100,
          currency: data.wallet.currency,
          status: data.wallet.status,
          limits: data.limits,
          quickAddChips: data.limits.quickAddChips,
          welcomeBonusEnabled: data.settings.welcomeBonusEnabled,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/wallet/transactions
   */
  public static async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { limit, cursor, type, direction } = req.query;

      const result = await WalletService.getTransactions(userId, {
        limit: limit ? Number(limit) : undefined,
        cursor: typeof cursor === 'string' ? cursor : undefined,
        type: typeof type === 'string' ? type : undefined,
        direction: typeof direction === 'string' ? direction : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.transactions.map((t) => ({
          id: t._id,
          type: t.type,
          direction: t.direction,
          amountPaise: t.amountPaise,
          amountRupees: t.amountPaise / 100,
          balanceAfterPaise: t.balanceAfterPaise,
          balanceAfterRupees: t.balanceAfterPaise / 100,
          status: t.status,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          description: t.description,
          createdAt: t.createdAt,
        })),
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/wallet/topup/intent
   */
  public static async createTopupIntent(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const rawRupees = req.body.amountRupees ?? req.body.amount;
      const rawPaise = req.body.amountPaise;

      let amountRupees: number;
      if (rawRupees !== undefined && rawRupees !== null && !isNaN(Number(rawRupees))) {
        amountRupees = Number(rawRupees);
      } else if (rawPaise !== undefined && rawPaise !== null && !isNaN(Number(rawPaise))) {
        amountRupees = Number(rawPaise) / 100;
      } else {
        res.status(400).json({
          success: false,
          error: { message: 'A positive numeric amount is required' },
        });
        return;
      }

      if (amountRupees <= 0) {
        res.status(400).json({
          success: false,
          error: { message: 'A positive numeric amount is required' },
        });
        return;
      }

      const idempotencyKey =
        (req.headers['idempotency-key'] as string) ||
        req.body.idempotencyKey ||
        `intent_${userId}_${amountRupees}_${Date.now()}`;

      const intent = await WalletService.createTopupIntent(
        userId,
        amountRupees,
        idempotencyKey
      );

      res.status(200).json({
        success: true,
        data: {
          ...intent,
          intent: {
            id: intent.orderId,
            orderId: intent.orderId,
            amountPaise: intent.amountPaise,
          },
          razorpay: {
            orderId: intent.orderId,
            amountPaise: intent.amountPaise,
            currency: intent.currency,
            keyId: intent.keyId,
          },
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to initialize topup intent' },
      });
    }
  }

  /**
   * POST /api/v1/wallet/topup/verify
   */
  public static async verifyTopup(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const razorpay_order_id =
        req.body.razorpay_order_id ||
        req.body.razorpayOrderId ||
        req.body.orderId ||
        req.body.intentId;
      const razorpay_payment_id =
        req.body.razorpay_payment_id ||
        req.body.razorpayPaymentId ||
        req.body.paymentId;
      const razorpay_signature =
        req.body.razorpay_signature ||
        req.body.razorpaySignature ||
        req.body.signature;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({
          success: false,
          error: { message: 'Missing payment signature verification details' },
        });
        return;
      }

      const result = await WalletService.verifyAndCreditTopup(
        userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Payment verification failed' },
      });
    }
  }

  /**
   * POST /api/v1/wallet/webhook/razorpay
   */
  public static async handleRazorpayWebhook(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      if (signature && paymentGateway.verifyWebhookSignature(rawBody, signature)) {
        const event = req.body.event;
        const payload = req.body.payload;

        logger.info({ event }, 'Received verified Razorpay webhook');

        if (event === 'payment.captured') {
          const payment = payload?.payment?.entity;
          const orderId = payment?.order_id;
          const paymentId = payment?.id;
          const notes = payment?.notes || {};

          if (orderId && paymentId && notes.userId) {
            try {
              await WalletService.verifyAndCreditTopup(
                notes.userId,
                orderId,
                paymentId,
                signature
              );
            } catch (e) {
              logger.debug({ e }, 'Webhook payment already credited or handled');
            }
          }
        }
      }
      res.status(200).json({ status: 'ok' });
    } catch (err) {
      logger.error({ err }, 'Error processing Razorpay webhook');
      res.status(200).json({ status: 'ignored' });
    }
  }

  /**
   * GET /api/v1/wallet/reconcile
   */
  public static async reconcile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const report = await WalletService.reconcileWallet(userId);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/wallet/admin/metrics
   */
  public static async adminGetMetrics(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metrics = await WalletService.getSystemMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/wallet/admin/settings
   */
  public static async adminGetSettings(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await WalletService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/wallet/admin/settings
   */
  public static async adminUpdateSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const settings = await WalletService.updateSettings(adminId, req.body);
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/wallet/admin/adjust
   */
  public static async adminAdjustWallet(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { targetUserId, amountRupees, direction, reason } = req.body;

      if (!targetUserId || !amountRupees || !direction || !reason) {
        res.status(400).json({
          success: false,
          error: { message: 'targetUserId, amountRupees, direction, and reason are required' },
        });
        return;
      }

      const amountPaise = Math.round(Number(amountRupees) * 100);
      const txn = await WalletService.adminAdjust(
        adminId,
        targetUserId,
        amountPaise,
        direction,
        reason
      );

      res.status(200).json({
        success: true,
        data: txn,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to adjust wallet balance' },
      });
    }
  }

  /**
   * POST /api/v1/wallet/admin/freeze
   */
  public static async adminToggleFreeze(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { targetUserId, freeze, reason } = req.body;

      const wallet = await WalletService.adminToggleFreeze(
        adminId,
        targetUserId,
        Boolean(freeze),
        reason || 'Administrative action'
      );

      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to freeze/unfreeze wallet' },
      });
    }
  }
}
