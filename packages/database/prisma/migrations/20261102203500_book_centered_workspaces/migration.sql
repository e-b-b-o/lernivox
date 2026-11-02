-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('PERSONAL', 'GROUP');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "type" "WorkspaceType" NOT NULL DEFAULT 'PERSONAL';

-- CreateIndex
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable conversations
ALTER TABLE "conversations" ADD COLUMN "workspaceId" TEXT;

-- CreateIndex
CREATE INDEX "conversations_workspaceId_idx" ON "conversations"("workspaceId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Safe, Idempotent Backfill:
-- For each document without a workspace:
-- 1. Create a PERSONAL workspace with ownerId = documents.ownerId
-- 2. Add owner to workspace_members with role = 'OWNER'
-- 3. Update document with workspaceId
-- 4. Update conversations associated with that document to have workspaceId
DO $$
DECLARE
    doc RECORD;
    new_ws_id TEXT;
    new_member_id TEXT;
BEGIN
    FOR doc IN 
        SELECT id, title, "ownerId", "createdAt" 
        FROM "documents" 
        WHERE "workspaceId" IS NULL AND "ownerId" IS NOT NULL 
    LOOP
        new_ws_id := gen_random_uuid()::text;
        new_member_id := gen_random_uuid()::text;

        -- Create workspace
        INSERT INTO "workspaces" ("id", "name", "type", "ownerId", "createdAt", "updatedAt")
        VALUES (new_ws_id, doc.title, 'PERSONAL', doc."ownerId", doc."createdAt", CURRENT_TIMESTAMP);

        -- Add owner to workspace_members
        INSERT INTO "workspace_members" ("id", "workspaceId", "userId", "role", "joinedAt")
        VALUES (new_member_id, new_ws_id, doc."ownerId", 'OWNER', doc."createdAt");

        -- Update document
        UPDATE "documents" SET "workspaceId" = new_ws_id WHERE id = doc.id;

        -- Update conversations for this document
        UPDATE "conversations" SET "workspaceId" = new_ws_id WHERE "documentId" = doc.id;
    END LOOP;
END $$;

-- CreateIndex (Unique index on documents.workspaceId to enforce 1-to-1 relationship)
CREATE UNIQUE INDEX "documents_workspaceId_key" ON "documents"("workspaceId");
