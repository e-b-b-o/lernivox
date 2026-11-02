-- CreateTable
CREATE TABLE "workspace_invitations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_discussion_messages" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "chapter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_discussion_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_conversation_snapshots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_conversation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_tokenHash_key" ON "workspace_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "workspace_invitations_workspaceId_idx" ON "workspace_invitations"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_invitations_tokenHash_idx" ON "workspace_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations"("email");

-- CreateIndex
CREATE INDEX "workspace_discussion_messages_workspaceId_createdAt_idx" ON "workspace_discussion_messages"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "workspace_discussion_messages_userId_idx" ON "workspace_discussion_messages"("userId");

-- CreateIndex
CREATE INDEX "shared_conversation_snapshots_workspaceId_createdAt_idx" ON "shared_conversation_snapshots"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "shared_conversation_snapshots_conversationId_idx" ON "shared_conversation_snapshots"("conversationId");

-- CreateIndex
CREATE INDEX "shared_conversation_snapshots_sharedById_idx" ON "shared_conversation_snapshots"("sharedById");

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_discussion_messages" ADD CONSTRAINT "workspace_discussion_messages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_discussion_messages" ADD CONSTRAINT "workspace_discussion_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_conversation_snapshots" ADD CONSTRAINT "shared_conversation_snapshots_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_conversation_snapshots" ADD CONSTRAINT "shared_conversation_snapshots_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_conversation_snapshots" ADD CONSTRAINT "shared_conversation_snapshots_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database-Level Invariant: Prevent GROUP -> PERSONAL Workspace Downgrade
CREATE OR REPLACE FUNCTION prevent_group_workspace_downgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'GROUP' AND NEW.type = 'PERSONAL' THEN
    RAISE EXCEPTION 'A GROUP workspace can never be converted back into a PERSONAL workspace.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_group_workspace_downgrade ON workspaces;
CREATE TRIGGER trigger_prevent_group_workspace_downgrade
BEFORE UPDATE OF type ON workspaces
FOR EACH ROW
EXECUTE FUNCTION prevent_group_workspace_downgrade();
