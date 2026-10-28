import { ChunkMetadata, TextChunk } from '../types/ai.types';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

/**
 * Splits text into semantic chunks with overlap.
 */
export function chunkText(
  documentId: string,
  rawText: string,
  options: ChunkingOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1000;
  const chunkOverlap = options.chunkOverlap ?? 200;

  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < rawText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < rawText.length) {
      // Find sentence or paragraph boundary near the end
      const lastNewline = rawText.lastIndexOf('\n', endIndex);
      const lastPeriod = rawText.lastIndexOf('. ', endIndex);

      if (lastNewline > startIndex + chunkSize / 2) {
        endIndex = lastNewline + 1;
      } else if (lastPeriod > startIndex + chunkSize / 2) {
        endIndex = lastPeriod + 2;
      }
    } else {
      endIndex = rawText.length;
    }

    const content = rawText.substring(startIndex, endIndex).trim();
    if (content.length > 0) {
      const metadata: ChunkMetadata = {
        documentId,
        chunkIndex,
        tokenCount: Math.ceil(content.length / 4),
      };

      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        content,
        metadata,
      });

      chunkIndex++;
    }

    startIndex = endIndex - chunkOverlap;
    if (startIndex >= rawText.length || endIndex >= rawText.length) {
      break;
    }
  }

  return chunks;
}
