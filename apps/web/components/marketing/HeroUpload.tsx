'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Layers,
  Cpu,
} from 'lucide-react';
import { ScrollReveal, StaggerContainer } from '../ui/scroll-reveal';

interface SampleMaterial {
  id: string;
  label: string;
  format: 'PDF' | 'DOCX' | 'TXT';
  fileName: string;
  fileSize: string;
  title: string;
  summary: string;
  chunksCount: number;
  topics: string[];
}

const SAMPLE_MATERIALS: SampleMaterial[] = [
  {
    id: 'literature',
    label: 'Fiction',
    format: 'PDF',
    fileName: 'Pride_and_Prejudice_Chapter_Analysis.pdf',
    fileSize: '680 KB',
    title: 'Pride & Prejudice — Themes of Class and Perception',
    summary:
      'Character dynamics between Elizabeth Bennet and Mr. Darcy, social mobility in Regency England, and irony in Austen’s narrative voice.',
    chunksCount: 12,
    topics: ['Social Hierarchy', 'Narrative Irony', 'Character Arc', 'Regency Etiquette'],
  },
  {
    id: 'neuroscience',
    label: 'Science',
    format: 'PDF',
    fileName: 'Introduction_to_Neuroscience_Ch3.pdf',
    fileSize: '740 KB',
    title: 'Neuroscience — Synaptic Transmission & Neural Signaling',
    summary:
      'Action potential propagation, voltage-gated ion channels, neurotransmitter release kinetics, and dendritic summation.',
    chunksCount: 12,
    topics: ['Resting Potential', 'Action Potential', 'Chemical Synapses', 'Neuroplasticity'],
  },
  {
    id: 'macroeconomics',
    label: 'Economics',
    format: 'DOCX',
    fileName: 'Principles_of_Macroeconomics_Unit2.docx',
    fileSize: '580 KB',
    title: 'Macroeconomics — Fiscal Policy & Aggregate Demand',
    summary:
      'Keynesian expenditure multipliers, IS-LM framework equilibria, automatic stabilizers, and central bank open-market operations.',
    chunksCount: 15,
    topics: ['Expenditure Multiplier', 'IS-LM Equilibrium', 'Fiscal Deficits', 'Liquidity Preference'],
  },
  {
    id: 'history',
    label: 'History',
    format: 'DOCX',
    fileName: 'The_Industrial_Revolution_Overview.docx',
    fileSize: '540 KB',
    title: 'World History — Technological Change & Urban Society',
    summary:
      'Steam power development, factory labor transitions, demographic shifts from rural villages to industrial centers, and early labor movements.',
    chunksCount: 15,
    topics: ['Steam Power', 'Urbanization', 'Labor Conditions', 'Economic Growth'],
  },
];

