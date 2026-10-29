import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingResult,
} from '../types/ai.types';

export class MockAiProvider implements AiProvider {
  readonly providerName = 'mock';

  constructor(private readonly dimension: number = 768) {}

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    return {
      content: 'Mock completion response for testing',
      model: 'mock-model',
      promptTokens: 10,
      completionTokens: 20,
      finishReason: 'STOP',
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    return texts.map((text, idx) => {
      const vector: number[] = new Array(this.dimension);
      let sumSq = 0;
      for (let i = 0; i < this.dimension; i++) {
        const val = Math.sin((idx + 1) * 31 + (i + 1) * 17);
        vector[i] = val;
        sumSq += val * val;
      }
      const norm = Math.sqrt(sumSq) || 1;
      const normalized = vector.map((v) => v / norm);

      return {
        embedding: normalized,
        model: 'text-embedding-004',
      };
    });
  }
}
