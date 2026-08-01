import type { User } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { AuthError } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/client';
import { getAdminAuth } from '@/lib/firebase/admin';

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export type RequireUserResult = {
  user: User;
  decodedToken: DecodedIdToken;
};

export async function requireUser(req: Request): Promise<RequireUserResult> {
  const token = getBearerToken(req);
  if (!token) {
    throw new AuthError('Missing or invalid Authorization header', 401);
  }

  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }

  const email = decodedToken.email?.trim().toLowerCase();
  if (!email) {
    throw new AuthError('Token is missing email', 401);
  }

  const name = decodedToken.name?.trim() || null;
  const photoUrl =
    typeof decodedToken.picture === 'string' && decodedToken.picture.trim()
      ? decodedToken.picture.trim()
      : null;

  const existing = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid },
  });

  const user = existing
    ? await prisma.user.update({
        where: { firebaseUid: decodedToken.uid },
        data: {
          email,
          ...(name ? { name } : {}),
          ...(photoUrl ? { photoUrl } : {}),
        },
      })
    : await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email,
          name,
          photoUrl,
        },
      });

  return { user, decodedToken };
}
