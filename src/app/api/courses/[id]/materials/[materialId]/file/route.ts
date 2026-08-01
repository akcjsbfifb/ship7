import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { getFileStore } from '@/lib/materials/file-store';

function isInlineMime(mimeType: string, filename: string) {
  const lower = mimeType.toLowerCase();
  const name = filename.toLowerCase();
  return (
    lower.includes('pdf') ||
    name.endsWith('.pdf') ||
    lower.startsWith('text/') ||
    lower.startsWith('image/')
  );
}

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
    if (!material.storagePath) {
      throw new AuthError('File not available', 404);
    }

    const course = await requireCourseAccess(user, courseId);
    const isTeacher = course.teacherId === user.id;
    if (!isTeacher && material.status !== 'READY') {
      throw new AuthError('Material not available', 404);
    }

    const store = getFileStore();
    const buffer = await store.get(material.storagePath);
    const inline = isInlineMime(material.mimeType, material.filename);
    const safeName = material.filename.replace(/"/g, '');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': material.mimeType || 'application/octet-stream',
        'Content-Length': String(buffer.length),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
