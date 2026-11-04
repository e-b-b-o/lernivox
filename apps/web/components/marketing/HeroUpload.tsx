'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Sparkles,
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
    id: 'neuroscience',
    label: 'Neuroscience PDF',
    format: 'PDF',
    fileName: 'Introduction_to_Neuroscience_Ch3.pdf',
    fileSize: '2.4 MB',
    title: 'Synaptic Transmission & Neural Signaling',
    summary:
      'Action potential propagation, voltage-gated ion channels, neurotransmitter release kinetics, and dendritic summation.',
    chunksCount: 12,
    topics: ['Resting Potential', 'Action Potential', 'Chemical Synapses', 'Neuroplasticity'],
  },
  {
    id: 'macroeconomics',
    label: 'Macroeconomics DOCX',
    format: 'DOCX',
    fileName: 'Principles_of_Macroeconomics_Unit2.docx',
    fileSize: '1.8 MB',
    title: 'Fiscal Policy & Aggregate Demand Dynamics',
    summary:
      'Keynesian expenditure multipliers, IS-LM framework equilibria, automatic stabilizers, and central bank open-market operations.',
    chunksCount: 15,
    topics: ['Expenditure Multiplier', 'IS-LM Equilibrium', 'Fiscal Deficits', 'Liquidity Preference'],
  },
  {
    id: 'calculus',
    label: 'Calculus Notes TXT',
    format: 'TXT',
    fileName: 'Calculus_Integration_Techniques.txt',
    fileSize: '420 KB',
    title: 'Integration Techniques & Improper Integrals',
    summary:
      'Tabular integration by parts, partial fraction decomposition for rational functions, and improper integral convergence tests.',
    chunksCount: 8,
    topics: ['Integration by Parts', 'Partial Fractions', 'Trig Substitution', 'Comparison Test'],
  },
];

