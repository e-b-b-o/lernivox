'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Quote,
} from 'lucide-react';

export function GuidedLearningPreview() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const options = [
    { id: 0, text: 'dy/dx = cos(x³)', correct: false, note: 'Forgot to multiply by the derivative of the inner function x³.' },
    { id: 1, text: 'dy/dx = 3x² cos(x³)', correct: true, note: 'Correct! Outer derivative cos(x³) multiplied by inner derivative 3x².' },
    { id: 2, text: 'dy/dx = 3x² sin(x³)', correct: false, note: 'The derivative of sin(u) is cos(u), not sin(u).' },
    { id: 3, text: 'dy/dx = -3x² cos(x³)', correct: false, note: 'The derivative of sin(x) is positive cos(x).' },
  ];

  const handleSelect = (idx: number) => {
    setSelectedAnswer(idx);
    setShowExplanation(true);
  };

  return (
    <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 md:p-10 shadow-[0_4px_0_0_#1B3428] sm:shadow-[0_6px_0_0_#1B3428] max-w-5xl mx-auto mb-16 sm:mb-28 w-full max-w-full overflow-hidden">
      {/* Card Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B3428]/15 pb-5 sm:pb-6 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="bg-[#F9D8C0] text-[#14261D] text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#1B3428]/15 inline-flex items-center gap-1.5 select-none">
            <span>⚡</span>
            <span>Interactive Lesson Preview</span>
          </span>
          <span className="font-sans text-xs sm:text-sm font-semibold text-[#14261D]">
            Calculus I • Chapter 2.5: The Chain Rule
          </span>
        </div>
        <div className="bg-[#EAE4D3] text-[#14261D]/70 text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full border border-[#1B3428]/10 select-none">
          Curated Demonstration
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Learning Objective */}
        <div className="bg-[#FFFFFF] border-[1.5px] border-[#1B3428]/20 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#497E64] mb-1.5">
            01 • LEARNING OBJECTIVE
          </div>
          <p className="font-display text-lg md:text-xl font-bold text-[#14261D] leading-snug">
            Differentiate composite functions f(g(x)) by multiplying the outer rate of change by the inner rate of change.
          </p>
        </div>

        {/* 2. Intuitive Mental Model (The Gear Analogy) */}
        <div className="bg-[#EAE4D3]/40 border-[1.5px] border-[#1B3428]/20 rounded-2xl p-5 mb-5">
          <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#E8722C] mb-1.5">
            02 • INTUITIVE PRINCIPLE
          </div>
          <p className="font-sans text-base text-[#14261D]/80 leading-relaxed">
            Think of composite functions as interconnected gears. If Gear A turns 3 times faster than Gear B, and Gear B turns 2 times faster than Gear C, how much faster does Gear A turn relative to Gear C? You multiply their rates:{' '}
            <span className="inline-block bg-[#FAF8F4] px-2.5 py-0.5 rounded-md font-mono font-bold text-[#14261D] border border-[#1B3428]/15">
              3 × 2 = 6
            </span>
            . The Chain Rule is simply multiplying rates of change.
          </p>
        </div>

        {/* 3. Worked Step-by-Step Method */}
        <div className="bg-[#FFFFFF] border-[1.5px] border-[#1B3428]/20 rounded-2xl p-5 md:p-6 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B3428]/10 pb-3 mb-4">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#E8722C]">
              03 • WORKED STEP-BY-STEP METHOD
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8722C] bg-[#FBE8DC] px-3 py-1 rounded-full border border-[#E8722C]/20 select-none">
              <Quote className="h-3 w-3 text-[#E8722C]" />
              📖 Stewart Calculus, 8th Ed., §2.5 p. 198
            </span>
          </div>

          <div className="font-mono text-sm md:text-base font-bold text-[#14261D] bg-[#FAF8F4] p-3.5 rounded-xl border border-[#1B3428]/15 mb-4 shadow-sm">
            dy/dx = (dy/du) · (du/dx)
          </div>

          <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-[#14261D]/80 leading-relaxed font-sans mb-5">
            <li>Identify the inner function <strong className="font-mono text-[#14261D]">u = g(x)</strong>.</li>
            <li>Differentiate the outer function with respect to u: <strong className="font-mono text-[#14261D]">f&apos;(u)</strong>.</li>
            <li>Differentiate the inner function with respect to x: <strong className="font-mono text-[#14261D]">g&apos;(x)</strong>.</li>
            <li>Multiply both derivatives and substitute u back in terms of x.</li>
          </ol>

          {/* Worked Calculation Example */}
          <div className="rounded-xl border border-[#1B3428]/15 bg-[#FAF8F4] p-4 space-y-2.5 font-sans">
            <p className="text-sm md:text-base font-bold text-[#14261D]">
              Worked Calculation Example: Find the derivative of y = (3x² - 5x + 2)⁴
            </p>
            <div className="text-sm md:text-base text-[#14261D]/75 space-y-1 font-mono">
              <p>• Let u = 3x² - 5x + 2  ⇒  y = u⁴</p>
              <p>• dy/du = 4u³</p>
              <p>• du/dx = 6x - 5</p>
              <p className="text-[#14261D] font-bold pt-1">
                • dy/dx = 4(3x² - 5x + 2)³ · (6x - 5)
              </p>
            </div>
          </div>
        </div>

        {/* 4. Understanding Check */}
        <div className="bg-[#FFFFFF] border-[1.5px] border-[#1B3428]/20 rounded-2xl p-5 md:p-6 mb-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-[#E8722C]" />
            <div>
              <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#497E64]">
                04 • COMPREHENSION CHECK
              </div>
              <h4 className="font-display text-base md:text-lg font-bold text-[#14261D] mt-0.5">
                Find the derivative of y = sin(x³)
              </h4>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-1">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              let btnClass = 'border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#EAE4D3]/50 text-[#14261D]';
              if (isSelected) {
                btnClass = opt.correct
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30'
                  : 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-400/30';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-sm font-medium transition-all ${btnClass}`}
                >
                  <span className="font-mono">{opt.text}</span>
                  {isSelected && (
                    opt.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && selectedAnswer !== null && (
            <div className="mt-4 rounded-xl bg-[#FAF8F4] p-4 text-sm border border-[#1B3428]/20 animate-fadeIn">
              <p className="font-semibold text-[#14261D]">
                {options[selectedAnswer]?.correct ? '🎉 Correct!' : '💡 Guidance:'}
              </p>
              <p className="text-[#14261D]/75 mt-1 font-sans">
                {options[selectedAnswer]?.note}
              </p>
            </div>
          )}
        </div>

        {/* 5. Grounding Citation Footer */}
        <div className="flex items-center gap-2.5 pt-2 text-xs md:text-sm text-[#14261D]/70 font-sans">
          <BookOpen className="h-4 w-4 text-[#14261D]" />
          <span>
            Verifiable Source Citation: Stewart Calculus, 8th Ed., Chapter 2.5, Page 198, Theorem 2.
          </span>
        </div>
      </div>
    </div>
  );
}
