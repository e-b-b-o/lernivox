'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Quote,
  ArrowRight,
  Calculator,
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
    <div className="w-full max-w-5xl mx-auto rounded-[2.5rem] border border-stone-200/80 bg-white/90 backdrop-blur-md p-8 md:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Sample Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-lernivox-peach/70 px-4 py-1.5 text-xs md:text-sm font-bold text-lernivox-forest">
            <Sparkles className="h-4 w-4 text-lernivox-terracotta" />
            Interactive Lesson Preview
          </span>
          <span className="text-sm font-medium text-stone-600">
            Topic: Calculus I • Chapter 2.5 The Chain Rule
          </span>
        </div>
        <div className="text-xs font-semibold text-stone-500 bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200/80">
          Curated sample demonstration
        </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Objective */}
        <div className="rounded-2xl bg-stone-50/70 p-6 border border-stone-200/80">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lernivox-forest text-white text-xs font-semibold">
              1
            </span>
            Learning Objective
          </div>
          <p className="text-base md:text-lg font-semibold text-lernivox-forest leading-relaxed">
            Differentiate composite functions f(g(x)) by multiplying the outer rate of change by the inner rate of change.
          </p>
        </div>

        {/* Step 2: Intuitive Explanation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lernivox-forest text-white text-xs font-semibold">
              2
            </span>
            Intuitive Principle
          </div>
          <p className="text-base text-stone-700 leading-relaxed">
            Think of composite functions as interconnected gears. If Gear A turns 3 times faster than Gear B, and Gear B turns 2 times faster than Gear C, how much faster does Gear A turn relative to Gear C? You multiply their rates: <strong className="font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200">3 × 2 = 6</strong>. The Chain Rule is simply multiplying rates of change.
          </p>
        </div>

        {/* Step 3: Method Grounded in Source */}
        <div className="rounded-2xl bg-lernivox-peach/30 p-6 md:p-8 border border-lernivox-peach/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-lernivox-terracotta">
              Step-by-Step Method
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-white/70 px-3 py-1 rounded-full border border-stone-200/60">
              <Quote className="h-3.5 w-3.5 text-lernivox-terracotta" /> Stewart Calculus, 8th Ed., §2.5 p. 198
            </span>
          </div>
          <div className="font-mono text-sm md:text-base text-lernivox-forest bg-white/90 p-4 rounded-xl border border-stone-200/80 shadow-subtle">
            dy/dx = (dy/du) · (du/dx)
          </div>
          <ol className="mt-4 list-decimal list-inside space-y-2 text-sm md:text-base text-stone-700 leading-relaxed">
            <li>Identify the inner function <strong className="font-mono text-lernivox-forest">u = g(x)</strong>.</li>
            <li>Differentiate the outer function with respect to u: <strong className="font-mono text-lernivox-forest">f'(u)</strong>.</li>
            <li>Differentiate the inner function with respect to x: <strong className="font-mono text-lernivox-forest">g'(x)</strong>.</li>
            <li>Multiply both derivatives and substitute u back in terms of x.</li>
          </ol>
        </div>

        {/* Step 4: Worked Example */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lernivox-forest text-white text-xs font-semibold">
              3
            </span>
            Worked Example
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-6 space-y-3">
            <p className="text-base font-semibold text-lernivox-forest">
              Problem: Find the derivative of y = (3x² - 5x + 2)⁴
            </p>
            <div className="text-sm md:text-base text-stone-600 space-y-1.5 font-mono">
              <p>• Let u = 3x² - 5x + 2  ⇒  y = u⁴</p>
              <p>• dy/du = 4u³</p>
              <p>• du/dx = 6x - 5</p>
              <p className="text-lernivox-forest font-bold pt-1.5">
                • dy/dx = 4(3x² - 5x + 2)³ · (6x - 5)
              </p>
            </div>
          </div>
        </div>

        {/* Step 5: Understanding Check */}
        <div className="rounded-2xl border-2 border-stone-200 bg-white p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-lernivox-terracotta" />
            <h4 className="text-base md:text-lg font-bold text-lernivox-forest">
              Understanding Check: Find the derivative of y = sin(x³)
            </h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              let btnClass = 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-800';
              if (isSelected) {
                btnClass = opt.correct
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30'
                  : 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-400/30';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left text-sm font-medium transition-all ${btnClass}`}
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
            <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm border border-stone-200/80 animate-fadeIn">
              <p className="font-semibold text-lernivox-forest">
                {options[selectedAnswer]?.correct ? '🎉 Correct!' : '💡 Guidance:'}
              </p>
              <p className="text-stone-600 mt-1">
                {options[selectedAnswer]?.note}
              </p>
            </div>
          )}
        </div>

        {/* Grounding Citation Footer */}
        <div className="flex items-center gap-2.5 pt-2 text-xs md:text-sm text-stone-500">
          <BookOpen className="h-4 w-4 text-lernivox-forest" />
          <span>
            Verifiable Source Citation: Stewart Calculus, 8th Ed., Chapter 2.5, Page 198, Theorem 2.
          </span>
        </div>
      </div>
    </div>
  );
}

