import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);

    const body = await req.json();
    const inviteCode =
      typeof body.inviteCode === 'string' ? body.inviteCode.trim() : '';

    if (!inviteCode) {
      return NextResponse.json({ error: 'inviteCode is required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { inviteCode },
    });

    if (!course) {
      throw new AuthError('Course not found', 404);
    }

    if (course.teacherId === user.id) {
      throw new AuthError('You are already the teacher of this course', 400);
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: user.id,
        },
      },
      create: {
        courseId: course.id,
        userId: user.id,
      },
      update: {},
    });

    return NextResponse.json({ enrollment, course });
  } catch (error) {
    return handleError(error);
  }
}
