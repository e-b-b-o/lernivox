import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
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
@Processor(QueueName.AI_ORCHESTRATION, {
  concurrency: 1,
  lockDuration: 90000,
  stalledInterval: 30000,
})
export class AiOrchestrationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiOrchestrationProcessor.name);

  constructor(
    private readonly quizProcessor: QuizGenerationProcessor,
    private readonly flashcardProcessor: FlashcardGenerationProcessor,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(
      `Worker picked up AI job [queue=${QueueName.AI_ORCHESTRATION}, jobId=${job.id}, name=${job.name}, attempt=${(job.attemptsMade ?? 0) + 1}]`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `AI orchestration job failed [queue=${QueueName.AI_ORCHESTRATION}, jobId=${job?.id ?? 'unknown'}, name=${job?.name ?? 'unknown'}]: ${error?.message || 'Unknown error'}`,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(
      `AI orchestration worker error [queue=${QueueName.AI_ORCHESTRATION}]: ${error?.message || 'Unknown error'}`,
    );
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

