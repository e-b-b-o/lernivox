import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQuizQuestions,
  buildQuizGenerationPrompt,
  parseAndValidateQuizJson,
  gradeObjectiveQuestion,
  gradeFillInTheBlank,
  gradeShortAnswer,
  MockAiProvider,
} from '../dist/index.js';
import type { SourcePassageForQuiz, QuizGenerationInput } from '../dist/index.js';

describe('AI Core Quiz Generation & Grading Suite', () => {
  const samplePassages: SourcePassageForQuiz[] = [
    {
      chunkId: 'chunk-101',
      content:
        'The Central Processing Unit (CPU) executes instructions stored in main memory. The Arithmetic Logic Unit (ALU) carries out arithmetic and logic operations. Address translation is governed by the Memory Management Unit (MMU).',
      pageNumber: 15,
      chapter: 'Chapter 3: Computer Architecture',
    },
    {
      chunkId: 'chunk-102',
      content:
        'Paging divides virtual memory into fixed-size blocks called pages, while physical memory is partitioned into frames. A page fault occurs when a program attempts to access an address in a page not currently mapped in RAM.',
      pageNumber: 28,
      chapter: 'Chapter 4: Virtual Memory',
    },
  ];

  const defaultInput: QuizGenerationInput = {
    documentTitle: 'Operating System Principles',
    sourceChapter: 'Chapter 3: Computer Architecture',
    difficulty: 'MEDIUM',
    numQuestions: 4,
    passages: samplePassages,
  };

  it('1. should build sanitized quiz generation prompt with passage isolation', () => {
    const prompt = buildQuizGenerationPrompt(defaultInput);

    assert.ok(prompt.systemPrompt.includes('assessment designer'));
    assert.ok(prompt.userPrompt.includes('Operating System Principles'));
    assert.ok(prompt.userPrompt.includes('Chapter 3: Computer Architecture'));
    assert.ok(prompt.userPrompt.includes('SOURCE TEXTBOOK PASSAGES:'));
    assert.ok(prompt.userPrompt.includes('chunk-101'));
    assert.ok(prompt.userPrompt.includes('chunk-102'));
  });

  it('2. should generate grounded questions with MockAiProvider across all 4 types', async () => {
    const mockProvider = new MockAiProvider();
    const result = await generateQuizQuestions(mockProvider, defaultInput);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.questions.length, 4);

    const q1 = result.questions[0];
    assert.ok(q1);
    assert.strictEqual(q1.questionType, 'MULTIPLE_CHOICE');
    assert.strictEqual(q1.options?.length, 4);
    assert.strictEqual(q1.sourceChunkId, 'chunk-101');
    assert.strictEqual(q1.pageNumber, 15);

    const q2 = result.questions[1];
    assert.ok(q2);
    assert.strictEqual(q2.questionType, 'TRUE_FALSE');
    assert.strictEqual(q2.options?.length, 2);

    const q3 = result.questions[2];
    assert.ok(q3);
    assert.strictEqual(q3.questionType, 'FILL_IN_THE_BLANK');
    assert.ok(q3.expectedAnswer);

    const q4 = result.questions[3];
    assert.ok(q4);
    assert.strictEqual(q4.questionType, 'SHORT_ANSWER');
    assert.ok(q4.rubric);
  });

  it('3. should handle validation of valid and malformed raw AI JSON payloads', () => {
    const validJson = JSON.stringify({
      questions: [
        {
          questionOrder: 1,
          questionType: 'MULTIPLE_CHOICE',
          prompt: 'What unit executes arithmetic computations?',
          expectedAnswer: 'ALU',
          options: [
            { optionOrder: 1, text: 'ALU', isCorrect: true },
            { optionOrder: 2, text: 'MMU', isCorrect: false },
          ],
          explanation: 'The ALU performs arithmetic logic operations.',
          sourceChunkId: 'chunk-101',
          sourceExcerpt: 'The Arithmetic Logic Unit (ALU) carries out arithmetic',
          pageNumber: 15,
        },
      ],
    });

    const parsed = parseAndValidateQuizJson(validJson, defaultInput);
    assert.strictEqual(parsed.error, undefined);
    assert.strictEqual(parsed.validQuestions.length, 1);
    assert.strictEqual(parsed.validQuestions[0]?.expectedAnswer, 'ALU');

    // Malformed JSON check
    const badParsed = parseAndValidateQuizJson('Not valid JSON at all', defaultInput);
    assert.ok(badParsed.error);
    assert.strictEqual(badParsed.validQuestions.length, 0);
  });

  it('4. should grade objective questions deterministically', () => {
    const mockOptions = [
      { id: 'opt-1', text: 'ALU', isCorrect: true },
      { id: 'opt-2', text: 'MMU', isCorrect: false },
    ];

    // MULTIPLE_CHOICE correct
    const mcqCorrect = gradeObjectiveQuestion('MULTIPLE_CHOICE', 'opt-1', mockOptions);
    assert.strictEqual(mcqCorrect.isCorrect, true);
    assert.strictEqual(mcqCorrect.scorePercent, 100);

    // MULTIPLE_CHOICE wrong
    const mcqWrong = gradeObjectiveQuestion('MULTIPLE_CHOICE', 'opt-2', mockOptions);
    assert.strictEqual(mcqWrong.isCorrect, false);
    assert.strictEqual(mcqWrong.scorePercent, 0);

    // FILL_IN_THE_BLANK (with comma-separated rubric synonyms)
    const fitbCorrect = gradeFillInTheBlank('MMU', 'Memory Management Unit', 'mmu, memory unit');
    assert.strictEqual(fitbCorrect.isCorrect, true);
    assert.strictEqual(fitbCorrect.scorePercent, 100);

    const fitbWrong = gradeFillInTheBlank('ALU', 'Memory Management Unit', 'mmu, memory unit');
    assert.strictEqual(fitbWrong.isCorrect, false);
    assert.strictEqual(fitbWrong.scorePercent, 0);
  });

  it('5. should grade short answer submissions using AI semantics and token-overlap fallback', async () => {
    const mockProvider = new MockAiProvider();

    const result = await gradeShortAnswer(mockProvider, {
      prompt: 'Explain what causes a page fault.',
      expectedAnswer:
        'A page fault occurs when a program accesses a virtual memory address whose page is not in physical RAM.',
      rubric: 'Virtual memory address, page not in physical RAM, disk page swap',
      studentAnswer:
        'It happens when accessing an address whose page is not currently in physical memory or RAM.',
    });

    assert.ok(result.scorePercent >= 50);
    assert.ok(result.feedback.length > 0);

    // Completely wrong answer
    const wrongResult = await gradeShortAnswer(mockProvider, {
      prompt: 'Explain what causes a page fault.',
      expectedAnswer:
        'A page fault occurs when a program accesses a virtual memory address whose page is not in physical RAM.',
      rubric: 'Virtual memory address, page not in physical RAM, disk page swap',
      studentAnswer: 'It is a network collision on ethernet packets.',
    });

    assert.strictEqual(wrongResult.isCorrect, false);
    assert.strictEqual(wrongResult.scorePercent, 0);
  });
});
