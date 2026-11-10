-- CreateTable
CREATE TABLE IF NOT EXISTS "workspace_discussion_read_cursors" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_discussion_read_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_discussion_read_cursors_workspaceId_userId_key" ON "workspace_discussion_read_cursors"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workspace_discussion_read_cursors_workspaceId_idx" ON "workspace_discussion_read_cursors"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workspace_discussion_read_cursors_userId_idx" ON "workspace_discussion_read_cursors"("userId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_discussion_read_cursors_workspaceId_fkey'
  ) THEN
    ALTER TABLE "workspace_discussion_read_cursors" ADD CONSTRAINT "workspace_discussion_read_cursors_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspace_discussion_read_cursors_userId_fkey'
  ) THEN
    ALTER TABLE "workspace_discussion_read_cursors" ADD CONSTRAINT "workspace_discussion_read_cursors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

