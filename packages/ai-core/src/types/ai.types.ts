export interface ChunkMetadata {
  documentId: string;
  chapter?: string;
  pageNumber?: number;
  sectionTitle?: string;
  chunkIndex: number;
  tokenCount?: number;
}

export interface TextChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export interface CompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: CompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
}

export interface CompletionResponse {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  finishReason?: string;
}

export interface GroundedCitation {
  sourceDocumentId: string;
  pageNumber?: number;
  chapter?: string;
  quoteSnippet: string;
}

export interface TutorResponse {
  answer: string;
  citations: GroundedCitation[];
  confidenceScore?: number;
}
