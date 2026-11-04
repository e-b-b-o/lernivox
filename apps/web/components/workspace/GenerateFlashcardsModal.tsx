'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  ArrowLeft,
  Check,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  QuizRangeScopeDto,
  FlashcardDeckSummaryDto,
  ProposedFlashcardItemDto,
  FlashcardFocusType,
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

  const [step, setStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [title, setTitle] = useState('');
  const [rangeScope, setRangeScope] = useState<QuizRangeScopeDto>({
    scopeType: 'ENTIRE_DOCUMENT',
    summaryLabel: 'Entire Material',
  });
  const [isRangeValid, setIsRangeValid] = useState<boolean>(true);
  const [cardCount, setCardCount] = useState<number>(10);
  const [focus, setFocus] = useState<FlashcardFocusType>('MIXED');
  const [proposedCards, setProposedCards] = useState<ProposedFlashcardItemDto[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize title when range changes or modal opens
  useEffect(() => {
    if (isOpen && step === 'CONFIG') {
      const defaultTitle =
        rangeScope.summaryLabel && rangeScope.scopeType !== 'ENTIRE_DOCUMENT'
          ? `Flashcards: ${rangeScope.summaryLabel}`
          : `Flashcards: ${documentTitle}`;
      setTitle((prev) => (!prev || prev.startsWith('Flashcards:') ? defaultTitle : prev));
    }
  }, [isOpen, step, rangeScope.summaryLabel, rangeScope.scopeType, documentTitle]);

  if (!isOpen) return null;

  const handleGeneratePreview = async (e: React.FormEvent) => {
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

    setIsGenerating(true);
    setError(null);

    try {
      const finalTitle = title.trim() || `Flashcards: ${rangeScope.summaryLabel || documentTitle}`;
      const preview = await api.flashcards.generatePreview(
        workspaceId,
        {
          workspaceId,
          documentId,
          title: finalTitle,
          rangeScope,
          cardCount,
          focus,
        },
        accessToken,
      );

      if (!preview.cards || preview.cards.length === 0) {
        setError('No flashcards could be generated from the selected range. Try widening the scope.');
        return;
      }

      setProposedCards(preview.cards);
      setTitle(preview.title || finalTitle);
      setStep('PREVIEW');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCardChange = (
    index: number,
    field: 'front' | 'back' | 'hint',
    value: string,
  ) => {
    setProposedCards((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;
      updated[index] = {
        ...current,
        [field]: value,
      };
      return updated;
    });
  };

  const handleDeleteCard = (index: number) => {
    setProposedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCard = () => {
    setProposedCards((prev) => [
      ...prev,
      {
        front: '',
        back: '',
        hint: '',
        pageNumber: preselectedPage || null,
        chapter: preselectedChapter || null,
      },
    ]);
  };

  const handleSaveDeck = async () => {
    if (!accessToken) return;
    const validCards = proposedCards.filter(
      (c) => c.front.trim().length > 0 && c.back.trim().length > 0,
    );

    if (validCards.length === 0) {
      setError('Please keep at least one valid flashcard with both a question and an answer.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const finalTitle = title.trim() || `Flashcards: ${rangeScope.summaryLabel || documentTitle}`;
      const deck = await api.flashcards.createManual(
        workspaceId,
        {
          workspaceId,
          documentId,
          title: finalTitle,
          sourceRange: rangeScope,
          cards: validCards.map((c) => ({
            front: c.front.trim(),
            back: c.back.trim(),
            hint: c.hint?.trim() || undefined,
            pageNumber: c.pageNumber || undefined,
            chapter: c.chapter?.trim() || undefined,
            sourceChunkId: c.sourceChunkId || undefined,
          })),
        },
        accessToken,
      );

      if (onDeckCreated) {
        onDeckCreated({
          id: deck.id,
          workspaceId: deck.workspaceId,
          documentId: deck.documentId,
          documentTitle: deck.documentTitle,
          title: deck.title,
          description: deck.description,
          cardCount: deck.cardCount,
          dueCardCount: deck.dueCardCount,
          sourceRange: deck.sourceRange,
          createdById: deck.createdById,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save flashcard deck. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14261D]/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          step === 'PREVIEW' ? 'max-w-2xl' : 'max-w-xl'
        } bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-5 sm:p-7 shadow-[0_8px_0_0_#1B3428] my-8 animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-[0_3px_0_0_#B26E45] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#14261D]">
                {step === 'CONFIG' ? 'Generate Flashcard Deck' : 'Review & Customize Cards'}
              </h2>
              <p className="text-xs text-[#14261D]/70 font-sans">
                {step === 'CONFIG'
                  ? `Active recall cards grounded in “${documentTitle}”`
                  : `Previewing proposed flashcards for “${title}” before saving`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/60 hover:text-[#14261D] hover:bg-[#F4F0E5] transition-colors cursor-pointer"
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

        {/* =====================================================================
            STEP 1: CONFIGURATION
            ===================================================================== */}
        {step === 'CONFIG' && (
          <form onSubmit={handleGeneratePreview} className="space-y-4">
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

            {/* Card Count Selector (5-30) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-display font-bold text-xs text-[#14261D]">
                  Number of Cards
                </label>
                <span className="font-mono text-xs font-bold text-[#E8722C]">
                  {cardCount} cards
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {[5, 10, 15, 20, 25, 30].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setCardCount(count)}
                    className={`py-2 rounded-xl border-[1.5px] font-display font-bold text-xs transition-all cursor-pointer ${
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

            {/* Card Focus */}
            <div>
              <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
                Generation Focus
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'MIXED', label: 'Mixed Coverage', desc: 'Balanced definitions & concepts' },
                  { id: 'DEFINITIONS', label: 'Key Definitions', desc: 'Terminology & foundational facts' },
                  { id: 'PROBLEM_SOLVING', label: 'Formulas & Methods', desc: 'Algorithms & problem solving' },
                  { id: 'DEEP_UNDERSTANDING', label: 'Deep Concept Checks', desc: 'Mechanisms & reasoning' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFocus(f.id as FlashcardFocusType)}
                    className={`p-2.5 rounded-xl border-[1.5px] text-left transition-all cursor-pointer ${
                      focus === f.id
                        ? 'border-[#E8722C] bg-[#FBE8DC]/40 shadow-xs'
                        : 'border-[#1B3428]/20 bg-[#F4F0E5] hover:border-[#1B3428]/40'
                    }`}
                  >
                    <span className="font-display font-bold text-xs text-[#14261D] block">
                      {f.label}
                    </span>
                    <span className="text-[10px] text-[#14261D]/60 font-sans block mt-0.5">
                      {f.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-[#1B3428]/15 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-full font-display font-bold text-xs text-[#14261D]/70 hover:text-[#14261D] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isGenerating || !isRangeValid}
                className="px-6 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting AI Cards...</span>
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
        )}

        {/* =====================================================================
            STEP 2: PREVIEW & CUSTOMIZE CARDS BEFORE SAVING
            ===================================================================== */}
        {step === 'PREVIEW' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#E2EBD8]/60 border border-[#497E64]/30 rounded-2xl p-3 text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#497E64]" />
                <span className="font-sans text-[#14261D]">
                  <strong className="font-bold">{proposedCards.length} flashcards</strong> generated. Review or edit questions and answers below before saving to your deck.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddCard}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#1B3428]/25 text-[#14261D] font-display font-bold text-[11px] hover:bg-[#FBE8DC] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#E8722C]" />
                <span>Add Card</span>
              </button>
            </div>

            {/* Editable Cards List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              {proposedCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-[#F4F0E5] border-[1.5px] border-[#1B3428]/25 rounded-2xl p-3.5 space-y-2 shadow-2xs relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#14261D]/70 bg-[#FAF8F4] px-2 py-0.5 rounded-full border border-[#1B3428]/15">
                      Card {idx + 1}
                      {card.pageNumber && ` • Page ${card.pageNumber}`}
                      {card.chapter && ` • ${card.chapter}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Question / Front */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#14261D]/60 mb-0.5">
                      Front (Question / Prompt)
                    </label>
                    <input
                      type="text"
                      value={card.front}
                      onChange={(e) => handleCardChange(idx, 'front', e.target.value)}
                      placeholder="Question prompt"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#1B3428]/20 bg-[#FAF8F4] font-display font-bold text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C]"
                    />
                  </div>

                  {/* Answer / Back */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#14261D]/60 mb-0.5">
                      Back (Answer & Concept)
                    </label>
                    <textarea
                      rows={2}
                      value={card.back}
                      onChange={(e) => handleCardChange(idx, 'back', e.target.value)}
                      placeholder="Answer text"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#1B3428]/20 bg-[#FAF8F4] font-sans text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C] resize-none"
                    />
                  </div>

                  {/* Optional Hint */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-[#14261D]/60 mb-0.5">
                      Optional Recall Hint
                    </label>
                    <input
                      type="text"
                      value={card.hint || ''}
                      onChange={(e) => handleCardChange(idx, 'hint', e.target.value)}
                      placeholder="Hint (2-4 words)"
                      className="w-full px-3 py-1 rounded-xl border border-[#1B3428]/20 bg-[#FAF8F4] font-sans text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-[#1B3428]/15 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('CONFIG')}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-full border border-[#1B3428]/20 bg-[#FAF8F4] font-display font-bold text-xs text-[#14261D] hover:bg-[#F4F0E5] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Setup</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-full font-display font-bold text-xs text-[#14261D]/70 hover:text-[#14261D] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveDeck}
                  disabled={isSaving || proposedCards.length === 0}
                  className="px-6 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                      <span>Saving Deck...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#A3E635]" />
                      <span>Save & Create Deck ({proposedCards.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
