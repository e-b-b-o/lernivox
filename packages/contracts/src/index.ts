/**
 * Shared job and event contract definitions for Lernivox.
 */

export enum QueueName {
  DOCUMENT_INGESTION = 'document-ingestion',
  AI_ORCHESTRATION = 'ai-orchestration',
}

export enum JobType {
  PARSE_DOCUMENT = 'PARSE_DOCUMENT',
  EXTRACT_CHUNKS = 'EXTRACT_CHUNKS',
  GENERATE_EMBEDDINGS = 'GENERATE_EMBEDDINGS',
  GENERATE_SUMMARY = 'GENERATE_SUMMARY',
  GENERATE_QUIZ = 'GENERATE_QUIZ',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface DocumentIngestionJobPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface AiGenerationJobPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  targetType: 'SUMMARY' | 'QUIZ' | 'FLASHCARDS' | 'REVISION_NOTES';
  focusChapter?: string;
  numQuestions?: number;
}

export interface JobExecutionResult<T = unknown> {
  success: boolean;
  jobId: string;
  durationMs: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
