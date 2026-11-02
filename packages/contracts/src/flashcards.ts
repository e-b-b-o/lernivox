/**
 * Flashcards and Spaced Repetition (SM-2) Contracts for Lernivox
 */

import { QuizRangeScopeDto } from './quizzes';

export type FlashcardRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FlashcardItemDto {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string | null;
  pageNumber?: number | null;
  chapter?: string | null;
  sourceChunkId?: string | null;
  repetition?: number;
  intervalDays?: number;
  easeFactor?: number;
  nextReviewAt?: string | null;
  lastReviewedAt?: string | null;
  lastRating?: number | null;
}

export interface FlashcardDeckSummaryDto {
  id: string;
  workspaceId: string;
  documentId: string | null;
  documentTitle?: string | null;
  title: string;
  description?: string | null;
  cardCount: number;
  dueCardCount: number;
  sourceRange?: QuizRangeScopeDto | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDeckDetailDto extends FlashcardDeckSummaryDto {
  cards: FlashcardItemDto[];
}

export interface CreateFlashcardDeckDto {
  workspaceId: string;
  documentId?: string;
  title: string;
  description?: string;
  sourceRange?: QuizRangeScopeDto;
  cards?: Array<{
    front: string;
    back: string;
    hint?: string;
    pageNumber?: number;
    chapter?: string;
    sourceChunkId?: string;
  }>;
}

export interface GenerateFlashcardsRequestDto {
  workspaceId: string;
  documentId?: string;
  title?: string;
  rangeScope?: QuizRangeScopeDto;
  cardCount?: number;
}

export interface ReviewFlashcardDto {
  rating: FlashcardRating;
}

export interface FlashcardReviewResultDto {
  cardId: string;
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  rating: FlashcardRating;
}

export interface GenerateFlashcardsJobPayload {
  deckId: string;
  userId: string;
  workspaceId: string;
  documentId: string;
  title: string;
  rangeScope?: QuizRangeScopeDto;
  cardCount: number;
}
