import { documentsVectorDB } from '@/lib/db/vector';
import { DB_CONFIG } from '@/lib/db/config';

export async function searchSimilarChunks(
  query: string,
  courseId: string,
  limit = 5
) {
  return documentsVectorDB.searchSimilar(query, { courseId, limit });
}

export async function searchWithOptions(
  query: string,
  courseId: string,
  options?: {
    limit?: number;
    distance?: typeof DB_CONFIG.embedding.distance;
    filter?: {
      chunkingMethod?: typeof DB_CONFIG.chunking.defaultMethod;
      date?: string;
      [key: string]: unknown;
    };
  }
) {
  return documentsVectorDB.searchSimilar(query, { courseId, ...options });
}

export async function searchByMetadata(
  query: string,
  courseId: string,
  metadata: {
    chunkingMethod?: typeof DB_CONFIG.chunking.defaultMethod;
    date?: string;
    [key: string]: unknown;
  },
  limit = 5
) {
  return documentsVectorDB.searchSimilar(query, {
    courseId,
    limit,
    filter: metadata,
  });
}
