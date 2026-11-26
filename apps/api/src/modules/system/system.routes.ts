import { Router } from 'express';
import { getIntegrations, testIntegration, updateConfig, getHomeContent } from './system.controller.js';
import { authenticate, authorize } from '../../common/middleware/auth.js';
import { env } from '../../config/env.config.js';

export const systemRouter = Router();

// Public system content endpoints
systemRouter.get('/home-content', getHomeContent);

// In development/test, permit authenticated shoppers and merchants to test & configure AI keys
// In production, strictly enforce Super Admin RBAC on all system & integration management endpoints
systemRouter.use(authenticate);
if (env.NODE_ENV === 'production') {
  systemRouter.use(authorize('ADMIN'));
}

systemRouter.get('/integrations', getIntegrations);
systemRouter.post('/integrations/test', testIntegration);
systemRouter.post('/integrations/config', updateConfig);
