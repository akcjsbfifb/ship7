import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({
      students: enrollments.map((e) => ({
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        role: e.user.role,
        joinedAt: e.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
