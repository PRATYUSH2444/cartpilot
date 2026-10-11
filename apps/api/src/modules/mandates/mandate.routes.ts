import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateRequest } from '../../common/middleware/validate.js';
import { mandateController } from './mandate.controller.js';
import { UpdateMandateSchema } from './mandate.schema.js';

export const mandateRouter = Router();

mandateRouter.get('/', authenticate, requireRole('CUSTOMER', 'ADMIN'), (req, res, next) =>
  mandateController.getMandate(req, res).catch(next)
);

mandateRouter.put(
  '/',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  validateRequest(UpdateMandateSchema),
  (req, res, next) => mandateController.updateMandate(req, res).catch(next)
);
