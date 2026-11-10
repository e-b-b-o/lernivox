'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Users,
  HelpCircle,
} from 'lucide-react';
import { HeroUpload } from '../../components/marketing/HeroUpload';
import { GuidedLearningPreview } from '../../components/marketing/GuidedLearningPreview';
import { WavingRibbon } from '../../components/marketing/WavingRibbon';
import { ScrollReveal, StaggerContainer } from '../../components/ui/scroll-reveal';

export default function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'What document formats does Lernivox support?',
      a: 'Lernivox natively accepts PDF documents, Microsoft Word files (.docx), plain text files (.txt), and direct pasted text. Files up to 1 MB are supported in this release.',
    },
    {
      q: 'How does Lernivox make sure answers are grounded in what I am reading?',
      a: 'Unlike generic conversational AI, Lernivox strictly grounds its answers in your uploaded material. When you ask a question, the AI tutor retrieves relevant passages from your book or notes and explains them clearly, citing exact page numbers and chapter references so you can verify everything for yourself.',
    },
    {
      q: 'Is my reading material and personal data private?',
      a: 'Yes, absolutely. Uploaded books, articles, and notes remain isolated in your personal workspace. Your private materials and conversations are never shared with others without your permission and are never used to train public AI models.',
    },
    {
      q: 'How does Lernivox prepare my material for reading?',
      a: 'When you upload a file, Lernivox securely stores it and prepares it for guided reading in clear stages: reading the text, organizing chapters and sections, and indexing topics. This background process ensures the reader is fast, responsive, and ready for you to ask questions.',
    },
    {
      q: 'What kinds of books and materials can I learn from?',
      a: 'You can bring any material with selectable text: literature, fiction novels, history books, science texts, programming guides, mathematics, or your own lecture notes. If it has text you want to understand, Lernivox helps you read it and learn from it.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ======================================================== */}
      {/* SECTION 1: HERO & UPLOAD ENTRY POINT */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-[120px] lg:pt-[146px] pb-12 px-4 sm:px-6 md:px-10">
        {/* Subtle decorative background gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#F9D8C0]/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-[1380px] text-center">
          {/* Main Headline — Three intentional lines on mobile (28-34px), two lines on tablet/desktop */}
          <ScrollReveal id="hero-headline" delay={0.1}>
            <h1 className="font-display font-extrabold text-[clamp(1.75rem,1.25rem+2.5vw,2.125rem)] sm:text-[clamp(2.5rem,5.6vw,3.9rem)] lg:text-[clamp(3.9rem,5.2vw,5.25rem)] leading-[1.15] sm:leading-[1.12] tracking-tight text-[#14261D] max-w-6xl mx-auto text-center mb-6">
              <span>Understand every </span>
              <br className="sm:hidden" />
              <span>book, </span>
              <br className="hidden sm:block" />
              <span>one question </span>
              <br className="sm:hidden" />
              <span>
                at a{' '}
                <span 
                  className="relative inline-block text-[#497E64] ml-1 sm:ml-1.5 select-none"
                  style={{
                    transform: 'translateY(-2px) rotate(2deg)',
                    transformOrigin: 'bottom right',
                    display: 'inline-block'
                  }}
                >
                  time.

                  {/* Responsive SVG Doodle Underline */}
                  <svg
                    className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-[10px] sm:h-[14px] md:h-[18px] text-[#E8722C] pointer-events-none overflow-visible"
                    viewBox="0 0 320 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path d="M 4 8 C 70 3, 200 4, 315 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 16 12 C 100 6, 230 11, 300 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                  </svg>

                  {/* Spark Ticks */}
                  <svg
                    className="absolute -top-2.5 sm:-top-3.5 -right-4 sm:-right-6 w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h1>
          </ScrollReveal>

          {/* Subheadline — Concise, Human Editorial Copy with Balanced Wrapping */}
          <ScrollReveal id="hero-subheadline" delay={0.2}>
            <p className="font-sans font-normal text-base sm:text-lg md:text-xl text-[#14261D]/80 max-w-4xl mx-auto text-center leading-relaxed mt-4 sm:mt-6 mb-8 [text-wrap:balance]">
              Bring a book, article, or notes. Read, ask questions, and learn with your AI tutor.
            </p>
          </ScrollReveal>

          {/* Action CTAs — Proportional tactile 44px pill buttons with intrinsic widths and intentional wrapping */}
          <ScrollReveal id="hero-ctas" delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-16 w-full mx-auto">
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('how-it-works');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#how-it-works');
                  }
                }}
                className="w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-[#E8722C] text-white font-sans text-sm sm:text-[15px] font-semibold shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-[0_1px_0_0_#B26E45] transition-all duration-150 inline-flex items-center justify-center whitespace-nowrap select-none text-center cursor-pointer"
              >
                Upload a Book or Notes
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('features');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', '#features');
                  }
                }}
                className="w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-[#F4EFE4] text-[#14261D] font-sans text-sm sm:text-[15px] font-medium border border-[#1B3428]/30 shadow-2xs hover:border-[#1B3428] hover:bg-[#FAF8F4] active:translate-y-0.5 transition-all duration-150 inline-flex items-center justify-center whitespace-nowrap select-none text-center cursor-pointer"
              >
                Explore Features
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* ======================================================== */}
        {/* PHOTO SHOWCASE & FULL-BLEED WAVING RIBBON BAND */}
        {/* ======================================================== */}
        <ScrollReveal id="hero-photos" delay={0.4} distance={40} className="relative w-full overflow-hidden py-4 mt-6 md:mt-8">
          {/* Edge-to-edge animated waving ribbon band passing behind photos */}
          <WavingRibbon />

          {/* Three Overlapping Photography Cards (Fluid percentage widths guarantee zero horizontal overflow across 320px to ultrawide) */}
          <div className="relative z-10 flex items-center justify-center gap-2 xs:gap-3 sm:gap-6 md:gap-8 lg:gap-10 max-w-5xl mx-auto px-2 sm:px-4 pt-4 pb-8 w-full">
            {/* Left Card: Tilted (-rotate-6) */}
            <div className="group relative w-[27%] max-w-[220px] min-w-[84px] sm:w-44 md:w-52 lg:w-56 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 sm:border-4 border-white -rotate-6 hover:rotate-0 transition-transform duration-300 mt-6 sm:mt-10 md:mt-16 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80"
                alt="Student reading focused"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Soft peach badge with smiling face sticker */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#F9D8C0] text-[#14261D] rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold shadow-md flex items-center gap-1 select-none">
                <span>Focused</span>
                <span>:)</span>
              </div>
            </div>

            {/* Center Card: Elevated & Upright */}
            <div className="group relative w-[38%] max-w-[320px] min-w-[120px] sm:w-60 md:w-68 lg:w-80 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white z-10 -mt-3 sm:-mt-6 md:-mt-10 flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                alt="Modern library student with books"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Subtle caption tag */}
              <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-[#14261D]/80 via-[#14261D]/20 to-transparent flex items-end justify-center">
                <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold text-[#14261D] shadow-sm select-none truncate max-w-full">
                  Books, Notes & Articles • Grounded
                </span>
              </div>
            </div>

            {/* Right Card: Tilted (rotate-6) */}
            <div className="group relative w-[28%] max-w-[240px] min-w-[88px] sm:w-48 md:w-56 lg:w-60 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 sm:border-4 border-white rotate-6 hover:rotate-0 transition-transform duration-300 -mt-2 sm:-mt-4 md:-mt-6 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                alt="Collaborative tutoring study session"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Soft green flower/cloud sticker */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#497E64] text-[#F6F4EE] rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold shadow-md flex items-center gap-1 select-none">
                <span>Peer Study</span>
                <span>✿</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: HOW IT WORKS (INGESTION & WORKFLOW SHOWCASE) */}
      {/* ======================================================== */}
      <HeroUpload />

      {/* ======================================================== */}
      {/* SECTION 3: UNIFIED FEATURES & INTERACTIVE LESSON PREVIEW */}
      {/* ======================================================== */}
      <section
        id="features"
        className="w-full bg-[#F4EFE4] pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-32 px-4 sm:px-6 md:px-10 scroll-mt-0 overflow-hidden"
      >
        <div className="max-w-[1380px] mx-auto">
        {/* ======================================================== */}
        {/* SECTION 3: INTERACTIVE LESSON PREVIEW */}
        {/* ======================================================== */}
        <ScrollReveal id="lesson-preview-heading" delay={0.1}>
          <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
            <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#14261D] tracking-tight leading-[1.08] mb-4 sm:mb-6">
              See how Lernivox deconstructs{' '}
              <span className="text-[#497E64]">difficult topics.</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#14261D]/75 max-w-xl mx-auto leading-relaxed">
              Get clear explanations, worked examples, and quick checks to make sure you understand.
            </p>
          </div>
        </ScrollReveal>

        {/* Tactile Framer Lesson Preview Notebook */}
        <ScrollReveal id="lesson-preview-card" delay={0.25} distance={36}>
          <div id="sample-lesson" className="scroll-mt-[86px]">
            <GuidedLearningPreview />
          </div>
        </ScrollReveal>

        {/* ======================================================== */}
        {/* SECTION 4: CAPABILITIES / ASYMMETRIC RETENTION ENGINE */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch mb-14 md:mb-16">
          
          {/* LEFT COLUMN */}
          <ScrollReveal id="retention-left" delay={0.1} className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-4xl lg:text-[44px] text-[#14261D] tracking-tight leading-[1.08] mb-3">
                Engineered for genuine academic{' '}
                <span
                  className="relative inline-block text-[#497E64] ml-1 select-none"
                  style={{
                    transform: 'translateY(-2px) rotate(2deg)',
                    transformOrigin: 'bottom right',
                    display: 'inline-block'
                  }}
                >
                  retention.

                  {/* Hand-Drawn Doodle Underline */}
                  <svg
                    className="absolute -bottom-2.5 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                    viewBox="0 0 240 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path d="M 4 8 C 50 3, 150 4, 235 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M 12 12 C 70 6, 170 11, 225 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                    <path d="M 35 10 C 90 6, 140 8, 185 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                  </svg>

                  {/* Spark Ticks (//) top-right */}
                  <svg
                    className="absolute -top-3.5 -right-6 w-5 h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h3>
              <p className="font-sans text-sm sm:text-base text-[#14261D]/75 leading-relaxed max-w-md">
                Practice with questions and flashcards directly connected to the chapters you are reading.
              </p>
            </div>

            {/* Photo Frame Anchoring the Bottom Flush with Card 03 */}
            <div className="w-full flex-1 min-h-[280px] rounded-[30px] overflow-hidden border border-[#14261D]/10 shadow-[0_6px_24px_rgba(20,38,29,0.06)] relative mt-6">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                alt="Students studying collaboratively"
                className="w-full h-full object-cover"
              />
            </div>
          </ScrollReveal>

          {/* RIGHT COLUMN: Scissor-Pinch Stacked Cards */}
          <StaggerContainer
            id="retention-cards"
            initialDelay={0.2}
            staggerDelay={0.14}
            className="lg:col-span-7 flex flex-col justify-start py-1"
          >
            {/* Card 01 */}
            <div 
              className="bg-white rounded-[26px] p-6 md:p-8 shadow-[0_4px_24px_rgba(20,38,29,0.06)] hover:shadow-[0_8px_32px_rgba(20,38,29,0.1)] transition-all duration-300 flex items-start gap-5 border border-black/[0.04] relative z-10"
              style={{ 
                transform: 'rotate(0.7deg)', 
                transformOrigin: 'center center',
                marginBottom: '18px'
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#E3EFFB] text-[#2B6CB0] flex items-center justify-center font-display font-bold text-base shrink-0">
                01
              </div>
              <div>
                <h4 className="font-display text-lg md:text-xl font-bold text-[#14261D] mb-1.5">
                  Guided AI Tutor
                </h4>
                <p className="font-sans text-sm md:text-[15px] leading-relaxed text-[#14261D]/75">
                  Ask questions about your book and get clear explanations with exact page citations.
                </p>
              </div>
            </div>

            {/* Card 02 */}
            <div 
              className="bg-white rounded-[26px] p-6 md:p-8 shadow-[0_4px_24px_rgba(20,38,29,0.06)] hover:shadow-[0_8px_32px_rgba(20,38,29,0.1)] transition-all duration-300 flex items-start gap-5 border border-black/[0.04] relative z-20"
              style={{ 
                transform: 'rotate(-2.0deg)', 
                transformOrigin: 'center center',
                marginBottom: '22px'
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#E2EBD8] text-[#497E64] flex items-center justify-center font-display font-bold text-base shrink-0">
                02
              </div>
              <div>
                <h4 className="font-display text-lg md:text-xl font-bold text-[#14261D] mb-1.5">
                  Step-by-Step Worked Methods
                </h4>
                <p className="font-sans text-sm md:text-[15px] leading-relaxed text-[#14261D]/75">
                  Break complex formulas, concepts, and derivations into clear, manageable steps.
                </p>
              </div>
            </div>

            {/* Card 03 */}
            <div 
              className="bg-white rounded-[26px] p-6 md:p-8 shadow-[0_4px_24px_rgba(20,38,29,0.06)] hover:shadow-[0_8px_32px_rgba(20,38,29,0.1)] transition-all duration-300 flex items-start gap-5 border border-black/[0.04] relative z-10"
              style={{ 
                transform: 'rotate(1.9deg)', 
                transformOrigin: 'center center'
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#FBE8DC] text-[#E8722C] flex items-center justify-center font-display font-bold text-base shrink-0">
                03
              </div>
              <div>
                <h4 className="font-display text-lg md:text-xl font-bold text-[#14261D] mb-1.5">
                  Chapter Quizzes & Feedback
                </h4>
                <p className="font-sans text-sm md:text-[15px] leading-relaxed text-[#14261D]/75">
                  Practice with questions generated directly from what you read and learn from instant feedback.
                </p>
              </div>
            </div>

          </StaggerContainer>

        </div>

        {/* Part B: Bottom Supporting Shelf (Full-Width Peach Banner) */}
        <ScrollReveal id="retention-shelf" delay={0.35} distance={28}>
          <div className="w-full rounded-[28px] bg-[#F9EAE1] border border-[#14261D]/[0.08] p-6 md:p-8 lg:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Item 04 (Problem-Solving Challenges) */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#14261D] text-white flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-base text-[#14261D]">
                    Problem-Solving Challenges
                  </span>
                </div>
                <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed pl-7">
                  Practice applying what you learn to new questions and realistic scenarios.
                </p>
              </div>

              {/* Item 05 (Structured Revision Cards) */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#14261D] text-white flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-base text-[#14261D]">
                    Structured Revision Cards
                  </span>
                </div>
                <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed pl-7">
                  Review key formulas, concepts, and definitions with clean summary flashcards.
                </p>
              </div>

              {/* Item 06 (Verifiable Page Citations) */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#14261D] text-white flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-base text-[#14261D]">
                    Verifiable Page Citations
                  </span>
                </div>
                <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed pl-7">
                  Click any citation to jump straight to the exact page and paragraph in your book.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 5: PROGRESS AND EXAM PREPARATION */}
      {/* ======================================================== */}
      <section id="readiness" className="w-full bg-[#C9E0F2] pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-32 px-4 sm:px-6 md:px-10 border-t border-[#14261D]/10 scroll-mt-0 overflow-hidden">
        <div className="mx-auto max-w-[1380px]">
          <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
            <ScrollReveal id="readiness-left" delay={0.1}>
              <div>
                <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-5xl lg:text-6xl text-[#14261D] tracking-tight leading-[1.08] mb-4 sm:mb-6">
                  Track exam readiness with verifiable{' '}
                  <span className="text-[#497E64]">certainty.</span>
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#14261D]/75 leading-relaxed">
                  See your reading progress and quiz scores in real time so you always know which topics you have mastered.
                </p>

                <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-100 text-[#497E64] flex-shrink-0 mt-0.5 font-bold text-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#14261D]">Chapter-by-Chapter Progress</h4>
                      <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1">
                        See which chapters you have finished and which ones need more practice.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-100 text-[#497E64] flex-shrink-0 mt-0.5 font-bold text-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#14261D]">Weak Spot Finder</h4>
                      <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1">
                        Spot the specific questions or concepts where you need extra review.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#F9D8C0] text-[#E8722C] flex-shrink-0 mt-0.5 font-bold text-sm">
                      ★
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#14261D]">Smart Daily Review</h4>
                      <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1">
                        Review difficult concepts before you forget them with spaced practice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Visual Metric Mockup Card */}
            <ScrollReveal id="readiness-card" delay={0.25} distance={36}>
              <div className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 md:p-8 border-[2px] border-[#1B3428] shadow-[0_4px_0_0_#1B3428] sm:shadow-[0_6px_0_0_#1B3428]">
                <div className="flex items-center justify-between border-b border-[#EAE4D3] pb-5 sm:pb-6 mb-6 sm:mb-8">
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#14261D]">
                      World History & Literature — Reading Progress
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14261D]/60 mt-0.5">4 of 6 sections reviewed</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-[#497E64]">
                    78% Understood
                  </span>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold text-[#14261D] mb-1.5 sm:mb-2">
                      <span>§ 1.2 Narrative Voice & Perspective</span>
                      <span className="text-[#497E64] font-bold">100% Mastered</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                      <div className="h-full bg-[#497E64] rounded-full w-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold text-[#14261D] mb-1.5 sm:mb-2">
                      <span>§ 2.4 Social Change & Urban Expansion</span>
                      <span className="text-[#497E64] font-bold">85% Mastered</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                      <div className="h-full bg-[#497E64] rounded-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold text-[#14261D] mb-1.5 sm:mb-2">
                      <span>§ 3.1 Character Motives & Dilemmas</span>
                      <span className="text-[#E8722C] font-bold">45% In Progress</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                      <div className="h-full bg-[#E8722C] rounded-full w-[45%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm font-semibold text-[#14261D] mb-1.5 sm:mb-2">
                      <span>§ 3.4 Key Concepts & Analysis</span>
                      <span className="text-[#14261D]/50 font-medium">Queued for review</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#FAF8F4] overflow-hidden border border-[#EAE4D3]">
                      <div className="h-full bg-stone-300 rounded-full w-[10%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#EAE4D3] flex items-center justify-between text-xs sm:text-sm text-[#14261D]/70 font-medium">
                  <span>Verified Material Coverage • 142 page citations</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 6: COLLABORATIVE LEARNING */}
      {/* ======================================================== */}
      <section className="w-full bg-[#F4F0E5] pt-16 sm:pt-24 md:pt-32 pb-16 sm:pb-24 md:pb-32 px-4 sm:px-6 md:px-10 border-t border-[#14261D]/10 scroll-mt-0 overflow-hidden">
        <div className="mx-auto max-w-[1380px] text-center">
          <ScrollReveal id="groups-heading" delay={0.1}>
            <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
              <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#14261D] tracking-tight leading-[1.08] mb-4 sm:mb-6">
                Study groups built around shared course{' '}
                <span
                  className="relative inline-block text-[#497E64] ml-1 select-none"
                  style={{
                    transform: 'translateY(-2px) rotate(2deg)',
                    transformOrigin: 'bottom right',
                    display: 'inline-block'
                  }}
                >
                  materials.

                  {/* Multi-Stroke Hand-Drawn Marker Underline */}
                  <svg
                    className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                    viewBox="0 0 240 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path d="M 4 8 C 50 3, 150 4, 235 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M 12 12 C 70 6, 170 11, 225 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                    <path d="M 35 10 C 90 6, 140 8, 185 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                  </svg>

                  {/* Spark Ticks */}
                  <svg
                    className="absolute -top-2.5 sm:-top-3.5 -right-4 sm:-right-6 w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#14261D]/75 max-w-xl mx-auto leading-relaxed">
                Share books with classmates, discuss chapters together, and keep your own notes private.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer
            id="groups-cards"
            initialDelay={0.2}
            staggerDelay={0.12}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            childClassName="h-full"
          >
            {/* Card 1: One Shared Book */}
            <div className="bg-white border-[1.5px] border-[#1B3428] rounded-[24px] p-8 shadow-[0_4px_0_0_#1B3428] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1B3428] transition-all text-left h-full">
              <div className="w-12 h-12 rounded-xl bg-[#E3EFFB] text-[#2B6CB0] flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-display text-xl font-bold text-[#14261D] mb-3">
                One Shared Book
              </h4>
              <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed">
                Upload a book once so everyone in your study circle can read and learn together.
              </p>
            </div>

            {/* Card 2: Shared Group Discussions */}
            <div className="bg-white border-[1.5px] border-[#1B3428] rounded-[24px] p-8 shadow-[0_4px_0_0_#1B3428] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1B3428] transition-all text-left h-full">
              <div className="w-12 h-12 rounded-xl bg-[#E2EBD8] text-[#497E64] flex items-center justify-center mb-6">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h4 className="font-display text-xl font-bold text-[#14261D] mb-3">
                Shared Group Discussions
              </h4>
              <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed">
                Ask questions and discuss difficult chapters with your study group in real time.
              </p>
            </div>

            {/* Card 3: Private Study Notes & Progress */}
            <div className="bg-white border-[1.5px] border-[#1B3428] rounded-[24px] p-8 shadow-[0_4px_0_0_#1B3428] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#1B3428] transition-all text-left h-full">
              <div className="w-12 h-12 rounded-xl bg-[#FBE8DC] text-[#E8722C] flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-display text-xl font-bold text-[#14261D] mb-3">
                Private Notes & Progress
              </h4>
              <p className="font-sans text-sm text-[#14261D]/75 leading-relaxed">
                Your quiz attempts, reading notes, and tutor conversations remain completely private.
              </p>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 7: PRICING */}
      {/* ======================================================== */}
      <section id="pricing" className="w-full bg-[#EAE4D3] pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-32 px-4 sm:px-6 md:px-10 scroll-mt-0 overflow-hidden">
        {/* Left-Aligned Header Block */}
        <ScrollReveal id="pricing-header" delay={0.1}>
          <div className="max-w-5xl mx-auto mb-10 sm:mb-14 text-left">
            <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-4xl lg:text-[56px] text-[#14261D] tracking-tight leading-[1.08] mb-3">
              Simple, accessible academic{' '}
              <span
                className="relative inline-block text-[#497E64] ml-1 select-none"
                style={{
                  transform: 'translateY(-3px) rotate(2.2deg)',
                  transformOrigin: 'bottom right',
                  display: 'inline-block'
                }}
              >
                plans.

                {/* Multi-Stroke Hand-Drawn Marker Underline */}
                <svg
                  className="absolute -bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                  viewBox="0 0 200 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path d="M 4 8 C 45 3, 130 4, 195 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 12 12 C 60 6, 145 11, 185 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                  <path d="M 30 10 C 75 6, 120 8, 160 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                </svg>

                {/* Spark Ticks (//) top-right */}
                <svg
                  className="absolute -top-3.5 -right-5 sm:-right-6 w-4 h-4 sm:w-5 sm:h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#14261D]/75 max-w-xl leading-relaxed">
              Start for free with your own books and upgrade only if you need more.
            </p>
          </div>
        </ScrollReveal>

        {/* Pricing Cards Grid (Light vs Dark Contrast Pair) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch">
          {/* Left Card: Light Tactile Card (Free Plan) */}
          <ScrollReveal id="pricing-free" delay={0.2} className="h-full">
            <div className="bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 md:p-10 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between h-full">
              <div>
                <h3 className="font-display text-xl font-bold text-[#14261D] mb-2">Free plan</h3>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-display font-extrabold text-4xl xs:text-5xl md:text-6xl text-[#14261D] tracking-tight">
                    0 Birr
                  </span>
                  <span className="font-sans text-sm sm:text-base text-[#14261D]/60 font-medium">/ forever</span>
                </div>

                <p className="font-sans text-sm text-[#14261D]/75 mb-6">
                  Everything you need to study your books with a personal AI tutor.
                </p>

                <hr className="border-t border-[#14261D]/15 my-6" />

                <ul className="space-y-4 font-sans text-sm md:text-[15px] text-[#14261D]/80">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Upload books, notes, and lecture slides (up to 1 MB)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Works with PDF, Word documents, and text files</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Ask questions with direct page citations from your book</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Chapter practice quizzes and review flashcards</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full mt-8 flex items-center justify-center py-3.5 px-6 rounded-full bg-[#FAF8F4] text-[#14261D] font-display font-bold text-base border-[2px] border-[#14261D] shadow-[0_4px_0_0_#14261D] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#14261D] active:translate-y-1 active:shadow-[0_1px_0_0_#14261D] transition-all text-center"
              >
                Start learning free
              </Link>
            </div>
          </ScrollReveal>

          {/* Right Card: Dark Forest Green Card (Freemium Plan) */}
          <ScrollReveal id="pricing-pro" delay={0.32} className="h-full">
            <div className="bg-[#1B3428] border-[1.5px] border-[#14261D] rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 md:p-10 shadow-[0_6px_0_0_#14261D] flex flex-col justify-between relative overflow-hidden h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-xl font-bold text-white">Freemium</h3>
                  <span className="bg-[#E8722C] text-white font-sans text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
                    Popular
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-display font-extrabold text-4xl xs:text-5xl md:text-6xl text-white tracking-tight">
                    999 Birr
                  </span>
                  <span className="font-sans text-sm sm:text-base text-white/60 font-medium">per month</span>
                </div>

                <p className="font-sans text-sm text-white/75 mb-6">
                  For students managing full course loads, research papers, and collaborative study.
                </p>

                <hr className="border-t border-white/15 my-6" />

                <ul className="space-y-4 font-sans text-sm md:text-[15px] text-white/90">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64]/30 border border-[#497E64] text-[#86EFAC] flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Everything in the Free plan</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64]/30 border border-[#497E64] text-[#86EFAC] flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Shared book workspaces for your study circle</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64]/30 border border-[#497E64] text-[#86EFAC] flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Chapter discussion channels for group study</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#497E64]/30 border border-[#497E64] text-[#86EFAC] flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <span>Private AI tutor conversations and individual quiz scores</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full mt-8 flex items-center justify-center py-3.5 px-6 rounded-full bg-[#E8722C] text-white font-display font-bold text-base shadow-[0_4px_0_0_#14261D] hover:bg-[#D65E1E] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#14261D] active:translate-y-1 active:shadow-[0_1px_0_0_#14261D] transition-all text-center"
              >
                Get started
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 8: FREQUENTLY ASKED QUESTIONS */}
      {/* ======================================================== */}
      <section id="faq" className="w-full bg-[#F4EFE4] pt-28 pb-20 sm:pt-32 sm:pb-24 md:pt-36 md:pb-32 px-4 sm:px-6 md:px-10 scroll-mt-0 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <ScrollReveal id="faq-header" delay={0.1}>
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 md:mb-16">
              <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-5xl lg:text-6xl text-[#14261D] tracking-tight leading-[1.08]">
                Frequently asked{' '}
                <span
                  className="relative inline-block text-[#497E64] ml-1 select-none"
                  style={{
                    transform: 'translateY(-3px) rotate(2.2deg)',
                    transformOrigin: 'bottom right',
                    display: 'inline-block'
                  }}
                >
                  questions.

                  {/* Multi-Stroke Hand-Drawn Marker Underline */}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                    viewBox="0 0 240 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path d="M 4 8 C 50 3, 150 4, 235 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M 12 12 C 70 6, 170 11, 225 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                    <path d="M 35 10 C 90 6, 140 8, 185 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                  </svg>

                  {/* Spark Ticks (//) top-right */}
                  <svg
                    className="absolute -top-3.5 -right-5 sm:-right-6 w-4 h-4 sm:w-5 sm:h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
            </div>
          </ScrollReveal>

          {/* Tactile Accordion Cards with Framer Plus/Minus Buttons */}
          <StaggerContainer id="faq-list" initialDelay={0.2} staggerDelay={0.08} className="space-y-3 sm:space-y-4 md:space-y-5 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => toggleFaq(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFaq(idx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-8 border border-[#14261D]/10 shadow-[0_4px_20px_rgba(20,38,29,0.04)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#497E64]/40 text-left"
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-6 select-none">
                    <span className="font-display text-base sm:text-lg md:text-xl font-bold text-[#14261D] text-left">
                      {faq.q}
                    </span>
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-10 rounded-[12px] sm:rounded-[14px] flex items-center justify-center shrink-0 border transition-all duration-200 ${
                        isOpen
                          ? 'bg-[#DCE7A8] text-[#3D5215] border-[#3D5215]/20 shadow-[0_2px_0_0_#C3D37F]'
                          : 'bg-[#C9E0F2] text-[#1E4D6B] border-[#1E4D6B]/20 shadow-[0_2px_0_0_#A8CEEC]'
                      }`}
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <p className="font-sans text-xs sm:text-sm md:text-base text-[#14261D]/75 leading-relaxed mt-3 sm:mt-4 max-w-2xl text-left animate-fadeIn">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 9: FINAL CALL TO ACTION (OPEN FULL-BLEED COMPOSITION) */}
      {/* ======================================================== */}
      <section className="relative w-full max-w-full bg-[#E9E3D2] pt-16 sm:pt-20 pb-16 sm:pb-20 md:pt-28 md:pb-28 px-4 sm:px-6 md:px-10 overflow-hidden select-none">
        {/* Organic Backdrop Blobs */}
        {/* Left backdrop arch */}
        <div className="absolute left-0 bottom-0 w-[240px] sm:w-[300px] lg:w-[420px] xl:w-[480px] h-[280px] sm:h-[340px] lg:h-[480px] bg-[#E2EBD8] rounded-tr-[160px] pointer-events-none -z-0" />

        {/* Right backdrop hill */}
        <div className="absolute right-0 bottom-0 w-[220px] sm:w-[280px] lg:w-[400px] xl:w-[460px] h-[260px] sm:h-[320px] lg:h-[440px] bg-[#EED5BE] rounded-tl-[180px] pointer-events-none -z-0" />

        {/* Left Cutout: Friendly student reviewing notes with tablet */}
        <ScrollReveal
          id="cta-cutout-left"
          delay={0.2}
          distance={40}
          className="hidden lg:block absolute left-0 xl:left-4 bottom-0 w-[300px] lg:w-[380px] xl:w-[430px] z-10 pointer-events-none select-none"
        >
          <img
            src="/assets/cta_student_female_left.png"
            alt="Student reviewing notes comfortably"
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </ScrollReveal>

        {/* Right Cutout: Friendly student reading open textbook */}
        <ScrollReveal
          id="cta-cutout-right"
          delay={0.28}
          distance={40}
          className="hidden lg:block absolute right-0 xl:right-4 bottom-0 w-[280px] lg:w-[350px] xl:w-[400px] z-10 pointer-events-none select-none"
        >
          <img
            src="/assets/cta_student_male_right.png"
            alt="Student reading open textbook"
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </ScrollReveal>

        {/* Center Headline, Subcopy & Framer 3D Buttons */}
        <div className="relative z-20 max-w-2xl mx-auto text-center px-2 sm:px-4">
          {/* Intro Badge Pill with Floating Notebook Sticker to its upper-left */}
          <div className="relative flex justify-center mb-5">
            {/* Tilted Spiral Notebook Sticker (Floating to the Left) */}
            <ScrollReveal
              id="cta-notebook"
              delay={0.05}
              distance={20}
              className="absolute -top-10 left-2 xs:left-4 sm:left-8 lg:-left-12 pointer-events-none"
            >
              <div className="relative">
                {/* Curved Motion Trail Doodle with Arrowhead */}
                <svg
                  className="absolute -top-3 -right-10 w-16 h-16 text-[#14261D]/35 pointer-events-none overflow-visible"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  <path
                    d="M 6 12 C 18 28, 36 36, 48 48"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeDasharray="3.5 3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 42 46 L 49 49 L 50 42"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Wirebound Notebook Sticker */}
                <div
                  className="w-13 h-16 sm:w-14 sm:h-18 bg-[#FAF8F4] border-[1.5px] border-[#1B3428] rounded-md shadow-[0_4px_12px_rgba(20,38,29,0.08)] flex p-1.5 transform hover:rotate-0 transition-transform duration-200 cursor-pointer pointer-events-auto"
                  style={{ transform: 'rotate(-14deg)', transformOrigin: 'bottom left' }}
                >
                  {/* Wire Spiral Rings along left */}
                  <div className="w-2.5 flex flex-col justify-between py-1 border-r border-[#1B3428]/25 pr-0.5 mr-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-2 h-1 rounded-full bg-[#1B3428]/80" />
                    ))}
                  </div>
                  {/* Ruled Notebook Page */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex gap-1 border-b border-[#1B3428]/20 pb-1 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8722C]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#497E64]" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-0.5 bg-[#14261D]/15 rounded" />
                      <div className="w-4/5 h-0.5 bg-[#14261D]/15 rounded" />
                      <div className="w-3/5 h-0.5 bg-[#14261D]/15 rounded" />
                      <div className="w-4/5 h-0.5 bg-[#14261D]/15 rounded" />
                      <div className="w-2/5 h-0.5 bg-[#14261D]/15 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal id="cta-headline" delay={0.15}>
            <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-5xl lg:text-[68px] text-[#14261D] tracking-tight leading-[1.08] mb-5">
              Your next book is ready to be{' '}
              <br className="hidden sm:inline" />
              <span
                className="relative inline-block text-[#497E64] ml-1 select-none"
                style={{
                  transform: 'translateY(-3px) rotate(2.2deg)',
                  transformOrigin: 'bottom right',
                  display: 'inline-block'
                }}
              >
                understood.

                {/* Multi-Stroke Hand-Drawn Marker Underline */}
                <svg
                  className="absolute -bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                  viewBox="0 0 240 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path d="M 4 8 C 50 3, 150 4, 235 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 12 12 C 70 6, 170 11, 225 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                  <path d="M 35 10 C 90 6, 140 8, 185 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                </svg>

                {/* Spark Ticks (//) top-right */}
                <svg
                  className="absolute -top-3.5 -right-5 sm:-right-6 w-4 h-4 sm:w-5 sm:h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#14261D]/75 max-w-xl mx-auto leading-relaxed mb-8">
              Bring your books or notes. Read, ask questions, and learn at your own pace.
            </p>
          </ScrollReveal>

          {/* Dual Tactile CTA Buttons & Micro Trust Indicators */}
          <ScrollReveal id="cta-buttons" delay={0.28}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6 w-full max-w-md mx-auto sm:max-w-none">
              {/* Primary Terracotta 3D Button */}
              <Link
                href="/register"
                className="w-full sm:w-auto h-[50px] sm:h-[52px] px-6 sm:px-8 rounded-full bg-[#E8722C] text-white font-display font-bold text-sm sm:text-base shadow-[0_4px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_1px_0_0_#B26E45] transition-all flex items-center justify-center text-center"
              >
                Get started
              </Link>

              {/* Secondary Light 3D Button */}
              <a
                href="#how-it-works"
                className="w-full sm:w-auto h-[50px] sm:h-[52px] px-6 sm:px-8 rounded-full bg-[#FAF8F4] text-[#14261D] font-display font-bold text-sm sm:text-base border-[2px] border-[#1B3428] shadow-[0_4px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#1B3428] active:translate-y-1 active:shadow-[0_1px_0_0_#1B3428] transition-all flex items-center justify-center text-center"
              >
                Upload a book or notes
              </a>
            </div>

            {/* Micro Trust Indicators */}
            <p className="font-sans text-xs text-[#14261D]/60 tracking-wide">
              Private book storage. Instant setup.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

