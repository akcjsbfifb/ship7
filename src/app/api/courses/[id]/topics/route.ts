import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { withDownloadUrls } from '@/lib/materials/download-url';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    const course = await requireCourseAccess(user, courseId);
    const isTeacher = course.teacherId === user.id;

    const topics = await prisma.courseTopic.findMany({
      where: { courseId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        materials: {
          where: isTeacher ? undefined : { status: 'READY' },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    const topicsWithUrls = await Promise.all(
      topics.map(async (topic) => ({
        ...topic,
        materials: await withDownloadUrls(topic.materials),
      })),
    );

    return NextResponse.json({ topics: topicsWithUrls, isTeacher });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId } = await params;
    await requireCourseAccess(user, courseId, { teacherOnly: true });

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      throw new AuthError('title is required', 400);
    }

    const count = await prisma.courseTopic.count({ where: { courseId } });
    const topic = await prisma.courseTopic.create({
      data: {
        courseId,
        title,
        description:
          typeof body.description === 'string' ? body.description.trim() : null,
        position: count,
      },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    return handleError(error);
  }
}
