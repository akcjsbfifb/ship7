import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import {
  filterValidPresetKeys,
  TUTOR_PRESETS,
} from '@/lib/tutor/presets';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await context.params;

    const course = await requireCourseAccess(user, courseId, {
      teacherOnly: true,
    });

    return NextResponse.json({
      tutorInstructions: course.tutorInstructions ?? '',
      tutorPresetKeys: course.tutorPresetKeys ?? [],
      presets: TUTOR_PRESETS.map(({ key, label, description }) => ({
        key,
        label,
        description,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await context.params;

    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const body = await req.json().catch(() => ({}));

    const data: {
      tutorInstructions?: string | null;
      tutorPresetKeys?: string[];
    } = {};

    if ('tutorInstructions' in body) {
      if (body.tutorInstructions === null || body.tutorInstructions === '') {
        data.tutorInstructions = null;
      } else if (typeof body.tutorInstructions === 'string') {
        data.tutorInstructions = body.tutorInstructions.trim() || null;
      } else {
        throw new AuthError('tutorInstructions must be a string', 400);
      }
    }

    if ('tutorPresetKeys' in body) {
      if (!Array.isArray(body.tutorPresetKeys)) {
        throw new AuthError('tutorPresetKeys must be an array', 400);
      }
      data.tutorPresetKeys = filterValidPresetKeys(body.tutorPresetKeys);
    }

    if (Object.keys(data).length === 0) {
      throw new AuthError(
        'Provide tutorInstructions and/or tutorPresetKeys',
        400,
      );
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
    });

    return NextResponse.json({
      tutorInstructions: course.tutorInstructions ?? '',
      tutorPresetKeys: course.tutorPresetKeys ?? [],
    });
  } catch (error) {
    return handleError(error);
  }
}
