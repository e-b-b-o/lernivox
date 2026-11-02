import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTutorPrompt,
  TUTOR_PROMPT_VERSION,
  validateAndMapCitations,
  extractVerbatimSnippet,
  parseTutorResponse,
  extractStructuredSections,
  isUnsupportedResponse,
  MockAiProvider,
} from '../dist/index.js';
import type { RetrievedPassage } from '../dist/index.js';

describe('AI Core Tutor RAG Engine Tests', () => {
  const samplePassages: RetrievedPassage[] = [
    {
      sourceId: 'S1',
      chunkId: 'chunk_101',
      documentId: 'doc_abc',
      documentTitle: 'New Testament History & Literature',
      content: 'The Hellenistic period in Judea began after the conquests of Alexander the Great in 332 BCE. This led to substantial cultural tensions between Greek and traditional Jewish customs.',
      pageNumber: 42,
      chapter: 'Chapter 2: The Hellenistic Context',
      sectionTitle: 'Alexander and the Diadochi',
      similarity: 0.89,
    },
    {
      sourceId: 'S2',
      chunkId: 'chunk_102',
      documentId: 'doc_abc',
      documentTitle: 'New Testament History & Literature',
      content: 'The Synoptic Problem examines the literary relationship between Matthew, Mark, and Luke. The Two-Source Hypothesis argues Mark was written first.',
      pageNumber: 88,
      chapter: 'Chapter 5: The Synoptic Gospels',
      sectionTitle: 'Literary Dependence',
      similarity: 0.84,
    },
  ];

  it('1. should construct grounded prompt with version, untrusted data isolation and recent history windowing', () => {
    const prompt = buildTutorPrompt({
      documentTitle: 'New Testament History & Literature',
      studentQuestion: 'What started the Hellenistic period in Judea?',
      recentHistory: [
        { role: 'user', content: 'Turn 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Turn 2' },
        { role: 'assistant', content: 'Response 2' },
        { role: 'user', content: 'Turn 3' },
        { role: 'assistant', content: 'Response 3' },
        { role: 'user', content: 'Turn 4' },
        { role: 'assistant', content: 'Response 4' },
      ],
      retrievedPassages: samplePassages,
    });

    assert.ok(prompt.systemPrompt.includes(TUTOR_PROMPT_VERSION));
    assert.ok(prompt.systemPrompt.includes('<<<SOURCE_PASSAGES>>>'));
    assert.ok(prompt.systemPrompt.includes('UNTRUSTED DATA'));
    assert.ok(prompt.systemPrompt.includes('Would you like me to explain this using additional general knowledge?'));

    // Verify recent history windowing (last 6 messages + current turn = 7 messages)
    assert.strictEqual(prompt.messages.length, 7);
    const lastMsg = prompt.messages[prompt.messages.length - 1];
    assert.ok(lastMsg.content.includes('<<<START SOURCE [S1]'));
    assert.ok(lastMsg.content.includes('Alexander the Great'));
    assert.ok(lastMsg.content.includes('STUDENT QUESTION: What started the Hellenistic period in Judea?'));
  });

  it('2. should validate citations against retrieved passages and reject hallucinated source IDs', () => {
    const rawAnswer =
      'Alexander the Great conquered Judea in 332 BCE [S1]. Some claims exist regarding later conflicts [S99]. The Synoptic problem is also relevant [S2].';

    const citations = validateAndMapCitations(rawAnswer, samplePassages);

    assert.strictEqual(citations.length, 2);
    assert.strictEqual(citations[0].sourceId, 'S1');
    assert.strictEqual(citations[0].chunkId, 'chunk_101');
    assert.strictEqual(citations[0].pageNumber, 42);
    assert.strictEqual(citations[0].relevanceScore, 0.89);
    assert.ok(citations[0].quoteSnippet.includes('Hellenistic period in Judea'));

    assert.strictEqual(citations[1].sourceId, 'S2');
    assert.strictEqual(citations[1].chunkId, 'chunk_102');
    assert.strictEqual(citations[1].pageNumber, 88);

    // Verify [S99] was safely rejected
    assert.ok(!citations.some((c) => c.sourceId === 'S99'));
  });

  it('3. should deduplicate repeated citations for the same chunk', () => {
    const rawAnswer =
      'First claim [S1]. Second supporting sentence [S1]. Multiple tags together [S1, S2].';

    const citations = validateAndMapCitations(rawAnswer, samplePassages);
    assert.strictEqual(citations.length, 2);
    const s1Citations = citations.filter((c) => c.sourceId === 'S1');
    assert.strictEqual(s1Citations.length, 1);
  });

  it('4. should extract verbatim snippet from passage', () => {
    const text = 'Short text sentence.';
    const snippet = extractVerbatimSnippet(text);
    assert.strictEqual(snippet, 'Short text sentence.');

    const longText = 'First sentence. ' + 'Second sentence. '.repeat(20);
    const longSnippet = extractVerbatimSnippet(longText, 60);
    assert.ok(longSnippet.length <= 70);
    assert.ok(longSnippet.includes('First sentence.'));
  });

  it('5. should identify unsupported question responses accurately', () => {
    const unsupportedText =
      'The available textbook ("New Testament History & Literature") does not adequately cover quantum computing. Would you like me to explain this using additional general knowledge?';
    assert.strictEqual(isUnsupportedResponse(unsupportedText), true);

    const normalGroundedText =
      'According to the textbook, Alexander the Great conquered Judea in 332 BCE [S1].';
    assert.strictEqual(isUnsupportedResponse(normalGroundedText), false);
  });

  it('6. should extract structured teaching sections from formatted markdown', () => {
    const responseWithSections = `
### Learning Objective
Understand the Two-Source Hypothesis in synoptic gospel studies.

### Simple Explanation
Imagine two students wrote reports where one copied from the other [S2].

### Textbook Method
The author compares Markan priority with Matthew and Luke.

### Worked Example
Comparing Mark 1:1 with Matthew 3:1.

### Understanding Check
Why do scholars believe Mark was written first rather than Matthew?

### Recap
Mark was the earliest written gospel used as a primary source.
    `;

    const sections = extractStructuredSections(responseWithSections);
    assert.ok(sections);
    assert.strictEqual(sections.learningObjective, 'Understand the Two-Source Hypothesis in synoptic gospel studies.');
    assert.ok(sections.simpleExplanation?.includes('Imagine two students'));
    assert.ok(sections.understandingCheck?.includes('Why do scholars believe'));
    assert.strictEqual(sections.recap, 'Mark was the earliest written gospel used as a primary source.');
  });

  it('7. should parse complete tutor response and calculate confidence scores', () => {
    const rawAnswer = `
### Simple Explanation
Alexander the Great began the Hellenistic era in 332 BCE [S1].

### Recap
Alexander's conquests initiated Hellenism in Judea.
    `;

    const parsed = parseTutorResponse(rawAnswer, samplePassages);
    assert.strictEqual(parsed.citations.length, 1);
    assert.strictEqual(parsed.isUnsupportedQuestion, false);
    assert.strictEqual(parsed.confidenceScore, 0.89);
    assert.strictEqual(parsed.structuredSections?.recap, "Alexander's conquests initiated Hellenism in Judea.");
  });

  it('8. should work deterministically with MockAiProvider for zero-quota testing', async () => {
    const mockProvider = new MockAiProvider(768);
    const embeddings = await mockProvider.generateEmbeddings(['Test question embedding']);
    assert.strictEqual(embeddings.length, 1);
    assert.strictEqual(embeddings[0].embedding.length, 768);

    const completion = await mockProvider.generateCompletion({
      messages: [{ role: 'user', content: 'What is Hellenism?' }],
      systemPrompt: 'You are Lernivox Tutor',
    });
    assert.ok(completion.content.length > 0);
    assert.strictEqual(completion.finishReason, 'STOP');
  });
});
