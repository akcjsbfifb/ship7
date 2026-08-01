import { createOpenAI } from '@ai-sdk/openai';

/**
 * OpenAI-compatible client pointed at Vercel AI Gateway.
 * Auth: AI_GATEWAY_API_KEY (local/Docker) or VERCEL_OIDC_TOKEN (on Vercel).
 */
export const gateway = createOpenAI({
  apiKey:
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

/** Chat model via Gateway (billed to Vercel credit). */
export const chatModel = gateway('openai/gpt-4o-mini');

/** Embedding model via Gateway (1536 dims → matches documents.embedding). */
export const embeddingModel = gateway.embedding(
  'openai/text-embedding-3-small'
);
