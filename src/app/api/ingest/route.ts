import { documentsVectorDB } from '@/lib/db/vector';
import { DB_CONFIG } from '@/lib/db/config';
import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);

    const {
      text,
      courseId,
      chunkingMethod = DB_CONFIG.chunking.defaultMethod,
      metadata = {},
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const result = await documentsVectorDB.addText(text, {
      courseId,
      chunkingMethod,
      metadata,
    });

    return NextResponse.json({
      success: true,
      courseId,
      chunks: result.count,
    });
  } catch (error) {
    return handleError(error);
  }
}
