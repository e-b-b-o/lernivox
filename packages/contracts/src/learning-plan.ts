import { QuizRangeScopeDto } from './quizzes';

export type PlanLifecycleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type PlanActivityType = 'READ' | 'EXPLAIN' | 'QUIZ' | 'FLASHCARDS' | 'RECAP';

export interface PlanActivityDto {
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
  quizId?: string;
  deckId?: string;
}

export interface StudySessionDto {
  id: string;
  studyPlanId: string;
  sessionNumber: number;
  orderIndex: number;
  scheduledDate: string; // ISO date
  title: string;
  description?: string;
  status: SessionStatus;
  estimatedMinutes: number;
  sourcePageStart?: number;
  sourcePageEnd?: number;
  sourceChapter?: string;
  topicKey?: string;
  activities: PlanActivityDto[];
  completedAt?: string;
  createdAt: string;
}

export interface PlanPreferencesDto {
  daysPerWeek: number;
  minutesPerSession: number;
  targetOutcome?: string;
  targetExamDate?: string;
  preferredDays?: string[]; // e.g. ["MON", "WED", "FRI"]
  difficultyPreference?: 'GENTLE' | 'MODERATE' | 'INTENSIVE';
}

export interface AdaptationHistoryEntryDto {
  adaptedAt: string; // ISO date
  trigger: 'QUIZ_PERFORMANCE' | 'FLASHCARD_RETENTION' | 'READING_PACE' | 'MANUAL';
  reason: string;
  modifications: string[];
}

export interface LearningPlanDto {
  id: string;
  userId: string;
  workspaceId: string;
  documentId?: string;
  title: string;
  goal?: string;
  preferences: PlanPreferencesDto;
  lifecycleStatus: PlanLifecycleStatus;
  estimatedDurationWeeks?: number;
  adaptationHistory: AdaptationHistoryEntryDto[];
  sessions: StudySessionDto[];
  progress: {
    totalSessions: number;
    completedSessions: number;
    percentComplete: number;
    currentSessionNumber?: number;
    estimatedMinutesRemaining: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlanOfferDto {
  shouldOffer: boolean;
  dismissed: boolean;
  activePlanId?: string;
  activePlanTitle?: string;
  reason?: string;
  recommendedGoal?: string;
}

export interface CreatePlanPreviewDto {
  goal: string;
  daysPerWeek: number;
  minutesPerSession: number;
  targetOutcome?: string;
  targetExamDate?: string;
  rangeScope?: QuizRangeScopeDto;
}

export interface StudySessionPreviewDto {
  sessionNumber: number;
  orderIndex: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  sourceChapter?: string;
  sourcePageStart?: number;
  sourcePageEnd?: number;
  topicKey?: string;
  activities: PlanActivityDto[];
}

export interface LearningPlanPreviewDto {
  title: string;
  goal: string;
  preferences: PlanPreferencesDto;
  estimatedDurationWeeks: number;
  totalSessions: number;
  totalMinutes: number;
  sourceGroundingSummary: {
    totalChapters: number;
    pageCount: number;
    focusTopics: string[];
  };
  sessions: StudySessionPreviewDto[];
}

export interface AcceptPlanDto {
  title: string;
  goal: string;
  preferences: PlanPreferencesDto;
  sessions: StudySessionPreviewDto[];
  targetExamDate?: string;
}

export interface UpdateSessionDto {
  status?: SessionStatus;
  activityId?: string;
  activityCompleted?: boolean;
}

export interface AdaptPlanDto {
  trigger?: 'AUTO' | 'MANUAL';
  focusTopics?: string[];
}

export interface UpdatePlanLifecycleDto {
  status: PlanLifecycleStatus;
}
