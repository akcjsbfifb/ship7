-- AlterTable
ALTER TABLE "Material" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill positions per topic (oldest first = lower position)
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY "topicId" ORDER BY "createdAt" ASC) - 1)::integer AS pos
  FROM "Material"
)
UPDATE "Material" AS m
SET "position" = ranked.pos
FROM ranked
WHERE m.id = ranked.id;

-- CreateIndex
CREATE INDEX "Material_topicId_position_idx" ON "Material"("topicId", "position");
