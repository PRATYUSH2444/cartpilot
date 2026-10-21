import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const INSECURE_DEV_JWT_ACCESS = 'dev_jwt_access_secret_32_characters_long_key!';
const INSECURE_DEV_JWT_REFRESH = 'dev_jwt_refresh_secret_32_characters_long_key!';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cartpilot_dev'),

    JWT_ACCESS_SECRET: z.string().min(16).default(INSECURE_DEV_JWT_ACCESS),
    JWT_REFRESH_SECRET: z.string().min(16).default(INSECURE_DEV_JWT_REFRESH),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
    RAZORPAY_KEY_SECRET: z.string().default('rzp_test_secret_placeholder'),
    RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_test_webhook_placeholder'),

    AI_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().optional(),
    AI_TIMEOUT_MS: z.coerce.number().default(15000),

    RESERVATION_SWEEPER_INTERVAL_MS: z.coerce.number().default(60000),
    FEATURE_EMAIL_VERIFICATION: z.coerce.boolean().default(false),
    USE_IN_MEMORY_DB: z.coerce.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_ACCESS_SECRET === INSECURE_DEV_JWT_ACCESS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'JWT_ACCESS_SECRET must be explicitly set to a cryptographically secure random value in production',
          path: ['JWT_ACCESS_SECRET'],
        });
      }
      if (data.JWT_REFRESH_SECRET === INSECURE_DEV_JWT_REFRESH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'JWT_REFRESH_SECRET must be explicitly set to a cryptographically secure random value in production',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
      if (data.MONGODB_URI.includes('127.0.0.1:27017/cartpilot_dev')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MONGODB_URI must point to a production database cluster in production',
          path: ['MONGODB_URI'],
        });
      }
      if (data.AI_PROVIDER === 'mock') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'AI_PROVIDER cannot be set to "mock" in production. A real LLM provider must be configured.',
          path: ['AI_PROVIDER'],
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid environment variable configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  isProduction: parsedEnv.data.NODE_ENV === 'production',
};
export type EnvConfig = typeof env;
