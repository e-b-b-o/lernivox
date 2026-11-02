-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "documentId" TEXT;

-- AlterTable
ALTER TABLE "conversation_messages" ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE INDEX "conversations_documentId_idx" ON "conversations"("documentId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
