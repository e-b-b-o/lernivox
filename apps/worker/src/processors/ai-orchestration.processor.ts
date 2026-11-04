import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  JobExecutionResult,
  JobType,
  QueueName,
} from '@lernivox/contracts';
import { QuizGenerationProcessor } from './quiz-generation.processor';
import { FlashcardGenerationProcessor } from './flashcard-generation.processor';

/**
 * Unified BullMQ Processor for the AI Orchestration Queue.
 * Dispatches incoming jobs strictly by job.name to prevent competing worker
 * collisions and job stealing between quiz and flashcard pipelines.
 */
@Processor(QueueName.AI_ORCHESTRATION)
export class AiOrchestrationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiOrchestrationProcessor.name);

  constructor(
    private readonly quizProcessor: QuizGenerationProcessor,
    private readonly flashcardProcessor: FlashcardGenerationProcessor,
  ) {
    super();
  }

  async process(job: Job): Promise<JobExecutionResult> {
    const jobName = job.name;
    this.logger.log(`[Job ${job.id}] Dispatching AI orchestration job: ${jobName}`);

    switch (jobName) {
      case JobType.GENERATE_QUIZ:
        return this.quizProcessor.process(job as any);

      case JobType.GENERATE_FLASHCARDS:
        return this.flashcardProcessor.process(job as any);

      default:
        this.logger.warn(`[Job ${job.id}] Unhandled job name on ${QueueName.AI_ORCHESTRATION}: ${jobName}`);
        return {
          success: false,
          jobId: job.id ?? 'unknown',
          durationMs: 0,
          error: {
            code: 'UNHANDLED_JOB_NAME',
            message: `No handler registered for job type ${jobName}`,
          },
        };
    }
  }
}

