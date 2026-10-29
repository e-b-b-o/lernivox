import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Readable } from 'stream';
import {
  DocumentIngestionJobPayload,
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

@Processor(QueueName.DOCUMENT_INGESTION)
export class DocumentIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentIngestionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(
    job: Job<DocumentIngestionJobPayload, JobExecutionResult>,
  ): Promise<JobExecutionResult> {
    const startTime = Date.now();
    const { documentId, storagePath, mimeType } = job.data;
    this.logger.log(`[Job ${job.id}] Starting ingestion for document: ${documentId}`);

    try {
      // 1. Mark status as PROCESSING
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSING',
          processingStartedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });

      // 2. Download from storage
      this.logger.log(`[Job ${job.id}] Downloading file from storage: ${storagePath}`);
      const fileStream = await this.storage.download(storagePath);
      const fileBuffer = await streamToBuffer(fileStream);

      // 3. Mark status as EXTRACTING
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'EXTRACTING' },
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

      // 4. Mark status as CHUNKING
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'CHUNKING' },
      });

      // Idempotency: delete any previously generated chunks for this document (e.g. on job retry)
      await this.prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      const chunks = chunkText(documentId, rawText, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      if (chunks.length === 0) {
        throw new Error('Failed to generate semantic chunks from document text');
      }

      this.logger.log(`[Job ${job.id}] Generated ${chunks.length} chunks`);

      // Persist chunks
      const totalTokens = chunks.reduce((sum, c) => sum + (c.metadata.tokenCount ?? 0), 0);

      for (const chunk of chunks) {
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

      // 5. Mark status as EMBEDDING
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'EMBEDDING' },
      });

      // Resolve AI Provider
      const aiProvider = this.getAiProvider();

      this.logger.log(`[Job ${job.id}] Generating embeddings using provider: ${aiProvider.providerName}`);

      // Batch embeddings generation (up to 10 at a time)
      const batchSize = 10;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
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
      }

      // 6. Mark status as READY
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'READY',
          pageCount,
          totalTokens,
          processingCompletedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
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
      const errorMessage = (error as Error).message || 'Document processing failed';
      this.logger.error(`[Job ${job.id}] Ingestion failed for document ${documentId}: ${errorMessage}`);

      // Update document record with failure info
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorCode: 'PROCESSING_ERROR',
          errorMessage: errorMessage.substring(0, 500),
          processingCompletedAt: new Date(),
        },
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

    return new GeminiProvider({ apiKey });
  }
}
