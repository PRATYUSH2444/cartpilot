import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cartpilot_dev'),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_32_characters_long_key!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_32_characters_long_key!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_secret_placeholder'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_test_webhook_placeholder'),

  AI_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid environment variable configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
export type EnvConfig = typeof env;
