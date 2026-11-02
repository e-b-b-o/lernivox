import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { GenerateFlashcardsJobPayload, JobExecutionResult } from '@lernivox/contracts';
import { FlashcardGenerationProcessor } from './flashcard-generation.processor';
import { PrismaService } from '../prisma/prisma.service';

describe('FlashcardGenerationProcessor', () => {
  let processor: FlashcardGenerationProcessor;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      document: {
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'doc-123',
          ownerId: 'user-1',
          title: 'Operating System Concepts',
        }),
      },
      documentChunk: {
        findMany: (jest.fn() as any).mockResolvedValue([
          {
            id: 'chunk-1',
            chunkIndex: 0,
            pageNumber: 5,
            chapter: 'Chapter 1',
            sectionTitle: '1.1 Introduction',
            content: 'An operating system acts as an intermediary between the user of a computer and computer hardware.',
          },
        ]),
      },
      flashcardItem: {
        create: (jest.fn() as any).mockResolvedValue({ id: 'item-1' }),
      },
      flashcardDeck: {
        update: (jest.fn() as any).mockResolvedValue({ id: 'deck-1' }),
      },
      $transaction: (jest.fn() as any).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardGenerationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, def) => {
              if (key === 'AI_PROVIDER') return 'mock';
              return def;
            }),
          },
        },
      ],
    }).compile();

    processor = module.get<FlashcardGenerationProcessor>(FlashcardGenerationProcessor);
  });

  it('generates flashcards and persists them in database on success', async () => {
    const mockJob = {
      id: 'job-fc-1',
      data: {
        deckId: 'deck-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        documentId: 'doc-123',
        title: 'Core Concepts',
        cardCount: 3,
      } as GenerateFlashcardsJobPayload,
    } as unknown as Job<GenerateFlashcardsJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(true);
    expect(mockPrisma.document.findFirst).toHaveBeenCalled();
    expect(mockPrisma.flashcardItem.create).toHaveBeenCalled();
    expect(mockPrisma.flashcardDeck.update).toHaveBeenCalledWith({
      where: { id: 'deck-1' },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it('fails safely if document is missing or access is denied', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    const mockJob = {
      id: 'job-fc-2',
      data: {
        deckId: 'deck-2',
        userId: 'user-wrong',
        workspaceId: 'ws-1',
        documentId: 'doc-ghost',
        title: 'Ghost Deck',
        cardCount: 5,
      } as GenerateFlashcardsJobPayload,
    } as unknown as Job<GenerateFlashcardsJobPayload, JobExecutionResult>;

    const result = await processor.process(mockJob);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('DOCUMENT_NOT_FOUND');
  });
});
