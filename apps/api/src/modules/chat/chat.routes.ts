import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validateRequest } from '../../common/middleware/validate.js';
import { chatController } from './chat.controller.js';
import { CreateSessionSchema, SendMessageSchema } from './chat.schema.js';

export const chatRouter = Router();

chatRouter.post(
  '/sessions',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  validateRequest(CreateSessionSchema),
  (req, res, next) => chatController.createSession(req, res).catch(next)
);

chatRouter.get('/sessions', authenticate, requireRole('CUSTOMER', 'ADMIN'), (req, res, next) =>
  chatController.getSessions(req, res).catch(next)
);

chatRouter.get('/sessions/:id', authenticate, requireRole('CUSTOMER', 'ADMIN'), (req, res, next) =>
  chatController.getSession(req, res).catch(next)
);

chatRouter.post(
  '/sessions/:id/messages',
  authenticate,
  requireRole('CUSTOMER', 'ADMIN'),
  validateRequest(SendMessageSchema),
  (req, res, next) => chatController.sendMessage(req, res).catch(next)
);
