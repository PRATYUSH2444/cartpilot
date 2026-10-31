import { Router } from 'express';
import {
  listMerchants,
  getMerchant,
  getMerchantProducts,
  applyMerchant,
  getMyStore,
  updateMyStore,
  inviteStaff,
  acceptStaffInvite,
  listStaff,
  revokeStaff,
  adminListMerchants,
  adminUpdateMerchantStatus,
  addMyProduct,
  updateMyProduct,
  adjustMyProductStock,
  archiveMyProduct,
} from './merchant.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { authRateLimiter } from '../../common/middleware/rate-limiter.js';
import {
  applyMerchantSchema,
  inviteStaffSchema,
  acceptStaffInviteSchema,
  merchantStatusActionSchema,
} from '../auth/auth.schema.js';

export const merchantRouter = Router();

// Public Discovery & Application
merchantRouter.get('/', listMerchants);
merchantRouter.post('/apply', authRateLimiter, validate(applyMerchantSchema), applyMerchant);
merchantRouter.post('/staff/accept-invite', authRateLimiter, validate(acceptStaffInviteSchema), acceptStaffInvite);

// Merchant Store & Staff Operations
merchantRouter.get('/my-store', authenticate, requireRole('MERCHANT'), getMyStore);
merchantRouter.patch('/my-store', authenticate, requireRole('MERCHANT'), updateMyStore);
merchantRouter.get('/staff', authenticate, requireRole('MERCHANT'), listStaff);
merchantRouter.post(
  '/staff/invite',
  authenticate,
  requireRole('MERCHANT'),
  validate(inviteStaffSchema),
  inviteStaff
);
merchantRouter.delete('/staff/:staffUserId', authenticate, requireRole('MERCHANT'), revokeStaff);

// Merchant Product & Inventory Management (Tenant Isolated)
merchantRouter.post('/my-store/products', authenticate, requireRole('MERCHANT'), addMyProduct);
merchantRouter.patch('/my-store/products/:productId', authenticate, requireRole('MERCHANT'), updateMyProduct);
merchantRouter.patch('/my-store/products/:productId/stock', authenticate, requireRole('MERCHANT'), adjustMyProductStock);
merchantRouter.delete('/my-store/products/:productId', authenticate, requireRole('MERCHANT'), archiveMyProduct);

// Public individual store & catalog inspection
merchantRouter.get('/:id', getMerchant);
merchantRouter.get('/:id/products', getMerchantProducts);

// Admin Governance over Merchants
merchantRouter.get('/admin/all', authenticate, requireRole('ADMIN'), adminListMerchants);
merchantRouter.post(
  '/admin/:id/status/:action',
  authenticate,
  requireRole('ADMIN'),
  validate(merchantStatusActionSchema),
  adminUpdateMerchantStatus
);
