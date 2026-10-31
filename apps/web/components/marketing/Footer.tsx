'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
    <footer className="w-full bg-[#21372C] text-[#FAF8F4] py-6 sm:py-10 md:py-12 px-3 sm:px-6 lg:px-8 select-none overflow-hidden">
      <div className="mx-auto max-w-[1400px]">
        {/* Subtle, thin rounded rectangle inset frame matching the reference */}
        <div className="border border-white/15 rounded-[20px] sm:rounded-[32px] lg:rounded-[36px] p-5 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-between min-h-0 sm:min-h-[580px] lg:min-h-[620px] relative">
          
          {/* Upper-Left Section: Small Intro Heading, Concise Sentence & Pill Input */}
          <div className="max-w-md">
            <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-1.5 tracking-tight">
              Stay in the loop.
            </h3>
            <p className="font-sans text-xs sm:text-sm text-white/70 leading-relaxed mb-5">
              Course syllabus guides, citation features, and student release notes.
            </p>

            {/* Pill-shaped email subscription field */}
            <form onSubmit={handleSubmit} className="w-full max-w-[390px]">
              <div className="relative flex items-center w-full rounded-full border border-white/25 bg-white/[0.03] p-1.5 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/15 transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  aria-label="Email address for updates"
                  className="flex-1 bg-transparent px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none min-w-0 font-sans"
                />
                <button
                  type="submit"
                  className="h-9 px-3.5 sm:px-5 rounded-full bg-white text-[#21372C] font-display font-bold text-xs hover:bg-[#FAF8F4] active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
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

          {/* Generous editorial whitespace separating upper action and lower brand/nav */}
          <div className="my-10 sm:my-14 lg:my-16" />

          {/* Lower Section: CSS Grid for pristine Desktop asymmetry & proper Mobile hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-8 lg:gap-y-6 items-end">
            
            {/* 3 Vertically Aligned Navigation Columns: Order 1 on mobile, top-right on desktop */}
            <div className="order-1 lg:col-span-7 xl:col-span-6 lg:col-start-6 xl:col-start-7 lg:row-start-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
                
                {/* Column 1: Explore */}
                <div className="space-y-3">
                  <h4 className="font-display font-semibold text-sm text-white/90 tracking-wide">
                    Explore
                  </h4>
                  <ul className="space-y-2 font-sans text-xs sm:text-sm text-white/70">
                    <li>
                      <a href="#how-it-works" className="hover:text-white transition-colors">
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a href="#sample-lesson" className="hover:text-white transition-colors">
                        Citation Engine
                      </a>
                    </li>
                    <li>
                      <a href="#features" className="hover:text-white transition-colors">
                        Exam Readiness
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className="hover:text-white transition-colors">
                        Pricing Plans
                      </a>
                    </li>
                    <li>
                      <a href="#faq" className="hover:text-white transition-colors">
                        Frequently Asked
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Workspace */}
                <div className="space-y-3">
                  <h4 className="font-display font-semibold text-sm text-white/90 tracking-wide">
                    Workspace
                  </h4>
                  <ul className="space-y-2 font-sans text-xs sm:text-sm text-white/70">
                    <li>
                      <Link href="/login" className="hover:text-white transition-colors">
                        Student Portal
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="hover:text-white transition-colors">
                        Create Account
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard" className="hover:text-white transition-colors">
                        Document Library
                      </Link>
                    </li>
                    <li>
                      <a href="#features" className="hover:text-white transition-colors">
                        Study Groups
                      </a>
                    </li>
                    <li>
                      <a href="#how-it-works" className="hover:text-white transition-colors">
                        Textbook Upload
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Transparency */}
                <div className="space-y-3 col-span-2 sm:col-span-1">
                  <h4 className="font-display font-semibold text-sm text-white/90 tracking-wide">
                    Transparency
                  </h4>
                  <ul className="space-y-2 font-sans text-xs sm:text-sm text-white/70">
                    <li>
                      <a href="#how-it-works" className="hover:text-white transition-colors">
                        Private Storage
                      </a>
                    </li>
                    <li>
                      <a href="#sample-lesson" className="hover:text-white transition-colors">
                        Citation Proofs
                      </a>
                    </li>
                    <li>
                      <a href="#faq" className="hover:text-white transition-colors">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="#faq" className="hover:text-white transition-colors">
                        Privacy Pledge
                      </a>
                    </li>
                    <li>
                      <a href="#how-it-works" className="hover:text-white transition-colors">
                        Open Architecture
                      </a>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Massive Brand Wordmark: Order 2 on mobile, lower-left on desktop spanning rows 1-2 */}
            <div className="order-2 lg:col-span-5 xl:col-span-6 lg:col-start-1 lg:row-start-1 lg:row-span-2 select-none self-end">
              <span className="font-display font-extrabold text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-[104px] xl:text-[132px] tracking-tight leading-none text-[#FAF8F4] block -ml-0.5 sm:-ml-1">
                Lernivox
              </span>
            </div>

            {/* Bottom-Right Copyright & Attribution: Order 3 on mobile (very bottom), bottom-right on desktop */}
            <div className="order-3 lg:col-span-7 xl:col-span-6 lg:col-start-6 xl:col-start-7 lg:row-start-2 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-2 sm:gap-6 text-[11px] sm:text-xs text-white/50 font-sans pt-4 lg:pt-2">
              <span>© {currentYear} Lernivox. All rights reserved.</span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>Source-Grounded Academic Learning</span>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}
