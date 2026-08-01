import type { Material } from '@prisma/client';

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

export async function resolveMaterialDownloadUrl(
  material: Pick<Material, 'status' | 'storagePath' | 'mimeType' | 'filename'>,
): Promise<string | null> {
  if (material.status !== 'READY' || !material.storagePath) return null;

  const store = getFileStore();
  if (!store.getSignedReadUrl) return null;

  try {
    return await store.getSignedReadUrl(material.storagePath, {
      expiresMs: 60 * 60 * 1000,
      inline: isInlineMime(material.mimeType, material.filename),
      filename: material.filename,
      contentType: material.mimeType,
    });
  } catch {
    return null;
  }
}

export async function withDownloadUrls<T extends Material>(
  materials: T[],
): Promise<Array<T & { downloadUrl: string | null }>> {
  return Promise.all(
    materials.map(async (m) => ({
      ...m,
      downloadUrl: await resolveMaterialDownloadUrl(m),
    })),
  );
}
