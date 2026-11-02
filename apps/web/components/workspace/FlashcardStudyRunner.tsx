'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Sparkles,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  FlashcardDeckDetailDto,
  FlashcardItemDto,
  FlashcardRating,
} from '@lernivox/contracts';

interface FlashcardStudyRunnerProps {
  deck: FlashcardDeckDetailDto;
  onClose: () => void;
  onDeckUpdated?: () => void;
}

export function FlashcardStudyRunner({
  deck,
  onClose,
  onDeckUpdated,
}: FlashcardStudyRunnerProps) {
  const { accessToken } = useAuth();

  const [cards, setCards] = useState<FlashcardItemDto[]>(deck.cards || []);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Review statistics during this session
  const [reviewedCounts, setReviewedCounts] = useState<Record<FlashcardRating, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  const currentCard: FlashcardItemDto | undefined = cards[currentIndex];

  // Reset flip & hint when moving to next card
  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = async (rating: FlashcardRating) => {
    if (!currentCard || !accessToken || isReviewing) return;
    setIsReviewing(true);

    try {
      await api.flashcards.reviewCard(currentCard.id, rating, accessToken);

      setReviewedCounts((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsFinished(true);
        if (onDeckUpdated) {
          onDeckUpdated();
        }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to record card review');
    } finally {
      setIsReviewing(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && !isReviewing) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isReviewing, isFinished, handleFlip]);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-base text-[#14261D] mb-1">
          No Flashcards in Deck
        </h3>
        <p className="text-xs text-[#14261D]/70 max-w-sm mb-4">
          This deck does not contain any cards yet.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs"
        >
          Back to Flashcards
        </button>
      </div>
    );
  }

  // Completion Screen
  if (isFinished) {
    const totalReviewed =
      reviewedCounts[1] +
      reviewedCounts[2] +
      reviewedCounts[3] +
      reviewedCounts[4];

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F4F0E5] overflow-y-auto">
        <div className="w-full max-w-md bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#1B3428] text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#1B3428] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#0D1B14]">
            <CheckCircle2 className="w-8 h-8 text-[#A3E635]" />
          </div>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#14261D] mb-1">
            Review Session Complete!
          </h2>
          <p className="text-xs text-[#14261D]/70 mb-6">
            You reviewed {totalReviewed} card{totalReviewed === 1 ? '' : 's'} from &ldquo;{deck.title}&rdquo;
          </p>

          {/* Breakdown cards */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
              <span className="font-display font-bold text-lg text-red-600 block">
                {reviewedCounts[1]}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-red-500">
                Again
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="font-display font-bold text-lg text-amber-600 block">
                {reviewedCounts[2]}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-amber-500">
                Hard
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="font-display font-bold text-lg text-emerald-600 block">
                {reviewedCounts[3]}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-600">
                Good
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="font-display font-bold text-lg text-blue-600 block">
                {reviewedCounts[4]}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-blue-600">
                Easy
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setReviewedCounts({ 1: 0, 2: 0, 3: 0, 4: 0 });
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Review Again</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Back to Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="h-full w-full flex flex-col bg-[#F4F0E5] text-[#14261D] select-none overflow-hidden">
      {/* Top Runner Bar */}
      <div className="w-full h-14 bg-[#FAF8F4] border-b-[2px] border-[#1B3428]/15 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-2.5 sm:px-3 rounded-full border border-[#1B3428]/25 bg-[#FAF8F4] font-display font-bold text-xs flex items-center gap-1.5 hover:bg-[#F4F0E5] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="min-w-0">
            <h2 className="font-display font-bold text-xs sm:text-sm text-[#14261D] truncate">
              {deck.title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-[#14261D]/60 font-mono">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              {currentCard?.pageNumber && (
                <>
                  <span>•</span>
                  <span>Page {currentCard.pageNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="w-24 sm:w-32 h-2 rounded-full bg-[#1B3428]/10 overflow-hidden">
            <div
              className="h-full bg-[#E8722C] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-[#E8722C]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Main Card Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-0 overflow-y-auto">
        <div className="w-full max-w-xl flex flex-col items-center">
          {/* Card Container with tactile flip feeling */}
          <div
            onClick={handleFlip}
            className={`w-full min-h-[300px] sm:min-h-[340px] p-6 sm:p-8 rounded-3xl border-[2.5px] border-[#1B3428] bg-[#FAF8F4] shadow-[0_8px_0_0_#1B3428] cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_0_0_#1B3428] active:translate-y-0 active:shadow-[0_4px_0_0_#1B3428] relative ${
              isFlipped ? 'border-[#E8722C] shadow-[0_8px_0_0_#E8722C]' : ''
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isFlipped
                    ? 'bg-[#E8722C]/10 text-[#E8722C] border-[#E8722C]/25'
                    : 'bg-[#1B3428]/10 text-[#1B3428] border-[#1B3428]/20'
                }`}
              >
                {isFlipped ? 'Answer & Concept' : 'Question / Prompt'}
              </span>

              {currentCard?.chapter && (
                <span className="font-sans text-[11px] text-[#14261D]/60 truncate max-w-[200px]">
                  {currentCard.chapter}
                </span>
              )}
            </div>

            {/* Prompt or Answer Content */}
            <div className="flex-1 flex flex-col justify-center my-4">
              {!isFlipped ? (
                <div className="animate-in fade-in duration-150">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#14261D] leading-snug">
                    {currentCard?.front}
                  </h3>

                  {currentCard?.hint && (
                    <div className="mt-4">
                      {showHint ? (
                        <p className="font-serif italic text-xs text-[#E8722C] bg-[#FBE8DC]/40 p-3 rounded-xl border border-[#E8722C]/20">
                          Hint: {currentCard.hint}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-[#14261D]/60 hover:text-[#E8722C] transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Show Hint</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-serif text-sm sm:text-base leading-relaxed text-[#14261D] whitespace-pre-wrap">
                    {currentCard?.back}
                  </div>

                  {currentCard?.pageNumber && (
                    <div className="mt-4 pt-3 border-t border-[#1B3428]/10 flex items-center gap-1.5 text-xs text-[#14261D]/60 font-sans">
                      <BookOpen className="w-3.5 h-3.5 text-[#E8722C]" />
                      <span>Found on Page {currentCard.pageNumber}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Prompt */}
            <div className="pt-4 border-t border-[#1B3428]/10 flex items-center justify-between text-xs text-[#14261D]/50 font-sans">
              <span>Press Space or click to flip</span>
              <span className="font-mono text-[11px]">
                {currentIndex + 1} / {cards.length}
              </span>
            </div>
          </div>

          {/* Control Bar */}
          <div className="w-full mt-6">
            {!isFlipped ? (
              <button
                type="button"
                onClick={handleFlip}
                className="w-full py-3 rounded-2xl bg-[#1B3428] text-white font-display font-bold text-xs sm:text-sm shadow-[0_4px_0_0_#0D1B14] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>Reveal Answer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/20">
                  Space
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <p className="text-center font-display font-bold text-xs text-[#14261D]/70 mb-1">
                  How well did you remember this?
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRate(1)}
                    disabled={isReviewing}
                    className="p-3 rounded-2xl border-[1.5px] border-red-300 bg-red-50 text-red-700 font-display font-bold text-xs hover:bg-red-100 hover:border-red-400 shadow-[0_2px_0_0_#FCA5A5] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Again</span>
                      <span className="font-mono text-[10px] opacity-60">(1)</span>
                    </div>
                    <span className="font-mono text-[10px] text-red-500 font-normal">
                      1 day
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(2)}
                    disabled={isReviewing}
                    className="p-3 rounded-2xl border-[1.5px] border-amber-300 bg-amber-50 text-amber-800 font-display font-bold text-xs hover:bg-amber-100 hover:border-amber-400 shadow-[0_2px_0_0_#FCD34D] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Hard</span>
                      <span className="font-mono text-[10px] opacity-60">(2)</span>
                    </div>
                    <span className="font-mono text-[10px] text-amber-600 font-normal">
                      1 day
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(3)}
                    disabled={isReviewing}
                    className="p-3 rounded-2xl border-[1.5px] border-emerald-300 bg-emerald-50 text-emerald-800 font-display font-bold text-xs hover:bg-emerald-100 hover:border-emerald-400 shadow-[0_2px_0_0_#6EE7B7] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Good</span>
                      <span className="font-mono text-[10px] opacity-60">(3)</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-600 font-normal">
                      6 days
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate(4)}
                    disabled={isReviewing}
                    className="p-3 rounded-2xl border-[1.5px] border-blue-300 bg-blue-50 text-blue-800 font-display font-bold text-xs hover:bg-blue-100 hover:border-blue-400 shadow-[0_2px_0_0_#93C5FD] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Easy</span>
                      <span className="font-mono text-[10px] opacity-60">(4)</span>
                    </div>
                    <span className="font-mono text-[10px] text-blue-600 font-normal">
                      10 days
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
