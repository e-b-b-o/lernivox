'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldCheck,
  BrainCircuit,
  GraduationCap,
  Users,
  HelpCircle,
  ChevronDown,
  Layers,
  Database,
  Cpu,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { HeroUpload } from '../../components/marketing/HeroUpload';
import { GuidedLearningPreview } from '../../components/marketing/GuidedLearningPreview';
import { WavingRibbon } from '../../components/marketing/WavingRibbon';

export default function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'What document formats does Lernivox support?',
      a: 'Lernivox natively accepts PDF documents, Microsoft Word files (.docx), plain text files (.txt), and direct pasted study notes. Files up to 25 MB are supported in this phase.',
    },
    {
      q: 'How does Lernivox guarantee zero hallucinations in explanations?',
      a: 'Unlike generic conversational AI, Lernivox strictly grounds its responses in your uploaded textbook. Documents are chunked and embedded into 768-dimensional vectors. When you ask a question, the AI retrieves verbatim passages and synthesizes an answer using only the verified source material, citing exact chapter and page numbers.',
    },
    {
      q: 'Is my textbook content and student data private?',
      a: 'Yes, absolutely. Uploaded files are isolated within your private user workspace using secure storage adapters. Your private learning materials are never indexed publicly, never shared with other students without your explicit consent, and never used to train public AI models.',
    },
    {
      q: 'How does background document processing work?',
      a: 'When you upload a file, our NestJS backend validates the MIME type and size, stores the file securely, and enqueues a background job via BullMQ and Redis. Our dedicated worker processes the document in clear stages: text extraction, semantic chunking, 768-dim vector embedding, and pgvector persistence. This keeps the web interface fast and non-blocking.',
    },
    {
      q: 'Can I upload scanned PDFs or handwritten notes?',
      a: 'In this phase, Lernivox processes digital documents with selectable text. Scanned photo PDFs without an embedded text layer and handwritten notes will be supported in a future update through specialized OCR pipelines.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ======================================================== */}
      {/* SECTION 1: HERO & UPLOAD ENTRY POINT */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-[120px] lg:pt-[146px] pb-12">
        {/* Subtle decorative background gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#F9D8C0]/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-[1380px] px-6 md:px-10 text-center">
          {/* Main Headline */}
          <h1 className="font-display font-black text-6xl md:text-8xl lg:text-[103px] leading-[0.98] tracking-[-0.03em] text-[#14261D] max-w-6xl mx-auto">
            Turn your textbooks
            <span className="block mt-2 md:mt-3">
              into real{' '}
              <span className="relative inline-block rotate-[3.5deg] origin-bottom-left text-[#497E64] pb-2 md:pb-3 select-none">
                understanding.
                {/* Top-Right Accent Ticks (//) in #E8722C */}
                <span className="absolute -top-3 md:-top-5 -right-6 md:-right-8 w-6 h-6 md:w-8 md:h-8 pointer-events-none select-none text-[#E8722C]">
                  <svg
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <path
                      d="M 7 21 L 13 7"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 17 23 L 23 9"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                {/* Bottom Decor: Multiple Sketch Underline Lines in #E8722C */}
                <span className="absolute -bottom-3 md:-bottom-5 left-0 w-[102%] h-4 md:h-6 pointer-events-none select-none text-[#E8722C]">
                  <svg
                    viewBox="0 0 320 22"
                    fill="none"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full overflow-visible"
                  >
                    {/* Primary top sketch line */}
                    <path
                      d="M 4 8 C 80 4, 200 4.5, 314 9.5"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Secondary lower sketch line */}
                    <path
                      d="M 22 15.5 C 95 11, 220 11.5, 290 17"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    {/* Subtle third sketch accent */}
                    <path
                      d="M 45 20 C 110 17, 180 18, 230 20.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  </svg>
                </span>
              </span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="font-sans font-normal text-lg md:text-xl lg:text-[20px] text-[#14261D]/75 max-w-3xl mx-auto text-center leading-relaxed mt-7">
            Upload course materials, lecture slides, or textbook chapters. Lernivox breaks complex subjects into guided explanations, worked methods, and verified practice—grounded directly in your source documents.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="#how-it-works"
              className="h-[54px] px-[30px] py-[16px] rounded-[100px] bg-[#E8722C] text-white font-sans text-[16px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#B26E45] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#B26E45] active:translate-y-[2px] active:shadow-[0_2px_0_0_#B26E45] transition-all duration-150 inline-flex items-center justify-center select-none"
            >
              Upload Course Material
            </a>
            <a
              href="#sample-lesson"
              className="h-[54px] px-[30px] py-[16px] rounded-[100px] bg-[#F4F0E5] text-[#14261D] font-sans text-[16px] font-medium leading-[22.4px] border border-[#1B3428] shadow-[0_4px_0_0_#1B3428] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#1B3428] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1B3428] transition-all duration-150 inline-flex items-center justify-center select-none"
            >
              Explore Sample Lesson
            </a>
          </div>

          {/* ======================================================== */}
          {/* PHOTO SHOWCASE & WAVING RIBBON BAND */}
          {/* ======================================================== */}
          <div className="relative mt-20 md:mt-28 w-full overflow-visible">
            {/* Edge-to-edge animated waving ribbon band passing behind photos */}
            <WavingRibbon />

            {/* Three Overlapping Photography Cards */}
            <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-8 md:gap-12 max-w-5xl mx-auto px-4 pt-4 pb-8">
              {/* Left Card: Tilted (-rotate-6) */}
              <div className="group relative w-44 md:w-56 aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-4 border-white -rotate-6 hover:rotate-0 transition-transform duration-300 mt-10 md:mt-16 flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80"
                  alt="Student reading focused"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Soft peach badge with smiling face sticker */}
                <div className="absolute top-3 left-3 bg-[#F9D8C0] text-[#14261D] rounded-full px-3 py-1 text-xs font-bold shadow-md flex items-center gap-1 select-none">
                  <span>Focused</span>
                  <span>:)</span>
                </div>
              </div>

              {/* Center Card: Elevated & Upright */}
              <div className="group relative w-60 md:w-72 lg:w-80 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10 -mt-6 md:-mt-10 flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                  alt="Modern library student with books"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Subtle caption tag */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#14261D]/80 via-[#14261D]/20 to-transparent flex items-end justify-center">
                  <span className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-1.5 text-xs font-bold text-[#14261D] shadow-sm select-none">
                    Stewart Calculus • Grounded
                  </span>
                </div>
              </div>

              {/* Right Card: Tilted (rotate-6) */}
              <div className="group relative w-48 md:w-60 aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-4 border-white rotate-6 hover:rotate-0 transition-transform duration-300 -mt-4 md:-mt-6 flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                  alt="Collaborative tutoring study session"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Soft green flower/cloud sticker */}
                <div className="absolute top-3 right-3 bg-[#497E64] text-[#F6F4EE] rounded-full px-3 py-1 text-xs font-bold shadow-md flex items-center gap-1 select-none">
                  <span>Peer Study</span>
                  <span>✿</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: HOW IT WORKS (INGESTION & WORKFLOW SHOWCASE) */}
      {/* ======================================================== */}
      <HeroUpload />

      {/* ======================================================== */}
      {/* SECTION 3: GUIDED LEARNING PREVIEW */}
      {/* ======================================================== */}
      <section id="sample-lesson" className="border-t border-[#EAE4D3] bg-[#F6F4EE] py-24 md:py-36">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#45564B] mb-6 shadow-subtle font-sans">
              Live Product Experience
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D]">
              See how Lernivox deconstructs{' '}
              <span className="text-[#497E64]">
                difficult topics
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-[#45564B] leading-relaxed font-sans">
              Rather than generic summaries, Lernivox presents learning objectives, intuitive mental models, worked calculations, and instant comprehension checks.
            </p>
          </div>

          <GuidedLearningPreview />
        </div>
      </section>


      {/* ======================================================== */}
      {/* SECTION 4: LEARNING FEATURES */}
      {/* ======================================================== */}
      <section id="features" className="border-t border-[#EAE4D3] bg-[#FAF8F4]/60 py-24 md:py-36">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#45564B] mb-6 shadow-subtle font-sans">
              Core Capabilities
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D]">
              Engineered for genuine{' '}
              <span className="text-[#497E64]">
                academic retention
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-[#45564B] leading-relaxed font-sans">
              Every feature is purposefully designed to bridge the gap between heavy textbooks and active recall.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9D8C0] text-[#E8722C] mb-6 shadow-subtle">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Guided AI Tutor
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Answers your questions using solely your professor’s slides and textbook chapters. Never hallucinates arbitrary formulas or ungrounded facts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9E0F2] text-[#14261D] mb-6 shadow-subtle">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Step-by-Step Worked Methods
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Breaks intricate mathematical derivations, biological cycles, and legal analyses into progressive, digestible sub-steps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6E59A] text-[#14261D] mb-6 shadow-subtle">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Chapter Quizzes & Feedback
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Generates practice questions tied directly to chapter learning objectives, providing instant explanations for wrong options.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6D7E8] text-[#14261D] mb-6 shadow-subtle">
                <Cpu className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Problem-Solving Challenges
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Applies abstract principles to novel problem sets, encouraging conceptual mastery rather than rote memorization.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAE4D3] text-[#14261D] mb-6 shadow-subtle">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Structured Revision Cards
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Condenses dense 50-page textbook chapters into high-yield summaries, formula reference cheat sheets, and active flashcards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-[#14261D] mb-6 shadow-subtle">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#14261D] mb-3">
                Verifiable Page Citations
              </h3>
              <p className="font-sans text-base text-[#45564B] leading-relaxed">
                Click any citation tag to jump directly to the exact textbook page, section number, and verbatim passage backing up the answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: PROGRESS AND EXAM PREPARATION */}
      {/* ======================================================== */}
      <section className="border-t border-[#EAE4D3] bg-[#F6F4EE] py-24 md:py-36">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#14261D]/70 mb-6 shadow-subtle">
                Objective Metrics
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D] leading-[1.08]">
                Track exam readiness with{' '}
                <span className="text-[#497E64]">
                  verifiable certainty
                </span>
                .
              </h2>
              <p className="mt-6 text-lg sm:text-xl text-[#14261D]/75 leading-relaxed">
                Stop guessing whether you are prepared for midterms. Lernivox tracks topic completion, quiz accuracy, and source comprehension across every chapter.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#497E64] flex-shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#14261D]">Chapter-by-Chapter Completion</h4>
                    <p className="text-base text-[#14261D]/70 mt-1">
                      Monitor which sections you’ve digested, chunked, and quizzed versus untouched textbook pages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#497E64] flex-shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#14261D]">Weak Concept Diagnostics</h4>
                    <p className="text-base text-[#14261D]/70 mt-1">
                      Pinpoint exact theorems or formulas where practice quiz scores indicate gaps in retention.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F9D8C0] text-[#E8722C] flex-shrink-0 mt-0.5 font-bold text-sm">
                    ★
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#14261D]">Spaced-Repetition Review (Roadmap)</h4>
                    <p className="text-base text-[#14261D]/70 mt-1">
                      Personalized daily review schedules based on memory decay curves are in active development.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Metric Mockup Card */}
            <div className="rounded-[2.5rem] border border-[#EAE4D3] bg-white/90 backdrop-blur-md p-8 sm:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex items-center justify-between border-b border-[#EAE4D3] pb-6 mb-8">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#14261D]">
                    Stewart Calculus — Exam Readiness
                  </h3>
                  <p className="text-sm text-[#14261D]/60 mt-0.5">4 of 6 chapters indexed</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-[#497E64]">
                  78% Ready
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#14261D] mb-2">
                    <span>§ 2.1 Limits & Derivatives</span>
                    <span className="text-[#497E64] font-bold">100% Mastered</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                    <div className="h-full bg-[#497E64] rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#14261D] mb-2">
                    <span>§ 2.5 The Chain Rule</span>
                    <span className="text-[#497E64] font-bold">85% Mastered</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                    <div className="h-full bg-[#497E64] rounded-full w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#14261D] mb-2">
                    <span>§ 3.1 Implicit Differentiation</span>
                    <span className="text-[#E8722C] font-bold">45% In Progress</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                    <div className="h-full bg-[#E8722C] rounded-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-[#14261D] mb-2">
                    <span>§ 3.4 Related Rates</span>
                    <span className="text-[#14261D]/50 font-medium">Queued for review</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                    <div className="h-full bg-stone-300 rounded-full w-[10%]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#EAE4D3] flex items-center justify-between text-sm text-[#14261D]/60">
                <span>Indexed using pgvector (768-dim)</span>
                <span className="font-semibold text-[#14261D]">142 verified citations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: COLLABORATIVE LEARNING */}
      {/* ======================================================== */}
      <section className="border-t border-[#EAE4D3] bg-[#FAF8F4]/60 py-24 md:py-36">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#14261D]/70 mb-6 shadow-subtle">
            Future Collaboration
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D] max-w-4xl mx-auto">
            Study groups built around{' '}
            <span className="text-[#497E64]">
              shared course materials
            </span>
            .
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-[#14261D]/75 leading-relaxed">
            In our upcoming collaborative release, study partners will be able to share private textbook indexes, challenge classmates to chapter quizzes, and compare solution methods without duplicating upload workloads.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCE2F5] text-[#14261D] mb-6 mx-auto shadow-subtle">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#14261D] mb-2">
                Shared Document Index
              </h3>
              <p className="text-base text-[#14261D]/70 leading-relaxed">
                One student uploads the heavy textbook; the entire study group accesses the indexed chapter citations.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8E6A2] text-[#14261D] mb-6 mx-auto shadow-subtle">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#14261D] mb-2">
                Group Practice Rounds
              </h3>
              <p className="text-base text-[#14261D]/70 leading-relaxed">
                Compete synchronously on randomized chapter problem sets to prep before recitation.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9D8C0] text-[#E8722C] mb-6 mx-auto shadow-subtle">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#14261D] mb-2">
                Strict Privacy Controls
              </h3>
              <p className="text-base text-[#14261D]/70 leading-relaxed">
                Your personal study notes and mistakes remain private; only shared deck questions are visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: PRICING */}
      {/* ======================================================== */}
      <section id="pricing" className="border-t border-[#EAE4D3] bg-[#F6F4EE] py-24 md:py-36">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#14261D]/70 mb-6 shadow-subtle">
              Transparent Freemium Model
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D]">
              Simple, accessible{' '}
              <span className="text-[#497E64]">
                academic plans
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-[#14261D]/75 leading-relaxed">
              Every student gets genuine document grounding for free. Upgrade only when you manage an extensive multi-semester library.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 max-w-5xl mx-auto items-stretch">
            {/* Free Starter Tier */}
            <div className="flex flex-col justify-between rounded-[2.5rem] border border-[#EAE4D3] bg-white/85 backdrop-blur-md p-10 md:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div>
                <span className="rounded-full bg-[#F6F4EE] px-4 py-1.5 text-xs font-bold text-[#14261D] border border-[#EAE4D3]">
                  Free Starter
                </span>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl md:text-6xl font-black text-[#14261D]">$0</span>
                  <span className="text-base text-[#14261D]/60 font-medium">/ forever</span>
                </div>
                <p className="mt-4 text-base text-[#14261D]/70 leading-relaxed">
                  Ideal for students focusing on a core class or midterm syllabus this term.
                </p>

                <ul className="mt-8 space-y-4 text-base text-[#14261D]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Upload up to 3 active textbooks or syllabi</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Files up to 25 MB (PDF, DOCX, TXT)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Standard BullMQ asynchronous processing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Full citation grounding & chapter practice quizzes</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-8 border-t border-[#EAE4D3]">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full justify-center rounded-full border-[#14261D]/25 text-[#14261D] hover:bg-white/60 font-medium text-[16px] py-3.5">
                    Start Learning Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Scholar Tier */}
            <div className="flex flex-col justify-between rounded-[2.5rem] border-2 border-[#14261D] bg-[#FAF8F4]/90 backdrop-blur-md p-10 md:p-12 shadow-card-hover transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#F9D8C0]/90 text-[#E8722C] text-xs font-bold uppercase tracking-wider px-6 py-2 rounded-bl-2xl border-l border-b border-[#F9D8C0]">
                Coming Soon
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#F9D8C0] px-4 py-1.5 text-xs font-bold text-[#E8722C]">
                    Pro Scholar
                  </span>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl md:text-6xl font-black text-[#14261D]">Freemium</span>
                  <span className="text-base text-[#14261D]/60 font-medium">tier</span>
                </div>
                <p className="mt-4 text-base text-[#14261D]/70 leading-relaxed">
                  For university students managing full course loads, research papers, and thesis materials.
                </p>

                <ul className="mt-8 space-y-4 text-base text-[#14261D]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Unlimited document uploads and course libraries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Priority background worker queueing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Comprehensive multi-chapter vector indexing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#497E64] flex-shrink-0" />
                    <span>Early access to study rooms and OCR pipelines</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-8 border-t border-[#EAE4D3]">
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center rounded-full bg-[#14261D] hover:bg-[#1f3a2c] text-white font-medium text-[16px] py-3.5 shadow-sm transition-all"
                  >
                    Register for Early Access
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 8: FREQUENTLY ASKED QUESTIONS */}
      {/* ======================================================== */}
      <section id="faq" className="border-t border-[#EAE4D3] bg-[#FAF8F4]/60 py-24 md:py-36">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE4D3] bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#14261D]/70 mb-6 shadow-subtle">
              Answers & Transparency
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#14261D]">
              Frequently asked{' '}
              <span className="text-[#497E64]">
                questions
              </span>
              .
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[1.75rem] border border-[#EAE4D3] bg-white/90 backdrop-blur-md overflow-hidden shadow-subtle hover:shadow-card transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-7 text-left focus:outline-none"
                  >
                    <span className="font-display text-lg md:text-xl font-bold text-[#14261D] pr-6">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#14261D]/60 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-7 pb-7 text-base text-[#14261D]/75 leading-relaxed border-t border-[#EAE4D3]/50 pt-5 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 9: FINAL CALL TO ACTION */}
      {/* ======================================================== */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="rounded-[3rem] bg-gradient-to-br from-[#14261D] via-[#1A3327] to-[#12231A] text-white p-12 sm:p-20 shadow-2xl relative overflow-hidden text-center">
            {/* Subtle radial decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#E8722C]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-2 text-xs md:text-sm font-semibold text-[#F9D8C0] mb-8">
                Start Your First Session
              </div>

              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08]">
                Ready to study with{' '}
                <span className="text-[#F9D8C0]">
                  verified certainty
                </span>
                ?
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-stone-300 leading-relaxed">
                Upload your first textbook chapter and experience learning grounded in real citations and zero hallucination.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full bg-[#E8722C] hover:bg-[#d66522] text-white font-['Instrument_Sans'] font-semibold text-[17px] px-[36px] py-[18px] shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Create Free Student Account
                    <ArrowRight className="ml-2.5 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#upload-card">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-['Instrument_Sans'] font-medium text-[17px] px-[36px] py-[18px] transition-all duration-200"
                  >
                    Upload Document Now
                  </Button>
                </a>
              </div>

              <p className="mt-8 text-sm text-stone-400">
                No credit card required • Strict private textbook storage • Instant setup
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

