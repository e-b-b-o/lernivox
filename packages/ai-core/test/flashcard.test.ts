import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockAiProvider, generateFlashcards } from '../dist/index.js';
import type { SourcePassageForFlashcard } from '../dist/index.js';

describe('AI Core Flashcard Generation Suite', () => {
  const mockPassages: SourcePassageForFlashcard[] = [
    {
      chunkId: 'chunk-test-1',
      pageNumber: 12,
      chapter: 'Chapter 2 — Operating System Structures',
      sectionTitle: '2.1 System Services',
      content:
        'An operating system provides an environment for the execution of programs. It provides certain services to programs and to the users of those programs. The specific services provided, of course, differ from one operating system to another, but we can identify common classes.',
    },
  ];

  it('1. should return error if passages are empty', async () => {
    const provider = new MockAiProvider();
    const result = await generateFlashcards(provider, {
      documentTitle: 'OS Concepts',
      passages: [],
      cardCount: 5,
    });

    assert.equal(result.success, false);
    assert.equal(result.cards.length, 0);
    assert.match(result.error || '', /No readable textbook passages/);
  });

  it('2. should generate grounded cards with MockAiProvider deterministically', async () => {
    const provider = new MockAiProvider();
    const result = await generateFlashcards(provider, {
      documentTitle: 'OS Concepts',
      sourceRangeSummary: 'Chapter 2 — Operating System Structures',
      passages: mockPassages,
      cardCount: 3,
    });

    assert.equal(result.success, true);
    assert.equal(result.cards.length, 3);
    assert.ok(result.cards[0]?.front);
    assert.ok(result.cards[0]?.back);
    assert.equal(result.cards[0]?.sourceChunkId, 'chunk-test-1');
  });
});
