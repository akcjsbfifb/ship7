import { NextResponse } from 'next/server';

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

    const materials = [];
    const topicsWithUrls = [];
    for (const topic of topics) {
      const withUrls = await withDownloadUrls(topic.materials);
      topicsWithUrls.push({
        ...topic,
        materials: withUrls,
      });
      for (const m of withUrls) {
        materials.push({
          ...m,
          topicTitle: topic.title,
        });
      }
    }

    return NextResponse.json({
      topics: topicsWithUrls,
      materials,
      isTeacher,
    });
  } catch (error) {
    return handleError(error);
  }
}
