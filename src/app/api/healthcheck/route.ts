import { NextResponse } from 'next/server';

import { healthCheck } from '@/lib/db/pg';

/**
 * Liveness by default (no DB) so Coolify/Docker don't mark the app
 * unhealthy when Postgres briefly restarts.
 * Use ?db=1 for a readiness probe that checks the database.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const checkDb = url.searchParams.get('db') === '1';

  if (!checkDb) {
    return NextResponse.json({ ok: true, status: 'alive' });
  }

  try {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Database is not healthy' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, status: 'ready' });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Database healthcheck failed:', {
      code: err.code,
      message: err.message,
    });

    const errorMessage =
      err.code === 'ECONNREFUSED'
        ? 'Unable to connect to database'
        : 'Failed to check database';

    return NextResponse.json({ error: errorMessage }, { status: 503 });
  }
}
