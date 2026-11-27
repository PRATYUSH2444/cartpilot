import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import { supportRateLimiter } from '../../common/middleware/rate-limiter.js';
import { createSupportTicket, getMySupportTickets } from './support.controller.js';

export const supportRouter = Router();

supportRouter.post('/', authenticate, supportRateLimiter, createSupportTicket);
supportRouter.get('/my-tickets', authenticate, getMySupportTickets);
