import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Readable } from 'stream';
import {
  DocumentIngestionJobPayload,
  DocumentProcessingStatus,
  JobExecutionResult,
  QueueName,
} from '@lernivox/contracts';
import { storeChunkVector } from '@lernivox/database';
import { chunkText, GeminiProvider, MockAiProvider, type AiProvider } from '@lernivox/ai-core';
import type { StorageService } from '@lernivox/storage';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE_TOKEN } from '../storage/storage.module';

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@Processor(QueueName.DOCUMENT_INGESTION, {
  concurrency: 1,
  lockDuration: 120000,
  stalledInterval: 30000,
  maxStalledCount: 2,
})
export class DocumentIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentIngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job<DocumentIngestionJobPayload, JobExecutionResult>): void {
    this.logger.log(
      `Worker picked up job [queue=${QueueName.DOCUMENT_INGESTION}, jobId=${job.id}, documentId=${job.data?.documentId ?? 'unknown'}, attempt=${(job.attemptsMade ?? 0) + 1}]`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<DocumentIngestionJobPayload, JobExecutionResult>): void {
    this.logger.log(
      `Worker completed job [queue=${QueueName.DOCUMENT_INGESTION}, jobId=${job.id}, documentId=${job.data?.documentId ?? 'unknown'}]`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DocumentIngestionJobPayload, JobExecutionResult> | undefined, error: Error): void {
    this.logger.error(
      `Worker job failed [queue=${QueueName.DOCUMENT_INGESTION}, jobId=${job?.id ?? 'unknown'}, documentId=${job?.data?.documentId ?? 'unknown'}, attemptsMade=${job?.attemptsMade ?? 0}]: ${error?.message || 'Unknown error'}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(
      `Worker job stalled [queue=${QueueName.DOCUMENT_INGESTION}, jobId=${jobId}]. Re-queuing if attempts remain.`,
    );
  }

  @OnWorkerEvent('error')
  onWorkerError(error: Error): void {
    this.logger.error(
      `Worker queue listener error [queue=${QueueName.DOCUMENT_INGESTION}]: ${error?.message || 'Unknown error'}`,
    );
  }

  private async updateDocumentProgress(
    documentId: string,
    job: Job<DocumentIngestionJobPayload, JobExecutionResult>,
    data: {
      status: DocumentProcessingStatus;
      progress: number;
      stage: string;
      message: string;
      completedUnits?: number | null;
      totalUnits?: number | null;
      pageCount?: number | null;
      totalTokens?: number | null;
      errorCode?: string | null;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    try {
      if (typeof job?.updateProgress === 'function') {
        await job.updateProgress({
          progress: data.progress,
          stage: data.stage,
          message: data.message,
          completedUnits: data.completedUnits,
          totalUnits: data.totalUnits,
        });
      }
    } catch {
      // ignore job progress failure
    }

    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: data.status,
          processingProgress: data.progress,
          processingStage: data.stage,
          processingMessage: data.message,
          completedUnits: data.completedUnits ?? null,
          totalUnits: data.totalUnits ?? null,
          ...(data.pageCount !== undefined ? { pageCount: data.pageCount } : {}),
          ...(data.totalTokens !== undefined ? { totalTokens: data.totalTokens } : {}),
          ...(data.errorCode !== undefined ? { errorCode: data.errorCode } : {}),
          ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
          ...(data.status === 'PROCESSING' ? { processingStartedAt: new Date() } : {}),
          ...(data.status === 'READY' ? { processingCompletedAt: new Date() } : {}),
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to persist document progress for ${documentId}: ${(err as Error).message}`);
    }
  }

  async process(
    job: Job<DocumentIngestionJobPayload, JobExecutionResult>,
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    const { documentId, storagePath, mimeType } = job.data;
    this.logger.log(
      `[Job ${job.id}] Starting ingestion [queue=${QueueName.DOCUMENT_INGESTION}, documentId=${documentId}, attempt=${(job.attemptsMade ?? 0) + 1}]`,
    );

    try {
      // Idempotency guard: if already marked READY in DB, skip duplicate processing cleanly
      if (typeof this.prisma.document?.findUnique === 'function') {
        const existingDoc = await this.prisma.document.findUnique({
          where: { id: documentId },
          select: { status: true, pageCount: true, totalTokens: true },
        });
        if (existingDoc?.status === 'READY') {
          const durationMs = Date.now() - startTime;
          this.logger.log(`[Job ${job.id}] Document ${documentId} is already READY. Skipping duplicate run.`);
          return {
            success: true,
            jobId: String(job.id),
            durationMs,
            data: {
              documentId,
              status: 'READY',
              pageCount: existingDoc.pageCount ?? null,
              totalTokens: existingDoc.totalTokens ?? null,
            },
          };
        }
      }

      // 1. Mark status as PROCESSING / QUEUED (5%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'PROCESSING',
        progress: 5,
        stage: 'QUEUED',
        message: 'Queued for processing',
      });

