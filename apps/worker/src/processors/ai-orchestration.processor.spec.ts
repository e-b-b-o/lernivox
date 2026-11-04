import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Job } from 'bullmq';
import { JobType } from '@lernivox/contracts';
import { AiOrchestrationProcessor } from './ai-orchestration.processor';

describe('AiOrchestrationProcessor', () => {
  let orchestrationProcessor: AiOrchestrationProcessor;
  let mockQuizProcessor: any;
  let mockFlashcardProcessor: any;

  beforeEach(() => {
    mockQuizProcessor = {
      process: (jest.fn() as any).mockResolvedValue({
        success: true,
        jobId: 'quiz-job-1',
        durationMs: 100,
        data: { quizId: 'q-1', status: 'READY' },
      }),
    };

    mockFlashcardProcessor = {
      process: (jest.fn() as any).mockResolvedValue({
        success: true,
        jobId: 'flash-job-1',
        durationMs: 100,
        data: { deckId: 'd-1', cardCount: 10 },
      }),
    };

    orchestrationProcessor = new AiOrchestrationProcessor(
      mockQuizProcessor,
      mockFlashcardProcessor,
    );
  });

  it('should route GENERATE_QUIZ jobs to QuizGenerationProcessor', async () => {
    const mockJob = {
      id: 'quiz-job-1',
      name: JobType.GENERATE_QUIZ,
      data: { quizId: 'q-1' },
    } as unknown as Job;

    const result = await orchestrationProcessor.process(mockJob);
    expect(mockQuizProcessor.process).toHaveBeenCalledWith(mockJob);
    expect(mockFlashcardProcessor.process).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should route GENERATE_FLASHCARDS jobs to FlashcardGenerationProcessor', async () => {
    const mockJob = {
      id: 'flash-job-1',
      name: JobType.GENERATE_FLASHCARDS,
      data: { deckId: 'd-1' },
    } as unknown as Job;

    const result = await orchestrationProcessor.process(mockJob);
    expect(mockFlashcardProcessor.process).toHaveBeenCalledWith(mockJob);
    expect(mockQuizProcessor.process).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should handle unhandled job types gracefully', async () => {
    const mockJob = {
      id: 'unknown-job',
      name: 'UNKNOWN_JOB_TYPE',
      data: {},
    } as unknown as Job;

    const result = await orchestrationProcessor.process(mockJob);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNHANDLED_JOB_NAME');
  });
});

