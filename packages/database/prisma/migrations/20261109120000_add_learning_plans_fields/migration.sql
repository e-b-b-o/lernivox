-- AlterTable study_plans
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "documentId" TEXT;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "goal" TEXT;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "adaptationHistory" JSONB;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "estimatedDurationWeeks" INTEGER;
ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "offerDismissed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable study_schedule_items
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "sessionNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "activities" JSONB;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "sourcePageStart" INTEGER;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "sourcePageEnd" INTEGER;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "sourceChapter" TEXT;
ALTER TABLE "study_schedule_items" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study_plans_workspaceId_idx" ON "study_plans"("workspaceId");
CREATE INDEX IF NOT EXISTS "study_plans_documentId_idx" ON "study_plans"("documentId");
CREATE INDEX IF NOT EXISTS "study_plans_userId_workspaceId_idx" ON "study_plans"("userId", "workspaceId");
CREATE INDEX IF NOT EXISTS "study_schedule_items_studyPlanId_orderIndex_idx" ON "study_schedule_items"("studyPlanId", "orderIndex");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_plans_workspaceId_fkey'
  ) THEN
    ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_plans_documentId_fkey'
  ) THEN
    ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

