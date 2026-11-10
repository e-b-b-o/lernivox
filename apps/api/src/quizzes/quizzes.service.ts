import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  FailedQuestionDto,
  GenerateQuizJobPayload,
  JobType,
  QuestionResultDto,
  QuizAttemptResultDto,
  QuizDetailDto,
  QuizDifficulty,
  QuizQuestionDto,
  QuizStatus,
  QuizSummaryDto,
  QueueName,
  StartQuizAttemptResponseDto,
  SubmitQuizAttemptRequestDto,
} from '@lernivox/contracts';
import {
  GeminiProvider,
  MockAiProvider,
  gradeFillInTheBlank,
  gradeObjectiveQuestion,
  gradeShortAnswer,
  type AiProvider,
} from '@lernivox/ai-core';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkerWakeService } from '../common/worker-wake/worker-wake.service';
import { CreateQuizDto } from './dto/quizzes.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);
  private readonly aiProvider: AiProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QueueName.AI_ORCHESTRATION)
    private readonly aiQueue: Queue<GenerateQuizJobPayload>,
    @Optional()
    private readonly workerWakeService?: WorkerWakeService,
  ) {
    const aiProviderType = this.config.get<string>('AI_PROVIDER', 'gemini');
    const geminiApiKey = this.config.get<string>('GEMINI_API_KEY');

    if (aiProviderType === 'mock' || !geminiApiKey) {
      this.aiProvider = new MockAiProvider();
    } else {
      const model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
      this.aiProvider = new GeminiProvider({ apiKey: geminiApiKey, defaultModel: model });
    }
  }

  async generateQuiz(
    userId: string,
    documentId: string,
    dto: CreateQuizDto,
  ): Promise<QuizSummaryDto> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: userId },
          { workspace: { members: { some: { userId } } } },
        ],
      },
      include: { workspace: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied.');
    }

    const resolvedWorkspaceId =
      dto.workspaceId || document.workspaceId || document.workspace?.id || null;

    // Validate rangeScope if specified
    if (dto.rangeScope && dto.rangeScope.scopeType === 'CUSTOM_RANGE') {
      if (
        typeof dto.rangeScope.startPage === 'number' &&
        typeof dto.rangeScope.endPage === 'number' &&
        dto.rangeScope.endPage < dto.rangeScope.startPage
      ) {
        throw new BadRequestException(
          'Invalid range: ending page cannot be earlier than starting page.',
        );
      }
      if (
        typeof dto.rangeScope.startChunkIndex === 'number' &&
        typeof dto.rangeScope.endChunkIndex === 'number' &&
        dto.rangeScope.endChunkIndex < dto.rangeScope.startChunkIndex
      ) {
        throw new BadRequestException(
          'Invalid range: ending section cannot be earlier than starting section.',
        );
      }
    }

    const scopeSummary = dto.rangeScope?.summaryLabel || dto.sourceChapter;
    const title =
      dto.title?.trim() ||
      (scopeSummary
        ? `${document.title} — ${scopeSummary}`
        : `${document.title} — Chapter Assessment`);

    const difficulty = (dto.difficulty || 'INTERMEDIATE') as QuizDifficulty;
    const numQuestions = dto.numQuestions || 5;
    const questionTypes = dto.questionTypes || [
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'FILL_IN_THE_BLANK',
      'SHORT_ANSWER',
    ];

    // Create Quiz in database with GENERATING status and permanent rangeScope
    const quiz = await this.prisma.quiz.create({
      data: {
        userId,
        documentId,
        workspaceId: resolvedWorkspaceId,
        rangeScope: dto.rangeScope || null,
        title,
        sourceChapter: dto.sourceChapter || null,
        difficulty: difficulty as any,
        status: 'GENERATING',
      },
    });

    // Enqueue background BullMQ generation job with stable, unique jobId
    await this.aiQueue.add(
      JobType.GENERATE_QUIZ,
      {
        quizId: quiz.id,
        userId,
        documentId,
        workspaceId: resolvedWorkspaceId || undefined,
        sourceChapter: dto.sourceChapter,
        rangeScope: dto.rangeScope,
        numQuestions,
        difficulty,
        questionTypes,
      },
      {
        jobId: `quiz-gen-${quiz.id}`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Enqueued quiz generation job for quiz ${quiz.id} (user ${userId})`);
    this.workerWakeService?.wake('quiz-generate');

    return {
      id: quiz.id,
      userId: quiz.userId,
      workspaceId: quiz.workspaceId,
      documentId: quiz.documentId,
      documentTitle: document.title,
      title: quiz.title,
      description: quiz.description,
      sourceChapter: quiz.sourceChapter,
      rangeScope: quiz.rangeScope as any,
      difficulty: quiz.difficulty as QuizDifficulty,
      status: quiz.status as QuizStatus,
      errorMessage: quiz.errorMessage,
      questionCount: 0,
      bestScore: null,
      attemptsCount: 0,
      createdAt: quiz.createdAt.toISOString(),
    };
  }

  async getUserQuizzes(userId: string): Promise<QuizSummaryDto[]> {
    // Reconcile any quizzes stuck in GENERATING state for more than 2 minutes
    const STALE_TIMEOUT_MS = 2 * 60 * 1000;
    const staleCutoff = new Date(Date.now() - STALE_TIMEOUT_MS);
    await this.prisma.quiz.updateMany({
      where: {
        userId,
        status: 'GENERATING',
        createdAt: { lt: staleCutoff },
        archivedAt: null,
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Generation timed out. Please retry quiz generation.',
      },
    });

    const quizzes = await this.prisma.quiz.findMany({
      where: { userId, archivedAt: null },
      include: {
        document: { select: { title: true } },
        questions: { select: { id: true } },
        attempts: {
          select: { score: true, isCompleted: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => {
      const completedAttempts = q.attempts.filter((a) => a.isCompleted && a.score !== null);
      const bestScore =
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((a) => a.score ?? 0))
          : null;

      return {
        id: q.id,
        userId: q.userId,
        documentId: q.documentId,
        documentTitle: q.document?.title,
        title: q.title,
        description: q.description,
        sourceChapter: q.sourceChapter,
        difficulty: q.difficulty as QuizDifficulty,
        status: q.status as QuizStatus,
        errorMessage: q.errorMessage,
        questionCount: q.questions.length,
        bestScore,
        attemptsCount: q.attempts.length,
        createdAt: q.createdAt.toISOString(),
      };
    });
  }

  async getDocumentQuizzes(userId: string, documentId: string): Promise<QuizSummaryDto[]> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, ownerId: userId },
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied.');
    }

    const quizzes = await this.prisma.quiz.findMany({
      where: { userId, documentId, archivedAt: null },
      include: {
        document: { select: { title: true } },
        questions: { select: { id: true } },
        attempts: {
          select: { score: true, isCompleted: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => {
      const completedAttempts = q.attempts.filter((a) => a.isCompleted && a.score !== null);
      const bestScore =
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((a) => a.score ?? 0))
          : null;

      return {
        id: q.id,
        userId: q.userId,
        documentId: q.documentId,
        documentTitle: q.document?.title,
        title: q.title,
        description: q.description,
        sourceChapter: q.sourceChapter,
        difficulty: q.difficulty as QuizDifficulty,
        status: q.status as QuizStatus,
        errorMessage: q.errorMessage,
        questionCount: q.questions.length,
        bestScore,
        attemptsCount: q.attempts.length,
        createdAt: q.createdAt.toISOString(),
      };
    });
  }

  async getWorkspaceQuizzes(userId: string, workspaceId: string): Promise<QuizSummaryDto[]> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    // Reconcile stale generating quizzes in this workspace
    const STALE_TIMEOUT_MS = 2 * 60 * 1000;
    const staleCutoff = new Date(Date.now() - STALE_TIMEOUT_MS);
    await this.prisma.quiz.updateMany({
      where: {
        status: 'GENERATING',
        createdAt: { lt: staleCutoff },
        archivedAt: null,
        OR: [
          { workspaceId },
          { document: { workspaceId } },
        ],
      },
      data: {
        status: 'FAILED',
        errorMessage: 'Generation timed out. Please retry quiz generation.',
      },
    });

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        archivedAt: null,
        OR: [
          { workspaceId },
          { document: { workspaceId } },
        ],
      },
      include: {
        document: { select: { title: true } },
        questions: { select: { id: true } },
        attempts: {
          where: { userId }, // STRICT PRIVACY: only current user's attempts!
          select: { score: true, isCompleted: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => {
      const completedAttempts = q.attempts.filter((a) => a.isCompleted && a.score !== null);
      const bestScore =
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((a) => a.score ?? 0))
          : null;

      return {
        id: q.id,
        userId: q.userId,
        workspaceId: q.workspaceId,
        documentId: q.documentId,
        documentTitle: q.document?.title,
        title: q.title,
        description: q.description,
        sourceChapter: q.sourceChapter,
        rangeScope: q.rangeScope as any,
        difficulty: q.difficulty as QuizDifficulty,
        status: q.status as QuizStatus,
        errorMessage: q.errorMessage,
        questionCount: q.questions.length,
        bestScore,
        attemptsCount: completedAttempts.length,
        createdAt: q.createdAt.toISOString(),
      };
    });
  }

  async getQuizById(userId: string, quizId: string): Promise<QuizDetailDto> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        archivedAt: null,
        OR: [
          { userId },
          { workspace: { members: { some: { userId } } } },
          { workspace: { ownerId: userId } },
          { document: { ownerId: userId } },
          { document: { workspace: { members: { some: { userId } } } } },
        ],
      },
      include: {
        document: { select: { title: true } },
        questions: {
          orderBy: { questionOrder: 'asc' },
          include: {
            options: {
              orderBy: { optionOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found or access denied.');
    }

    // Reconcile stale generating quiz
    const STALE_TIMEOUT_MS = 2 * 60 * 1000;
    const staleCutoff = new Date(Date.now() - STALE_TIMEOUT_MS);
    if (quiz.status === 'GENERATING' && quiz.createdAt < staleCutoff) {
      await this.prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Generation timed out. Please retry quiz generation.',
        },
      });
      quiz.status = 'FAILED';
      quiz.errorMessage = 'Generation timed out. Please retry quiz generation.';
    }

    // SANITIZATION: Never leak correct options or expected answers when delivering quiz questions
    // Ensure deterministic questionOrder fallback for legacy or malformed quiz records
    const sanitizedQuestions: QuizQuestionDto[] = (quiz.questions || []).map(
      (q, index) => ({
        id: q.id,
        questionOrder:
          typeof q.questionOrder === 'number' && !Number.isNaN(q.questionOrder)
            ? q.questionOrder
            : index + 1,
        questionType: q.questionType as any,
        prompt: q.prompt,
        pageNumber: q.pageNumber,
        sourceChunkId: q.sourceChunkId,
        options: (q.options || []).map((opt, optIndex) => ({
          id: opt.id,
          optionOrder:
            typeof opt.optionOrder === 'number' && !Number.isNaN(opt.optionOrder)
              ? opt.optionOrder
              : optIndex + 1,
          text: opt.text,
        })),
      }),
    );

    return {
      id: quiz.id,
      workspaceId: quiz.workspaceId,
      title: quiz.title,
      description: quiz.description,
      sourceChapter: quiz.sourceChapter,
      rangeScope: quiz.rangeScope as any,
      documentId: quiz.documentId,
      documentTitle: quiz.document?.title,
      difficulty: quiz.difficulty as QuizDifficulty,
      status: quiz.status as QuizStatus,
      errorMessage: quiz.errorMessage,
      questions: sanitizedQuestions,
      createdAt: quiz.createdAt.toISOString(),
    };
  }

  async startAttempt(userId: string, quizId: string): Promise<StartQuizAttemptResponseDto> {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        OR: [
          { userId },
          { workspace: { members: { some: { userId } } } },
          { workspace: { ownerId: userId } },
          { document: { ownerId: userId } },
          { document: { workspace: { members: { some: { userId } } } } },
        ],
      },
      include: {
        questions: { select: { id: true } },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found or access denied.');
    }

    if (quiz.archivedAt !== null) {
      throw new BadRequestException('This quiz has been archived and can no longer be attempted.');
    }

    if (quiz.status !== 'READY') {
      throw new BadRequestException(
        quiz.status === 'GENERATING'
          ? 'Quiz is still generating questions. Please wait a moment.'
          : 'Quiz generation failed and cannot be started.',
      );
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException('This quiz has no questions.');
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId,
        totalQuestions: quiz.questions.length,
        startedAt: new Date(),
        isCompleted: false,
      },
    });

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      startedAt: attempt.startedAt.toISOString(),
      totalQuestions: attempt.totalQuestions,
    };
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    dto: SubmitQuizAttemptRequestDto,
  ): Promise<QuizAttemptResultDto> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: {
          include: {
            document: { select: { title: true } },
            questions: {
              orderBy: { questionOrder: 'asc' },
              include: {
                options: { orderBy: { optionOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found or access denied.');
    }

    if (attempt.isCompleted) {
      throw new ConflictException('This quiz attempt has already been submitted and graded.');
    }

    const questions = attempt.quiz.questions;
    const answerMap = new Map<string, { selectedOptionId?: string | null; submittedAnswer?: string | null }>();

    for (const ans of dto.answers || []) {
      answerMap.set(ans.questionId, {
        selectedOptionId: ans.selectedOptionId,
        submittedAnswer: ans.submittedAnswer,
      });
    }

    const gradedAnswers: Array<{
      questionId: string;
      selectedOptionId?: string | null;
      submittedAnswer?: string | null;
      isCorrect: boolean;
      isPartial: boolean;
      scorePercent: number;
      feedback: string;
    }> = [];

    let totalScoreSum = 0;
    let correctCount = 0;

    for (const q of questions) {
      const studentInput = answerMap.get(q.id);

      if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
        const evalResult = gradeObjectiveQuestion(
          q.questionType,
          studentInput?.selectedOptionId,
          q.options,
        );
        gradedAnswers.push({
          questionId: q.id,
          selectedOptionId: studentInput?.selectedOptionId || null,
          submittedAnswer: null,
          isCorrect: evalResult.isCorrect,
          isPartial: evalResult.isPartial,
          scorePercent: evalResult.scorePercent,
          feedback: evalResult.feedback,
        });

        totalScoreSum += evalResult.scorePercent;
        if (evalResult.isCorrect) correctCount++;
      } else if (q.questionType === 'FILL_IN_THE_BLANK') {
        const evalResult = gradeFillInTheBlank(
          studentInput?.submittedAnswer,
          q.expectedAnswer,
          q.rubric || undefined,
        );
        gradedAnswers.push({
          questionId: q.id,
          selectedOptionId: null,
          submittedAnswer: studentInput?.submittedAnswer || null,
          isCorrect: evalResult.isCorrect,
          isPartial: evalResult.isPartial,
          scorePercent: evalResult.scorePercent,
          feedback: evalResult.feedback,
        });

        totalScoreSum += evalResult.scorePercent;
        if (evalResult.isCorrect) correctCount++;
      } else if (q.questionType === 'SHORT_ANSWER') {
        const evalResult = await gradeShortAnswer(this.aiProvider, {
          prompt: q.prompt,
          expectedAnswer: q.expectedAnswer,
          rubric: q.rubric || undefined,
          sourceExcerpt: q.sourceExcerpt || undefined,
          studentAnswer: studentInput?.submittedAnswer || '',
        });

        gradedAnswers.push({
          questionId: q.id,
          selectedOptionId: null,
          submittedAnswer: studentInput?.submittedAnswer || null,
          isCorrect: evalResult.isCorrect,
          isPartial: evalResult.isPartial,
          scorePercent: evalResult.scorePercent,
          feedback: evalResult.feedback,
        });

        totalScoreSum += evalResult.scorePercent;
        if (evalResult.isCorrect) correctCount++;
      }
    }

    const overallScorePercent =
      questions.length > 0 ? Math.round(totalScoreSum / questions.length) : 0;
    const completedAt = new Date();

    // Persist graded answers and update attempt
    await this.prisma.$transaction(async (tx: any) => {
      for (const ga of gradedAnswers) {
        await tx.quizAttemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: ga.questionId,
            },
          },
          update: {
            selectedOptionId: ga.selectedOptionId,
            submittedAnswer: ga.submittedAnswer,
            isCorrect: ga.isCorrect,
            isPartial: ga.isPartial,
            feedback: ga.feedback,
          },
          create: {
            attemptId: attempt.id,
            questionId: ga.questionId,
            selectedOptionId: ga.selectedOptionId,
            submittedAnswer: ga.submittedAnswer,
            isCorrect: ga.isCorrect,
            isPartial: ga.isPartial,
            feedback: ga.feedback,
          },
        });
      }

      await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score: overallScorePercent,
          correctAnswers: correctCount,
          isCompleted: true,
          completedAt,
        },
      });
    });

    return this.getAttemptResult(userId, attempt.id);
  }

  async getAttemptResult(userId: string, attemptId: string): Promise<QuizAttemptResultDto> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: {
          include: {
            document: { select: { title: true } },
            questions: {
              orderBy: { questionOrder: 'asc' },
              include: {
                options: { orderBy: { optionOrder: 'asc' } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found or access denied.');
    }

    if (!attempt.isCompleted) {
      throw new BadRequestException('This quiz attempt has not yet been submitted.');
    }

    const answerMap = new Map<string, (typeof attempt.answers)[0]>();
    for (const ans of attempt.answers) {
      answerMap.set(ans.questionId, ans);
    }

    const results: QuestionResultDto[] = (attempt.quiz.questions || []).map((q, index) => {
      const studentAns = answerMap.get(q.id);
      return {
        questionId: q.id,
        questionOrder:
          typeof q.questionOrder === 'number' && !Number.isNaN(q.questionOrder)
            ? q.questionOrder
            : index + 1,
        questionType: q.questionType as any,
        prompt: q.prompt,
        submittedAnswer: studentAns?.submittedAnswer || null,
        selectedOptionId: studentAns?.selectedOptionId || null,
        expectedAnswer: q.expectedAnswer,
        isCorrect: Boolean(studentAns?.isCorrect),
        isPartial: Boolean(studentAns?.isPartial),
        feedback: studentAns?.feedback || null,
        explanation: q.explanation,
        sourceExcerpt: q.sourceExcerpt,
        pageNumber: q.pageNumber,
        sourceChunkId: q.sourceChunkId,
        options: (q.options || []).map((opt, optIndex) => ({
          id: opt.id,
          optionOrder:
            typeof opt.optionOrder === 'number' && !Number.isNaN(opt.optionOrder)
              ? opt.optionOrder
              : optIndex + 1,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      };
    });

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      documentId: attempt.quiz.documentId,
      documentTitle: attempt.quiz.document?.title || null,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() || null,
      score: attempt.score ?? 0,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers ?? 0,
      isCompleted: attempt.isCompleted,
      results,
    };
  }

  async getFailedQuestions(userId: string, workspaceId: string): Promise<FailedQuestionDto[]> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    const failedAnswers = await this.prisma.quizAttemptAnswer.findMany({
      where: {
        attempt: {
          userId,
          isCompleted: true,
          quiz: {
            archivedAt: null,
            OR: [{ workspaceId }, { document: { workspaceId } }],
          },
        },
        isCorrect: false,
      },
      include: {
        question: {
          include: {
            quiz: { select: { id: true, title: true } },
          },
        },
        attempt: { select: { completedAt: true } },
      },
      orderBy: { answeredAt: 'desc' },
    });

    const questionMap = new Map<string, FailedQuestionDto>();

    for (const fa of failedAnswers) {
      const q = fa.question;
      if (!questionMap.has(q.id)) {
        questionMap.set(q.id, {
          questionId: q.id,
          quizId: q.quiz.id,
          quizTitle: q.quiz.title,
          prompt: q.prompt,
          questionType: q.questionType as any,
          expectedAnswer: q.expectedAnswer,
          submittedAnswer: fa.submittedAnswer,
          feedback: fa.feedback,
          explanation: q.explanation,
          pageNumber: q.pageNumber,
          sourceExcerpt: q.sourceExcerpt,
          lastFailedAt: (fa.attempt.completedAt || fa.answeredAt).toISOString(),
          failCount: 1,
        });
      } else {
        const item = questionMap.get(q.id)!;
        item.failCount += 1;
      }
    }

    return Array.from(questionMap.values());
  }

  async retryGeneration(userId: string, quizId: string): Promise<QuizSummaryDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        document: { select: { id: true, title: true, workspaceId: true } },
        workspace: {
          include: { members: true },
        },
      },
    });

    if (!quiz || quiz.archivedAt !== null) {
      throw new NotFoundException('Quiz not found or access denied.');
    }

    const workspace =
      quiz.workspace ||
      (quiz.document?.workspaceId
        ? await this.prisma.workspace.findUnique({
            where: { id: quiz.document.workspaceId },
            include: { members: true },
          })
        : null);

    const isWorkspaceOwner = workspace?.ownerId === userId;
    const isQuizCreator = quiz.userId === userId;
    const isMember = workspace?.members.some((m) => m.userId === userId);

    if (!isWorkspaceOwner && !isQuizCreator && !isMember) {
      throw new ForbiddenException('Access denied to retry quiz generation.');
    }

    if (quiz.status === 'READY') {
      throw new BadRequestException('Quiz is already generated and ready.');
    }

    // Remove any stale or partially generated questions
    await this.prisma.quizQuestion.deleteMany({
      where: { quizId: quiz.id },
    });

    // Update quiz status to GENERATING and clear errorMessage
    const updated = await this.prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        status: 'GENERATING',
        errorMessage: null,
      },
    });

    const resolvedDocId = quiz.documentId || quiz.document?.id;
    if (!resolvedDocId) {
      throw new BadRequestException('Cannot retry quiz without an associated document.');
    }

    // Enqueue new BullMQ background generation job
    await this.aiQueue.add(
      JobType.GENERATE_QUIZ,
      {
        quizId: quiz.id,
        userId: quiz.userId,
        documentId: resolvedDocId,
        workspaceId: quiz.workspaceId || undefined,
        sourceChapter: quiz.sourceChapter || undefined,
        rangeScope: quiz.rangeScope as any,
        numQuestions: 5,
        difficulty: quiz.difficulty as QuizDifficulty,
        questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER'],
      },
      {
        jobId: `quiz-gen-${quiz.id}-${Date.now()}`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Retrying quiz generation job for quiz ${quiz.id} (user ${userId})`);
    this.workerWakeService?.wake('quiz-retry');

    return {
      id: updated.id,
      userId: updated.userId,
      workspaceId: updated.workspaceId,
      documentId: updated.documentId,
      documentTitle: quiz.document?.title,
      title: updated.title,
      description: updated.description,
      sourceChapter: updated.sourceChapter,
      rangeScope: updated.rangeScope as any,
      difficulty: updated.difficulty as QuizDifficulty,
      status: updated.status as QuizStatus,
      errorMessage: updated.errorMessage,
      questionCount: 0,
      bestScore: null,
      attemptsCount: 0,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteQuiz(
    userId: string,
    quizId: string,
    workspaceId?: string,
  ): Promise<{ success: boolean }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
        document: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!quiz || quiz.archivedAt !== null) {
      throw new NotFoundException('Quiz not found or already deleted.');
    }

    const workspace = quiz.workspace || quiz.document?.workspace || null;

    if (workspaceId && workspace && workspace.id !== workspaceId) {
      throw new NotFoundException('Quiz not found in this workspace.');
    }

    if (workspace) {
      const isWorkspaceOwner = workspace.ownerId === userId;
      const isQuizCreator = quiz.userId === userId;
      const isMember = workspace.members.some((m) => m.userId === userId);

      if (workspace.type === 'PERSONAL') {
        if (!isWorkspaceOwner && !isQuizCreator) {
          throw new ForbiddenException('Only the workspace owner can delete this quiz.');
        }
      } else {
        // GROUP workspace: quiz creator or workspace owner only
        if (!isWorkspaceOwner && !isQuizCreator) {
          if (isMember) {
            throw new ForbiddenException(
              'Only the quiz creator or workspace owner can delete this quiz.',
            );
          } else {
            throw new NotFoundException('Quiz not found or access denied.');
          }
        }
      }
    } else {
      // Standalone quiz without workspace
      const isQuizCreator = quiz.userId === userId;
      const isDocOwner = quiz.document?.ownerId === userId;
      if (!isQuizCreator && !isDocOwner) {
        throw new ForbiddenException('You do not have permission to delete this quiz.');
      }
    }

    await this.prisma.quiz.update({
      where: { id: quizId },
      data: { archivedAt: new Date() },
    });

    return { success: true };
  }
}
