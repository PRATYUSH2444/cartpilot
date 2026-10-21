import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { auditController } from './audit.controller.js';

export const auditRouter = Router();

// Chain verification can be queried by any authenticated role to inspect zero-tampering proof
auditRouter.get(
  '/verify',
  authenticate,
  requireRole('CUSTOMER', 'MERCHANT', 'ADMIN'),
  (req, res, next) => auditController.verifyChain(req, res).catch(next)
);

// Detailed event log listing - restricted to ADMIN to prevent customer & merchant data exposure
auditRouter.get('/events', authenticate, requireRole('ADMIN'), (req, res, next) =>
  auditController.getEvents(req, res).catch(next)
);
