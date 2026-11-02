/**
 * Workspace Learning Progress Contracts for Lernivox
 * Purely derived from real persisted learning data (zero fabricated scores)
 */

export type TopicUnderstandingStatus = 'NOT_STARTED' | 'LEARNING' | 'NEEDS_REVIEW' | 'CONFIDENT';

export interface TopicUnderstandingDto {
  id: string; // section or chapter identifier
  title: string;
  pageNumber?: number | null;
  status: TopicUnderstandingStatus;
  quizzesAttempted: number;
  successRate: number; // 0 - 100 percentage
  failedQuestionsCount: number;
  flashcardsCount: number;
  flashcardsMastered: number;
  lastStudiedAt?: string | null;
}

export interface WorkspaceReadingProgressDto {
  currentPage: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
}

export interface WorkspaceAssessmentProgressDto {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  latestScore: number | null;
  totalFailedQuestions: number;
  recentAttempts: Array<{
    attemptId: string;
    quizId: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}

export interface WorkspaceFlashcardProgressDto {
  totalDecks: number;
  totalCards: number;
  cardsReviewed: number;
  cardsDue: number;
  cardsMastered: number; // intervalDays >= 14 or repetition >= 3
  cardsNeedingReview: number; // lastRating === 1 or 2
  retentionRate: number; // percentage of ratings >= 3
}

export interface WorkspaceProgressOverviewDto {
  workspaceId: string;
  workspaceName: string;
  documentTitle: string;
  reading: WorkspaceReadingProgressDto;
  assessment: WorkspaceAssessmentProgressDto;
  flashcards: WorkspaceFlashcardProgressDto;
  topics: TopicUnderstandingDto[];
  overallStatus: 'GETTING_STARTED' | 'IN_PROGRESS' | 'WELL_PREPARED' | 'EXAM_READY';
}
