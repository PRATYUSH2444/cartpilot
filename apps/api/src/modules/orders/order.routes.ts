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

// POST /api/v1/orders/:id/simulate-step (Demo & Verification)
orderRouter.post('/:id/simulate-step', OrderController.simulateStep);
