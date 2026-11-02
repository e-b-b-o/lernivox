import { GroundedCitation, RetrievedPassage } from '../types/ai.types';

/**
 * Extracts a verbatim snippet from a passage's content to ground the citation.
 */
export function extractVerbatimSnippet(content: string, maxLength = 220): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  // Try to cut at a sentence or period boundary
  const periodIdx = clean.indexOf('.', Math.min(100, maxLength));
  if (periodIdx !== -1 && periodIdx <= maxLength) {
    return clean.slice(0, periodIdx + 1);
  }
  // Otherwise cut at word boundary with ellipsis
  const slice = clean.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 50 ? slice.slice(0, lastSpace) : slice) + '...';
}

/**
 * Parses all [S#] citations from text and maps them to verified chunk records.
 * Ignores any source tags that do not correspond to retrieved passages.
 */
export function validateAndMapCitations(
  text: string,
  passages: RetrievedPassage[],
): GroundedCitation[] {
  if (!text || passages.length === 0) {
    return [];
  }

  // Create lookup map for supplied passages by sourceId (e.g. "S1", "S2")
  const passageMap = new Map<string, RetrievedPassage>();
  for (const p of passages) {
    const normalizedKey = p.sourceId.toUpperCase().replace(/[\[\]]/g, '');
    passageMap.set(normalizedKey, p);
  }

  // Match patterns like [S1], [S2], [S1, S2], [S1; S2], [S1-S3]
  const tagRegex = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/gi;
  const citedKeys = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    const inner = match[1];
    if (inner) {
      const subMatches = inner.split(/[,;]/);
      for (const sub of subMatches) {
        const key = sub.trim().toUpperCase();
        if (key) {
          citedKeys.add(key);
        }
      }
    }
  }

  const result: GroundedCitation[] = [];
  const seenChunkIds = new Set<string>();

  for (const key of citedKeys) {
    const passage = passageMap.get(key);
    if (!passage) {
      // Discard unknown or hallucinated source IDs
      continue;
    }

    if (seenChunkIds.has(passage.chunkId)) {
      continue;
    }
    seenChunkIds.add(passage.chunkId);

    const snippet = extractVerbatimSnippet(passage.content);

    result.push({
      sourceId: passage.sourceId,
      chunkId: passage.chunkId,
      documentId: passage.documentId,
      quoteSnippet: snippet,
      pageNumber: passage.pageNumber ?? null,
      chapter: passage.chapter ?? null,
      relevanceScore: passage.similarity != null ? Number(passage.similarity.toFixed(4)) : null,
    });
  }

  return result;
}
