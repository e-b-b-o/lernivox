import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FlashcardsService, computeSm2Review } from './flashcards.service';

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let mockPrisma: any;
  let mockQueue: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'ws-1',
          name: 'Biology Workspace',
          ownerId: 'user-1',
          document: { id: 'doc-1', title: 'Molecular Biology' },
        }),
      },
      flashcardDeck: {
        create: (jest.fn() as any).mockResolvedValue({
          id: 'deck-1',
          workspaceId: 'ws-1',
          documentId: 'doc-1',
          createdById: 'user-1',
          title: 'Core Terms',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: (jest.fn() as any).mockResolvedValue([]),
        findFirst: (jest.fn() as any).mockResolvedValue(null),
        update: (jest.fn() as any).mockResolvedValue({ id: 'deck-1', title: 'New Deck Title' }),
        delete: (jest.fn() as any).mockResolvedValue({ id: 'deck-1' }),
      },
      flashcardItem: {
        create: (jest.fn() as any).mockResolvedValue({ id: 'card-1' }),
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'card-1',
          deckId: 'deck-1',
          front: 'What is ATP?',
          back: 'Adenosine triphosphate, energy currency of the cell',
          reviews: [],
        }),
        update: (jest.fn() as any).mockResolvedValue({
          id: 'card-1',
          deckId: 'deck-1',
          front: 'What is ATP? (Updated)',
          back: 'Adenosine triphosphate',
          hint: 'Energy currency',
        }),
        delete: (jest.fn() as any).mockResolvedValue({ id: 'card-1' }),
      },
      documentChunk: {
        findMany: (jest.fn() as any).mockResolvedValue([
          {
            id: 'chunk-1',
            pageNumber: 10,
            chapter: 'Chapter 1',
            sectionTitle: 'Cell Energy',
            content: 'Adenosine triphosphate (ATP) is the principal molecule for storing and transferring energy in cells.',
          },
        ]),
      },
      userFlashcardReview: {
        findUnique: (jest.fn() as any).mockResolvedValue(null),
        upsert: (jest.fn() as any).mockResolvedValue({
          cardId: 'card-1',
          userId: 'user-1',
          repetition: 1,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date(Date.now() + 86400000),
          lastReviewedAt: new Date(),
        }),
      },
    };

    mockQueue = {
      add: (jest.fn() as any).mockResolvedValue({ id: 'job-fc-1' }),
    };

    service = new FlashcardsService(mockPrisma, mockQueue);
  });

  describe('SM-2 Algorithm Math', () => {
    it('Again (rating 1) resets repetition to 0, sets interval to 1 day, and reduces ease factor', () => {
      const sm2 = computeSm2Review(1, 4, 15, 2.5);
      expect(sm2.repetition).toBe(0);
      expect(sm2.intervalDays).toBe(1);
      expect(sm2.easeFactor).toBe(2.3);
      expect(sm2.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('Hard (rating 2) resets repetition to 0, sets interval to 1 day, and reduces ease factor', () => {
      const sm2 = computeSm2Review(2, 3, 10, 2.4);
      expect(sm2.repetition).toBe(0);
      expect(sm2.intervalDays).toBe(1);
      expect(sm2.easeFactor).toBe(2.25);
    });

    it('Good (rating 3) increments repetition and advances intervals correctly', () => {
      const r1 = computeSm2Review(3, 0, 1, 2.5);
      expect(r1.repetition).toBe(1);
      expect(r1.intervalDays).toBe(1);

      const r2 = computeSm2Review(3, 1, 1, 2.5);
      expect(r2.repetition).toBe(2);
      expect(r2.intervalDays).toBe(6);

      const r3 = computeSm2Review(3, 2, 6, 2.5);
      expect(r3.repetition).toBe(3);
      expect(r3.intervalDays).toBe(15); // Math.round(6 * 2.5) = 15
    });

    it('Easy (rating 4) provides bonus intervals and increases ease factor', () => {
      const r1 = computeSm2Review(4, 0, 1, 2.5);
      expect(r1.repetition).toBe(1);
      expect(r1.intervalDays).toBe(4);
      expect(r1.easeFactor).toBe(2.65);

      const r2 = computeSm2Review(4, 1, 4, 2.65);
      expect(r2.repetition).toBe(2);
      expect(r2.intervalDays).toBe(10);
    });
  });

  describe('Deck Generation & Management', () => {
    it('generateDeck creates a deck record and enqueues BullMQ job', async () => {
      const result = await service.generateDeck('user-1', 'ws-1', {
        workspaceId: 'ws-1',
        title: 'Photosynthesis Deck',
        cardCount: 8,
      });

      expect(result.id).toBe('deck-1');
      expect(mockPrisma.flashcardDeck.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('generateDeck rejects reversed page range', async () => {
      await expect(
        service.generateDeck('user-1', 'ws-1', {
          workspaceId: 'ws-1',
          rangeScope: {
            scopeType: 'CUSTOM_RANGE',
            rangeType: 'PAGE',
            startPage: 50,
            endPage: 25,
            summaryLabel: 'Pages 50 to 25',
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('reviewCard calculates SM-2 and upserts user review record', async () => {
      const result = await service.reviewCard('user-1', 'card-1', 3);
      expect(result.cardId).toBe('card-1');
      expect(result.rating).toBe(3);
      expect(mockPrisma.userFlashcardReview.upsert).toHaveBeenCalled();
    });

    it('generatePreview returns proposed cards WITHOUT saving to database', async () => {
      const preview = await service.generatePreview('user-1', 'ws-1', {
        workspaceId: 'ws-1',
        cardCount: 5,
      });

      expect(preview.cards.length).toBeGreaterThan(0);
      expect(preview.title).toBeDefined();
      // Must NOT save deck or items to database during preview
      expect(mockPrisma.flashcardDeck.create).not.toHaveBeenCalled();
    });

    it('getWorkspaceDecks strictly isolates decks by createdById for group privacy', async () => {
      await service.getWorkspaceDecks('user-student-2', 'ws-1');

      expect(mockPrisma.flashcardDeck.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId: 'ws-1',
            createdById: 'user-student-2',
          },
        }),
      );
    });

    it('updateDeck allows creator to rename title and description', async () => {
      const now = new Date();
      mockPrisma.flashcardDeck.findFirst
        .mockResolvedValueOnce({
          id: 'deck-1',
          createdById: 'user-1',
          title: 'Old Title',
          createdAt: now,
          updatedAt: now,
          cards: [],
        })
        .mockResolvedValueOnce({
          id: 'deck-1',
          createdById: 'user-1',
          title: 'New Deck Title',
          createdAt: now,
          updatedAt: now,
          cards: [],
        });

      await service.updateDeck('user-1', 'deck-1', { title: 'New Deck Title' });

      expect(mockPrisma.flashcardDeck.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'deck-1' },
          data: expect.objectContaining({ title: 'New Deck Title' }),
        }),
      );
    });

    it('updateCard allows creator to edit front, back, and hint', async () => {
      const updated = await service.updateCard('user-1', 'card-1', {
        front: 'What is ATP? (Updated)',
        back: 'Adenosine triphosphate',
        hint: 'Energy currency',
      });

      expect(updated.front).toBe('What is ATP? (Updated)');
      expect(mockPrisma.flashcardItem.update).toHaveBeenCalled();
    });

    it('deleteCard allows creator to remove card', async () => {
      const res = await service.deleteCard('user-1', 'card-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.flashcardItem.delete).toHaveBeenCalledWith({ where: { id: 'card-1' } });
    });

    it('deleteDeck enforces creator authorization', async () => {
      mockPrisma.flashcardDeck.findFirst.mockResolvedValueOnce({
        id: 'deck-1',
        createdById: 'user-1',
      });

      const res = await service.deleteDeck('user-1', 'deck-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.flashcardDeck.delete).toHaveBeenCalledWith({ where: { id: 'deck-1' } });
    });
  });
});