export function HeroUpload() {
  const [activeSampleId, setActiveSampleId] = useState<string>('neuroscience');
  const [simulationStep, setSimulationStep] = useState<'analyzing' | 'chunking' | 'ready'>('ready');
  const [progressPercent, setProgressPercent] = useState<number>(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSample =
    SAMPLE_MATERIALS.find((s) => s.id === activeSampleId) || SAMPLE_MATERIALS[0]!;

  const handleSelectSample = (sampleId: string) => {
    if (sampleId === activeSampleId && simulationStep === 'ready') return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setActiveSampleId(sampleId);
    setSimulationStep('analyzing');
    setProgressPercent(28);

    timerRef.current = setTimeout(() => {
      setSimulationStep('chunking');
      setProgressPercent(74);

      timerRef.current = setTimeout(() => {
        setSimulationStep('ready');
        setProgressPercent(100);
      }, 500);
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section id="how-it-works" className="relative w-full max-w-full bg-[#EAE4D3] scroll-mt-0 overflow-hidden">
      {/* Cloud Canopy Divider (BrightPath Design System Reference) */}
      <div className="w-full max-w-full overflow-hidden leading-none select-none pointer-events-none relative bg-[#F4F0E5]">
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

      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 md:px-10 pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-28 md:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Side (5 Columns) — Editorial Narrative & 3-Step Flow */}
          <div className="lg:col-span-5 text-left">
            <ScrollReveal id="workspace-heading" delay={0.1}>
              <span className="bg-[#F9D8C0] text-[#14261D] font-sans text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-block mb-4 shadow-sm">
                Interactive Showcase
              </span>

              <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-[#14261D] tracking-tight leading-[1.08] mb-8">
                From dense PDFs to clear, guided{' '}
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

            {/* 3 Numbered Steps */}
            <StaggerContainer id="workspace-steps" initialDelay={0.1} staggerDelay={0.1} className="space-y-4 font-sans text-[#14261D]/80">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  1
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Select a textbook chapter</strong> — See how Lernivox ingests structured chapters, mathematical notes, or lecture documents.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  2
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Semantic chunking & vector indexing</strong> — Dense pages are partitioned into grounded conceptual units with verbatim citation tracking.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  3
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Grounding & active study</strong> — Generate range-bound quizzes, SM-2 flashcard decks, and private AI tutoring tied to the exact source.
                </p>
              </div>
            </StaggerContainer>
          </div>

          {/* Right Side (7 Columns) — Interactive Sample Showcase Card */}
          <ScrollReveal id="workspace-card" delay={0.25} distance={36} className="lg:col-span-7 w-full max-w-full">
            <div
              id="upload-card"
              className="w-full max-w-full bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] sm:rounded-[32px] shadow-[0_4px_0_0_#1B3428] sm:shadow-[0_6px_0_0_#1B3428] p-5 sm:p-7 md:p-8 transition-all duration-200"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#1B3428]/10">
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D]">
                    Simulated Ingestion Showcase
                  </h3>
                  <p className="text-xs text-[#14261D]/70 font-sans mt-0.5">
                    Choose a sample learning material below to preview chunking and indexing:
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono font-bold text-[11px] uppercase tracking-wider border border-[#497E64]/20 shrink-0">
                  Interactive Demo
                </span>
              </div>

              {/* 3 Interactive Sample Selector Pills */}
              <div
                role="tablist"
                aria-label="Sample learning materials"
                className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-[#EAE4D3] rounded-2xl mb-6 border border-[#1B3428]/15"
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
                      className={`py-2 px-1 sm:px-2 md:px-3 text-[11px] sm:text-xs md:text-sm font-display font-bold rounded-xl transition-all text-center select-none truncate cursor-pointer ${
                        isActive
                          ? 'bg-[#1B3428] text-white shadow-[0_2px_0_0_#0D1B14] -translate-y-0.5'
                          : 'text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#FAF8F4]/60'
                      }`}
                    >
                      {sample.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Document Preview Card */}
              <div className="rounded-2xl border-[2px] border-[#1B3428]/20 bg-white p-4 sm:p-6 shadow-sm relative overflow-hidden transition-all">
                {/* Simulated Processing Progress Line (Orange #E8722C) */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-[#FAF8F4] overflow-hidden">
                  <div
                    className="h-full bg-[#E8722C] transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Card Top: Metadata Bar */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-3 pt-1">
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-display font-bold shadow-2xs animate-fadeIn">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready for Study</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBE8DC] text-[#E8722C] border border-[#E8722C]/30 text-xs font-display font-bold animate-pulse">
                        <Cpu className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {simulationStep === 'analyzing'
                            ? 'Analyzing Document...'
                            : 'Chunking Passages...'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content: Title & Summary */}
                <div className="text-left mt-3 pt-3 border-t border-[#1B3428]/10">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#14261D] mb-1">
                    {activeSample.title}
                  </h4>
                  <p className="font-serif text-xs sm:text-sm text-[#14261D]/75 leading-relaxed line-clamp-2">
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

                  {/* Ready Indicator Footer */}
                  <div className="mt-4 pt-3 border-t border-[#1B3428]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#14261D]/70">
                    <span className="font-bold text-[#497E64]">
                      ✓ {activeSample.chunksCount} Chunks Indexed & Embedded
                    </span>
                    <span className="text-[#14261D]/50">768-dim Vectors • Verified Grounding</span>
                  </div>
                </div>
              </div>

              {/* Conversion Footer with Micro-Copy & CTAs */}
              <div className="border-t border-[#1B3428]/10 pt-5 mt-6 text-left">
                {/* Micro-copy banner */}
                <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/15">
                  <Sparkles className="w-4 h-4 text-[#E8722C] shrink-0" />
                  <p className="font-sans text-xs text-[#14261D]/80 leading-snug">
                    <strong className="text-[#14261D] font-semibold">Ready to study your own textbooks?</strong> Create an account to upload and index your own learning materials.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="font-sans text-xs text-[#14261D]/60 hidden sm:inline">
                    Free student tier includes 3 active material workspaces.
                  </span>

                  <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                    <Link
                      href="/login"
                      className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-transparent text-[#14261D] font-display font-bold text-sm border-[1.5px] border-[#1B3428] shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-black/5 transition-all text-center select-none"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-[#E8722C] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-[#D66522] transition-all text-center select-none whitespace-nowrap inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
