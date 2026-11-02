/**
 * Quizzes and Active Recall Assessment Contracts for Lernivox
 */

export type QuizStatus = 'GENERATING' | 'READY' | 'FAILED';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'TRUE_FALSE'
  | 'FILL_IN_THE_BLANK';

export type QuizDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface CreateQuizRequestDto {
  title?: string;
  sourceChapter?: string;
  sectionId?: string;
  numQuestions?: number;
  difficulty?: QuizDifficulty;
  questionTypes?: QuestionType[];
}

export interface QuizOptionDto {
  id: string;
  optionOrder: number;
  text: string;
}

export interface QuizQuestionDto {
  id: string;
  questionOrder: number;
  questionType: QuestionType;
  prompt: string;
  options: QuizOptionDto[];
  pageNumber?: number | null;
  sourceChunkId?: string | null;
}

export interface QuizSummaryDto {
  id: string;
  userId: string;
  documentId: string | null;
  documentTitle?: string;
  title: string;
  description: string | null;
  sourceChapter: string | null;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  errorMessage: string | null;
  questionCount: number;
  bestScore?: number | null;
  attemptsCount: number;
  createdAt: string;
}

export interface QuizDetailDto {
  id: string;
  title: string;
  description: string | null;
  sourceChapter: string | null;
  documentId: string | null;
  documentTitle?: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  errorMessage: string | null;
  questions: QuizQuestionDto[];
  createdAt: string;
}

export interface StartQuizAttemptResponseDto {
  attemptId: string;
  quizId: string;
  startedAt: string;
  totalQuestions: number;
}

export interface SubmitAnswerItemDto {
  questionId: string;
  selectedOptionId?: string | null;
  submittedAnswer?: string | null;
}

export interface SubmitQuizAttemptRequestDto {
  answers: SubmitAnswerItemDto[];
}

export interface QuestionResultOptionDto {
  id: string;
  optionOrder: number;
  text: string;
  isCorrect: boolean;
}

export interface QuestionResultDto {
  questionId: string;
  questionOrder: number;
  questionType: QuestionType;
  prompt: string;
  submittedAnswer: string | null;
  selectedOptionId: string | null;
  expectedAnswer: string;
  isCorrect: boolean;
  isPartial: boolean;
  feedback: string | null;
  explanation: string | null;
  sourceExcerpt: string | null;
  pageNumber: number | null;
  sourceChunkId: string | null;
  options: QuestionResultOptionDto[];
}

export interface QuizAttemptResultDto {
  id: string;
  quizId: string;
  quizTitle: string;
  documentId: string | null;
  documentTitle: string | null;
  startedAt: string;
  completedAt: string | null;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isCompleted: boolean;
  results: QuestionResultDto[];
}

export interface GenerateQuizJobPayload {
  quizId: string;
  userId: string;
  documentId: string;
  sourceChapter?: string;
  numQuestions: number;
  difficulty: QuizDifficulty;
  questionTypes: QuestionType[];
}
