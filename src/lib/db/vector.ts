import { query } from './pg';
import { embed, embedMany } from 'ai';
import { embeddingModel } from '@/lib/ai';

import {
  DB_CONFIG,
  ChunkMetadata,
  VectorTableConfig,
  VectorDBConfig,
} from './config';

type ChunkingMethod = 'sentence' | 'paragraph' | 'fixed';

interface VectorDBConfigType {
  embedding: {
    model: string;
    dimensions: number;
    distance: 'cosine' | 'euclidean' | 'inner_product';
  };
  chunking: {
    defaultMethod: ChunkingMethod;
    fixedSize: number;
  };
  search: {
    defaultLimit: number;
    reranking: boolean;
  };
}

export class VectorDB {
  private embeddingModel = embeddingModel;
  private tableConfig: VectorTableConfig;
  private config: VectorDBConfigType;

  constructor(tableConfig: VectorTableConfig, config?: VectorDBConfig) {
    this.tableConfig = tableConfig;
    this.config = {
      embedding: {
        ...DB_CONFIG.embedding,
        ...config?.embedding,
      },
      chunking: {
        ...DB_CONFIG.chunking,
        ...config?.chunking,
      },
      search: {
        ...DB_CONFIG.search,
        ...config?.search,
      },
    };
  }

  /**
   * Adds chunks to the database with their embeddings, scoped to a courseId.
   */
  async addChunks(
    chunks: string[],
    options: {
      courseId: string;
      metadata?: Partial<ChunkMetadata>;
    }
  ) {
    try {
      const { embeddings } = await embedMany({
        model: this.embeddingModel,
        values: chunks,
      });

      const columns = this.tableConfig.columns;
      const baseMetadata: ChunkMetadata = {
        date: new Date().toISOString(),
        embeddingModel: this.config.embedding.model,
        chunkingMethod: this.config.chunking.defaultMethod,
        chunkIndex: 0,
        totalChunks: chunks.length,
        ...options.metadata,
      };

      for (let i = 0; i < chunks.length; i++) {
        await query(
          `INSERT INTO "${this.tableConfig.tableName}" (
            "${columns.courseId}",
            "${columns.content}",
            "${columns.vector}",
            "${columns.metadata}",
            "${columns.updatedAt}"
          )
          VALUES ($1, $2, $3::vector, $4, NOW())`,
          [
            options.courseId,
            chunks[i],
            JSON.stringify(embeddings[i]),
            JSON.stringify({ ...baseMetadata, chunkIndex: i }),
          ]
        );
      }

      return { count: chunks.length };
    } catch (error) {
      console.error('Error in addChunks:', error);
      throw error;
    }
  }

  /**
   * Searches for similar chunks within a course (multi-tenant isolation).
   */
  async searchSimilar(
    searchQuery: string,
    options: {
      courseId: string;
      limit?: number;
      distance?: typeof DB_CONFIG.embedding.distance;
      filter?: Record<string, unknown>;
      select?: string[];
    }
  ) {
    const { embedding } = await embed({
      model: this.embeddingModel,
      value: searchQuery,
    });

    const distanceOp = {
      cosine: '<=>',
      euclidean: '<->',
      inner_product: '<#>',
    }[options?.distance || this.config.embedding.distance];

    const columns = this.tableConfig.columns;
    const selectColumns =
      options?.select?.map((col) => `"${col}"`) ||
      [columns.content, columns.metadata, columns.courseId, columns.createdAt]
        .filter(Boolean)
        .map((col) => `"${col}"`);

    const params: unknown[] = [
      JSON.stringify(embedding),
      options.courseId,
      options?.limit || this.config.search.defaultLimit,
    ];

    let filterClause = `WHERE "${columns.courseId}" = $2`;
    if (options?.filter && columns.metadata) {
      for (const [key, value] of Object.entries(options.filter)) {
        params.push(String(value));
        filterClause += ` AND "${columns.metadata}"->>'${key}' = $${params.length}`;
      }
    }

    const { rows } = await query(
      `SELECT
        ${selectColumns.join(', ')},
        "${columns.vector}" ${distanceOp} $1::vector AS distance
      FROM "${this.tableConfig.tableName}"
      ${filterClause}
      ORDER BY distance ASC
      LIMIT $3`,
      params as never[]
    );

    return rows;
  }

  /**
   * Merge tiny fragments so vector search gets meaningful passages
   * (PDFs via markitdown often produce hundreds of 1-line "paragraphs").
   */
  private mergeSmallChunks(chunks: string[], minChars = 280): string[] {
    const merged: string[] = [];
    let buf = '';
    for (const raw of chunks) {
      const c = raw.trim();
      if (!c) continue;
      buf = buf ? `${buf}\n\n${c}` : c;
      if (buf.length >= minChars) {
        merged.push(buf);
        buf = '';
      }
    }
    if (buf.trim()) merged.push(buf.trim());
    return merged;
  }

  /**
   * Utility function to chunk text
   */
  chunkText(
    text: string,
    method = this.config.chunking.defaultMethod
  ): string[] {
    let chunks: string[] = [];
    switch (method) {
      case 'sentence':
        chunks = text
          .trim()
          .split('.')
          .filter(Boolean)
          .map((s) => s.trim());
        break;
      case 'paragraph':
        chunks = text
          .trim()
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p) => p.trim());
        break;
      case 'fixed': {
        const words = text.split(/\s+/).filter(Boolean);
        let currentChunk = '';

        for (const word of words) {
          if (
            currentChunk.length + word.length + 1 >
            this.config.chunking.fixedSize
          ) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = word;
          } else {
            currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
          }
        }
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        break;
      }
      default:
        return [];
    }
    return this.mergeSmallChunks(chunks);
  }

  /**
   * Adds text by first chunking it, scoped to a courseId.
   */
  async addText(
    text: string,
    options: {
      courseId: string;
      chunkingMethod?: ChunkingMethod;
      metadata?: Partial<ChunkMetadata>;
    }
  ) {
    const chunks = this.chunkText(text, options?.chunkingMethod);
    return this.addChunks(chunks, {
      courseId: options.courseId,
      metadata: {
        ...options?.metadata,
        sourceText: text.slice(0, 100) + '...',
        chunkingMethod:
          options?.chunkingMethod || this.config.chunking.defaultMethod,
      },
    });
  }

  async select(
    options: {
      courseId?: string;
      limit?: number;
      orderBy?: string;
      order?: 'ASC' | 'DESC';
    } = {}
  ) {
    const limit = options.limit || 10;
    const orderBy = options.orderBy
      ? `ORDER BY ${options.orderBy} ${options.order || 'ASC'}`
      : '';

    const columns = this.tableConfig.columns;
    const params: unknown[] = [limit];
    let whereClause = '';

    if (options.courseId && columns.courseId) {
      params.unshift(options.courseId);
      whereClause = `WHERE "${columns.courseId}" = $1`;
    }

    const limitParam = `$${params.length}`;

    const { rows } = await query(
      `SELECT ${Object.values(columns)
        .filter(Boolean)
        .map((col) => `"${col}"`)
        .join(', ')}
      FROM "${this.tableConfig.tableName}"
      ${whereClause}
      ${orderBy}
      LIMIT ${limitParam}`,
      params as never[]
    );

    return rows;
  }
}

/** Default vector store for course-scoped documents. */
export const documentsVectorDB = new VectorDB({
  tableName: 'documents',
  columns: {
    id: 'id',
    vector: 'embedding',
    content: 'content',
    metadata: 'metadata',
    courseId: 'courseId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});
