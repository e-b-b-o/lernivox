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
}

export interface DocumentUploadResponseDto {
  document: DocumentDto;
  message: string;
}
