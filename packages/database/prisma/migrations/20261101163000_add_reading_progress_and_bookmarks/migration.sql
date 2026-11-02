-- CreateTable
CREATE TABLE "document_reading_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER,
    "scrollProgress" DOUBLE PRECISION DEFAULT 0,
    "zoomLevel" DOUBLE PRECISION DEFAULT 1.0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_reading_progress_userId_idx" ON "document_reading_progress"("userId");

-- CreateIndex
CREATE INDEX "document_reading_progress_documentId_idx" ON "document_reading_progress"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_reading_progress_userId_documentId_key" ON "document_reading_progress"("userId", "documentId");

-- CreateIndex
CREATE INDEX "document_bookmarks_userId_documentId_idx" ON "document_bookmarks"("userId", "documentId");

-- CreateIndex
CREATE INDEX "document_bookmarks_documentId_idx" ON "document_bookmarks"("documentId");

-- AddForeignKey
ALTER TABLE "document_reading_progress" ADD CONSTRAINT "document_reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reading_progress" ADD CONSTRAINT "document_reading_progress_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bookmarks" ADD CONSTRAINT "document_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bookmarks" ADD CONSTRAINT "document_bookmarks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
