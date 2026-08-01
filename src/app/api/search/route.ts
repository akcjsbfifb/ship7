import { searchSimilarChunks } from '@/lib/actions/search';
import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);

    const { query, courseId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    await requireCourseAccess(user, courseId);

    const results = await searchSimilarChunks(query, courseId);
    return NextResponse.json({ results });
  } catch (error) {
    return handleError(error);
  }
}
