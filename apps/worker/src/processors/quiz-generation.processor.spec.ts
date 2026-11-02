import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Job } from 'bullmq';
import { GenerateQuizJobPayload, JobExecutionResult } from '@lernivox/contracts';
import { QuizGenerationProcessor } from './quiz-generation.processor';

describe('QuizGenerationProcessor', () => {
  let processor: QuizGenerationProcessor;
  let mockPrisma: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      document: {
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'doc-123',
          ownerId: 'user-1',
          title: 'Computer Architecture and Operating Systems',
        }),
      },
      documentChunk: {
        findMany: (jest.fn() as any).mockResolvedValue([
          {
            id: 'chunk-1',
            chunkIndex: 0,
            pageNumber: 1,
            chapter: 'Chapter 1: Hardware Abstraction',
            sectionTitle: 'CPU Registers',
            content:
              'Registers provide high-speed data storage directly accessible by the processor execution core.',
          },
          {
            id: 'chunk-2',
            chunkIndex: 1,
            pageNumber: 2,
            chapter: 'Chapter 1: Hardware Abstraction',
            sectionTitle: 'ALU',
            content:
              'The arithmetic logic unit executes integer addition, subtraction, bitwise comparisons, and shifts.',
          },
        ]),
      },
      quiz: {
        update: (jest.fn() as any).mockResolvedValue({}),
      },
      quizQuestion: {
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
        create: (jest.fn() as any).mockResolvedValue({ id: 'qq-1' }),
      },
      questionOption: {
        createMany: (jest.fn() as any).mockResolvedValue({ count: 4 }),
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

    processor = new QuizGenerationProcessor(mockPrisma, mockConfig);
  });

  it('generates questions and updates quiz to READY on success', async () => {
    const mockJob = {
      id: 'job-quiz-1',
      data: {
        quizId: 'quiz-abc',
        userId: 'user-1',
        documentId: 'doc-123',
        sourceChapter: 'Chapter 1: Hardware Abstraction',
        numQuestions: 4,
        difficulty: 'INTERMEDIATE',
        questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER'],
      } as GenerateQuizJobPayload,
    } as unknown as Job<GenerateQuizJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(true);
    expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'doc-123',
        OR: [
          { ownerId: 'user-1' },
          { workspace: { members: { some: { userId: 'user-1' } } } },
        ],
      },
    });
    expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
      where: { id: 'quiz-abc' },
      data: { status: 'READY', errorMessage: null },
    });
  });

  it('marks quiz as FAILED if document does not exist or user lacks access', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    const mockJob = {
      id: 'job-quiz-2',
      data: {
        quizId: 'quiz-xyz',
        userId: 'user-wrong',
        documentId: 'doc-nonexistent',
        numQuestions: 5,
        difficulty: 'BEGINNER',
        questionTypes: ['MULTIPLE_CHOICE'],
      } as GenerateQuizJobPayload,
    } as unknown as Job<GenerateQuizJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(false);
    expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
      where: { id: 'quiz-xyz' },
      data: {
        status: 'FAILED',
        errorMessage: expect.stringContaining('not found'),
      },
    });
  });

  it('marks quiz as FAILED if document has no readable passages', async () => {
    mockPrisma.document.findFirst.mockResolvedValue({
      id: 'doc-empty',
      ownerId: 'user-1',
      title: 'Empty Document',
    });
    mockPrisma.documentChunk.findMany.mockResolvedValue([]);

    const mockJob = {
      id: 'job-quiz-3',
      data: {
        quizId: 'quiz-empty',
        userId: 'user-1',
        documentId: 'doc-empty',
        numQuestions: 3,
        difficulty: 'BEGINNER',
        questionTypes: ['MULTIPLE_CHOICE'],
      } as GenerateQuizJobPayload,
    } as unknown as Job<GenerateQuizJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(false);
    expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
      where: { id: 'quiz-empty' },
      data: {
        status: 'FAILED',
        errorMessage: expect.stringContaining('No readable text content'),
      },
    });
  });
});
