import { Pool, PoolClient, QueryResult } from 'pg';

const useSsl = process.env.PGSSL === 'true' || process.env.PGSSL === 'require';

// Creates a global connection pool (reads PG* env vars by default)
const pool = new Pool(
  useSsl
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : undefined
);

// Better type for query params
export type QueryParams =
  | string
  | number
  | boolean
  | null
  | undefined
  | Buffer
  | Date
  | QueryParams[];

// Generic query function with better typing
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: QueryParams[] = []
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get client with automatic release on error
export async function withClient<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function end(): Promise<void> {
  await pool.end();
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
