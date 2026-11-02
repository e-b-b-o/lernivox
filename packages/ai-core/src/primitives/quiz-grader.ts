import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  GradingEvaluation,
  ShortAnswerGradingInput,
} from '../types/quiz.types';
import { buildShortAnswerGradingPrompt } from './quiz-prompts';

export function normalizeAnswerText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ');
}

export function gradeObjectiveQuestion(
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE',
  selectedOptionId: string | null | undefined,
  options: Array<{ id: string; isCorrect: boolean; text?: string }>,
): GradingEvaluation {
  if (!selectedOptionId) {
    return {
      isCorrect: false,
      isPartial: false,
      scorePercent: 0,
      feedback: 'No option was selected.',
    };
  }

  const selected = options.find((o) => o.id === selectedOptionId);
  if (!selected) {
    return {
      isCorrect: false,
      isPartial: false,
      scorePercent: 0,
      feedback: 'Selected option not found in question choices.',
    };
  }

  const isCorrect = Boolean(selected.isCorrect);
  return {
    isCorrect,
    isPartial: false,
    scorePercent: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? 'Correct! Your selected answer matches the textbook explanation.'
      : 'Incorrect. Review the correct option and textbook explanation below.',
  };
}

export function gradeFillInTheBlank(
  submittedAnswer: string | null | undefined,
  expectedAnswer: string,
  rubric?: string,
): GradingEvaluation {
  const normSubmitted = normalizeAnswerText(submittedAnswer);
  if (!normSubmitted) {
    return {
      isCorrect: false,
      isPartial: false,
      scorePercent: 0,
      feedback: 'No answer was provided.',
    };
  }

  const normExpected = normalizeAnswerText(expectedAnswer);
  const acceptedList = [normExpected];

  if (rubric) {
    const rawVariants = rubric.split(/[,;]/);
    for (const v of rawVariants) {
      const normV = normalizeAnswerText(v);
      if (normV) acceptedList.push(normV);
    }
  }

  const isCorrect = acceptedList.includes(normSubmitted);
  return {
    isCorrect,
    isPartial: false,
    scorePercent: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? 'Correct! Exact terminology identified.'
      : `Incorrect. Expected: "${expectedAnswer}".`,
  };
}

export async function gradeShortAnswer(
  aiProvider: AiProvider,
  input: ShortAnswerGradingInput,
): Promise<GradingEvaluation> {
  const normSubmitted = normalizeAnswerText(input.studentAnswer);
  if (!normSubmitted || normSubmitted.length < 2) {
    return {
      isCorrect: false,
      isPartial: false,
      scorePercent: 0,
      feedback: 'No substantive answer provided.',
      missingConcepts: ['Complete conceptual explanation'],
    };
  }

  // Handle MockAiProvider deterministically
  if (aiProvider.providerName === 'mock') {
    const expectedKeywords = input.expectedAnswer
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const studentWords = new Set(normSubmitted.split(/\s+/));
    const matched = expectedKeywords.filter((k) => studentWords.has(k));
    const ratio = matched.length / (expectedKeywords.length || 1);

    if (ratio >= 0.5) {
      return {
        isCorrect: true,
        isPartial: false,
        scorePercent: 100,
        feedback: 'Excellent explanation. Accurately captured the core concepts.',
        matchedConcepts: matched,
      };
    } else if (ratio >= 0.2) {
      return {
        isCorrect: false,
        isPartial: true,
        scorePercent: 50,
        feedback: 'Partially correct. Identified some related ideas, but missed key principles.',
        matchedConcepts: matched,
        missingConcepts: ['Complete explanation of required mechanisms'],
      };
    } else {
      return {
        isCorrect: false,
        isPartial: false,
        scorePercent: 0,
        feedback: 'Incorrect. Does not convey the required textbook concepts.',
        missingConcepts: ['Accurate conceptual basis'],
      };
    }
  }

  // Live AI semantic grading
  const { systemPrompt, userPrompt } = buildShortAnswerGradingPrompt(input);

  try {
    const response = await aiProvider.generateCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.1,
      responseFormat: 'json',
      maxTokens: 500,
    });

    let cleaned = response.content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    const isCorrect = Boolean(parsed.isCorrect);
    const isPartial = Boolean(parsed.isPartial);
    const scorePercent = typeof parsed.scorePercent === 'number' ? parsed.scorePercent : isCorrect ? 100 : isPartial ? 50 : 0;
    const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : isCorrect ? 'Correct.' : 'Incorrect.';

    return {
      isCorrect,
      isPartial,
      scorePercent,
      feedback,
      matchedConcepts: Array.isArray(parsed.matchedConcepts) ? parsed.matchedConcepts : undefined,
      missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : undefined,
    };
  } catch (err) {
    // Fallback: heuristic token overlap so student is never blocked
    const expectedKeywords = input.expectedAnswer
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const studentWords = new Set(normSubmitted.split(/\s+/));
    const matched = expectedKeywords.filter((k) => studentWords.has(k));
    const ratio = matched.length / (expectedKeywords.length || 1);

    const isCorrect = ratio >= 0.5;
    const isPartial = !isCorrect && ratio >= 0.25;

    return {
      isCorrect,
      isPartial,
      scorePercent: isCorrect ? 100 : isPartial ? 50 : 0,
      feedback: isCorrect
        ? 'Well explained. Your answer covers the essential ideas.'
        : isPartial
        ? 'Partially correct explanation.'
        : 'Answer evaluated as incomplete based on key concepts.',
      matchedConcepts: matched,
    };
  }
}
