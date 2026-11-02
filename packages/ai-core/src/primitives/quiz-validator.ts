import {
  GeneratedOption,
  GeneratedQuestion,
  QuestionType,
  QuizGenerationInput,
  SourcePassageForQuiz,
} from '../types/quiz.types';

export function parseAndValidateQuizJson(
  rawJson: string,
  input: QuizGenerationInput,
): { validQuestions: GeneratedQuestion[]; error?: string } {
  // 1. Strip markdown code fences if model wrapped response in ```json ... ```
  let cleaned = rawJson.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt relaxed extraction of JSON array or object
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return { validQuestions: [], error: 'Failed to parse model response as JSON.' };
      }
    } else {
      return { validQuestions: [], error: 'No JSON object or array found in model response.' };
    }
  }

  // 2. Extract questions array
  let rawList: unknown[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      rawList = obj.questions;
    } else if (Array.isArray(obj.data)) {
      rawList = obj.data;
    }
  }

  if (!rawList || rawList.length === 0) {
    return { validQuestions: [], error: 'Generated quiz response contained an empty questions array.' };
  }

  const validChunkIds = new Set(input.passages.map((p) => p.chunkId));
  const fallbackChunk: SourcePassageForQuiz = input.passages[0] || {
    chunkId: 'chunk-fallback',
    content: 'Textbook excerpt',
    pageNumber: 1,
  };
  const validChunkMap = new Map(input.passages.map((p) => [p.chunkId, p]));

  const validQuestions: GeneratedQuestion[] = [];
  const seenPrompts = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') continue;

    const q = item as Record<string, unknown>;

    const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
    if (!prompt || prompt.length < 5) continue;

    // Check for duplicate prompts
    const normalizedPrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenPrompts.has(normalizedPrompt)) continue;
    seenPrompts.add(normalizedPrompt);

    // Validate Question Type
    let questionType: QuestionType = 'MULTIPLE_CHOICE';
    const rawType = String(q.questionType || '').toUpperCase();
    if (
      rawType === 'MULTIPLE_CHOICE' ||
      rawType === 'SHORT_ANSWER' ||
      rawType === 'TRUE_FALSE' ||
      rawType === 'FILL_IN_THE_BLANK'
    ) {
      questionType = rawType as QuestionType;
    }

    const expectedAnswer =
      typeof q.expectedAnswer === 'string' ? q.expectedAnswer.trim() : '';
    if (!expectedAnswer) continue;

    const explanation =
      typeof q.explanation === 'string' && q.explanation.trim()
        ? q.explanation.trim()
        : 'Based on the textbook explanation.';

    const rubric = typeof q.rubric === 'string' ? q.rubric.trim() : undefined;

    // Validate Chunk ID & Excerpt
    let sourceChunkId = typeof q.sourceChunkId === 'string' ? q.sourceChunkId.trim() : '';
    if (!validChunkIds.has(sourceChunkId)) {
      sourceChunkId = fallbackChunk.chunkId;
    }

    const passageMeta = validChunkMap.get(sourceChunkId) || fallbackChunk;
    const pageNumber =
      typeof q.pageNumber === 'number'
        ? q.pageNumber
        : passageMeta?.pageNumber ?? null;

    const sourceExcerpt =
      typeof q.sourceExcerpt === 'string' && q.sourceExcerpt.trim()
        ? q.sourceExcerpt.trim()
        : (passageMeta?.content ? passageMeta.content.slice(0, 200).trim() + '...' : 'From source text.');

    // Validate Options
    let options: GeneratedOption[] | undefined;
    if (questionType === 'MULTIPLE_CHOICE') {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const parsedOptions: GeneratedOption[] = [];

      for (let j = 0; j < rawOptions.length; j++) {
        const opt = rawOptions[j];
        if (opt && typeof opt === 'object') {
          const optObj = opt as Record<string, unknown>;
          const text = typeof optObj.text === 'string' ? optObj.text.trim() : '';
          if (text) {
            parsedOptions.push({
              optionOrder: j + 1,
              text,
              isCorrect: Boolean(optObj.isCorrect),
            });
          }
        }
      }

      // Ensure at least one correct option exists
      if (parsedOptions.length >= 2) {
        const hasCorrect = parsedOptions.some((o) => o.isCorrect);
        if (!hasCorrect) {
          // If expectedAnswer matches an option text, mark that
          const matchIdx = parsedOptions.findIndex(
            (o) => o.text.toLowerCase() === expectedAnswer.toLowerCase(),
          );
          if (matchIdx >= 0 && parsedOptions[matchIdx]) {
            parsedOptions[matchIdx]!.isCorrect = true;
          } else if (parsedOptions[0]) {
            parsedOptions[0].isCorrect = true;
          }
        }
        // Ensure not all are correct
        const correctCount = parsedOptions.filter((o) => o.isCorrect).length;
        if (correctCount > 1) {
          let kept = false;
          for (const o of parsedOptions) {
            if (o.isCorrect) {
              if (!kept) kept = true;
              else o.isCorrect = false;
            }
          }
        }
        options = parsedOptions;
      } else {
        // Fallback options
        options = [
          { optionOrder: 1, text: expectedAnswer, isCorrect: true },
          { optionOrder: 2, text: 'Alternative explanation', isCorrect: false },
          { optionOrder: 3, text: 'Opposite condition', isCorrect: false },
          { optionOrder: 4, text: 'None of the above', isCorrect: false },
        ];
      }
    } else if (questionType === 'TRUE_FALSE') {
      const isTrueCorrect =
        expectedAnswer.toLowerCase().includes('true') ||
        expectedAnswer.toLowerCase() === 't';

      options = [
        { optionOrder: 1, text: 'True', isCorrect: isTrueCorrect },
        { optionOrder: 2, text: 'False', isCorrect: !isTrueCorrect },
      ];
    }

    validQuestions.push({
      questionOrder: validQuestions.length + 1,
      questionType,
      prompt,
      expectedAnswer,
      options,
      rubric,
      explanation,
      sourceChunkId,
      sourceExcerpt,
      pageNumber,
    });
  }

  return { validQuestions };
}
