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

          {/* Prominent Upload Card Component */}
          <div id="upload-card" className="mt-16 md:mt-24">
            <HeroUpload />
          </div>

          {/* Value Props Row under Hero */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-2.5 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-5 py-2 text-sm font-medium text-stone-700 shadow-subtle">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Verifiable Page Citations</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-5 py-2 text-sm font-medium text-stone-700 shadow-subtle">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Zero-Hallucination Grounding</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-5 py-2 text-sm font-medium text-stone-700 shadow-subtle">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Asynchronous BullMQ Ingestion</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: HOW IT WORKS */}
      {/* ======================================================== */}
      <section id="how-it-works" className="border-t border-stone-200/80 bg-lernivox-cream-light/60 py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
              The Learning Journey
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest">
              From raw textbook to{' '}
              <span className="font-serif italic font-normal text-lernivox-terracotta">
                verified mastery
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
              Lernivox replaces chaotic skimming with a structured, step-by-step learning loop directly connected to your actual curriculum.
            </p>
          </div>

          {/* 4-Step Cards */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8E6A2] text-lernivox-forest font-display font-black text-xl mb-6 shadow-subtle">
                  01
                </div>
                <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                  Upload Materials
                </h3>
                <p className="text-base text-stone-600 leading-relaxed">
                  Drop PDF textbooks, lecture slides, DOCX syllabi, or raw study notes up to 25 MB directly into your private workspace.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Phase 1: Ingestion
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCE2F5] text-lernivox-forest font-display font-black text-xl mb-6 shadow-subtle">
                  02
                </div>
                <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                  Semantic Ingestion
                </h3>
                <p className="text-base text-stone-600 leading-relaxed">
                  BullMQ worker extracts text, chunks semantic passages, and generates 768-dim embeddings in PostgreSQL with pgvector.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Phase 2: Indexing
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-peach text-lernivox-terracotta font-display font-black text-xl mb-6 shadow-subtle">
                  03
                </div>
                <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                  Guided Explanation
                </h3>
                <p className="text-base text-stone-600 leading-relaxed">
                  Study difficult topics with outer-inner intuition, step-by-step methods, and worked examples cited to exact page numbers.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Phase 3: Understanding
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-stone text-lernivox-forest font-display font-black text-xl mb-6 shadow-subtle">
                  04
                </div>
                <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                  Verified Practice
                </h3>
                <p className="text-base text-stone-600 leading-relaxed">
                  Reinforce recall with chapter quizzes, flashcards, and exam-readiness challenges linked directly to source passages.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Phase 4: Mastery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: GUIDED LEARNING PREVIEW */}
      {/* ======================================================== */}
      <section id="sample-lesson" className="border-t border-stone-200/80 bg-lernivox-cream py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
              Live Product Experience
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest">
              See how Lernivox deconstructs{' '}
              <span className="font-serif italic font-normal text-lernivox-terracotta">
                difficult topics
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
              Rather than generic summaries, Lernivox presents learning objectives, intuitive mental models, worked calculations, and instant comprehension checks.
            </p>
          </div>

          <GuidedLearningPreview />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 4: LEARNING FEATURES */}
      {/* ======================================================== */}
      <section id="features" className="border-t border-stone-200/80 bg-lernivox-cream-light/60 py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
              Core Capabilities
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest">
              Engineered for genuine{' '}
              <span className="font-serif italic font-normal text-lernivox-terracotta">
                academic retention
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
              Every feature is purposefully designed to bridge the gap between heavy textbooks and active recall.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-peach text-lernivox-terracotta mb-6 shadow-subtle">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Guided AI Tutor
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Answers your questions using solely your professor’s slides and textbook chapters. Never hallucinates arbitrary formulas or ungrounded facts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCE2F5] text-lernivox-forest mb-6 shadow-subtle">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Step-by-Step Worked Methods
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Breaks intricate mathematical derivations, biological cycles, and legal analyses into progressive, digestible sub-steps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8E6A2] text-lernivox-forest mb-6 shadow-subtle">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Chapter Quizzes & Feedback
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Generates practice questions tied directly to chapter learning objectives, providing instant explanations for wrong options.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6D7E8] text-lernivox-forest mb-6 shadow-subtle">
                <Cpu className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Problem-Solving Challenges
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Applies abstract principles to novel problem sets, encouraging conceptual mastery rather than rote memorization.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-stone/80 text-lernivox-forest mb-6 shadow-subtle">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Structured Revision Cards
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Condenses dense 50-page textbook chapters into high-yield summaries, formula reference cheat sheets, and active flashcards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-6 shadow-subtle">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-bold text-lernivox-forest mb-3">
                Verifiable Page Citations
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Click any citation tag to jump directly to the exact textbook page, section number, and verbatim passage backing up the answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: PROGRESS AND EXAM PREPARATION */}
      {/* ======================================================== */}
      <section className="border-t border-stone-200/80 bg-lernivox-cream py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
                Objective Metrics
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest leading-[1.08]">
                Track exam readiness with{' '}
                <span className="font-serif italic font-normal text-lernivox-terracotta">
                  verifiable certainty
                </span>
                .
              </h2>
              <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
                Stop guessing whether you are prepared for midterms. Lernivox tracks topic completion, quiz accuracy, and source comprehension across every chapter.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-lernivox-forest">Chapter-by-Chapter Completion</h4>
                    <p className="text-base text-stone-600 mt-1">
                      Monitor which sections you’ve digested, chunked, and quizzed versus untouched textbook pages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-lernivox-forest">Weak Concept Diagnostics</h4>
                    <p className="text-base text-stone-600 mt-1">
                      Pinpoint exact theorems or formulas where practice quiz scores indicate gaps in retention.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lernivox-peach text-lernivox-terracotta flex-shrink-0 mt-0.5 font-bold text-sm">
                    ★
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-lernivox-forest">Spaced-Repetition Review (Roadmap)</h4>
                    <p className="text-base text-stone-600 mt-1">
                      Personalized daily review schedules based on memory decay curves are in active development.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Metric Mockup Card */}
            <div className="rounded-[2.5rem] border border-stone-200/80 bg-white/90 backdrop-blur-md p-8 sm:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-6 mb-8">
                <div>
                  <h3 className="font-display text-xl font-bold text-lernivox-forest">
                    Stewart Calculus — Exam Readiness
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5">4 of 6 chapters indexed</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
                  78% Ready
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-lernivox-forest mb-2">
                    <span>§ 2.1 Limits & Derivatives</span>
                    <span className="text-emerald-700 font-bold">100% Mastered</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-lernivox-forest mb-2">
                    <span>§ 2.5 The Chain Rule</span>
                    <span className="text-emerald-700 font-bold">85% Mastered</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                    <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-lernivox-forest mb-2">
                    <span>§ 3.1 Implicit Differentiation</span>
                    <span className="text-amber-700 font-bold">45% In Progress</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                    <div className="h-full bg-amber-400 rounded-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-lernivox-forest mb-2">
                    <span>§ 3.4 Related Rates</span>
                    <span className="text-stone-500 font-medium">Queued for review</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                    <div className="h-full bg-stone-300 rounded-full w-[10%]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200/80 flex items-center justify-between text-sm text-stone-500">
                <span>Indexed using pgvector (768-dim)</span>
                <span className="font-semibold text-lernivox-forest">142 verified citations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: COLLABORATIVE LEARNING */}
      {/* ======================================================== */}
      <section className="border-t border-stone-200/80 bg-lernivox-cream-light/60 py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
            Future Collaboration
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest max-w-4xl mx-auto">
            Study groups built around{' '}
            <span className="font-serif italic font-normal text-lernivox-terracotta">
              shared course materials
            </span>
            .
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-stone-600 leading-relaxed">
            In our upcoming collaborative release, study partners will be able to share private textbook indexes, challenge classmates to chapter quizzes, and compare solution methods without duplicating upload workloads.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCE2F5] text-lernivox-forest mb-6 mx-auto shadow-subtle">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-lernivox-forest mb-2">
                Shared Document Index
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                One student uploads the heavy textbook; the entire study group accesses the indexed chapter citations.
              </p>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8E6A2] text-lernivox-forest mb-6 mx-auto shadow-subtle">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-lernivox-forest mb-2">
                Group Practice Rounds
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Compete synchronously on randomized chapter problem sets to prep before recitation.
              </p>
            </div>

            <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-8 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lernivox-peach text-lernivox-terracotta mb-6 mx-auto shadow-subtle">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-lernivox-forest mb-2">
                Strict Privacy Controls
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                Your personal study notes and mistakes remain private; only shared deck questions are visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: PRICING */}
      {/* ======================================================== */}
      <section id="pricing" className="border-t border-stone-200/80 bg-lernivox-cream py-24 md:py-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
              Transparent Freemium Model
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest">
              Simple, accessible{' '}
              <span className="font-serif italic font-normal text-lernivox-terracotta">
                academic plans
              </span>
              .
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed">
              Every student gets genuine document grounding for free. Upgrade only when you manage an extensive multi-semester library.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 max-w-5xl mx-auto items-stretch">
            {/* Free Starter Tier */}
            <div className="flex flex-col justify-between rounded-[2.5rem] border border-stone-200/80 bg-white/85 backdrop-blur-md p-10 md:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div>
                <span className="rounded-full bg-lernivox-cream px-4 py-1.5 text-xs font-bold text-lernivox-forest border border-stone-200/80">
                  Free Starter
                </span>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl md:text-6xl font-black text-lernivox-forest">$0</span>
                  <span className="text-base text-stone-500 font-medium">/ forever</span>
                </div>
                <p className="mt-4 text-base text-stone-600 leading-relaxed">
                  Ideal for students focusing on a core class or midterm syllabus this term.
                </p>

                <ul className="mt-8 space-y-4 text-base text-lernivox-forest">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Upload up to 3 active textbooks or syllabi</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Files up to 25 MB (PDF, DOCX, TXT)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Standard BullMQ asynchronous processing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Full citation grounding & chapter practice quizzes</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-8 border-t border-stone-200/80">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full justify-center">
                    Start Learning Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Scholar Tier */}
            <div className="flex flex-col justify-between rounded-[2.5rem] border-2 border-lernivox-forest bg-lernivox-cream-light/90 backdrop-blur-md p-10 md:p-12 shadow-card-hover transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-lernivox-peach/80 text-lernivox-terracotta text-xs font-bold uppercase tracking-wider px-6 py-2 rounded-bl-2xl border-l border-b border-lernivox-peach">
                Coming Soon
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-lernivox-peach px-4 py-1.5 text-xs font-bold text-lernivox-terracotta">
                    Pro Scholar
                  </span>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl md:text-6xl font-black text-lernivox-forest">Freemium</span>
                  <span className="text-base text-stone-500 font-medium">tier</span>
                </div>
                <p className="mt-4 text-base text-stone-600 leading-relaxed">
                  For university students managing full course loads, research papers, and thesis materials.
                </p>

                <ul className="mt-8 space-y-4 text-base text-lernivox-forest">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Unlimited document uploads and course libraries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Priority background worker queueing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Comprehensive multi-chapter vector indexing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Early access to study rooms and OCR pipelines</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-8 border-t border-stone-200/80">
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center shadow-glow-terracotta"
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
      <section id="faq" className="border-t border-stone-200/80 bg-lernivox-cream-light/60 py-24 md:py-36">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-6 shadow-subtle">
              Answers & Transparency
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-lernivox-forest">
              Frequently asked{' '}
              <span className="font-serif italic font-normal text-lernivox-terracotta">
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
                  className="rounded-[1.75rem] border border-stone-200/80 bg-white/90 backdrop-blur-md overflow-hidden shadow-subtle hover:shadow-card transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-7 text-left focus:outline-none"
                  >
                    <span className="font-display text-lg md:text-xl font-bold text-lernivox-forest pr-6">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-stone-500 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-7 pb-7 text-base text-stone-600 leading-relaxed border-t border-stone-100 pt-5 animate-fadeIn">
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
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="rounded-[3rem] bg-gradient-to-br from-[#14261D] via-[#1A3327] to-[#12231A] text-white p-12 sm:p-20 shadow-2xl relative overflow-hidden text-center">
            {/* Subtle radial decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-lernivox-terracotta/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-2 text-xs md:text-sm font-semibold text-lernivox-peach mb-8">
                Start Your First Session
              </div>

              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.08]">
                Ready to study with{' '}
                <span className="font-serif italic font-normal text-lernivox-peach">
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
                    className="px-10 h-14 text-lg font-semibold shadow-glow-terracotta"
                  >
                    Create Free Student Account
                    <ArrowRight className="ml-2.5 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#upload-card">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-10 h-14 text-lg font-semibold border-white/30 bg-white/10 text-white hover:bg-white/20"
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

