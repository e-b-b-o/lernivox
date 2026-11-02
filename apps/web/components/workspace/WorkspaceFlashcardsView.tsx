'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Play,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  FlashcardDeckSummaryDto,
  FlashcardDeckDetailDto,
  DocumentDto,
} from '@lernivox/contracts';
import { GenerateFlashcardsModal } from './GenerateFlashcardsModal';
import { FlashcardStudyRunner } from './FlashcardStudyRunner';

interface WorkspaceFlashcardsViewProps {
  workspaceId: string;
  document: DocumentDto | null;
  onReturnToBook: () => void;
  preselectedChapter?: string;
  preselectedPage?: number;
}

export function WorkspaceFlashcardsView({
  workspaceId,
  document,
  onReturnToBook,
  preselectedChapter,
  preselectedPage,
}: WorkspaceFlashcardsViewProps) {
  const { accessToken } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeckSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeckDetailDto | null>(null);
  const [loadingDeck, setLoadingDeck] = useState(false);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  const fetchDecks = async () => {
    if (!accessToken || !workspaceId) return;
    setLoading(true);

    try {
      const data = await api.flashcards.listByWorkspace(workspaceId, accessToken);
      setDecks(data);
    } catch (err) {
      console.error('Failed to load workspace flashcard decks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [workspaceId, accessToken]);

  const handleStartReview = async (deckId: string) => {
    if (!accessToken) return;
    setLoadingDeck(true);
    try {
      const fullDeck = await api.flashcards.getDeck(deckId, accessToken);
      setActiveDeck(fullDeck);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to open flashcard deck');
    } finally {
      setLoadingDeck(false);
    }
  };

  const handleDeleteDeck = async (deckId: string, title: string) => {
    if (!accessToken || deletingDeckId) return;
    if (!confirm(`Are you sure you want to delete the deck "${title}"?`)) return;

    setDeletingDeckId(deckId);
    try {
      await api.flashcards.deleteDeck(deckId, accessToken);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete deck');
    } finally {
      setDeletingDeckId(null);
    }
  };

  // If a deck is actively being studied, show the runner
  if (activeDeck) {
    return (
      <FlashcardStudyRunner
        deck={activeDeck}
        onClose={() => {
          setActiveDeck(null);
          fetchDecks();
        }}
        onDeckUpdated={fetchDecks}
      />
    );
  }

  // Summary counts
  const totalCardsAcrossDecks = decks.reduce((sum, d) => sum + d.cardCount, 0);
  const totalDueCardsAcrossDecks = decks.reduce((sum, d) => sum + d.dueCardCount, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F0E5] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-7 shadow-[0_6px_0_0_#1B3428] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] text-xs font-bold border border-[#497E64]/30">
                Active Recall Decks
              </span>
              <span className="text-xs text-[#14261D]/60 font-sans">
                {document?.title || 'Current Book'}
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-[#14261D] tracking-tight">
              Spaced Repetition Flashcards
            </h1>
            <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1 max-w-xl">
              Study book terminology, definitions, and formulas with AI cards grounded strictly in your selected textbook range.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReturnToBook}
              className="px-4 py-2.5 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] font-display font-bold text-xs text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1B3428]" />
              <span>Back to Reader</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Deck</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 shadow-xs">
            <span className="font-mono text-[10px] font-bold text-[#14261D]/60 uppercase tracking-wider block mb-1">
              Total Decks
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-[#14261D]">
                {decks.length}
              </span>
              <span className="text-xs text-[#14261D]/60 font-sans">created</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 shadow-xs">
            <span className="font-mono text-[10px] font-bold text-[#14261D]/60 uppercase tracking-wider block mb-1">
              Total Cards
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-[#14261D]">
                {totalCardsAcrossDecks}
              </span>
              <span className="text-xs text-[#14261D]/60 font-sans">available</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBE8DC] border-[1.5px] border-[#E8722C]/30 shadow-xs col-span-2 sm:col-span-1">
            <span className="font-mono text-[10px] font-bold text-[#E8722C] uppercase tracking-wider block mb-1">
              Due for Review
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-2xl text-[#E8722C]">
                {totalDueCardsAcrossDecks}
              </span>
              <span className="text-xs text-[#14261D]/70 font-sans">cards today</span>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading || loadingDeck ? (
          <div className="p-12 text-center bg-[#FAF8F4] border-[2px] border-[#1B3428]/15 rounded-3xl">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8722C] mx-auto mb-2" />
            <p className="font-display font-bold text-xs text-[#14261D]">
              Loading flashcards...
            </p>
          </div>
        ) : decks.length === 0 ? (
          /* Empty State */
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-8 sm:p-12 text-center shadow-[0_6px_0_0_#1B3428]">
            <div className="w-16 h-16 rounded-3xl bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center mx-auto mb-4 border border-[#E8722C]/20">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="font-display font-black text-xl text-[#14261D] mb-2">
              No Flashcards Created Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#14261D]/70 max-w-md mx-auto mb-6 leading-relaxed">
              Generate active recall decks from specific chapters, page ranges, or your entire book to master complex material with spaced repetition.
            </p>
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_4px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#A3E635]" />
              <span>Create Your First Deck</span>
            </button>
          </div>
        ) : (
          /* Decks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck) => {
              const scopeLabel = deck.sourceRange?.summaryLabel || 'Entire Book';

              return (
                <div
                  key={deck.id}
                  className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#1B3428] transition-all"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/25 truncate max-w-[220px]">
                        {scopeLabel}
                      </span>

                      {deck.dueCardCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <Clock className="w-2.5 h-2.5" />
                          {deck.dueCardCount} Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Up to date
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D] mb-1.5 leading-snug line-clamp-2">
                      {deck.title}
                    </h3>

                    {/* Description or count */}
                    <p className="text-xs text-[#14261D]/70 line-clamp-2 mb-4">
                      {deck.description || `Contains ${deck.cardCount} active recall flashcards.`}
                    </p>
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-4 border-t border-[#1B3428]/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#14261D]/60 font-mono">
                      <Layers className="w-3.5 h-3.5 text-[#1B3428]" />
                      <span className="font-bold">{deck.cardCount}</span> cards
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteDeck(deck.id, deck.title)}
                        disabled={deletingDeckId === deck.id}
                        className="p-2 rounded-full border border-[#1B3428]/15 text-[#14261D]/50 hover:text-red-600 hover:border-red-300 transition-colors"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartReview(deck.id)}
                        className="px-4 py-2 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_2px_0_0_#0D1B14] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Study Deck</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Flashcards Modal */}
      {document && (
        <GenerateFlashcardsModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          workspaceId={workspaceId}
          documentId={document.id}
          documentTitle={document.title}
          preselectedChapter={preselectedChapter}
          preselectedPage={preselectedPage}
          onDeckCreated={() => {
            fetchDecks();
          }}
        />
      )}
    </div>
  );
}
