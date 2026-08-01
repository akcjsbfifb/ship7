import { documentsVectorDB } from '@/lib/db/vector';
import { extractTextFromFile } from '@/lib/materials/extract';
import { getFileStore } from '@/lib/materials/file-store';
import { prisma } from '@/lib/db/client';
import { query } from '@/lib/db/pg';

export async function processMaterialUpload(opts: {
  materialId: string;
  courseId: string;
  topicId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  title: string;
}) {
  const { materialId, courseId, topicId, buffer, filename, mimeType, title } =
    opts;
  const store = getFileStore();
  const storagePath = `courses/${courseId}/topics/${topicId}/${materialId}/${filename}`;

  await store.put(storagePath, buffer, mimeType);

  await prisma.material.update({
    where: { id: materialId },
    data: { storagePath, sizeBytes: buffer.length },
  });

  try {
    const text = await extractTextFromFile({ buffer, filename, mimeType });
    if (!text.trim()) {
      throw new Error('El archivo no tiene texto extraíble');
    }

    await documentsVectorDB.addText(text, {
      courseId,
      // Fixed-size + merge avoids thousands of useless 1-line PDF chunks
      chunkingMethod: 'fixed',
      metadata: {
        materialId,
        topicId,
        filename,
        title,
        source: 'material_upload',
      },
    });

    await prisma.material.update({
      where: { id: materialId },
      data: {
        status: 'READY',
        extractedMd: text.slice(0, 50_000),
        errorMessage: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    await prisma.material.update({
      where: { id: materialId },
      data: { status: 'FAILED', errorMessage: message.slice(0, 500) },
    });
    throw err;
  }
}

export async function reindexMaterial(materialId: string) {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) throw new Error('Material not found');

  await query(
    `DELETE FROM documents WHERE metadata->>'materialId' = $1`,
    [materialId],
  );

  const store = getFileStore();
  const buffer = await store.get(material.storagePath);
  const text = await extractTextFromFile({
    buffer,
    filename: material.filename,
    mimeType: material.mimeType,
  });
  if (!text.trim()) {
    throw new Error('El archivo no tiene texto extraíble');
  }

  await documentsVectorDB.addText(text, {
    courseId: material.courseId,
    chunkingMethod: 'fixed',
    metadata: {
      materialId: material.id,
      topicId: material.topicId,
      filename: material.filename,
      title: material.title,
      source: 'material_reindex',
    },
  });

  await prisma.material.update({
    where: { id: materialId },
    data: {
      status: 'READY',
      extractedMd: text.slice(0, 50_000),
      errorMessage: null,
    },
  });
}

export async function deleteMaterialFully(materialId: string) {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) return;

  const store = getFileStore();
  await store.delete(material.storagePath);

  await query(
    `DELETE FROM documents WHERE metadata->>'materialId' = $1`,
    [materialId],
  );

  await prisma.material.delete({ where: { id: materialId } });
}
