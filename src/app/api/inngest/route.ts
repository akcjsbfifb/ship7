import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  embedText,
  embedTextWithMetadata,
  embedBatchTexts,
} from '@/inngest/functions/embedding';
import { retrieveSimilar } from '@/inngest/functions/retrieval';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    embedText,
    embedTextWithMetadata,
    embedBatchTexts,
    retrieveSimilar,
  ],
});
