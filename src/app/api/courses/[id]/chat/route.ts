import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

async function getOrCreateThread(courseId: string, userId: string) {
  return prisma.chatThread.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId },
    update: {},
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    await requireCourseAccess(user, courseId);

    const thread = await getOrCreateThread(courseId, user.id);
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

/** Append a message manually (backup); primary persistence is in /api/chat onFinish */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    await requireCourseAccess(user, courseId);

    const body = await req.json();
    const role = body.role === 'assistant' ? 'assistant' : 'user';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) throw new AuthError('content is required', 400);

    const thread = await getOrCreateThread(courseId, user.id);
    const message = await prisma.chatMessage.create({
      data: { threadId: thread.id, role, content },
    });
    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    return handleError(error);
  }
}
