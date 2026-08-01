import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';

export function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
