import { Router } from 'express';
import { getIntegrations, testIntegration, updateConfig } from './system.controller.js';
import { authenticate, authorize } from '../../common/middleware/auth.js';

export const systemRouter = Router();

// Strictly enforce Admin RBAC on all system & integration management endpoints
systemRouter.use(authenticate, authorize('ADMIN'));

systemRouter.get('/integrations', getIntegrations);
systemRouter.post('/integrations/test', testIntegration);
systemRouter.post('/integrations/config', updateConfig);
