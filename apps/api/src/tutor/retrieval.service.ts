import { Inject, Injectable, Logger } from '@nestjs/common';
import { searchSimilarChunks } from '@lernivox/database';
import type { AiProvider, RetrievedPassage } from '@lernivox/ai-core';
import { PrismaService } from '../common/prisma/prisma.service';
import { AI_PROVIDER_TOKEN } from './tutor.constants';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  /**
   * Retrieves semantically relevant document chunks using pgvector cosine similarity search.
   * Strictly scopes retrieval to the specified document ID.
   */
  async retrieveRelevantChunks(
    documentId: string,
    documentTitle: string,
    query: string,
    topK = 6,
    minSimilarity = 0.1,
  ): Promise<RetrievedPassage[]> {
    const startTime = Date.now();

    // 1. Generate query embedding vector using the active AI provider
    const embeddings = await this.aiProvider.generateEmbeddings([query]);
    const queryResult = embeddings[0];

    if (!queryResult || !Array.isArray(queryResult.embedding) || queryResult.embedding.length !== 768) {
      throw new Error(
        `Invalid query embedding generated: expected 768 dimensions, received ${queryResult?.embedding?.length ?? 0}`,
      );
    }

    // 2. Query pgvector for cosine similarity constrained to this document
    const rawMatches = await searchSimilarChunks(this.prisma.client, {
      embedding: queryResult.embedding,
      limit: topK,
      minSimilarity,
      documentIds: [documentId],
    });

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `Retrieved ${rawMatches.length} chunks for doc "${documentId}" in ${durationMs}ms (topK=${topK}, minSim=${minSimilarity})`,
    );

    // 3. Map into structured RetrievedPassage records with deterministic source tags [S1], [S2]...
    const passages: RetrievedPassage[] = rawMatches.map((m, index) => ({
      sourceId: `S${index + 1}`,
      chunkId: m.chunkId,
      documentId: m.documentId,
      documentTitle,
      content: m.content,
      pageNumber: m.pageNumber,
      chapter: m.chapter,
      sectionTitle: m.sectionTitle,
      similarity: Number(m.similarity.toFixed(4)),
    }));

    return passages;
  }
}
