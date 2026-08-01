import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

async function getOwnThread(courseId: string, userId: string, threadId: string) {
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, courseId, userId },
  });
  if (!thread) throw new AuthError('Thread not found', 404);
  return thread;
}

/** Load messages for a specific conversation (must own it). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    await requireCourseAccess(user, courseId);

    const url = new URL(req.url);
    const threadId = url.searchParams.get('threadId');
    if (!threadId) throw new AuthError('threadId is required', 400);

    const thread = await getOwnThread(courseId, user.id, threadId);
    const messages = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      thread,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
