'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  QuizRangeScopeDto,
  FlashcardDeckSummaryDto,
} from '@lernivox/contracts';
import { BookRangeSelector } from './BookRangeSelector';

interface GenerateFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  documentId: string;
  documentTitle?: string;
  preselectedChapter?: string;
  preselectedPage?: number;
  onDeckCreated?: (deck: FlashcardDeckSummaryDto) => void;
}

export function GenerateFlashcardsModal({
  isOpen,
  onClose,
  workspaceId,
  documentId,
  documentTitle = 'Textbook',
  preselectedChapter = '',
  preselectedPage,
  onDeckCreated,
}: GenerateFlashcardsModalProps) {
  const { accessToken } = useAuth();

  const [title, setTitle] = useState('');
  const [rangeScope, setRangeScope] = useState<QuizRangeScopeDto>({
    scopeType: 'ENTIRE_DOCUMENT',
    summaryLabel: 'Entire Material',
  });
  const [isRangeValid, setIsRangeValid] = useState<boolean>(true);
  const [cardCount, setCardCount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize title when range changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultTitle = rangeScope.summaryLabel && rangeScope.scopeType !== 'ENTIRE_DOCUMENT'
        ? `Flashcards: ${rangeScope.summaryLabel}`
        : `Flashcards: ${documentTitle}`;
      setTitle((prev) => (!prev || prev.startsWith('Flashcards:') ? defaultTitle : prev));
    }
  }, [isOpen, rangeScope.summaryLabel, rangeScope.scopeType, documentTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!documentId) {
      setError('Document reference is missing.');
      return;
    }
    if (!isRangeValid) {
      setError('Please resolve the invalid book range before generating.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalTitle = title.trim() || `Flashcards: ${rangeScope.summaryLabel || documentTitle}`;
      const deck = await api.flashcards.generate(
        workspaceId,
        {
          workspaceId,
          documentId,
          title: finalTitle,
          rangeScope,
          cardCount,
        },
        accessToken,
      );

      if (onDeckCreated) {
        onDeckCreated(deck);
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14261D]/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-6 sm:p-7 shadow-[0_8px_0_0_#1B3428] my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-[0_3px_0_0_#B26E45] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#14261D]">
                Generate Flashcard Deck
              </h2>
              <p className="text-xs text-[#14261D]/70 font-sans">
                Active recall cards grounded in &ldquo;{documentTitle}&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/60 hover:text-[#14261D] hover:bg-[#F4F0E5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Deck Title */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Deck Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Flashcards: ${documentTitle}`}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#1B3428]/30 bg-[#F4F0E5] font-sans text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C] focus:bg-white transition-colors"
            />
          </div>

          {/* Range Selector Component */}
          <BookRangeSelector
            documentId={documentId}
            preselectedChapter={preselectedChapter}
            preselectedPage={preselectedPage}
            onChange={(scope, valid) => {
              setRangeScope(scope);
              setIsRangeValid(valid);
            }}
          />

          {/* Number of Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-display font-bold text-xs text-[#14261D]">
                Number of Cards
              </label>
              <span className="font-mono text-xs font-bold text-[#E8722C]">
                {cardCount} cards
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setCardCount(count)}
                  className={`py-2 rounded-xl border-[1.5px] font-display font-bold text-xs transition-all ${
                    cardCount === count
                      ? 'border-[#1B3428] bg-[#1B3428] text-white shadow-[0_2px_0_0_#0D1B14]'
                      : 'border-[#1B3428]/25 bg-[#F4F0E5] text-[#14261D] hover:border-[#1B3428]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#1B3428]/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-full font-display font-bold text-xs text-[#14261D]/70 hover:text-[#14261D] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isRangeValid}
              className="px-6 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Deck...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Cards</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
