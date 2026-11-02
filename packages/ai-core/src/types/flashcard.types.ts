export interface SourcePassageForFlashcard {
  chunkId: string;
  pageNumber?: number | null;
  chapter?: string | null;
  sectionTitle?: string | null;
  content: string;
}

export interface FlashcardGenerationInput {
  documentTitle: string;
  sourceRangeSummary?: string;
  passages: SourcePassageForFlashcard[];
  cardCount: number;
}

export interface GeneratedFlashcardItem {
  front: string;
  back: string;
  hint?: string | null;
  sourceChunkId?: string | null;
  pageNumber?: number | null;
  chapter?: string | null;
}

export interface FlashcardGenerationResult {
  success: boolean;
  cards: GeneratedFlashcardItem[];
  error?: string;
}
