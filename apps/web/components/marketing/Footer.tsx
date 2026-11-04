'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal, StaggerContainer } from '../ui/scroll-reveal';

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitted(true);
    setEmail('');
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#21372C] text-[#FAF8F4] pt-20 md:pt-28 pb-0 overflow-hidden select-none">
      {/* Expansive Inner Container (No Constricting Inset Box) */}
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-16 md:mb-20 lg:mb-24">
        
        {/* Upper Row: Newsletter Subscription Block */}
        <ScrollReveal id="footer-newsletter" delay={0.1}>
          <div className="max-w-md">
            <h3 className="font-display font-bold text-lg sm:text-xl text-[#FAF8F4] mb-1.5 tracking-tight">
              Stay in the loop.
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#FAF8F4]/70 leading-relaxed mb-5">
              Course syllabus guides, citation features, and student release notes.
            </p>

            {/* Pill-shaped email subscription field with signature Terracotta button */}
            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="relative flex items-center w-full bg-white/[0.07] border border-white/15 rounded-full p-1 sm:p-1.5 focus-within:border-[#E77130]/60 transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  aria-label="Email address for updates"
                  className="flex-1 bg-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#FAF8F4] placeholder-[#FAF8F4]/40 focus:outline-none min-w-0 font-sans"
                />
                <button
                  type="submit"
                  className="h-9 sm:h-10 px-4 sm:px-6 rounded-full bg-[#E77130] text-white font-display font-bold text-xs sm:text-sm tracking-wide shadow-sm hover:bg-[#d56223] hover:shadow-[0_2px_8px_rgba(231,113,48,0.35)] active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </div>

              {submitted && (
                <div className="mt-3 text-xs text-emerald-300 font-sans leading-normal animate-fadeIn">
                  <span className="font-semibold">✓ Pre-registration noted!</span> Platform updates are tied to student accounts. Lock in your free document indexing:{' '}
                  <Link href="/register" className="underline font-semibold text-white hover:text-emerald-200">
                    Create account →
                  </Link>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-300 mt-2.5 flex items-center gap-1.5 font-sans">
                  <span>!</span> {error}
                </p>
              )}
            </form>
          </div>
        </ScrollReveal>

        {/* Generous editorial whitespace separating upper subscription and lower brand/nav */}
        <div className="my-14 sm:my-16 lg:my-20" />

        {/* Lower Section: Wordmark on Left, Navigation Columns & Copyright on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-x-12 lg:gap-y-8 items-end">
          
          {/* Massive Brand Wordmark: Order 2 on mobile, lower-left on desktop */}
          <ScrollReveal id="footer-wordmark" delay={0.1} className="order-2 lg:order-1 lg:col-span-5 xl:col-span-6 select-none self-end">
            <span className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[116px] tracking-tight leading-none text-[#FAF8F4] block -ml-0.5 sm:-ml-1 select-none">
              Lernivox
            </span>
          </ScrollReveal>

          {/* 3 Navigation Columns & Attribution: Order 1 on mobile, right side on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-6">
            <StaggerContainer id="footer-nav" initialDelay={0.2} staggerDelay={0.1} className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 mb-8 lg:mb-10">
              
              {/* Column 1: Explore */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-sm text-[#FAF8F4] tracking-wide mb-4">
                  Explore
                </h4>
                <ul className="space-y-2 font-sans text-xs sm:text-sm">
                  <li>
                    <a
                      href="#how-it-works"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#sample-lesson"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Citation Engine
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Exam Readiness
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Pricing Plans
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Frequently Asked
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 2: Workspace */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-sm text-[#FAF8F4] tracking-wide mb-4">
                  Workspace
                </h4>
                <ul className="space-y-2 font-sans text-xs sm:text-sm">
                  <li>
                    <Link
                      href="/login"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Student Portal
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Document Library
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Study Groups
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Textbook Upload
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3: Transparency */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="font-display font-bold text-sm text-[#FAF8F4] tracking-wide mb-4">
                  Transparency
                </h4>
                <ul className="space-y-2 font-sans text-xs sm:text-sm">
                  <li>
                    <a
                      href="#how-it-works"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Private Storage
                    </a>
                  </li>
                  <li>
                    <a
                      href="#sample-lesson"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Citation Proofs
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Privacy Pledge
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="block text-[#FAF8F4]/75 hover:text-[#E77130] transition-colors duration-200 py-1"
                    >
                      Open Architecture
                    </a>
                  </li>
                </ul>
              </div>

            </StaggerContainer>

            {/* Bottom Attribution & Copyright */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-2 sm:gap-6 text-xs text-[#FAF8F4]/50 font-sans pt-4 border-t border-white/10 lg:border-t-0">
              <span>© {currentYear} Lernivox. All rights reserved.</span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>Source-Grounded Academic Learning</span>
            </div>
          </div>

        </div>

      </div>

      {/* Base Rolling Cloud Canopy (#4A7D64) Flush to Bottom */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none relative -mb-[1px]">
        <div className="relative w-full h-[60px] md:h-[90px] lg:h-[115px]">
          <svg
            className="absolute bottom-0 left-0 w-full h-full text-[#4A7D64]"
            viewBox="0 0 1440 115"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Back Cloud Layer (Soft Depth Silhouette - 40% Opacity) */}
            <path
              opacity="0.4"
              fill="currentColor"
              d="M 0,115 L 0,68
                 C 70,68 110,30 200,30
                 C 300,30 340,58 430,58
                 C 520,58 570,20 680,20
                 C 790,20 840,54 930,54
                 C 1020,54 1070,24 1180,24
                 C 1280,24 1340,60 1440,60
                 L 1440,115 Z"
            />

            {/* Front Cloud Canopy (Solid #4A7D64 Rolling Domes) */}
            <path
              fill="currentColor"
              d="M 0,115 L 0,86
                 C 85,86 125,44 250,44
                 C 370,44 420,76 535,76
                 C 655,76 705,36 835,36
                 C 955,36 1005,70 1125,70
                 C 1245,70 1295,40 1395,40
                 C 1420,40 1435,46 1440,50
                 L 1440,115 Z"
            />
          </svg>
        </div>
      </div>
    </footer>
  );
}
