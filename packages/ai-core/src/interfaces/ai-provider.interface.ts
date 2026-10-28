import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingResult,
} from '../types/ai.types';

export interface AiProvider {
  readonly providerName: string;

  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;

  generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>;
}
