import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  FlashcardDeckDetailDto,
  FlashcardDeckSummaryDto,
  FlashcardItemDto,
  FlashcardRating,
  FlashcardReviewResultDto,
  GenerateFlashcardsJobPayload,
  JobType,
  QueueName,
} from '@lernivox/contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateFlashcardDeckDto,
  GenerateFlashcardsDto,
} from './dto/flashcards.dto';

export function computeSm2Review(
  rating: FlashcardRating,
  prevRepetition: number,
  prevIntervalDays: number,
  prevEaseFactor: number,
): { repetition: number; intervalDays: number; easeFactor: number; nextReviewAt: Date } {
  let repetition = prevRepetition;
  let intervalDays = prevIntervalDays;
  let easeFactor = prevEaseFactor;

  if (rating === 1) {
    // Again (Complete blackout / failed recall)
    repetition = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, prevEaseFactor - 0.2);
  } else if (rating === 2) {
    // Hard (Significant hesitation / partial struggle)
    repetition = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, prevEaseFactor - 0.15);
  } else if (rating === 3) {
    // Good (Successful recall with reasonable effort)
    repetition = prevRepetition + 1;
    if (repetition === 1) {
      intervalDays = 1;
    } else if (repetition === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(prevIntervalDays * prevEaseFactor));
    }
    easeFactor = Math.max(1.3, prevEaseFactor);
  } else if (rating === 4) {
    // Easy (Effortless, rapid recall)
    repetition = prevRepetition + 1;
    if (repetition === 1) {
      intervalDays = 4;
    } else if (repetition === 2) {
      intervalDays = 10;
    } else {
      intervalDays = Math.max(1, Math.round(prevIntervalDays * prevEaseFactor * 1.3));
    }
    easeFactor = Math.max(1.3, prevEaseFactor + 0.15);
  }

  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  return { repetition, intervalDays, easeFactor, nextReviewAt };
}

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.AI_ORCHESTRATION)
    private readonly aiQueue: Queue<GenerateFlashcardsJobPayload>,
  ) {}

  async generateDeck(
    userId: string,
    workspaceId: string,
    dto: GenerateFlashcardsDto,
  ): Promise<FlashcardDeckSummaryDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { document: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    const documentId = dto.documentId || workspace.document?.id;
    if (!documentId) {
      throw new BadRequestException('No document associated with this workspace.');
    }

    // Validate rangeScope if specified
    if (dto.rangeScope && dto.rangeScope.scopeType === 'CUSTOM_RANGE') {
      if (
        typeof dto.rangeScope.startPage === 'number' &&
        typeof dto.rangeScope.endPage === 'number' &&
        dto.rangeScope.endPage < dto.rangeScope.startPage
      ) {
        throw new BadRequestException(
          'Invalid range: ending page cannot be earlier than starting page.',
        );
      }
      if (
        typeof dto.rangeScope.startChunkIndex === 'number' &&
        typeof dto.rangeScope.endChunkIndex === 'number' &&
        dto.rangeScope.endChunkIndex < dto.rangeScope.startChunkIndex
      ) {
        throw new BadRequestException(
          'Invalid range: ending section cannot be earlier than starting section.',
        );
      }
    }

    const scopeSummary = dto.rangeScope?.summaryLabel || 'Complete Material';
    const title =
      dto.title?.trim() ||
      `${workspace.document?.title || workspace.name} — ${scopeSummary}`;

    const deck = await this.prisma.flashcardDeck.create({
      data: {
        workspaceId,
        documentId,
        createdById: userId,
        title,
        sourceRange: dto.rangeScope || null,
      },
    });

    // Enqueue BullMQ job
    await this.aiQueue.add(
      JobType.GENERATE_FLASHCARDS,
      {
        deckId: deck.id,
        userId,
        workspaceId,
        documentId,
        title,
        rangeScope: dto.rangeScope,
        cardCount: dto.cardCount || 10,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Enqueued flashcard generation job for deck ${deck.id}`);

    return {
      id: deck.id,
      workspaceId: deck.workspaceId,
      documentId: deck.documentId,
      documentTitle: workspace.document?.title || null,
      title: deck.title,
      description: deck.description,
      cardCount: 0,
      dueCardCount: 0,
      createdById: deck.createdById,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }

  async createManualDeck(
    userId: string,
    workspaceId: string,
    dto: CreateFlashcardDeckDto,
  ): Promise<FlashcardDeckDetailDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { document: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    const documentId = dto.documentId || workspace.document?.id || null;

    const deck = await this.prisma.flashcardDeck.create({
      data: {
        workspaceId,
        documentId,
        createdById: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        sourceRange: dto.sourceRange || null,
      },
    });

    const cards: FlashcardItemDto[] = [];
    if (dto.cards && dto.cards.length > 0) {
      for (const c of dto.cards) {
        const item = await this.prisma.flashcardItem.create({
          data: {
            deckId: deck.id,
            front: c.front.trim(),
            back: c.back.trim(),
            hint: c.hint?.trim() || null,
            pageNumber: c.pageNumber || null,
            chapter: c.chapter?.trim() || null,
            sourceChunkId: c.sourceChunkId || null,
          },
        });
        cards.push({
          id: item.id,
          deckId: deck.id,
          front: item.front,
          back: item.back,
          hint: item.hint,
          pageNumber: item.pageNumber,
          chapter: item.chapter,
          sourceChunkId: item.sourceChunkId,
          repetition: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: null,
          lastReviewedAt: null,
          lastRating: null,
        });
      }
    }

    return {
      id: deck.id,
      workspaceId: deck.workspaceId,
      documentId: deck.documentId,
      documentTitle: workspace.document?.title || null,
      title: deck.title,
      description: deck.description,
      cardCount: cards.length,
      dueCardCount: cards.length,
      createdById: deck.createdById,
      sourceRange: deck.sourceRange as any,
      cards,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }

  async getWorkspaceDecks(
    userId: string,
    workspaceId: string,
  ): Promise<FlashcardDeckSummaryDto[]> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    const decks = await this.prisma.flashcardDeck.findMany({
      where: { workspaceId },
      include: {
        document: { select: { title: true } },
        cards: {
          include: {
            reviews: {
              where: { userId }, // PRIVACY: only current user's review records!
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return decks.map((deck) => {
      const cardCount = deck.cards.length;
      let dueCardCount = 0;

      for (const card of deck.cards) {
        const review = card.reviews[0];
        if (!review || !review.nextReviewAt || review.nextReviewAt <= now) {
          dueCardCount++;
        }
      }

      return {
        id: deck.id,
        workspaceId: deck.workspaceId,
        documentId: deck.documentId,
        documentTitle: deck.document?.title || null,
        title: deck.title,
        description: deck.description,
        cardCount,
        dueCardCount,
        createdById: deck.createdById,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      };
    });
  }

  async getDeckById(userId: string, deckId: string): Promise<FlashcardDeckDetailDto> {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: {
        id: deckId,
        workspace: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      include: {
        document: { select: { title: true } },
        cards: {
          orderBy: { createdAt: 'asc' },
          include: {
            reviews: {
              where: { userId }, // STRICT PRIVACY: only current user's reviews!
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Flashcard deck not found or access denied.');
    }

    const now = new Date();
    let dueCardCount = 0;

    const cards: FlashcardItemDto[] = deck.cards.map((c) => {
      const review = c.reviews[0];
      const isDue = !review || !review.nextReviewAt || review.nextReviewAt <= now;
      if (isDue) dueCardCount++;

      return {
        id: c.id,
        deckId: c.deckId,
        front: c.front,
        back: c.back,
        hint: c.hint,
        pageNumber: c.pageNumber,
        chapter: c.chapter,
        sourceChunkId: c.sourceChunkId,
        repetition: review?.repetition ?? 0,
        intervalDays: review?.intervalDays ?? 1,
        easeFactor: review?.easeFactor ?? 2.5,
        nextReviewAt: review?.nextReviewAt?.toISOString() || null,
        lastReviewedAt: review?.lastReviewedAt?.toISOString() || null,
        lastRating: review?.lastRating || null,
      };
    });

    return {
      id: deck.id,
      workspaceId: deck.workspaceId,
      documentId: deck.documentId,
      documentTitle: deck.document?.title || null,
      title: deck.title,
      description: deck.description,
      cardCount: cards.length,
      dueCardCount,
      createdById: deck.createdById,
      sourceRange: deck.sourceRange as any,
      cards,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }

  async reviewCard(
    userId: string,
    cardId: string,
    rating: FlashcardRating,
  ): Promise<FlashcardReviewResultDto> {
    const card = await this.prisma.flashcardItem.findFirst({
      where: {
        id: cardId,
        deck: {
          workspace: {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Flashcard not found or access denied.');
    }

    // Load existing user review record
    const existing = await this.prisma.userFlashcardReview.findUnique({
      where: {
        userId_cardId: { userId, cardId },
      },
    });

    const prevRepetition = existing?.repetition ?? 0;
    const prevIntervalDays = existing?.intervalDays ?? 1;
    const prevEaseFactor = existing?.easeFactor ?? 2.5;
    const prevReviewCount = existing?.reviewCount ?? 0;

    const sm2 = computeSm2Review(rating, prevRepetition, prevIntervalDays, prevEaseFactor);
    const lastReviewedAt = new Date();

    const review = await this.prisma.userFlashcardReview.upsert({
      where: {
        userId_cardId: { userId, cardId },
      },
      update: {
        repetition: sm2.repetition,
        intervalDays: sm2.intervalDays,
        easeFactor: sm2.easeFactor,
        nextReviewAt: sm2.nextReviewAt,
        lastReviewedAt,
        lastRating: rating,
        reviewCount: prevReviewCount + 1,
      },
      create: {
        userId,
        cardId,
        repetition: sm2.repetition,
        intervalDays: sm2.intervalDays,
        easeFactor: sm2.easeFactor,
        nextReviewAt: sm2.nextReviewAt,
        lastReviewedAt,
        lastRating: rating,
        reviewCount: 1,
      },
    });

    return {
      cardId: review.cardId,
      repetition: review.repetition,
      intervalDays: review.intervalDays,
      easeFactor: review.easeFactor,
      nextReviewAt: review.nextReviewAt.toISOString(),
      lastReviewedAt: review.lastReviewedAt?.toISOString() || lastReviewedAt.toISOString(),
      rating,
    };
  }

  async deleteDeck(userId: string, deckId: string): Promise<{ success: boolean }> {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: {
        id: deckId,
        workspace: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      include: { workspace: true },
    });

    if (!deck) {
      throw new NotFoundException('Flashcard deck not found or access denied.');
    }

    // Only deck creator or workspace owner can delete the deck
    if (deck.createdById !== userId && deck.workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the deck creator or workspace owner can delete this deck.');
    }

    await this.prisma.flashcardDeck.delete({
      where: { id: deckId },
    });

    return { success: true };
  }
}
