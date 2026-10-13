import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.js';
import { OrderController } from './order.controller.js';

export const orderRouter = Router();

// All order endpoints require authentication
orderRouter.use(requireAuth);

// GET /api/v1/orders
orderRouter.get('/', OrderController.listOrders);

// GET /api/v1/orders/:id
orderRouter.get('/:id', OrderController.getOrderById);

// GET /api/v1/orders/:id/proof (Cryptographic Proof Bundle)
orderRouter.get('/:id/proof', OrderController.getOrderProof);

// POST /api/v1/orders/:id/proof/verify (Tamper-Evident Verification)
orderRouter.post('/:id/proof/verify', OrderController.verifyOrderProof);

// POST /api/v1/orders/:id/simulate-step (Demo & Verification)
orderRouter.post('/:id/simulate-step', OrderController.simulateStep);
