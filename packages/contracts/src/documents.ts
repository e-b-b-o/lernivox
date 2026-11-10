/**
 * Document and Ingestion Contracts for Lernivox
 */

export const MAX_UPLOAD_SIZE_BYTES = 1048576; // 1 MiB (1,048,576 bytes)
export const MAX_UPLOAD_SIZE_LABEL = '1 MB';
export const UPLOAD_SIZE_ERROR_MESSAGE =
  'This file is larger than the 1 MB upload limit. Choose a smaller file.';

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
  processingProgress?: number | null;
  processingStage?: string | null;
  processingMessage?: string | null;
  completedUnits?: number | null;
  totalUnits?: number | null;
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

export interface DocumentStatusDto {
  documentId: string;
  status: DocumentProcessingStatus;
  progress: number;
  stage: string;
  message: string;
  completedUnits?: number | null;
  totalUnits?: number | null;
  isComplete: boolean;
  isFailed: boolean;
  errorCode?: string | null;
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

