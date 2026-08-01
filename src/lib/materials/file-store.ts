import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';

import { getAdminApp } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';

export type SignedUrlOptions = {
  expiresMs?: number;
  inline?: boolean;
  filename?: string;
  contentType?: string;
};

export type FileStore = {
  put: (path: string, data: Buffer, contentType: string) => Promise<void>;
  get: (path: string) => Promise<Buffer>;
  delete: (path: string) => Promise<void>;
  getSignedReadUrl?: (
    path: string,
    options?: number | SignedUrlOptions,
  ) => Promise<string>;
};

function localRoot() {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'data', 'uploads');
}

function createLocalStore(): FileStore {
  const root = localRoot();
  mkdirSync(root, { recursive: true });

  return {
    async put(path, data) {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, data);
    },
    async get(path) {
      return readFileSync(join(root, path));
    },
    async delete(path) {
      const full = join(root, path);
      if (existsSync(full)) unlinkSync(full);
    },
  };
}

function createFirebaseStore(): FileStore {
  getAdminApp();
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || 'ship7-a8c70.firebasestorage.app';
  const bucket = getStorage().bucket(bucketName);

  return {
    async put(path, data, contentType) {
      const file = bucket.file(path);
      await file.save(data, {
        contentType,
        resumable: false,
        metadata: { contentType },
      });
    },
    async get(path) {
      const [buf] = await bucket.file(path).download();
      return buf;
    },
    async delete(path) {
      try {
        await bucket.file(path).delete({ ignoreNotFound: true });
      } catch {
        // ignore
      }
    },
    async getSignedReadUrl(path, options = {}) {
      const opts: SignedUrlOptions =
        typeof options === 'number' ? { expiresMs: options } : options;
      const expiresMs = opts.expiresMs ?? 60 * 60 * 1000;
      const safeName = (opts.filename || 'file').replace(/"/g, '');
      const disposition = opts.inline
        ? `inline; filename="${safeName}"`
        : `attachment; filename="${safeName}"`;

      const [url] = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresMs,
        responseDisposition: disposition,
        ...(opts.contentType ? { responseType: opts.contentType } : {}),
      });
      return url;
    },
  };
}

export function getFileStore(): FileStore {
  const driver = (process.env.UPLOAD_DRIVER || 'firebase').toLowerCase();
  if (driver === 'local') return createLocalStore();
  return createFirebaseStore();
}
