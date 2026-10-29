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
 * Gemini AI provider adapter.
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

  hasValidKey(): boolean {
    return Boolean(
      this.config.apiKey &&
        !this.config.apiKey.includes('placeholder') &&
        this.config.apiKey.trim().length > 10,
    );
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.hasValidKey()) {
      throw new Error(
        'Gemini API key is not configured or is a placeholder. Set GEMINI_API_KEY in environment.',
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: request.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return {
      content: text,
      model: this.defaultModel,
      promptTokens: 0,
      completionTokens: 0,
      finishReason: data.candidates?.[0]?.finishReason ?? 'STOP',
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.hasValidKey()) {
      throw new Error(
        'Gemini API key is not configured or is a placeholder. Set GEMINI_API_KEY to generate embeddings.',
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:batchEmbedContents?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${this.embeddingModel}`,
            content: { parts: [{ text }] },
          })),
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini embedding API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      embeddings?: Array<{ values: number[] }>;
    };

    if (!data.embeddings || data.embeddings.length !== texts.length) {
      throw new Error('Invalid response structure from Gemini embedding API');
    }

    return data.embeddings.map((item) => ({
      embedding: item.values,
      model: this.embeddingModel,
    }));
  }
}
