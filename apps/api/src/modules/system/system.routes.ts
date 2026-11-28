import { Router } from 'express';
import {
  getIntegrations,
  testIntegration,
  testSmsIntegration,
  updateConfig,
  getHomeContent,
} from './system.controller.js';
import { authenticate, authorize } from '../../common/middleware/auth.js';

export const systemRouter = Router();

// Public system content endpoints
systemRouter.get('/home-content', getHomeContent);

// System integration endpoints require authentication and Master Admin authorization
systemRouter.use(authenticate);
systemRouter.use(authorize('ADMIN'));

systemRouter.get('/integrations', getIntegrations);
systemRouter.post('/integrations/test', testIntegration);
systemRouter.post('/integrations/test-sms', testSmsIntegration);
systemRouter.post('/integrations/config', updateConfig);
