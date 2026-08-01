import { inngest } from '../client';
import { documentsVectorDB as vectorDB } from '@/lib/db/vector';
import { ChunkMetadata, DB_CONFIG } from '@/lib/db/config';

export const embedText = inngest.createFunction(
  { name: 'Embed Text', id: 'embed/text' },
  { event: 'embed/text' },
  async ({ event, step }) => {
    const { text, courseId, chunkingMethod } = event.data;

    if (!courseId) {
      throw new Error('courseId is required for multi-tenant isolation');
    }

    const result = await step.run('Add Text', () =>
      vectorDB.addText(text, { courseId, chunkingMethod })
    );

    return {
      numChunks: result.count,
      courseId,
      success: true,
    };
  }
);

export const embedTextWithMetadata = inngest.createFunction(
  { name: 'Embed Text with Metadata', id: 'embed/text-with-metadata' },
  { event: 'embed/text-with-metadata' },
  async ({ event, step }) => {
    const {
      text,
      courseId,
      chunkingMethod = DB_CONFIG.chunking.defaultMethod,
      metadata = {},
    } = event.data;

    if (!courseId) {
      throw new Error('courseId is required for multi-tenant isolation');
    }

    const customMetadata: Partial<ChunkMetadata> = {
      ...metadata,
      chunkingMethod,
    };

    const result = await step.run('Add Text with Metadata', () =>
      vectorDB.addText(text, {
        courseId,
        chunkingMethod,
        metadata: customMetadata,
      })
    );

    return {
      numChunks: result.count,
      courseId,
      metadata: customMetadata,
      success: true,
    };
  }
);

export const embedBatchTexts = inngest.createFunction(
  { name: 'Embed Batch Texts', id: 'embed/batch-texts' },
  { event: 'embed/batch-texts' },
  async ({ event, step }) => {
    const { texts, courseId, chunkingMethod, metadata = {} } = event.data;

    if (!courseId) {
      throw new Error('courseId is required for multi-tenant isolation');
    }

    const results = await step.run('Process Batch', async () => {
      const promises = texts.map((text: string) =>
        vectorDB.addText(text, {
          courseId,
          chunkingMethod,
          metadata: {
            ...metadata,
            batchId: event.id,
            processedAt: new Date().toISOString(),
          },
        })
      );

      return Promise.all(promises);
    });

    return {
      totalProcessed: results.reduce((acc, r) => acc + r.count, 0),
      courseId,
      batchId: event.id,
      success: true,
    };
  }
);
