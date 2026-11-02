-- AlterTable: add workspaceId and rangeScope to quizzes
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "rangeScope" JSONB;

-- Add index and foreign key on quizzes.workspaceId
CREATE INDEX IF NOT EXISTS "quizzes_workspaceId_idx" ON "quizzes"("workspaceId");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_workspaceId_fkey'
  ) THEN
    ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable flashcard_decks
CREATE TABLE IF NOT EXISTS "flashcard_decks" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceRange" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable flashcard_items
CREATE TABLE IF NOT EXISTS "flashcard_items" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "sourceChunkId" TEXT,
    "pageNumber" INTEGER,
    "chapter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_flashcard_reviews
CREATE TABLE IF NOT EXISTS "user_flashcard_reviews" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repetition" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "lastRating" INTEGER,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_flashcard_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "flashcard_decks_workspaceId_idx" ON "flashcard_decks"("workspaceId");
CREATE INDEX IF NOT EXISTS "flashcard_decks_documentId_idx" ON "flashcard_decks"("documentId");
CREATE INDEX IF NOT EXISTS "flashcard_decks_createdById_idx" ON "flashcard_decks"("createdById");

CREATE INDEX IF NOT EXISTS "flashcard_items_deckId_idx" ON "flashcard_items"("deckId");
CREATE INDEX IF NOT EXISTS "flashcard_items_sourceChunkId_idx" ON "flashcard_items"("sourceChunkId");

CREATE UNIQUE INDEX IF NOT EXISTS "user_flashcard_reviews_userId_cardId_key" ON "user_flashcard_reviews"("userId", "cardId");
CREATE INDEX IF NOT EXISTS "user_flashcard_reviews_userId_nextReviewAt_idx" ON "user_flashcard_reviews"("userId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "user_flashcard_reviews_cardId_idx" ON "user_flashcard_reviews"("cardId");

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flashcard_decks_workspaceId_fkey') THEN
    ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flashcard_decks_documentId_fkey') THEN
    ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flashcard_decks_createdById_fkey') THEN
    ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flashcard_items_deckId_fkey') THEN
    ALTER TABLE "flashcard_items" ADD CONSTRAINT "flashcard_items_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flashcard_items_sourceChunkId_fkey') THEN
    ALTER TABLE "flashcard_items" ADD CONSTRAINT "flashcard_items_sourceChunkId_fkey" FOREIGN KEY ("sourceChunkId") REFERENCES "document_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_flashcard_reviews_cardId_fkey') THEN
    ALTER TABLE "user_flashcard_reviews" ADD CONSTRAINT "user_flashcard_reviews_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "flashcard_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_flashcard_reviews_userId_fkey') THEN
    ALTER TABLE "user_flashcard_reviews" ADD CONSTRAINT "user_flashcard_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
