import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { deleteMaterialFully } from '@/lib/materials/process';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId, topicId } = await params;
    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const topic = await prisma.courseTopic.findFirst({
      where: { id: topicId, courseId },
    });
    if (!topic) throw new AuthError('Topic not found', 404);

    const body = await req.json();
    const data: { title?: string; description?: string | null; position?: number } =
      {};
    if (typeof body.title === 'string' && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (body.description === null || typeof body.description === 'string') {
      data.description =
        typeof body.description === 'string' ? body.description.trim() : null;
    }
    if (typeof body.position === 'number') data.position = body.position;

    const updated = await prisma.courseTopic.update({
      where: { id: topicId },
      data,
    });

    return NextResponse.json({ topic: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId, topicId } = await params;
    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const topic = await prisma.courseTopic.findFirst({
      where: { id: topicId, courseId },
      include: { materials: true },
    });
    if (!topic) throw new AuthError('Topic not found', 404);

    for (const material of topic.materials) {
      await deleteMaterialFully(material.id);
    }

    await prisma.courseTopic.delete({ where: { id: topicId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
