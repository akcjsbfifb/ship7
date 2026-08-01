-- AlterTable
ALTER TABLE "Course" ADD COLUMN "tutorInstructions" TEXT;
ALTER TABLE "Course" ADD COLUMN "tutorPresetKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
