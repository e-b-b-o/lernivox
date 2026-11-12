import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Readable } from 'stream';
import { Job } from 'bullmq';
import { DocumentIngestionJobPayload, JobExecutionResult } from '@lernivox/contracts';
import { DocumentIngestionProcessor } from './document-ingestion.processor';

describe('DocumentIngestionProcessor', () => {
  let processor: DocumentIngestionProcessor;
  let mockPrisma: any;
  let mockStorage: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      document: {
        update: (jest.fn() as any).mockResolvedValue({}),
      },
      documentChunk: {
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 0 }),
        create: (jest.fn() as any).mockResolvedValue({}),
      },
      $executeRaw: (jest.fn() as any).mockResolvedValue(1),
      client: {
        $executeRaw: (jest.fn() as any).mockResolvedValue(1),
      },
    };

    mockStorage = {
      download: jest.fn(),
    };

    mockConfig = {
      get: (jest.fn() as any).mockImplementation((key: any, defaultVal: any) => {
        if (key === 'AI_PROVIDER') return 'mock';
        if (key === 'USE_MOCK_EMBEDDINGS') return 'true';
        return defaultVal;
      }),
    };

    processor = new DocumentIngestionProcessor(mockPrisma, mockStorage, mockConfig);
  });

  it('processes a plain text document successfully end-to-end', async () => {
    const textContent = 'Calculus is the mathematical study of continuous change. Derivatives represent instantaneous rates of change.';
    mockStorage.download.mockResolvedValue(Readable.from(Buffer.from(textContent, 'utf-8')));

    const mockJob = {
      id: 'job-1',
      data: {
        documentId: 'doc-123',
        storagePath: 'documents/user-1/doc-123_notes.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
      } as DocumentIngestionJobPayload,
    } as unknown as Job<DocumentIngestionJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(true);
    expect((result.data as any)?.status).toBe('READY');
    expect((result.data as any)?.chunkCount).toBeGreaterThan(0);

    // Verify status transitions: PROCESSING, EXTRACTING, CHUNKING, EMBEDDING, READY
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-123' },
        data: expect.objectContaining({ status: 'PROCESSING' }),
      }),
    );
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-123' },
        data: expect.objectContaining({ status: 'EXTRACTING' }),
      }),
    );
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-123' },
        data: expect.objectContaining({ status: 'CHUNKING' }),
      }),
    );
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-123' },
        data: expect.objectContaining({ status: 'EMBEDDING' }),
      }),
    );
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-123' },
        data: expect.objectContaining({ status: 'READY' }),
      }),
    );

    // Verify idempotency: chunks deleted prior to insert
    expect(mockPrisma.documentChunk.deleteMany).toHaveBeenCalledWith({
      where: { documentId: 'doc-123' },
    });

    // Verify chunk creation
    expect(mockPrisma.documentChunk.create).toHaveBeenCalled();
  });

  it('fails and updates status to FAILED when document contains no text', async () => {
    mockStorage.download.mockResolvedValue(Readable.from(Buffer.alloc(0)));

    const mockJob = {
      id: 'job-2',
      data: {
        documentId: 'doc-empty',
        storagePath: 'documents/user-1/doc-empty.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
      } as DocumentIngestionJobPayload,
    } as unknown as Job<DocumentIngestionJobPayload, JobExecutionResult>;

    await expect(processor.process(mockJob)).rejects.toThrow();

    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-empty' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorCode: 'PROCESSING_ERROR',
        }),
      }),
    );
  });

  it('fails when AI credentials are unavailable in live provider mode', async () => {
    // Configure to non-mock provider with missing key
    mockConfig.get.mockImplementation((key: string, defaultVal: any) => {
      if (key === 'AI_PROVIDER') return 'google-gemini';
      if (key === 'GEMINI_API_KEY') return 'your_gemini_api_key_placeholder';
      if (key === 'USE_MOCK_EMBEDDINGS') return 'false';
      return defaultVal;
    });

    // Temporarily override NODE_ENV to production for this test
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const textContent = 'Valid content to process.';
    mockStorage.download.mockResolvedValue(Readable.from(Buffer.from(textContent, 'utf-8')));

    const mockJob = {
      id: 'job-3',
      data: {
        documentId: 'doc-creds-fail',
        storagePath: 'documents/user-1/doc-creds-fail.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
      } as DocumentIngestionJobPayload,
    } as unknown as Job<DocumentIngestionJobPayload, JobExecutionResult>;

    try {
      await expect(processor.process(mockJob)).rejects.toThrow(/AI provider credentials unavailable/);

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-creds-fail' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorCode: 'PROCESSING_ERROR',
          }),
        }),
      );
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('skips duplicate processing cleanly when document is already READY', async () => {
    mockPrisma.document.findUnique = (jest.fn() as any).mockResolvedValue({
      status: 'READY',
      pageCount: 12,
      totalTokens: 2400,
    });

    const mockJob = {
      id: 'ingest-doc-already-ready',
      attemptsMade: 0,
      data: {
        documentId: 'doc-already-ready',
        storagePath: 'documents/user-1/doc.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
      } as DocumentIngestionJobPayload,
    } as unknown as Job<DocumentIngestionJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(true);
    expect((result.data as any)?.status).toBe('READY');
    expect(mockStorage.download).not.toHaveBeenCalled();
    expect(mockPrisma.document.update).not.toHaveBeenCalled();
  });
});
