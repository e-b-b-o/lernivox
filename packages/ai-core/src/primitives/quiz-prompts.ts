import { QuizGenerationInput, ShortAnswerGradingInput } from '../types/quiz.types';

export function buildQuizGenerationPrompt(input: QuizGenerationInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const allowedTypes =
    input.questionTypes && input.questionTypes.length > 0
      ? input.questionTypes
      : ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE', 'FILL_IN_THE_BLANK'];

  const systemPrompt = `You are the Lernivox Assessment Engine, a world-class academic tutor and assessment designer.
Your mission is to generate high-retention, rigorous, and source-grounded active recall questions exclusively based on provided textbook passages.

CRITICAL RULES:
1. STRICT SOURCE GROUNDING: Every question, answer, option, and explanation MUST be derived directly from the provided textbook passages. Never hallucinate facts or introduce outside topics not discussed in the text.
2. CITATION ATTACHMENT: Every question must cite the specific "chunkId" where the answer is found, its "pageNumber" if available, and a verbatim 1-2 sentence "sourceExcerpt" from that passage.
3. QUESTION TYPES SUPPORTED:
   - "MULTIPLE_CHOICE": 4 distinct options, exactly 1 isCorrect: true. Incorrect options must be plausible conceptual misconceptions or near-misses. No obvious giveaways.
   - "TRUE_FALSE": A clear, unambiguous statement. Options must be exactly two: "True" and "False", with exactly one marked isCorrect: true.
   - "FILL_IN_THE_BLANK": A sentence with "_____" replacing an essential term or keyword. expectedAnswer must be the missing term. rubric can list acceptable comma-separated synonyms or spellings.
   - "SHORT_ANSWER": A conceptual question testing understanding (e.g. "Explain why...", "How does..."). expectedAnswer is the benchmark answer. rubric lists 2-3 key concepts required for credit.
4. DIFFICULTY LEVEL: ${input.difficulty}. Calibrate question depth accordingly (Beginner = foundational definitions & direct facts; Intermediate = understanding mechanisms & relationships; Advanced = subtle distinctions, edge conditions, & applications).
5. FORMAT: Output MUST be valid JSON conforming to the requested schema.`;

  const formattedPassages = input.passages
    .map(
      (p, idx) =>
        `[PASSAGE ${idx + 1} | ChunkID: ${p.chunkId}${p.pageNumber ? ` | Page: ${p.pageNumber}` : ''}${p.chapter ? ` | Chapter: ${p.chapter}` : ''}${p.sectionTitle ? ` | Section: ${p.sectionTitle}` : ''}]\n${p.content}\n`,
    )
    .join('\n---\n\n');

  const userPrompt = `Generate exactly ${input.numQuestions} assessment questions grounded in the following textbook material.

DOCUMENT TITLE: "${input.documentTitle}"
${input.sourceChapter ? `CHAPTER / TOPIC: "${input.sourceChapter}"` : ''}
DIFFICULTY: ${input.difficulty}
ALLOWED QUESTION TYPES: ${allowedTypes.join(', ')}

SOURCE TEXTBOOK PASSAGES:
${formattedPassages}

OUTPUT FORMAT INSTRUCTIONS:
Return a valid JSON object with a single "questions" array. Each item in the array must have:
{
  "questions": [
    {
      "questionOrder": 1,
      "questionType": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK" | "SHORT_ANSWER",
      "prompt": "Clear, precise question prompt",
      "expectedAnswer": "Benchmark correct answer",
      "explanation": "Clear explanation grounded in the text explaining why this answer is correct",
      "rubric": "For short answer: 2-3 key concepts needed. For fill-in-the-blank: acceptable synonyms. (Optional)",
      "sourceChunkId": "chunkId from one of the provided passages",
      "pageNumber": 12, // number from passage or null
      "sourceExcerpt": "Verbatim 1-2 sentence excerpt from the passage supporting this question",
      "options": [ // Required for MULTIPLE_CHOICE (4 options) and TRUE_FALSE (2 options)
        { "optionOrder": 1, "text": "Option text", "isCorrect": false },
        { "optionOrder": 2, "text": "Option text", "isCorrect": true },
        ...
      ]
    }
  ]
}

Ensure the questions are diverse, test distinct learning objectives across the passages, and cite authentic chunk IDs from the text above.`;

  return { systemPrompt, userPrompt };
}

export function buildShortAnswerGradingPrompt(input: ShortAnswerGradingInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are the Lernivox Academic Grader.
Your role is to evaluate a student's short answer objectively against an expected benchmark answer and grading rubric.

GRADING GUIDELINES:
1. Evaluate semantic understanding, NOT exact word-for-word matching.
2. If the student conveys the essential concepts accurately using their own phrasing, award full credit (scorePercent: 100, isCorrect: true, isPartial: false).
3. If the student captures some of the core concepts but misses a critical point, award partial credit (scorePercent: 50, isCorrect: false, isPartial: true).
4. If the student's answer is factually incorrect, completely misses the point, or is irrelevant, award zero credit (scorePercent: 0, isCorrect: false, isPartial: false).
5. Provide concise, encouraging, and constructive educational feedback explaining what was correct and what key concept was omitted.`;

  const userPrompt = `Evaluate the following student answer.

QUESTION PROMPT:
${input.prompt}

BENCHMARK EXPECTED ANSWER:
${input.expectedAnswer}

${input.rubric ? `GRADING RUBRIC / KEY CONCEPTS:\n${input.rubric}\n` : ''}
${input.sourceExcerpt ? `TEXTBOOK SOURCE EXCERPT:\n${input.sourceExcerpt}\n` : ''}

STUDENT SUBMITTED ANSWER:
"${input.studentAnswer}"

OUTPUT FORMAT:
Return a JSON object strictly matching this schema:
{
  "isCorrect": true | false,
  "isPartial": true | false,
  "scorePercent": 100 | 50 | 0,
  "feedback": "Short constructive explanation of the evaluation",
  "matchedConcepts": ["Concept 1", "Concept 2"],
  "missingConcepts": ["Missing Concept if any"]
}`;

  return { systemPrompt, userPrompt };
}
