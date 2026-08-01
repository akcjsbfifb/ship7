import { inngest } from '../client';
import { searchSimilarChunks } from '@/lib/actions/search';

export const retrieveSimilar = inngest.createFunction(
  { name: 'Retrieve Similar', id: 'retrieve/similar' },
  { event: 'retrieve/similar' },
  async ({ event, step }) => {
    const { query, courseId, limit = 5 } = event.data;

    if (!courseId) {
      throw new Error('courseId is required for multi-tenant isolation');
    }

    const results = await step.run('Search Similar', () =>
      searchSimilarChunks(query, courseId, limit)
    );

    return {
      results,
      courseId,
      success: true,
    };
  }
);
