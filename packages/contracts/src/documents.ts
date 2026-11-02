/**
 * Document and Ingestion Contracts for Lernivox
 */

export type DocumentProcessingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'READY'
  | 'FAILED';

export interface DocumentDto {
  id: string;
  workspaceId?: string | null;
  workspaceType?: 'PERSONAL' | 'GROUP' | null;
  ownerId: string;
  title: string;
  fileName: string | null;
  mimeType: string;
  sizeBytes: number;
  storageProvider: 'LOCAL' | 'CLOUDINARY' | 'S3';
  visibility: 'PRIVATE' | 'SHARED' | 'COURSE_ONLY';
  status: DocumentProcessingStatus;
  errorCode: string | null;
  errorMessage: string | null;
  pageCount: number | null;
  totalTokens: number | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkDto {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  chapter: string | null;
  sectionTitle: string | null;
  tokenCount: number | null;
  hasEmbedding: boolean;
  createdAt: string;
}

export interface CreatePastedTextDto {
  title: string;
  content: string;
  workspaceType?: 'PERSONAL' | 'GROUP';
}

export interface DocumentUploadResponseDto {
  document: DocumentDto;
  message: string;
}

export interface DocumentOutlineItemDto {
  id: string;
  title: string;
  chapterNumber?: number | null;
  sectionNumber?: number | null;
  pageNumber: number;
  level: number;
  subsections?: DocumentOutlineItemDto[];
}

export interface DocumentOutlineDto {
  documentId: string;
  title: string;
  totalPages: number | null;
  items: DocumentOutlineItemDto[];
}

export interface DocumentReadingProgressDto {
  id: string;
  userId: string;
  documentId: string;
  currentPage: number;
  totalPages: number | null;
  scrollProgress: number | null;
  zoomLevel: number | null;
  lastReadAt: string;
}

export interface UpdateReadingProgressDto {
  currentPage: number;
  totalPages?: number | null;
  scrollProgress?: number | null;
  zoomLevel?: number | null;
}

export interface DocumentBookmarkDto {
  id: string;
  userId: string;
  documentId: string;
  pageNumber: number;
  title: string | null;
  snippet: string | null;
  createdAt: string;
}

export interface CreateBookmarkDto {
  pageNumber: number;
  title?: string | null;
  snippet?: string | null;
}

export interface DocumentReaderPageDto {
  pageNumber: number;
  text: string;
  chapter?: string | null;
  chunkIds: string[];
}

export interface DocumentReaderContentDto {
  documentId: string;
  title: string;
  pageCount: number;
  pages: DocumentReaderPageDto[];
}

