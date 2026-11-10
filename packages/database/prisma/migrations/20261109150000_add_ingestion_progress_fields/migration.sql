-- AlterTable documents
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "processingProgress" INTEGER DEFAULT 0;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "processingStage" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "processingMessage" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "completedUnits" INTEGER;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "totalUnits" INTEGER;

