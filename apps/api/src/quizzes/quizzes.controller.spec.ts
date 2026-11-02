import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { UserDto } from '@lernivox/contracts';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let mockService: any;

  const mockUser: UserDto = {
    id: 'user-1',
    email: 'student@example.com',
    name: 'Marie Curie',
    role: 'USER',
    planTier: 'FREE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockService = {
      generateQuiz: jest.fn<any>(),
      getUserQuizzes: jest.fn<any>(),
      getDocumentQuizzes: jest.fn<any>(),
      getQuizById: jest.fn<any>(),
      startAttempt: jest.fn<any>(),
      submitAttempt: jest.fn<any>(),
      getAttemptResult: jest.fn<any>(),
      deleteQuiz: jest.fn<any>(),
    };

    controller = new QuizzesController(mockService as unknown as QuizzesService);
  });

  it('generateQuiz delegates to service and returns quiz summary', async () => {
    const dto = { title: 'Chapter 1 Quiz', numQuestions: 5 };
    mockService.generateQuiz.mockResolvedValue({ id: 'quiz-1', status: 'GENERATING' });

    const result = await controller.generateQuiz(mockUser, 'doc-1', dto);

    expect(result).toEqual({ id: 'quiz-1', status: 'GENERATING' });
    expect(mockService.generateQuiz).toHaveBeenCalledWith(mockUser.id, 'doc-1', dto);
  });

  it('getUserQuizzes delegates to service', async () => {
    mockService.getUserQuizzes.mockResolvedValue([{ id: 'quiz-1' }]);

    const result = await controller.getUserQuizzes(mockUser);

    expect(result).toEqual([{ id: 'quiz-1' }]);
    expect(mockService.getUserQuizzes).toHaveBeenCalledWith(mockUser.id);
  });

  it('startAttempt delegates to service', async () => {
    mockService.startAttempt.mockResolvedValue({ attemptId: 'att-1', totalQuestions: 5 });

    const result = await controller.startAttempt(mockUser, 'quiz-1');

    expect(result).toEqual({ attemptId: 'att-1', totalQuestions: 5 });
    expect(mockService.startAttempt).toHaveBeenCalledWith(mockUser.id, 'quiz-1');
  });

  it('submitAttempt delegates to service and returns graded result', async () => {
    const dto = { answers: [{ questionId: 'q-1', selectedOptionId: 'opt-1' }] };
    mockService.submitAttempt.mockResolvedValue({ id: 'att-1', score: 100, isCompleted: true });

    const result = await controller.submitAttempt(mockUser, 'att-1', dto);

    expect(result).toEqual({ id: 'att-1', score: 100, isCompleted: true });
    expect(mockService.submitAttempt).toHaveBeenCalledWith(mockUser.id, 'att-1', dto);
  });
});
