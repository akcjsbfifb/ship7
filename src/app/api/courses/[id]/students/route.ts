import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await context.params;

    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      students: enrollments.map((e) => ({
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        joinedAt: e.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
