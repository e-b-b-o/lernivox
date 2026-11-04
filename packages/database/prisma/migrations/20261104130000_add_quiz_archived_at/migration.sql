-- AlterTable: add archivedAt to quizzes for historical attempt preservation and soft-deletion
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- Create index on archivedAt for fast active-quiz queries
CREATE INDEX IF NOT EXISTS "quizzes_archivedAt_idx" ON "quizzes"("archivedAt");

