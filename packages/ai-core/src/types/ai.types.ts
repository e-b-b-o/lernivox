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

export interface RetrievedPassage {
  sourceId: string; // e.g. "S1", "S2"
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber?: number | null;
  chapter?: string | null;
  sectionTitle?: string | null;
  similarity: number;
}

export interface StructuredLearningSections {
  learningObjective?: string;
  simpleExplanation?: string;
  textbookMethod?: string;
  workedExample?: string;
  understandingCheck?: string;
  recap?: string;
}

export interface TutorPromptContext {
  documentTitle: string;
  studentQuestion: string;
  recentHistory: CompletionMessage[];
  retrievedPassages: RetrievedPassage[];
  allowGeneralKnowledge?: boolean;
}

export interface GroundedCitation {
  sourceId: string; // e.g. "S1"
  chunkId: string;
  documentId: string;
  quoteSnippet: string;
  pageNumber?: number | null;
  chapter?: string | null;
  relevanceScore?: number | null;
}

export interface TutorGroundedResult {
  content: string;
  structuredSections?: StructuredLearningSections;
  citations: GroundedCitation[];
  isUnsupportedQuestion: boolean;
  confidenceScore?: number;
}

export interface TutorResponse {
  answer: string;
  citations: GroundedCitation[];
  confidenceScore?: number;
}
