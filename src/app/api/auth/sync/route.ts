import type { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { handleError } from '@/lib/auth/http';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

const VALID_ROLES: Role[] = ['TEACHER', 'STUDENT'];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedRole: Role | undefined =
      body.role && VALID_ROLES.includes(body.role) ? body.role : undefined;

    // roleOnCreate only matters for brand-new users when no explicit role is sent
    const { user: initialUser } = await requireUser(req, {
      roleOnCreate: requestedRole ?? 'STUDENT',
    });

    const data: { name?: string; role?: Role } = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }

    // If the client explicitly sends a role (register / "ser profesor"), apply it
    if (requestedRole) {
      data.role = requestedRole;
    }

    const user =
      Object.keys(data).length > 0
        ? await prisma.user.update({
            where: { id: initialUser.id },
            data,
          })
        : initialUser;

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
