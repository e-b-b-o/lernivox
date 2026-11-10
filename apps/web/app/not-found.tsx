'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F4F0E5] text-[#14261D] selection:bg-[#F9D8C0] selection:text-[#14261D]">
      {/* Top minimal header */}
      <header className="h-16 w-full px-4 sm:px-8 flex items-center justify-between border-b border-[#1B3428]/10 bg-[#FAF8F4]/80 backdrop-blur-xs">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[#14261D] hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-[#14261D] text-[#FAF8F4] flex items-center justify-center font-display font-black text-base shadow-xs">
            L
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            Lernivox
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs sm:text-sm font-display font-bold text-[#14261D]/70 hover:text-[#14261D] transition-colors"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-[#FAF8F4] border-2 border-[#1B3428] rounded-[28px] sm:rounded-[32px] shadow-[0_8px_0_0_#1B3428] sm:shadow-[0_12px_0_0_#1B3428] p-6 sm:p-10 text-center relative overflow-hidden animate-fadeIn">
          {/* Subtle Decorative Background Lines */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-40 h-40 bg-[#E8722C]/5 rounded-full pointer-events-none blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#497E64]/5 rounded-full pointer-events-none blur-2xl"
          />

          {/* Book / Lost Bookmark Illustration Motif */}
          <div className="w-20 h-24 sm:w-24 sm:h-28 mx-auto mb-6 relative">
            <div className="w-full h-full bg-[#FAF8F4] border-2 border-[#1B3428] rounded-xl shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between p-3 relative overflow-hidden">
              {/* Spine Crease */}
              <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-black/5 border-r border-[#1B3428]/10" />

              {/* Bookmark Ribbon */}
              <div className="absolute top-0 right-3 w-4 h-9 bg-[#E8722C] shadow-xs flex flex-col justify-end">
                <div
                  className="w-full h-2 bg-[#FAF8F4]"
                  style={{
                    clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  }}
                />
              </div>

              {/* Cover lines */}
              <div className="mt-4 pl-2 space-y-1.5">
                <div className="h-2 w-10 bg-[#1B3428]/20 rounded-full" />
                <div className="h-1.5 w-14 bg-[#1B3428]/10 rounded-full" />
                <div className="h-1.5 w-8 bg-[#1B3428]/10 rounded-full" />
              </div>

              <div className="pl-2 pt-2 border-t border-[#1B3428]/10 flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold text-[#E8722C]">
                  pg. ?
                </span>
                <span className="font-mono text-[9px] text-[#14261D]/40">
                  404
                </span>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#E8722C]/10 text-[#E8722C] border border-[#E8722C]/25 mb-4">
            <span>404 · Page Not Found</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14261D] tracking-tight leading-tight mb-3">
            This chapter seems to be missing.
          </h1>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base text-[#14261D]/75 leading-relaxed max-w-md mx-auto mb-8">
            The page you are looking for may have moved, expired, or the link might be incorrect. Let&apos;s get you back to your learning space.
          </p>

          {/* Context-aware Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <Link
              href="/"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#E8722C] hover:bg-[#D65E1E] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#B26E45] active:translate-y-0.5 transition-all text-center cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            {!isLoading && isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-[#FAF8F4] text-[#14261D] font-display font-bold text-sm border-2 border-[#1B3428]/20 shadow-[0_2px_0_0_#1B3428]/10 active:translate-y-0.5 transition-all text-center cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#497E64]" />
                <span>Go to My Books</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-[#FAF8F4] text-[#14261D] font-display font-bold text-sm border-2 border-[#1B3428]/20 shadow-[0_2px_0_0_#1B3428]/10 active:translate-y-0.5 transition-all text-center cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#497E64]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Quick links footer */}
          <div className="mt-8 pt-6 border-t border-[#1B3428]/10 flex items-center justify-center gap-4 text-xs font-sans text-[#14261D]/60">
            <Link href="/#features" className="hover:text-[#14261D] transition-colors">
              Features
            </Link>
            <span>•</span>
            <Link href="/#preview" className="hover:text-[#14261D] transition-colors">
              How it Works
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-[#E8722C] transition-colors font-semibold">
              Get Started
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

