import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import {
  GenerateFlashcardsJobPayload,
  JobExecutionResult,
  QueueName,
} from '@lernivox/contracts';
import {
  generateFlashcards,
  GeminiProvider,
  MockAiProvider,
  type AiProvider,
  type SourcePassageForFlashcard,
} from '@lernivox/ai-core';
import { PrismaService } from '../prisma/prisma.service';

@Processor(QueueName.AI_ORCHESTRATION)
export class FlashcardGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(FlashcardGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(
    job: Job<GenerateFlashcardsJobPayload, JobExecutionResult>,
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    const {
      deckId,
      userId,
      workspaceId,
      documentId,
      title,
      rangeScope,
      cardCount,
    } = job.data;

    const scopeLabel = rangeScope?.summaryLabel || 'ALL';
    this.logger.log(
      `[Job ${job.id}] Generating flashcards for deck ${deckId} (doc: ${documentId}, scope: ${scopeLabel})`,
    );

    try {
      // 1. Fetch document and verify authorization (owner OR workspace member)
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          OR: [
            { ownerId: userId },
            {
              workspace: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      });

      if (!document) {
        return {
          success: false,
          jobId: job.id ?? 'unknown',
          durationMs: Date.now() - startTime,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found or access denied.',
          },
        };
      }

      // 2. Fetch chunks and filter passages strictly by selected range
      const chunkWhere: any = { documentId };

      if (rangeScope && rangeScope.scopeType === 'CUSTOM_RANGE') {
        if (
          typeof rangeScope.startPage === 'number' &&
          typeof rangeScope.endPage === 'number' &&
          rangeScope.endPage >= rangeScope.startPage
        ) {
          chunkWhere.pageNumber = {
            gte: rangeScope.startPage,
            lte: rangeScope.endPage,
          };
        } else if (
          typeof rangeScope.startChunkIndex === 'number' &&
          typeof rangeScope.endChunkIndex === 'number' &&
          rangeScope.endChunkIndex >= rangeScope.startChunkIndex
        ) {
          chunkWhere.chunkIndex = {
            gte: rangeScope.startChunkIndex,
            lte: rangeScope.endChunkIndex,
          };
        }
      }

      const allChunks = await this.prisma.documentChunk.findMany({
        where: chunkWhere,
        orderBy: { chunkIndex: 'asc' },
        take: 100,
      });

      let relevantChunks = allChunks;

      if (
        rangeScope?.scopeType === 'CUSTOM_RANGE' &&
        rangeScope.resolvedSections &&
        rangeScope.resolvedSections.length > 0 &&
        !chunkWhere.pageNumber &&
        !chunkWhere.chunkIndex
      ) {
        const sectionsLower = rangeScope.resolvedSections.map((s) => s.toLowerCase());
        const filtered = allChunks.filter((c) => {
          const ch = c.chapter ? c.chapter.toLowerCase() : '';
          const sec = c.sectionTitle ? c.sectionTitle.toLowerCase() : '';
          return sectionsLower.some((s) => ch.includes(s) || sec.includes(s));
        });
        if (filtered.length > 0) {
          relevantChunks = filtered;
        }
      }

      const selectedChunks = relevantChunks.slice(0, 30);
      const passages: SourcePassageForFlashcard[] = selectedChunks.map((c) => ({
        chunkId: c.id,
        pageNumber: c.pageNumber,
        chapter: c.chapter,
        sectionTitle: c.sectionTitle,
        content: c.content,
      }));

      if (passages.length === 0) {
        return {
          success: false,
          jobId: job.id ?? 'unknown',
          durationMs: Date.now() - startTime,
          error: {
            code: 'NO_PASSAGES',
            message: 'No readable text content found in selected range.',
          },
        };
      }

      // 3. Resolve AI provider
      const aiProviderType = this.config.get<string>('AI_PROVIDER', 'gemini');
      const geminiApiKey = this.config.get<string>('GEMINI_API_KEY');
      let aiProvider: AiProvider;

      if (aiProviderType === 'mock' || !geminiApiKey) {
        aiProvider = new MockAiProvider();
      } else {
        const model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
        aiProvider = new GeminiProvider({ apiKey: geminiApiKey, defaultModel: model });
      }

      // 4. Generate flashcards via AI Core
      const genResult = await generateFlashcards(aiProvider, {
        documentTitle: document.title,
        sourceRangeSummary: scopeLabel,
        passages,
        cardCount: cardCount || 10,
      });

      if (!genResult.success || genResult.cards.length === 0) {
        return {
          success: false,
          jobId: job.id ?? 'unknown',
          durationMs: Date.now() - startTime,
          error: {
            code: 'GENERATION_FAILED',
            message: genResult.error || 'Failed to generate flashcards.',
          },
        };
      }

      // 5. Persist flashcard items in database
      await this.prisma.$transaction(async (tx: any) => {
        for (const card of genResult.cards) {
          await tx.flashcardItem.create({
            data: {
              deckId,
              front: card.front,
              back: card.back,
              hint: card.hint || null,
              pageNumber: card.pageNumber || null,
              chapter: card.chapter || null,
              sourceChunkId: card.sourceChunkId || null,
            },
          });
        }

        await tx.flashcardDeck.update({
          where: { id: deckId },
          data: {
            updatedAt: new Date(),
          },
        });
      });

      this.logger.log(
        `[Job ${job.id}] Successfully generated and persisted ${genResult.cards.length} flashcards for deck ${deckId}`,
      );

      return {
        success: true,
        jobId: job.id ?? 'unknown',
        durationMs: Date.now() - startTime,
        data: {
          deckId,
          cardCount: genResult.cards.length,
        },
      };
    } catch (error: any) {
      this.logger.error(`[Job ${job.id}] Flashcard generation error: ${error.message}`, error.stack);
      return {
        success: false,
        jobId: job.id ?? 'unknown',
        durationMs: Date.now() - startTime,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Flashcard generation failed.',
        },
      };
    }
  }
}