export function HeroUpload() {
  return (
    <section id="how-it-works" className="relative w-full max-w-full bg-[#EAE4D3] scroll-mt-0 overflow-hidden">
      {/* Cloud Canopy Divider (BrightPath Design System Reference) */}
      <div className="w-full max-w-full overflow-hidden leading-none select-none pointer-events-none relative bg-[#F4EFE4]">
        <div
          className="w-full h-[64px] sm:h-[72px] md:h-[78px]"
          style={{
            backgroundImage: "url('/assets/cloud-divider.svg')",
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center top',
            backgroundSize: '1248px auto',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="w-full px-4 sm:px-6 md:px-10">
        <div className="w-full max-w-[1380px] mx-auto pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-28 md:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Side (5 Columns) — Editorial Narrative & 3-Step Flow */}
            <div className="lg:col-span-5 text-left">
              <ScrollReveal id="workspace-heading" delay={0.1}>
                <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-[#14261D] tracking-tight leading-[1.08] mb-8">
                  From dense reading to clear, guided{' '}
                  <span
                    className="relative inline-block text-[#497E64] ml-1 select-none"
                    style={{
                      transform: 'translateY(-3px) rotate(2.2deg)',
                      transformOrigin: 'bottom right',
                      display: 'inline-block',
                    }}
                  >
                    mastery.
                    {/* Multi-Stroke Hand-Drawn Marker Underline in #E8722C */}
                    <svg
                      className="absolute -bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                      viewBox="0 0 320 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <path d="M 4 8 C 70 3, 200 4, 315 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                      <path d="M 16 12 C 100 6, 230 11, 300 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                      <path d="M 45 10 C 120 6, 190 8, 250 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                    </svg>
                  </span>
                </h2>
              </ScrollReveal>

              {/* 3 Numbered Steps — Clear, Human, Benefit-Driven Cards */}
              <StaggerContainer id="workspace-steps" initialDelay={0.1} staggerDelay={0.1} className="space-y-3.5 font-sans">
                <div className="p-4 rounded-2xl bg-[#FAF8F4]/70 border border-[#1B3428]/10 shadow-xs flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#14261D] mb-0.5">
                      Bring your material
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14261D]/75 leading-relaxed">
                      Choose a book, chapter, lecture notes, or reference document in PDF, DOCX, or TXT format.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F4]/70 border border-[#1B3428]/10 shadow-xs flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#14261D] mb-0.5">
                      {"Explore what you're reading"}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14261D]/75 leading-relaxed">
                      Read with an AI tutor ready to clarify difficult passages, explain unfamiliar ideas, and cite exact page sources.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F4]/70 border border-[#1B3428]/10 shadow-xs flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#14261D] mb-0.5">
                      Practice and remember
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14261D]/75 leading-relaxed">
                      Reinforce key ideas with chapter quizzes, spaced-repetition flashcards, and personalized progress tracking.
                    </p>
                  </div>
                </div>
              </StaggerContainer>
            </div>

            {/* Right Side (7 Columns) — Isolated Auto-Rotating Interactive Sample Showcase */}
            <ScrollReveal id="workspace-card" delay={0.25} distance={36} className="lg:col-span-7 w-full max-w-full">
              <RotatingSampleShowcase />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Isolated client subcomponent managing sample auto-rotation (2s cadence),
 * visibility pause, reduced-motion compliance, and interactive selection without
 * re-rendering surrounding marketing content or causing layout shifts.
 */
function RotatingSampleShowcase() {
  const [activeSampleId, setActiveSampleId] = useState<string>(SAMPLE_MATERIALS[0]!.id);
  const [simulationStep, setSimulationStep] = useState<'analyzing' | 'chunking' | 'ready'>('ready');
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [cycleSeed, setCycleSeed] = useState<number>(0);

  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageSecondTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSample =
    SAMPLE_MATERIALS.find((s) => s.id === activeSampleId) || SAMPLE_MATERIALS[0]!;

  const clearStageTimers = () => {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    if (stageSecondTimerRef.current) {
      clearTimeout(stageSecondTimerRef.current);
      stageSecondTimerRef.current = null;
    }
  };

  const triggerSampleTransition = (sampleId: string, skipProgressSweep = false) => {
    clearStageTimers();
    setActiveSampleId(sampleId);

    if (skipProgressSweep) {
      setSimulationStep('ready');
      setProgressPercent(100);
      return;
    }

    setSimulationStep('analyzing');
    setProgressPercent(32);

    stageTimerRef.current = setTimeout(() => {
      setSimulationStep('chunking');
      setProgressPercent(76);

      stageSecondTimerRef.current = setTimeout(() => {
        setSimulationStep('ready');
        setProgressPercent(100);
      }, 220);
    }, 180);
  };

  const handleSelectSample = (sampleId: string) => {
    setCycleSeed((s) => s + 1);
    if (sampleId === activeSampleId && simulationStep === 'ready') return;
    triggerSampleTransition(sampleId, prefersReducedMotion);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };

    setIsDocumentHidden(document.hidden);
    mediaQuery.addEventListener('change', handleMotionChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearStageTimers();
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || isDocumentHidden) {
      return;
    }

    const interval = setInterval(() => {
      setActiveSampleId((currentId) => {
        const currentIndex = SAMPLE_MATERIALS.findIndex((s) => s.id === currentId);
        const nextIndex = (currentIndex + 1) % SAMPLE_MATERIALS.length;
        const nextId = SAMPLE_MATERIALS[nextIndex]!.id;

        clearStageTimers();
        setSimulationStep('analyzing');
        setProgressPercent(32);
        stageTimerRef.current = setTimeout(() => {
          setSimulationStep('chunking');
          setProgressPercent(76);
          stageSecondTimerRef.current = setTimeout(() => {
            setSimulationStep('ready');
            setProgressPercent(100);
          }, 220);
        }, 180);

        return nextId;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [prefersReducedMotion, isPaused, isDocumentHidden, cycleSeed]);

  return (
    <div
      id="upload-card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      className="w-full max-w-full bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] sm:rounded-[32px] shadow-[0_4px_0_0_#1B3428] sm:shadow-[0_6px_0_0_#1B3428] p-5 sm:p-7 md:p-8 transition-all duration-200"
    >
      {/* Section Header */}
      <div className="mb-5 pb-4 border-b border-[#1B3428]/10 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D]">
            See how Lernivox helps you understand a book
          </h3>
          <p className="text-xs text-[#14261D]/70 font-sans mt-0.5">
            Select a sample material below to preview reading and tutoring:
          </p>
        </div>
      </div>

      {/* 4 Interactive Sample Selector Pills — 2x2 grid on mobile/narrow, 4-column on desktop */}
      <div
        role="tablist"
        aria-label="Sample learning materials"
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 p-1.5 bg-[#EAE4D3] rounded-2xl mb-6 border border-[#1B3428]/15"
      >
        {SAMPLE_MATERIALS.map((sample) => {
          const isActive = sample.id === activeSampleId;
          return (
            <button
              key={sample.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectSample(sample.id)}
              className={`py-2 px-2 sm:px-3 text-xs sm:text-[13px] font-display font-bold rounded-xl transition-all flex items-center justify-between gap-1.5 select-none truncate cursor-pointer ${
                isActive
                  ? 'bg-[#14261D] text-white shadow-[0_2px_0_0_#0D1B14] -translate-y-0.5'
                  : 'bg-[#FAF8F4]/80 text-[#14261D] border border-[#1B3428]/15 hover:bg-[#FAF8F4] hover:border-[#1B3428]/30'
              }`}
            >
              <span className="truncate">{sample.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#14261D]/10 text-[#14261D]/70'
                }`}
              >
                {sample.format}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Document Preview Card (Fixed minimum heights prevent layout shift on rotation) */}
      <div className="rounded-2xl border-[2px] border-[#1B3428]/20 bg-white p-4 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-200">
        {/* Simulated Processing Progress Line (Orange #E8722C) */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#FAF8F4] overflow-hidden">
          <div
            className="h-full bg-[#E8722C] transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card Top: Metadata Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-3 pt-1 min-h-[64px] sm:min-h-[42px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FBE8DC] border border-[#E8722C]/30 text-[#E8722C] flex items-center justify-center shrink-0">
              {activeSample.format === 'PDF' ? (
                <BookOpen className="w-4 h-4" />
              ) : activeSample.format === 'DOCX' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="font-mono text-xs font-bold text-[#14261D] truncate">
                {activeSample.fileName}
              </p>
              <p className="font-mono text-[11px] text-[#14261D]/60">
                {activeSample.fileSize} • {activeSample.format} Format
              </p>
            </div>
          </div>

          {/* Processing Status Badge */}
          <div className="shrink-0">
            {simulationStep === 'ready' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-display font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready for Study</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBE8DC] text-[#E8722C] border border-[#E8722C]/30 text-xs font-display font-bold">
                <Cpu className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
                <span>
                  {simulationStep === 'analyzing'
                    ? 'Analyzing Document...'
                    : 'Preparing Sections...'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Card Content: Title & Summary with height stability */}
        <div className="text-left mt-3 pt-3 border-t border-[#1B3428]/10 min-h-[168px] sm:min-h-[154px] flex flex-col justify-between">
          <div>
            <h4 className="font-display font-bold text-sm sm:text-base text-[#14261D] mb-1 line-clamp-1">
              {activeSample.title}
            </h4>
            <p className="font-serif text-xs sm:text-sm text-[#14261D]/75 leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {activeSample.summary}
            </p>

            {/* Key Grounded Concept Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#1B3428]/5">
              {activeSample.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md bg-[#FAF8F4] border border-[#1B3428]/15 text-[11px] font-sans font-medium text-[#14261D]/80"
                >
                  § {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Ready Indicator Footer */}
          <div className="mt-4 pt-3 border-t border-[#1B3428]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#14261D]/70">
            <span className="font-bold text-[#497E64]">
              ✓ {activeSample.chunksCount} Sections Prepared for Reading
            </span>
            <span className="text-[#14261D]/50">Grounded Citations • Verifiable Pages</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions Row — Consistent 44px Height & Single-Line Labels */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 mt-5 border-t border-[#1B3428]/10 text-left">
        <p className="font-sans text-xs text-[#14261D]/70 hidden sm:block max-w-[240px] leading-relaxed">
          Bring your own books or notes up to 1 MB and start reading with your AI tutor.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 rounded-full bg-transparent text-[#14261D] font-display font-bold text-sm border-[1.5px] border-[#1B3428] shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-black/5 transition-all text-center select-none"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 rounded-full bg-[#E8722C] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-[#D66522] transition-all text-center select-none gap-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
