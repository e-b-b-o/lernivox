import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
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
      where: { id: documentId, ownerId: userId },
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied.');
    }

    const title =
      dto.title?.trim() ||
      (dto.sourceChapter
        ? `${document.title} — ${dto.sourceChapter}`
        : `${document.title} — Chapter Assessment`);

    const difficulty = (dto.difficulty || 'INTERMEDIATE') as QuizDifficulty;
    const numQuestions = dto.numQuestions || 5;
    const questionTypes = dto.questionTypes || [
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'FILL_IN_THE_BLANK',
      'SHORT_ANSWER',
    ];

    // Create Quiz in database with GENERATING status
    const quiz = await this.prisma.quiz.create({
      data: {
        userId,
        documentId,
        title,
        sourceChapter: dto.sourceChapter || null,
        difficulty: difficulty as any,
        status: 'GENERATING',
      },
    });

    // Enqueue background BullMQ generation job
    await this.aiQueue.add(
      JobType.GENERATE_QUIZ,
      {
        quizId: quiz.id,
        userId,
        documentId,
        sourceChapter: dto.sourceChapter,
        numQuestions,
        difficulty,
        questionTypes,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Enqueued quiz generation job for quiz ${quiz.id} (user ${userId})`);

    return {
      id: quiz.id,
      userId: quiz.userId,
      documentId: quiz.documentId,
      documentTitle: document.title,
      title: quiz.title,
      description: quiz.description,
      sourceChapter: quiz.sourceChapter,
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
    const quizzes = await this.prisma.quiz.findMany({
      where: { userId },
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
      where: { userId, documentId },
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

  async getQuizById(userId: string, quizId: string): Promise<QuizDetailDto> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, userId },
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

    // SANITIZATION: Never leak correct options or expected answers when delivering quiz questions
    const sanitizedQuestions: QuizQuestionDto[] = quiz.questions.map((q) => ({
      id: q.id,
      questionOrder: q.questionOrder,
      questionType: q.questionType as any,
      prompt: q.prompt,
      pageNumber: q.pageNumber,
      sourceChunkId: q.sourceChunkId,
      options: q.options.map((opt) => ({
        id: opt.id,
        optionOrder: opt.optionOrder,
        text: opt.text,
      })),
    }));

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      sourceChapter: quiz.sourceChapter,
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
      where: { id: quizId, userId },
      include: {
        questions: { select: { id: true } },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found or access denied.');
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

    const results: QuestionResultDto[] = attempt.quiz.questions.map((q) => {
      const studentAns = answerMap.get(q.id);
      return {
        questionId: q.id,
        questionOrder: q.questionOrder,
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
        options: q.options.map((opt) => ({
          id: opt.id,
          optionOrder: opt.optionOrder,
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

  async deleteQuiz(userId: string, quizId: string): Promise<{ success: boolean }> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, userId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found or access denied.');
    }

    await this.prisma.quiz.delete({
      where: { id: quizId },
    });

    return { success: true };
  }
}
