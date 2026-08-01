import { NextResponse } from 'next/server';

import { generateInviteCode } from '@/lib/auth/invite-code';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireUser(req);
    const { id } = await params;

    await requireCourseAccess(user, id, { teacherOnly: true });

    const course = await prisma.course.update({
      where: { id },
      data: { inviteCode: generateInviteCode() },
    });

    return NextResponse.json({ course });
  } catch (error) {
    return handleError(error);
  }
}
