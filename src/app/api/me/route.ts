import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  try {
    const { user: authUser } = await requireUser(req);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [owned, enrollments] = await Promise.all([
      prisma.course.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: { course: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      user,
      owned,
      enrolled: enrollments.map((e) => e.course),
    });
  } catch (error) {
    return handleError(error);
  }
}
