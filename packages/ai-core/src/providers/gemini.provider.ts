import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingResult,
} from '../types/ai.types';

export interface GeminiProviderConfig {
  apiKey: string;
  defaultModel?: string;
  embeddingModel?: string;
}

/**
 * Provisional Gemini AI provider adapter.
 * Wraps Gemini API calls behind the unified AiProvider contract.
 */
export class GeminiProvider implements AiProvider {
  readonly providerName = 'google-gemini';
  private readonly defaultModel: string;
  private readonly embeddingModel: string;

  constructor(private readonly config: GeminiProviderConfig) {
    this.defaultModel = config.defaultModel ?? 'gemini-1.5-pro';
    this.embeddingModel = config.embeddingModel ?? 'text-embedding-004';
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    // Adapter interface implementation ready for provider SDK binding
    return {
      content: 'Provisional completion placeholder for phase 1 validation',
      model: this.defaultModel,
      promptTokens: 0,
      completionTokens: 0,
      finishReason: 'STOP',
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // Generates typed embeddings placeholder without network dependency during phase 1
    return texts.map(() => ({
      embedding: new Array(768).fill(0),
      model: this.embeddingModel,
    }));
  }
}
