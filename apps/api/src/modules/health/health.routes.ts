import { Router } from 'express';
import { getLiveness, getReadiness } from './health.controller.js';
import { env } from '../../config/env.config.js';

export const healthRouter = Router();

healthRouter.get('/health', getLiveness);
healthRouter.get('/ready', getReadiness);
healthRouter.get('/health/ai-models', async (_req, res) => {
  try {
    if (!env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'GEMINI_API_KEY not set' });
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
    const data = await r.json() as any;
    const modelNames = data.models ? data.models.map((m: any) => m.name.replace('models/', '')) : data;
    return res.json({ success: true, count: modelNames.length, models: modelNames });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
