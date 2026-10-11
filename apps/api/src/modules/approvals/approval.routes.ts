import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { approvalController } from './approval.controller.js';

export const approvalRouter = Router();

approvalRouter.get('/pending', authenticate, requireRole('CUSTOMER', 'ADMIN'), (req, res, next) =>
  approvalController.getPendingApproval(req, res).catch(next)
);

approvalRouter.post(
  '/:id/approve',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  (req, res, next) => approvalController.approve(req, res).catch(next)
);

approvalRouter.post(
  '/:id/reject',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  (req, res, next) => approvalController.reject(req, res).catch(next)
);