      // 2. Download from storage
      this.logger.log(`[Job ${job.id}] Downloading file from storage: ${storagePath}`);
      const fileStream = await this.storage.download(storagePath);
      const fileBuffer = await streamToBuffer(fileStream);

      // 3. Mark status as EXTRACTING (15%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'EXTRACTING',
        progress: 15,
        stage: 'EXTRACTING',
        message: 'Extracting document text',
      });

      let rawText = '';
      let pageCount: number | null = null;

      if (mimeType === 'application/pdf' || storagePath.endsWith('.pdf')) {
        this.logger.log(`[Job ${job.id}] Extracting text from PDF`);
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        const info = await parser.getInfo();
        await parser.destroy();
        rawText = textResult.text;
        pageCount = info.total || textResult.pages?.length || 1;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        storagePath.endsWith('.docx')
      ) {
        this.logger.log(`[Job ${job.id}] Extracting text from DOCX`);
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
        pageCount = 1;
      } else {
        // Plain text or pasted text
        this.logger.log(`[Job ${job.id}] Decoding text content`);
        rawText = fileBuffer.toString('utf-8');
        pageCount = 1;
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No readable text found in document');
      }

      // Extraction complete (25%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'EXTRACTING',
        progress: 25,
        stage: 'EXTRACTING',
        message: pageCount ? `Extracted ${pageCount} pages` : 'Document text extracted',
        completedUnits: pageCount ?? 1,
        totalUnits: pageCount ?? 1,
        pageCount,
      });

      // 4. Mark status as CHUNKING (30%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'CHUNKING',
        progress: 30,
        stage: 'CHUNKING',
        message: 'Organizing extracted text',
      });

      // Check if existing chunks already exist in DB to allow resuming embedding
      let chunks: Array<{ id: string; content: string; metadata?: any; tokenCount?: number | null }>;
      const existingChunks =
        typeof this.prisma.documentChunk.findMany === 'function'
          ? await this.prisma.documentChunk.findMany({
              where: { documentId },
              orderBy: { chunkIndex: 'asc' },
            })
          : [];

      if (existingChunks.length > 0) {
        this.logger.log(`[Job ${job.id}] Reusing ${existingChunks.length} existing chunks`);
        chunks = existingChunks;
      } else {
        // Idempotency: delete any previously generated chunks for this document (e.g. on job retry)
        await this.prisma.documentChunk.deleteMany({
          where: { documentId },
        });

        const generatedChunks = chunkText(documentId, rawText, {
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        if (generatedChunks.length === 0) {
          throw new Error('Failed to generate semantic chunks from document text');
        }

        this.logger.log(`[Job ${job.id}] Generated ${generatedChunks.length} chunks`);

        for (const chunk of generatedChunks) {
          await this.prisma.documentChunk.create({
            data: {
              id: chunk.id,
              documentId,
              chunkIndex: chunk.metadata.chunkIndex,
              content: chunk.content,
              pageNumber: chunk.metadata.pageNumber ?? 1,
              tokenCount: chunk.metadata.tokenCount,
            },
          });
        }
        chunks = generatedChunks;
      }

      // Chunks generated (35%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'CHUNKING',
        progress: 35,
        stage: 'CHUNKING',
        message: `Organized into ${chunks.length} sections`,
        completedUnits: chunks.length,
        totalUnits: chunks.length,
      });

      // Persist chunks
      const totalTokens = chunks.reduce((sum, c) => sum + (c.tokenCount ?? c.metadata?.tokenCount ?? 0), 0);

      // Resolve AI Provider
      const aiProvider = this.getAiProvider();

      this.logger.log(`[Job ${job.id}] Generating embeddings using provider: ${aiProvider.providerName}`);

      // Check which chunks already have embeddings
      const existingEmbeddings =
        typeof this.prisma.chunkEmbedding?.findMany === 'function'
          ? await this.prisma.chunkEmbedding.findMany({
              where: {
                chunkId: { in: chunks.map((c) => c.id) },
              },
              select: { chunkId: true },
            })
          : [];
      const embeddedChunkIds = new Set(existingEmbeddings.map((e) => e.chunkId));
      const chunksToEmbed = chunks.filter((c) => !embeddedChunkIds.has(c.id));

      this.logger.log(
        `[Job ${job.id}] Total chunks: ${chunks.length}, already embedded: ${embeddedChunkIds.size}, remaining to embed: ${chunksToEmbed.length}`,
      );

      // 5. Embedding Stage (35% -> 90%)
      const batchSize = 10;
      const totalBatches = Math.max(1, Math.ceil(chunksToEmbed.length / batchSize));

      if (chunksToEmbed.length === 0) {
        await this.updateDocumentProgress(documentId, job, {
          status: 'EMBEDDING',
          progress: 90,
          stage: 'EMBEDDING',
          message: 'Vector embeddings verified',
          completedUnits: totalBatches,
          totalUnits: totalBatches,
        });
      } else {
        for (let i = 0; i < chunksToEmbed.length; i += batchSize) {
          const batchIndex = Math.floor(i / batchSize);
          const batch = chunksToEmbed.slice(i, i + batchSize);
          const batchTexts = batch.map((c) => c.content);
          const embeddingResults = await aiProvider.generateEmbeddings(batchTexts);

          for (let j = 0; j < batch.length; j++) {
            const chunkItem = batch[j];
            const embItem = embeddingResults[j];

            if (!chunkItem || !embItem) continue;

            // Verify dimension is 768
            if (embItem.embedding.length !== 768) {
              throw new Error(
                `Embedding dimension mismatch: expected 768, got ${embItem.embedding.length}`,
              );
            }

            // Persist to document_chunks and chunk_embeddings via pgvector
            await storeChunkVector(
              this.prisma.client,
              chunkItem.id,
              embItem.embedding,
              embItem.model,
            );
          }

          // Monotonic progress update per batch completed (35% -> 90%)
          const currentBatchNum = batchIndex + 1;
          const progress = 35 + Math.round((currentBatchNum / totalBatches) * 55);
          await this.updateDocumentProgress(documentId, job, {
            status: 'EMBEDDING',
            progress: Math.min(progress, 90),
            stage: 'EMBEDDING',
            message: 'Generating vector embeddings',
            completedUnits: currentBatchNum,
            totalUnits: totalBatches,
          });
        }
      }

      // 6. Indexing stage (95%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'PROCESSING',
        progress: 95,
        stage: 'INDEXING',
        message: 'Organizing sections and topics',
        completedUnits: chunks.length,
        totalUnits: chunks.length,
      });

      // 7. Mark status as READY (100%)
      await this.updateDocumentProgress(documentId, job, {
        status: 'READY',
        progress: 100,
        stage: 'READY',
        message: 'Ready for Study',
        pageCount,
        totalTokens,
        completedUnits: chunks.length,
        totalUnits: chunks.length,
      });

      const durationMs = Date.now() - startTime;
      this.logger.log(`[Job ${job.id}] Document ${documentId} processed successfully in ${durationMs}ms`);

      return {
        success: true,
        jobId: String(job.id),
        durationMs,
        data: {
          documentId,
          status: 'READY',
          chunkCount: chunks.length,
          totalTokens,
          pageCount,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const rawError = (error as Error).message || 'Document processing failed';
      this.logger.error(`[Job ${job.id}] Ingestion failed for document ${documentId}: ${rawError}`);

      // User-friendly sanitized failure message (never expose raw stack traces)
      let safeMessage = 'Document processing failed. Please verify the file and try again.';
      if (rawError.includes('No readable text')) {
        safeMessage = 'No readable text found in document. Please upload a document with readable text.';
      } else if (rawError.includes('credentials') || rawError.includes('quota') || rawError.includes('429')) {
        safeMessage = 'AI processing service is temporarily busy. Please retry in a few moments.';
      } else if (rawError.includes('dimension') || rawError.includes('corrupted')) {
        safeMessage = 'Document structure could not be processed. Please try re-saving the file.';
      }

      await this.updateDocumentProgress(documentId, job, {
        status: 'FAILED',
        progress: 0,
        stage: 'FAILED',
        message: safeMessage,
        errorCode: 'PROCESSING_ERROR',
        errorMessage: safeMessage,
      });

      throw error;
    }
  }

  private getAiProvider(): AiProvider {
    const providerName = this.config.get<string>('AI_PROVIDER', 'google-gemini');
    const apiKey = this.config.get<string>('GEMINI_API_KEY', '');
    const isMock =
      providerName === 'mock' ||
      process.env.NODE_ENV === 'test' ||
      this.config.get<string>('USE_MOCK_EMBEDDINGS') === 'true';

    if (isMock) {
      return new MockAiProvider(768);
    }

    if (!apiKey || apiKey.includes('placeholder') || apiKey.trim().length < 10) {
      throw new Error(
        'AI provider credentials unavailable for embedding generation. GEMINI_API_KEY is missing or invalid.',
      );
    }

    const embeddingModel = this.config.get<string>(
      'GEMINI_EMBEDDING_MODEL',
      'gemini-embedding-2',
    );

    return new GeminiProvider({ apiKey, embeddingModel });
  }
}
