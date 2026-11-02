import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePdfOutlineTree,
  extractDocxHeadings,
  extractTextHeadings,
  type RawPdfOutlineNode,
} from '../dist/index.js';

describe('Deterministic Outline Extractor Tests (Zero AI spend)', () => {
  it('1. should resolve hierarchical PDF outline with nested children and page destinations', async () => {
    const rawNodes: RawPdfOutlineNode[] = [
      {
        title: 'Chapter 1: Foundations',
        dest: 'dest_ch1',
        items: [
          {
            title: '1.1 Axioms',
            dest: ['pageRef1', { name: 'XYZ' }, 0, 0, null],
          },
          {
            title: '1.2 Definitions',
            dest: 'dest_def',
          },
        ],
      },
      {
        title: 'Chapter 2: Vector Spaces',
        dest: 'dest_ch2',
      },
    ];

    const destinationMap: Record<string, number> = {
      dest_ch1: 1,
      dest_def: 14,
      dest_ch2: 45,
    };

    const resolveDest = async (dest: any): Promise<number | null> => {
      if (typeof dest === 'string') {
        return destinationMap[dest] ?? null;
      }
      if (Array.isArray(dest) && dest[0] === 'pageRef1') {
        return 7;
      }
      return null;
    };

    const resolved = await resolvePdfOutlineTree(rawNodes, resolveDest);

    assert.equal(resolved.length, 4);
    assert.equal(resolved[0]?.title, 'Chapter 1: Foundations');
    assert.equal(resolved[0]?.pageNumber, 1);
    assert.equal(resolved[0]?.level, 1);
    assert.equal(resolved[0]?.isNative, true);

    // Nested child 1.1 Axioms
    assert.equal(resolved[1]?.title, '1.1 Axioms');
    assert.equal(resolved[1]?.pageNumber, 7);
    assert.equal(resolved[1]?.level, 2);

    // Nested child 1.2 Definitions
    assert.equal(resolved[2]?.title, '1.2 Definitions');
    assert.equal(resolved[2]?.pageNumber, 14);
    assert.equal(resolved[2]?.level, 2);

    // Chapter 2
    assert.equal(resolved[3]?.title, 'Chapter 2: Vector Spaces');
    assert.equal(resolved[3]?.pageNumber, 45);
    assert.equal(resolved[3]?.level, 1);
  });

  it('2. should gracefully handle unresolved or null destinations without throwing', async () => {
    const rawNodes: RawPdfOutlineNode[] = [
      {
        title: 'Corrupted Dest Item',
        dest: 'unknown_destination',
      },
      {
        title: 'Missing Dest Item',
        dest: null,
      },
    ];

    const resolveDest = async () => null;
    const resolved = await resolvePdfOutlineTree(rawNodes, resolveDest);

    assert.equal(resolved.length, 2);
    // Graceful fallback to page 1
    assert.equal(resolved[0]?.pageNumber, 1);
    assert.equal(resolved[1]?.pageNumber, 1);
  });

  it('3. should return empty array for empty outline without AI calls', async () => {
    const resolved = await resolvePdfOutlineTree([], async () => 1);
    assert.deepEqual(resolved, []);
  });

  it('4. should extract structural headings from DOCX paragraphs', () => {
    const paragraphs = [
      { text: 'Introduction to Mechanics', style: 'Heading 1' },
      { text: 'Standard introductory paragraph describing the course scope.' },
      { text: 'Chapter 2: Newton Laws', style: 'Normal' },
      { text: 'Detailed discussion of force vectors and inertial frames.' },
      { text: '2.1 Gravitational Forces', style: 'Heading 2' },
    ];

    const headings = extractDocxHeadings(paragraphs);
    assert.equal(headings.length, 3);
    assert.equal(headings[0]?.title, 'Introduction to Mechanics');
    assert.equal(headings[0]?.level, 1);
    assert.equal(headings[0]?.isNative, false);

    assert.equal(headings[1]?.title, 'Chapter 2: Newton Laws');
    assert.equal(headings[1]?.level, 1);

    assert.equal(headings[2]?.title, '2.1 Gravitational Forces');
    assert.equal(headings[2]?.level, 2);
  });

  it('5. should extract structural chapter headings from plain text chunks', () => {
    const text = `
Lernivox Course Syllabus
Chapter 1: Ancient Civilizations
The Fertile Crescent saw the birth of early agriculture and writing systems.

Chapter 2: The Classical Mediterranean
1. Early Greece and the Polis
Greek city-states developed diverse forms of political organization.
2. The Roman Republic
From regional power to Mediterranean hegemony.
    `;

    const headings = extractTextHeadings(text);
    assert.ok(headings.length >= 3);
    assert.ok(headings.some((h) => h.title.includes('Chapter 1: Ancient Civilizations')));
    assert.ok(headings.some((h) => h.title.includes('Chapter 2: The Classical Mediterranean')));
  });
});
