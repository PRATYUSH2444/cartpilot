import { Router } from 'express';
import { requireAuth, requireRole } from '../../common/middleware/auth.js';
import { WalletController } from './wallet.controller.js';

export const walletRouter = Router();

// Shopper routes
walletRouter.get('/', requireAuth, WalletController.getWallet);
walletRouter.get('/transactions', requireAuth, WalletController.getTransactions);
walletRouter.post('/topup/intent', requireAuth, WalletController.createTopupIntent);
walletRouter.post('/topup/verify', requireAuth, WalletController.verifyTopup);
walletRouter.get('/reconcile', requireAuth, WalletController.reconcile);

// Razorpay Webhook (unauthenticated, signature-verified inside controller)
walletRouter.post('/webhook/razorpay', WalletController.handleRazorpayWebhook);

// Admin routes
walletRouter.get('/admin/metrics', requireAuth, requireRole('ADMIN'), WalletController.adminGetMetrics);
walletRouter.get('/admin/settings', requireAuth, requireRole('ADMIN'), WalletController.adminGetSettings);
walletRouter.put('/admin/settings', requireAuth, requireRole('ADMIN'), WalletController.adminUpdateSettings);
walletRouter.post('/admin/adjust', requireAuth, requireRole('ADMIN'), WalletController.adminAdjustWallet);
walletRouter.post('/admin/freeze', requireAuth, requireRole('ADMIN'), WalletController.adminToggleFreeze);
