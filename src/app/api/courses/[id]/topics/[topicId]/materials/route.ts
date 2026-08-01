import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { processMaterialUpload } from '@/lib/materials/process';

export const maxDuration = 60;

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

    const body = await req.json().catch(() => ({}));
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((id: unknown): id is string => typeof id === 'string')
      : null;

    if (!orderedIds || orderedIds.length === 0) {
      throw new AuthError('orderedIds is required', 400);
    }

    const existing = await prisma.material.findMany({
      where: { topicId, courseId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((m) => m.id));

    if (
      orderedIds.length !== existingIds.size ||
      orderedIds.some((id) => !existingIds.has(id))
    ) {
      throw new AuthError('orderedIds must include every material in the topic', 400);
    }

    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.material.update({
          where: { id },
          data: { position },
        }),
      ),
    );

    const materials = await prisma.material.findMany({
      where: { topicId, courseId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ materials });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
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

    const nextPosition = await prisma.material.count({ where: { topicId } });

    const form = await req.formData();
    const file = form.get('file');
    const titleField = form.get('title');
    const textField = form.get('text');

    // Quick path: paste text as .txt material
    if (typeof textField === 'string' && textField.trim()) {
      const title =
        typeof titleField === 'string' && titleField.trim()
          ? titleField.trim()
          : 'Nota de texto';
      const filename = `${nanoid(6)}.txt`;
      const buffer = Buffer.from(textField, 'utf8');
      const materialId = nanoid();

      const material = await prisma.material.create({
        data: {
          id: materialId,
          topicId,
          courseId,
          title,
          filename,
          mimeType: 'text/plain',
          storagePath: '',
          sizeBytes: buffer.length,
          position: nextPosition,
          status: 'PROCESSING',
        },
      });

      try {
        await processMaterialUpload({
          materialId,
          courseId,
          topicId,
          buffer,
          filename,
          mimeType: 'text/plain',
          title,
        });
      } catch {
        // status already FAILED
      }

      const refreshed = await prisma.material.findUnique({
        where: { id: material.id },
      });
      return NextResponse.json({ material: refreshed });
    }

    if (!(file instanceof File)) {
      throw new AuthError('file or text is required', 400);
    }

    const filename = file.name || `upload-${nanoid(6)}`;
    const mimeType = file.type || 'application/octet-stream';
    const title =
      typeof titleField === 'string' && titleField.trim()
        ? titleField.trim()
        : filename;
    const buffer = Buffer.from(await file.arrayBuffer());
    const materialId = nanoid();

    const material = await prisma.material.create({
      data: {
        id: materialId,
        topicId,
        courseId,
        title,
        filename,
        mimeType,
        storagePath: '',
        sizeBytes: buffer.length,
        position: nextPosition,
        status: 'PROCESSING',
      },
    });

    try {
      await processMaterialUpload({
        materialId,
        courseId,
        topicId,
        buffer,
        filename,
        mimeType,
        title,
      });
    } catch {
      // status already FAILED in processMaterialUpload
    }

    const refreshed = await prisma.material.findUnique({
      where: { id: material.id },
    });
    return NextResponse.json({ material: refreshed });
  } catch (error) {
    return handleError(error);
  }
}
