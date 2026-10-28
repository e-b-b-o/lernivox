import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  DocumentIngestionJobPayload,
  JobExecutionResult,
  QueueName,
} from '@lernivox/contracts';

@Processor(QueueName.DOCUMENT_INGESTION)
export class DocumentIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentIngestionProcessor.name);

  async process(
    job: Job<DocumentIngestionJobPayload, JobExecutionResult>,
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    this.logger.log(`Processing document ingestion job ${job.id} for document ${job.data.documentId}`);

    // Skeleton processor ready for ingestion pipeline implementation in Phase 7
    return {
      success: true,
      jobId: String(job.id),
      durationMs: Date.now() - startTime,
      data: {
        documentId: job.data.documentId,
        status: 'READY',
      },
    };
  }
}
