import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { resolveMaterialDownloadUrl } from '@/lib/materials/download-url';
import { deleteMaterialFully } from '@/lib/materials/process';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId, materialId } = await params;

    const material = await prisma.material.findFirst({
      where: { id: materialId, courseId },
    });
    if (!material) throw new AuthError('Material not found', 404);

    await requireCourseAccess(user, courseId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    const isTeacher = course?.teacherId === user.id;

    if (!isTeacher && material.status !== 'READY') {
      throw new AuthError('Material not available', 404);
    }

    const downloadUrl = await resolveMaterialDownloadUrl(material);
    return NextResponse.json({ material: { ...material, downloadUrl } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id: courseId, materialId } = await params;

    const material = await prisma.material.findFirst({
      where: { id: materialId, courseId },
    });
    if (!material) throw new AuthError('Material not found', 404);

    await requireCourseAccess(user, courseId, { teacherOnly: true });
    await deleteMaterialFully(materialId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
