import {
  RetrievedPassage,
  StructuredLearningSections,
  TutorGroundedResult,
} from '../types/ai.types';
import { validateAndMapCitations } from './citation-validator';

/**
 * Parses markdown headers to extract optional structured teaching sections.
 */
export function extractStructuredSections(text: string): StructuredLearningSections | undefined {
  const sections: StructuredLearningSections = {};
  let foundAny = false;

  const patterns: Array<[keyof StructuredLearningSections, RegExp]> = [
    ['learningObjective', /###?\s*(?:Learning\s*Objective|Objective)[:\s]*([\s\S]*?)(?=###?|$)/i],
    ['simpleExplanation', /###?\s*(?:Simple\s*Explanation|Explanation|Core\s*Concept)[:\s]*([\s\S]*?)(?=###?|$)/i],
    ['textbookMethod', /###?\s*(?:Textbook\s*Method|Method|Author(?:'s)?\s*Approach)[:\s]*([\s\S]*?)(?=###?|$)/i],
    ['workedExample', /###?\s*(?:Worked\s*Example|Example|Application)[:\s]*([\s\S]*?)(?=###?|$)/i],
    ['understandingCheck', /###?\s*(?:Understanding\s*Check|Check\s*Your\s*Understanding|Quiz|Question)[:\s]*([\s\S]*?)(?=###?|$)/i],
    ['recap', /###?\s*(?:Recap|Summary|Key\s*Takeaway)[:\s]*([\s\S]*?)(?=###?|$)/i],
  ];

  for (const [key, regex] of patterns) {
    const match = regex.exec(text);
    if (match && match[1]?.trim()) {
      sections[key] = match[1].trim();
      foundAny = true;
    }
  }

  return foundAny ? sections : undefined;
}

/**
 * Checks whether the response content indicates an unsupported question.
 */
export function isUnsupportedResponse(text: string): boolean {
  const lower = text.toLowerCase();
  const hasDisclaimer =
    lower.includes('does not adequately cover') ||
    lower.includes('does not cover') ||
    lower.includes('not mentioned in the textbook') ||
    lower.includes('not covered in the provided') ||
    lower.includes('not found in the available textbook');

  const hasGeneralKnowledgeOffer =
    lower.includes('additional general knowledge') ||
    lower.includes('explain this using') ||
    lower.includes('general knowledge?');

  return hasDisclaimer && hasGeneralKnowledgeOffer;
}

/**
 * Parses raw completion text into a validated TutorGroundedResult with citations and metadata.
 */
export function parseTutorResponse(
  rawContent: string,
  passages: RetrievedPassage[],
): TutorGroundedResult {
  const citations = validateAndMapCitations(rawContent, passages);
  const structuredSections = extractStructuredSections(rawContent);
  const unsupported = isUnsupportedResponse(rawContent);

  // Calculate confidence score based on top similarity and whether citations were found
  let confidenceScore = 0.5;
  if (unsupported) {
    confidenceScore = 0.2;
  } else if (citations.length > 0) {
    const maxSim = Math.max(...citations.map((c) => c.relevanceScore ?? 0.5));
    confidenceScore = Math.min(0.98, Math.max(0.6, maxSim));
  } else if (passages.length > 0 && passages[0]) {
    confidenceScore = Math.min(0.7, passages[0].similarity);
  }

  return {
    content: rawContent.trim(),
    structuredSections,
    citations,
    isUnsupportedQuestion: unsupported,
    confidenceScore: Number(confidenceScore.toFixed(2)),
  };
}
