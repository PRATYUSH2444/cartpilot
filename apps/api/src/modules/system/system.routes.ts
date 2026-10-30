import { Router } from 'express';
import { getIntegrations, testIntegration, updateConfig } from './system.controller.js';

export const systemRouter = Router();

systemRouter.get('/integrations', getIntegrations);
systemRouter.post('/integrations/test', testIntegration);
systemRouter.post('/integrations/config', updateConfig);
