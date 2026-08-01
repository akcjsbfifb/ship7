// src/lib/env.mjs
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'preview', 'production'])
      .default('development'),
    POSTGRES_URL: z.string().url().optional(),
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
