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

healthRouter.get('/health/ai-test', async (_req, res) => {
  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
  ];
  const results: Record<string, any> = {};
  for (const m of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] }),
          signal: AbortSignal.timeout(6000),
        }
      );
      const text = await resp.text();
      results[m] = { status: resp.status, ok: resp.ok, text: text.substring(0, 150) };
    } catch (e: any) {
      results[m] = { error: e.message };
    }
  }
  return res.json(results);
});
