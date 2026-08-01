import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { getFileStore } from '@/lib/materials/file-store';

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
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const store = getFileStore();
    const materials = [];
    for (const topic of topics) {
      for (const m of topic.materials) {
        let downloadUrl: string | null = null;
        if (m.status === 'READY' && m.storagePath && store.getSignedReadUrl) {
          try {
            downloadUrl = await store.getSignedReadUrl(m.storagePath);
          } catch {
            downloadUrl = null;
          }
        }
        materials.push({
          ...m,
          topicTitle: topic.title,
          downloadUrl,
        });
      }
    }

    return NextResponse.json({ topics, materials, isTeacher });
  } catch (error) {
    return handleError(error);
  }
}
