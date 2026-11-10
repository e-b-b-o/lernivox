'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, X, ArrowRight } from 'lucide-react';
import type { PlanOfferDto } from '@lernivox/contracts';

interface LearningPlanOfferBannerProps {
  offer: PlanOfferDto;
  onOpenPlanModal: () => void;
  onDismiss: () => void;
}

export function LearningPlanOfferBanner({
  offer,
  onOpenPlanModal,
  onDismiss,
}: LearningPlanOfferBannerProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  if (!offer.shouldOffer) {
    return null;
  }

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await onDismiss();
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="mx-4 mt-3 mb-1 p-3.5 rounded-xl bg-[#F4F0E5] border border-[#EAE4D3] shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8722C]/10 border border-[#E8722C]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#E8722C]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-[#14261D] flex items-center gap-1.5">
              <span>Personalized Study Plan</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#14261D]/10 text-[#14261D]">
                Adaptive
              </span>
            </h4>
            <p className="text-[11px] text-[#14261D]/70 font-sans mt-0.5 leading-snug">
              {offer.reason || 'Structure textbook chapters into guided, bite-sized sessions with quizzes and flashcards.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="text-[#14261D]/40 hover:text-[#14261D] p-1 rounded-md transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss plan suggestion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#14261D]/10 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="text-[11px] font-sans font-medium text-[#14261D]/60 hover:text-[#14261D] transition-colors cursor-pointer"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={onOpenPlanModal}
          className="px-3 py-1.5 rounded-lg bg-[#14261D] text-white text-[11px] font-display font-bold flex items-center gap-1.5 hover:bg-[#1B3428] transition-colors shadow-sm cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#E8722C]" />
          <span>Build Study Plan</span>
          <ArrowRight className="w-3 h-3 text-[#E8722C]" />
        </button>
      </div>
    </div>
  );
}

