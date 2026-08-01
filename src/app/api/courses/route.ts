import { NextResponse } from 'next/server';

import { AuthError } from '@/lib/auth/errors';
import { generateInviteCode } from '@/lib/auth/invite-code';
import { handleError } from '@/lib/auth/http';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);

    if (user.role !== 'TEACHER') {
      throw new AuthError('Teacher access required', 403);
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const description =
      typeof body.description === 'string' ? body.description.trim() : undefined;

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        inviteCode: generateInviteCode(),
        teacherId: user.id,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await requireUser(req);

    const [owned, enrollments] = await Promise.all([
      prisma.course.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: { course: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const enrolled = enrollments.map((e) => e.course);

    return NextResponse.json({ owned, enrolled });
  } catch (error) {
    return handleError(error);
  }
}
