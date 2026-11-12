import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockQueue: any;

  beforeEach(() => {
    mockPrisma = {
      document: {
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'doc-1',
          ownerId: 'user-1',
          title: 'Molecular Biology',
        }),
      },
      quiz: {
        create: (jest.fn() as any).mockResolvedValue({
          id: 'quiz-1',
          userId: 'user-1',
          documentId: 'doc-1',
          title: 'Molecular Biology — Chapter Assessment',
          description: null,
          sourceChapter: null,
          difficulty: 'INTERMEDIATE',
          status: 'GENERATING',
          errorMessage: null,
          createdAt: new Date(),
        }),
        findMany: (jest.fn() as any).mockResolvedValue([]),
        findFirst: (jest.fn() as any).mockResolvedValue(null),
        findUnique: (jest.fn() as any).mockResolvedValue(null),
        update: (jest.fn() as any).mockResolvedValue({}),
        updateMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
        delete: (jest.fn() as any).mockResolvedValue({ id: 'quiz-1' }),
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
      },
      quizQuestion: {
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
      },
      quizAttempt: {
        create: (jest.fn() as any).mockResolvedValue({
          id: 'att-1',
          quizId: 'quiz-1',
          userId: 'user-1',
          totalQuestions: 2,
          startedAt: new Date(),
          isCompleted: false,
        }),
        findFirst: (jest.fn() as any).mockResolvedValue(null),
        update: (jest.fn() as any).mockResolvedValue({}),
      },
      quizAttemptAnswer: {
        upsert: (jest.fn() as any).mockResolvedValue({}),
      },
      $transaction: (jest.fn() as any).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      }),
    };

    mockConfig = {
      get: (jest.fn() as any).mockImplementation((key: string, defaultVal: any) => {
        if (key === 'AI_PROVIDER') return 'mock';
        return defaultVal;
      }),
    };

    mockQueue = {
      add: (jest.fn() as any).mockResolvedValue({ id: 'job-1' }),
    };

    service = new QuizzesService(mockPrisma, mockConfig, mockQueue);
  });

  it('generateQuiz creates a quiz in GENERATING status and enqueues BullMQ job', async () => {
    const result = await service.generateQuiz('user-1', 'doc-1', {
      title: 'Cell Division Quiz',
      numQuestions: 5,
    });

    expect(result.id).toBe('quiz-1');
    expect(result.status).toBe('GENERATING');
    expect(mockPrisma.quiz.create).toHaveBeenCalled();
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('generateQuiz throws NotFoundException if document does not belong to user', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    await expect(
      service.generateQuiz('user-1', 'doc-not-found', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('getQuizById sanitizes questions by omitting correct option indicators', async () => {
    mockPrisma.quiz.findFirst.mockResolvedValue({
      id: 'quiz-1',
      userId: 'user-1',
      documentId: 'doc-1',
      title: 'Cell Division Quiz',
      difficulty: 'INTERMEDIATE',
      status: 'READY',
      createdAt: new Date(),
      document: { title: 'Molecular Biology' },
      questions: [
        {
          id: 'q-1',
          questionOrder: 1,
          questionType: 'MULTIPLE_CHOICE',
          prompt: 'What phase precedes mitosis?',
          expectedAnswer: 'Interphase', // Secret!
          options: [
            { id: 'opt-1', optionOrder: 1, text: 'Interphase', isCorrect: true },
            { id: 'opt-2', optionOrder: 2, text: 'Telophase', isCorrect: false },
          ],
        },
      ],
    });

    const quiz = await service.getQuizById('user-1', 'quiz-1');

    expect(quiz.id).toBe('quiz-1');
    expect(quiz.questions.length).toBe(1);

    const question = quiz.questions[0]!;
    expect(question.prompt).toBe('What phase precedes mitosis?');
    // Ensure secret answers are stripped
    expect((question as any).expectedAnswer).toBeUndefined();
    expect((question.options[0] as any).isCorrect).toBeUndefined();
    expect((question.options[1] as any).isCorrect).toBeUndefined();
  });

  it('getQuizById provides deterministic fallback questionOrder if property is missing or null', async () => {
    mockPrisma.quiz.findFirst.mockResolvedValue({
      id: 'quiz-legacy',
      userId: 'user-1',
      documentId: 'doc-1',
      title: 'Legacy Quiz',
      difficulty: 'INTERMEDIATE',
      status: 'READY',
      createdAt: new Date(),
      document: { title: 'Molecular Biology' },
      questions: [
        {
          id: 'q-legacy-1',
          questionOrder: null, // Legacy null ordering
          questionType: 'MULTIPLE_CHOICE',
          prompt: 'Legacy prompt 1?',
          expectedAnswer: 'Answer 1',
          options: [{ id: 'opt-1', optionOrder: null, text: 'Opt 1', isCorrect: true }],
        },
        {
          id: 'q-legacy-2',
          questionOrder: undefined, // Missing ordering
          questionType: 'SHORT_ANSWER',
          prompt: 'Legacy prompt 2?',
          expectedAnswer: 'Answer 2',
          options: [],
        },
      ],
    });

    const quiz = await service.getQuizById('user-1', 'quiz-legacy');
    expect(quiz.questions.length).toBe(2);
    expect(quiz.questions[0]!.questionOrder).toBe(1);
    expect(quiz.questions[1]!.questionOrder).toBe(2);
    expect(quiz.questions[0]!.options[0]!.optionOrder).toBe(1);
  });

  it('getQuizById handles quiz with empty question list gracefully', async () => {
    mockPrisma.quiz.findFirst.mockResolvedValue({
      id: 'quiz-empty',
      userId: 'user-1',
      documentId: 'doc-1',
      title: 'Empty Quiz',
      difficulty: 'INTERMEDIATE',
      status: 'READY',
      createdAt: new Date(),
      document: { title: 'Molecular Biology' },
      questions: [],
    });

    const quiz = await service.getQuizById('user-1', 'quiz-empty');
    expect(quiz.questions).toEqual([]);
  });

  it('startAttempt throws BadRequestException if quiz is still GENERATING', async () => {
    mockPrisma.quiz.findFirst.mockResolvedValue({
      id: 'quiz-1',
      userId: 'user-1',
      status: 'GENERATING',
      questions: [{ id: 'q-1' }],
    });

    await expect(service.startAttempt('user-1', 'quiz-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('generateQuiz rejects reversed page range with BadRequestException', async () => {
    await expect(
      service.generateQuiz('user-1', 'doc-1', {
        rangeScope: {
          scopeType: 'CUSTOM_RANGE',
          rangeType: 'PAGE',
          startPage: 40,
          endPage: 20,
          summaryLabel: 'Pages 40 to 20',
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('getWorkspaceQuizzes lists quizzes in workspace with user attempt isolation', async () => {
    mockPrisma.workspace = {
      findFirst: (jest.fn() as any).mockResolvedValue({ id: 'ws-1', ownerId: 'user-1' }),
    };
    mockPrisma.quiz.findMany.mockResolvedValue([
      {
        id: 'quiz-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        title: 'Range Quiz',
        description: null,
        sourceChapter: null,
        rangeScope: { scopeType: 'CUSTOM_RANGE', summaryLabel: 'Pages 10–20' },
        difficulty: 'INTERMEDIATE',
        status: 'READY',
        errorMessage: null,
        createdAt: new Date(),
        document: { title: 'Molecular Biology' },
        questions: [{ id: 'q-1' }, { id: 'q-2' }],
        attempts: [{ score: 85, isCompleted: true }],
      },
    ]);

    const result = await service.getWorkspaceQuizzes('user-1', 'ws-1');
    expect(result.length).toBe(1);
    expect(result[0]?.bestScore).toBe(85);
    expect(result[0]?.attemptsCount).toBe(1);
    expect(result[0]?.rangeScope?.summaryLabel).toBe('Pages 10–20');
  });

  it('getFailedQuestions aggregates distinct failed questions for student in workspace', async () => {
    mockPrisma.workspace = {
      findFirst: (jest.fn() as any).mockResolvedValue({ id: 'ws-1', ownerId: 'user-1' }),
    };
    mockPrisma.quizAttemptAnswer.findMany = (jest.fn() as any).mockResolvedValue([
      {
        id: 'ans-1',
        submittedAnswer: 'Prophase',
        feedback: 'Incorrect, interphase precedes mitosis',
        answeredAt: new Date(),
        attempt: { completedAt: new Date() },
        question: {
          id: 'q-1',
          prompt: 'What phase precedes mitosis?',
          expectedAnswer: 'Interphase',
          explanation: 'Interphase is the preparatory phase.',
          pageNumber: 15,
          sourceExcerpt: 'Before entering mitosis...',
          questionType: 'MULTIPLE_CHOICE',
          quiz: { id: 'quiz-1', title: 'Range Quiz' },
        },
      },
    ]);

    const failed = await service.getFailedQuestions('user-1', 'ws-1');
    expect(failed.length).toBe(1);
    expect(failed[0]?.questionId).toBe('q-1');
    expect(failed[0]?.failCount).toBe(1);
    expect(failed[0]?.expectedAnswer).toBe('Interphase');
  });

  describe('quiz deletion & authorization', () => {
    it('deleteQuiz soft-deletes with archivedAt when owner in PERSONAL workspace', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        archivedAt: null,
        workspace: {
          id: 'ws-1',
          type: 'PERSONAL',
          ownerId: 'user-1',
          members: [],
        },
      });

      const res = await service.deleteQuiz('user-1', 'quiz-1', 'ws-1');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.quiz.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quiz-1' },
          data: expect.objectContaining({ archivedAt: expect.any(Date) }),
        }),
      );
    });

    it('deleteQuiz soft-deletes when creator deletes in GROUP workspace', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-2',
        archivedAt: null,
        workspace: {
          id: 'ws-group',
          type: 'GROUP',
          ownerId: 'user-1',
          members: [{ userId: 'user-1' }, { userId: 'user-2' }],
        },
      });

      const res = await service.deleteQuiz('user-2', 'quiz-1', 'ws-group');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.quiz.update).toHaveBeenCalled();
    });

    it('deleteQuiz soft-deletes when workspace owner deletes another member quiz in GROUP workspace', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-2',
        archivedAt: null,
        workspace: {
          id: 'ws-group',
          type: 'GROUP',
          ownerId: 'user-1',
          members: [{ userId: 'user-1' }, { userId: 'user-2' }],
        },
      });

      const res = await service.deleteQuiz('user-1', 'quiz-1', 'ws-group');
      expect(res).toEqual({ success: true });
      expect(mockPrisma.quiz.update).toHaveBeenCalled();
    });

    it('deleteQuiz throws ForbiddenException when non-creator member in GROUP workspace attempts deletion', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-2',
        archivedAt: null,
        workspace: {
          id: 'ws-group',
          type: 'GROUP',
          ownerId: 'user-1',
          members: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
        },
      });

      await expect(service.deleteQuiz('user-3', 'quiz-1', 'ws-group')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deleteQuiz throws NotFoundException when quiz is already archived or not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        archivedAt: new Date(),
      });

      await expect(service.deleteQuiz('user-1', 'quiz-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('stale reconciliation, retry and archived status checks', () => {
    it('startAttempt throws BadRequestException if quiz is archived', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        status: 'READY',
        archivedAt: new Date(),
        questions: [{ id: 'q-1' }],
      });

      await expect(service.startAttempt('user-1', 'quiz-1')).rejects.toThrow(BadRequestException);
    });

    it('retryGeneration resets status to GENERATING and adds job to BullMQ queue', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        documentId: 'doc-1',
        title: 'Biology Quiz',
        status: 'FAILED',
        archivedAt: null,
        difficulty: 'INTERMEDIATE',
        document: { id: 'doc-1', title: 'Molecular Biology' },
        workspace: { ownerId: 'user-1', members: [] },
      });
      mockPrisma.quiz.update.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        documentId: 'doc-1',
        title: 'Biology Quiz',
        status: 'GENERATING',
        errorMessage: null,
        difficulty: 'INTERMEDIATE',
        createdAt: new Date(),
      });

      const res = await service.retryGeneration('user-1', 'quiz-1');
      expect(res.status).toBe('GENERATING');
      expect(mockPrisma.quizQuestion.deleteMany).toHaveBeenCalledWith({ where: { quizId: 'quiz-1' } });
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('retryGeneration throws BadRequestException if quiz is already READY', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        userId: 'user-1',
        documentId: 'doc-1',
        status: 'READY',
        archivedAt: null,
        workspace: { ownerId: 'user-1', members: [] },
      });

      await expect(service.retryGeneration('user-1', 'quiz-1')).rejects.toThrow(BadRequestException);
    });

    it('getWorkspaceQuizzes triggers stale reconciliation query on GENERATING quizzes', async () => {
      mockPrisma.workspace = {
        findFirst: (jest.fn() as any).mockResolvedValue({ id: 'ws-1', ownerId: 'user-1' }),
      };
      mockPrisma.quiz.findMany.mockResolvedValue([]);

      await service.getWorkspaceQuizzes('user-1', 'ws-1');
      expect(mockPrisma.quiz.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'GENERATING',
            archivedAt: null,
          }),
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });

    it('getDocumentQuizzes allows authorized group workspace members and scopes attempts to requesting user', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'owner-user',
        workspaceId: 'ws-group-1',
        title: 'Shared Textbook',
        workspace: { id: 'ws-group-1' },
      });
      mockPrisma.quiz.findMany.mockResolvedValue([
        {
          id: 'quiz-shared-1',
          userId: 'owner-user',
          documentId: 'doc-1',
          title: 'Group Quiz',
          description: null,
          sourceChapter: 'Ch 1',
          difficulty: 'INTERMEDIATE',
          status: 'READY',
          errorMessage: null,
          createdAt: new Date(),
          document: { title: 'Shared Textbook' },
          questions: [{ id: 'q-1' }],
          attempts: [{ score: 90, isCompleted: true }],
        },
      ]);

      const quizzes = await service.getDocumentQuizzes('member-user', 'doc-1');

      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'doc-1',
          OR: [
            { ownerId: 'member-user' },
            { workspace: { ownerId: 'member-user' } },
            { workspace: { members: { some: { userId: 'member-user' } } } },
          ],
        },
        include: { workspace: true },
      });
      expect(quizzes).toHaveLength(1);
      expect(quizzes[0]!.bestScore).toBe(90);
    });
  });
});
