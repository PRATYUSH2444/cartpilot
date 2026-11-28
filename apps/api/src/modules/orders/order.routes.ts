import { Router } from 'express';
import { requireAuth, requireRole, requireOrderFulfillmentPermission } from '../../common/middleware/auth.js';
import { OrderController } from './order.controller.js';

export const orderRouter = Router();

// ==========================================
// 1. PUBLIC TOKEN-GATED FIELD RUN SHEET
// (No login required for on-the-road runners)
// ==========================================
orderRouter.get('/public/field-run/:token', OrderController.getFieldRun);
orderRouter.post('/public/field-run/:token/collect', OrderController.collectFieldRun);

// ==========================================
// 2. AUTHENTICATED ENDPOINTS
// ==========================================
orderRouter.use(requireAuth);

// ------------------------------------------
// Dark-Store Admin Fulfilment Console Endpoints
// ------------------------------------------
orderRouter.get('/admin/today-board', requireRole('ADMIN'), OrderController.getTodayBoard);
orderRouter.get('/admin/procurement', requireRole('ADMIN'), OrderController.getProcurement);
orderRouter.get('/admin/packing', requireRole('ADMIN'), OrderController.getPackingChecklist);
orderRouter.get('/admin/delivery', requireRole('ADMIN'), OrderController.getDeliveryManifest);
orderRouter.post('/admin/generate-lots', requireRole('ADMIN'), OrderController.generateLots);
orderRouter.post('/:id/fulfilment-stage', requireRole('ADMIN'), OrderController.advanceFulfilmentStage);

// ------------------------------------------
// Merchant Lots & Pickup Endpoints
// ------------------------------------------
orderRouter.get('/merchant/lots', requireRole('MERCHANT', 'ADMIN'), OrderController.getMerchantLots);
orderRouter.patch('/merchant/lots/:lotId', requireOrderFulfillmentPermission, OrderController.updateLotStatus);

// ------------------------------------------
// Standard Order CRUD & Proof
// ------------------------------------------
// GET /api/v1/orders
orderRouter.get('/', OrderController.listOrders);

// GET /api/v1/orders/:id
orderRouter.get('/:id', OrderController.getOrderById);

// GET /api/v1/orders/:id/proof (Cryptographic Proof Bundle)
orderRouter.get('/:id/proof', OrderController.getOrderProof);

// POST /api/v1/orders/:id/proof/verify (Tamper-Evident Verification)
orderRouter.post('/:id/proof/verify', OrderController.verifyOrderProof);

// ------------------------------------------
// Order Lifecycle & Acceptance Endpoints
// ------------------------------------------
orderRouter.post(
  '/:id/accept',
  requireOrderFulfillmentPermission,
  OrderController.acceptOrder
);

orderRouter.post(
  '/:id/reject',
  requireOrderFulfillmentPermission,
  OrderController.rejectOrder
);

// Fulfillment Progression
orderRouter.post(
  '/:id/advance-status',
  requireOrderFulfillmentPermission,
  OrderController.simulateStep
);

orderRouter.post(
  '/:id/simulate-step',
  requireOrderFulfillmentPermission,
  OrderController.simulateStep
);

orderRouter.patch(
  '/:id/status',
  requireOrderFulfillmentPermission,
  OrderController.updateStatus
);
