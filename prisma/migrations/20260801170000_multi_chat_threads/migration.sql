-- DropIndex
DROP INDEX IF EXISTS "ChatThread_courseId_userId_key";

-- CreateIndex
CREATE INDEX "ChatThread_courseId_userId_idx" ON "ChatThread"("courseId", "userId");
