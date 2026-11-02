import dns from 'node:dns';
import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingResult,
} from '../types/ai.types';

// Ensure IPv4 is prioritized over unreachable IPv6 routes on host system
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where setDefaultResultOrder is not available
}

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
    this.defaultModel =
      config.defaultModel ?? process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
    this.embeddingModel =
      config.embeddingModel ?? process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2';
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

    const payload: Record<string, unknown> = {
      contents: request.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.3,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };

    if (request.systemPrompt) {
      payload.system_instruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${this.config.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Connection: 'close',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45000),
          },
        );

        if (response.status === 429 && attempt < maxRetries) {
          let waitMs = 5000;
          try {
            const errData = (await response.clone().json()) as any;
            const retryInfo =
              errData?.error?.details?.find?.((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay) ||
              errData?.details?.find?.((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
            if (retryInfo?.retryDelay) {
              const parsedSeconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
              if (!isNaN(parsedSeconds)) {
                if (parsedSeconds > 60) {
                  const errText = await response.text();
                  throw new Error(`Gemini rate limit exceeded (retry in ${parsedSeconds}s): ${errText}`);
                }
                waitMs = Math.ceil(parsedSeconds * 1000) + 1000;
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('rate limit exceeded')) {
              throw e;
            }
          }
          console.warn(`[GeminiProvider] Rate limit (429) on generation attempt ${attempt}/${maxRetries}. Backing off for ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
          };
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return {
          content: text,
          model: this.defaultModel,
          promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          finishReason: data.candidates?.[0]?.finishReason ?? 'STOP',
        };
      } catch (err) {
        if (attempt >= maxRetries) {
          throw err;
        }
      }
    }

    throw new Error('Gemini API request failed after maximum retries');
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.hasValidKey()) {
      throw new Error(
        'Gemini API key is not configured or is a placeholder. Set GEMINI_API_KEY to generate embeddings.',
      );
    }

    const maxRetries = 40;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:batchEmbedContents?key=${this.config.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Connection: 'close',
            },
            body: JSON.stringify({
              requests: texts.map((text) => ({
                model: `models/${this.embeddingModel}`,
                content: { parts: [{ text }] },
                outputDimensionality: 768,
              })),
            }),
            signal: AbortSignal.timeout(30000),
          },
        );

        if (response.status === 429 && attempt < maxRetries) {
          let waitMs = 15000;
          try {
            const errData = (await response.clone().json()) as any;
            const retryInfo =
              errData?.error?.details?.find?.((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay) ||
              errData?.details?.find?.((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
            if (retryInfo?.retryDelay) {
              const parsedSeconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
              if (!isNaN(parsedSeconds)) {
                if (parsedSeconds > 60) {
                  const errText = await response.text();
                  throw new Error(`Gemini daily embedding quota exhausted (retry in ${parsedSeconds}s): ${errText}`);
                }
                waitMs = Math.ceil(parsedSeconds * 1000) + 2000;
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('quota exhausted')) {
              throw e;
            }
            // ignore parsing error
          }
          console.warn(`[GeminiProvider] Rate limit (429) on attempt ${attempt}/${maxRetries}. Backing off for ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

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
      } catch (err) {
        console.warn(`[GeminiProvider] Network/fetch error on attempt ${attempt}/${maxRetries}:`, err instanceof Error ? err.message : err);
        if (
          attempt < maxRetries &&
          (err instanceof Error &&
            (err.message.includes('fetch failed') ||
              err.message.includes('ECONNRESET') ||
              err.message.includes('ETIMEDOUT') ||
              err.name === 'TimeoutError' ||
              err.name === 'AbortError'))
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5000 * Math.min(attempt, 6)));
          continue;
        }
        throw err;
      }
    }

    throw new Error('Gemini embedding API exceeded maximum rate-limit retry attempts');
  }
}
