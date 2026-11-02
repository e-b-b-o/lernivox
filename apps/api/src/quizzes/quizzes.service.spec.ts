import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
        delete: (jest.fn() as any).mockResolvedValue({ id: 'quiz-1' }),
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
});
