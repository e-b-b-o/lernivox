-- AlterTable
ALTER TABLE "workspace_invitations" ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3);

