import type { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

const VALID_ROLES: Role[] = ['TEACHER', 'STUDENT'];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roleOnCreate =
      body.role && VALID_ROLES.includes(body.role) ? body.role : 'STUDENT';

    const { user: initialUser } = await requireUser(req, { roleOnCreate });

    let user = initialUser;

    if (typeof body.name === 'string' && body.name.trim()) {
      user = await prisma.user.update({
        where: { id: initialUser.id },
        data: { name: body.name.trim() },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
