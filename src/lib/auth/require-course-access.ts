import type { Course, User } from '@prisma/client';

import { AuthError } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/client';

export type RequireCourseAccessOptions = {
  teacherOnly?: boolean;
};

export async function requireCourseAccess(
  user: User,
  courseId: string,
  options?: RequireCourseAccessOptions,
): Promise<Course> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AuthError('Course not found', 404);
  }

  const isTeacher = course.teacherId === user.id;

  if (options?.teacherOnly) {
    if (!isTeacher) {
      throw new AuthError('Teacher access required', 403);
    }
    return course;
  }

  if (isTeacher) {
    return course;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: user.id,
      },
    },
  });

  if (!enrollment) {
    throw new AuthError('Course access denied', 403);
  }

  return course;
}
