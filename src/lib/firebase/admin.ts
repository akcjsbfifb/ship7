import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    join(process.cwd(), 'firebase-service-account.json');
  if (existsSync(credPath)) {
    const sa = JSON.parse(readFileSync(credPath, 'utf8'));
    return initializeApp({
      credential: cert(sa),
    });
  }

  throw new Error('Firebase Admin is not configured');
}

export function getAdminApp() {
  return initAdmin();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
