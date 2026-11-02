export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'TRUE_FALSE'
  | 'FILL_IN_THE_BLANK';

export type QuizDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SourcePassageForQuiz {
  chunkId: string;
  pageNumber?: number | null;
  chapter?: string | null;
  sectionTitle?: string | null;
  content: string;
}

export interface QuizGenerationInput {
  documentTitle: string;
  sourceChapter?: string;
  passages: SourcePassageForQuiz[];
  numQuestions: number;
  difficulty: QuizDifficulty;
  questionTypes?: QuestionType[];
}

export interface GeneratedOption {
  optionOrder: number;
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  questionOrder: number;
  questionType: QuestionType;
  prompt: string;
  expectedAnswer: string;
  options?: GeneratedOption[];
  rubric?: string;
  explanation: string;
  sourceChunkId: string;
  sourceExcerpt: string;
  pageNumber?: number | null;
}

export interface QuizGenerationResult {
  success: boolean;
  questions: GeneratedQuestion[];
  error?: string;
}

export interface ShortAnswerGradingInput {
  prompt: string;
  expectedAnswer: string;
  rubric?: string;
  sourceExcerpt?: string;
  studentAnswer: string;
}

export interface GradingEvaluation {
  isCorrect: boolean;
  isPartial: boolean;
  scorePercent: number; // 0 to 100
  feedback: string;
  matchedConcepts?: string[];
  missingConcepts?: string[];
}
