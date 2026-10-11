import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { policyController } from './policy.controller.js';

export const policyRouter = Router();

policyRouter.get('/evaluate', authenticate, requireRole('CUSTOMER', 'ADMIN'), (req, res, next) =>
  policyController.evaluate(req, res).catch(next)
);
