export type PlanActivityType = 'READ' | 'EXPLAIN' | 'QUIZ' | 'FLASHCARDS' | 'RECAP';
export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type TopicUnderstandingStatus = 'NOT_STARTED' | 'LEARNING' | 'NEEDS_REVIEW' | 'CONFIDENT';

export interface PlanGenerationChapter {
  title: string;
  pageStart: number;
  pageEnd: number;
  sectionCount?: number;
}

export interface PlanGenerationInput {
  documentTitle: string;
  totalPages: number;
  chapters: PlanGenerationChapter[];
  goal: string;
  daysPerWeek: number;
  minutesPerSession: number;
  targetOutcome?: string;
  targetExamDate?: string;
  selectedRange?: {
    startPage?: number;
    endPage?: number;
    chapterTitle?: string;
  };
  studentPerformance?: {
    needsReviewTopics?: string[];
    overdueFlashcardsCount?: number;
    averageQuizScorePercent?: number;
  };
}

export interface GeneratedPlanActivity {
  id: string;
  type: PlanActivityType;
  title: string;
  description?: string;
  estimatedMinutes: number;
  completed: boolean;
  pageStart?: number;
  pageEnd?: number;
  chapter?: string;
  topicKey?: string;
}

export interface GeneratedPlanSession {
  sessionNumber: number;
  orderIndex: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  sourceChapter: string;
  sourcePageStart: number;
  sourcePageEnd: number;
  topicKey: string;
  activities: GeneratedPlanActivity[];
}

export interface GeneratedPlanResult {
  success: boolean;
  title: string;
  goal: string;
  estimatedDurationWeeks: number;
  totalSessions: number;
  totalMinutes: number;
  sourceGroundingSummary: {
    totalChapters: number;
    pageCount: number;
    focusTopics: string[];
  };
  sessions: GeneratedPlanSession[];
  error?: string;
}

export interface AdaptPlanInput {
  existingSessions: Array<{
    id: string;
    sessionNumber: number;
    orderIndex: number;
    title: string;
    status: SessionStatus;
    sourceChapter?: string;
    sourcePageStart?: number;
    sourcePageEnd?: number;
    topicKey?: string;
    activities: GeneratedPlanActivity[];
    estimatedMinutes: number;
  }>;
  topicMatrix: Array<{
    topicKey: string;
    topicLabel: string;
    classification: TopicUnderstandingStatus;
    accuracyPercent: number;
  }>;
  overdueFlashcardsCount: number;
  recentFailedQuestionsCount: number;
  readingProgressPercent: number;
}

export interface AdaptPlanResult {
  adapted: boolean;
  reason: string;
  modifications: string[];
  updatedSessions: Array<{
    id?: string;
    sessionNumber: number;
    orderIndex: number;
    title: string;
    status: SessionStatus;
    sourceChapter?: string;
    sourcePageStart?: number;
    sourcePageEnd?: number;
    topicKey?: string;
    activities: GeneratedPlanActivity[];
    estimatedMinutes: number;
  }>;
}

