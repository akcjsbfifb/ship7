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

    const threads = await prisma.chatThread.findMany({
      where: { courseId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      threads: threads.map((t) => ({
        id: t.id,
        user: t.user,
        updatedAt: t.updatedAt,
        messageCount: t._count.messages,
        lastMessage: t.messages[0] ?? null,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
