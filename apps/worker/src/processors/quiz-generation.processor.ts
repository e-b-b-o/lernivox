import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import {
  GenerateQuizJobPayload,
  JobExecutionResult,
  JobType,
  QueueName,
} from '@lernivox/contracts';
import {
  generateQuizQuestions,
  GeminiProvider,
  MockAiProvider,
  type AiProvider,
  type SourcePassageForQuiz,
} from '@lernivox/ai-core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizGenerationProcessor {
  private readonly logger = new Logger(QuizGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async process(
    job: Job<GenerateQuizJobPayload, JobExecutionResult>,
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    if (!job.data?.quizId) {
      this.logger.warn(`[Job ${job.id}] Missing quizId in job payload`);
      return {
        success: false,
        jobId: job.id ?? 'unknown',
        durationMs: 0,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Missing quizId in job payload.',
        },
      };
    }

    const {
      quizId,
      userId,
      documentId,
      workspaceId,
      sourceChapter,
      rangeScope,
      numQuestions,
      difficulty,
      questionTypes,
    } = job.data;

    const scopeLabel = rangeScope?.summaryLabel || sourceChapter || 'ALL';
    this.logger.log(
      `[Job ${job.id}] Generating quiz ${quizId} for document ${documentId} (scope: ${scopeLabel})`,
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
        await this.prisma.quiz.update({
          where: { id: quizId },
          data: {
            status: 'FAILED',
            errorMessage: 'Document not found or access denied.',
          },
        });
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

      // Further chapter/section filtering if specified and not already page-filtered
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
      } else if (sourceChapter && sourceChapter.trim() && !rangeScope) {
        const chapterLower = sourceChapter.toLowerCase().trim();
        const filtered = allChunks.filter((c) => {
          const ch = c.chapter ? c.chapter.toLowerCase() : '';
          const sec = c.sectionTitle ? c.sectionTitle.toLowerCase() : '';
          return ch.includes(chapterLower) || sec.includes(chapterLower);
        });
        if (filtered.length > 0) {
          relevantChunks = filtered;
        }
      }

      const selectedChunks = relevantChunks.slice(0, 30);
      const passages: SourcePassageForQuiz[] = selectedChunks.map((c) => ({
        chunkId: c.id,
        pageNumber: c.pageNumber,
        chapter: c.chapter,
        sectionTitle: c.sectionTitle,
        content: c.content,
      }));

      if (passages.length === 0) {
        await this.prisma.quiz.update({
          where: { id: quizId },
          data: {
            status: 'FAILED',
            errorMessage: 'No readable text content found in the selected range for quiz generation.',
          },
        });
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

      // 4. Generate questions via AI Core
      const genResult = await generateQuizQuestions(aiProvider, {
        documentTitle: document.title,
        sourceChapter: scopeLabel,
        passages,
        numQuestions: numQuestions || 5,
        difficulty: (difficulty as any) || 'INTERMEDIATE',
        questionTypes: questionTypes as any,
      });

      if (!genResult.success || genResult.questions.length === 0) {
        throw new Error(genResult.error || 'Failed to generate questions from passages.');
      }

      // 5. Persist questions and options in Prisma transaction
      await this.prisma.$transaction(async (tx: any) => {
        // Clear any old questions if this is a regeneration
        await tx.quizQuestion.deleteMany({
          where: { quizId },
        });

        for (let i = 0; i < genResult.questions.length; i++) {
          const q = genResult.questions[i]!;
          const createdQuestion = await tx.quizQuestion.create({
            data: {
              quizId,
              questionOrder: i + 1,
              questionType: q.questionType,
              prompt: q.prompt,
              expectedAnswer: q.expectedAnswer,
              explanation: q.explanation,
              rubric: q.rubric || null,
              sourceExcerpt: q.sourceExcerpt || null,
              pageNumber: q.pageNumber || null,
              sourceChunkId: q.sourceChunkId || null,
            },
          });

          // Insert options if available
          if (q.options && q.options.length > 0) {
            await tx.questionOption.createMany({
              data: q.options.map((opt, optIdx) => ({
                questionId: createdQuestion.id,
                optionOrder: optIdx + 1,
                text: opt.text,
                isCorrect: Boolean(opt.isCorrect),
              })),
            });
          }
        }

        // Mark quiz as READY
        await tx.quiz.update({
          where: { id: quizId },
          data: {
            status: 'READY',
            errorMessage: null,
          },
        });
      });

      this.logger.log(
        `[Job ${job.id}] Successfully generated and persisted ${genResult.questions.length} questions for quiz ${quizId}`,
      );

      return {
        success: true,
        jobId: job.id ?? 'unknown',
        durationMs: Date.now() - startTime,
        data: {
          quizId,
          questionCount: genResult.questions.length,
          status: 'READY',
        },
      };
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const maxAttempts = job.opts?.attempts ?? 1;
      const currentAttempt = (job.attemptsMade ?? 0) + 1;
      const isFinalAttempt = currentAttempt >= maxAttempts;

      this.logger.error(
        `[Job ${job.id}] Quiz generation error (attempt ${currentAttempt}/${maxAttempts}): ${rawMessage}`,
        stack,
      );

      // Keep quiz in GENERATING while BullMQ retries remain; persist FAILED only on the final attempt
      if (isFinalAttempt && quizId) {
        try {
          let userMessage = rawMessage || 'An unexpected error occurred during quiz generation.';
          if (
            userMessage.includes('429') ||
            userMessage.includes('Resource has been exhausted') ||
            userMessage.includes('rate limit') ||
            userMessage.includes('RESOURCE_EXHAUSTED')
          ) {
            userMessage = 'AI provider quota or rate limit reached. Please wait a moment and retry.';
          }
          await this.prisma.quiz.update({
            where: { id: quizId },
            data: {
              status: 'FAILED',
              errorMessage: userMessage,
            },
          });
        } catch (dbErr) {
          this.logger.error(`Failed to update quiz failure status: ${dbErr}`);
        }
      }

      throw error instanceof Error ? error : new Error(rawMessage);
    }
  }
}
