'use client';

import React from 'react';

/**
 * Low-level accessible skeleton primitive.
 * Features calm shimmer animation that automatically respects prefers-reduced-motion.
 */
export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`bg-[#1B3428]/10 rounded-md animate-pulse motion-reduce:animate-none ${className}`}
      {...props}
    />
  );
}

/**
 * Compact, accessible inline spinner for buttons and interactive controls.
 */
export function InlineLoader({
  size = 'md',
  className = '',
  label = 'Loading...',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5 border-[2px]',
    md: 'w-4 h-4 border-[2px]',
    lg: 'w-6 h-6 border-[2.5px]',
  };

  return (
    <span
      role="status"
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <span
        className={`${sizeClasses[size]} rounded-full border-[#14261D]/20 border-t-[#E8722C] animate-spin motion-reduce:animate-none`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Skeleton placeholder for a single 3D Book Card on the dashboard.
 * Mirrors the exact aspect ratio (3/4.2) and card spacing of `BookCard`.
 */
export function BookCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="w-full min-w-0 max-w-full flex flex-col select-none"
    >
      {/* 1. PHYSICAL 3D BOOK COVER PLACEHOLDER */}
      <div className="relative w-full aspect-[3/4.2] rounded-[14px] sm:rounded-[20px] p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden bg-[#FAF8F4] border-[1.5px] sm:border-[2px] border-[#1B3428]/15 shadow-[0_3px_0_0_#1B3428]/15">
        {/* Spine Crease Accent */}
        <div className="absolute top-0 left-0 bottom-0 w-2 sm:w-3 bg-black/5 border-r border-[#1B3428]/10" />

        {/* Top Meta Row inside Book */}
        <div className="flex items-start justify-between gap-1 pl-1.5 sm:pl-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-9 rounded-md bg-[#1B3428]/15" />
            <Skeleton className="h-4 w-14 rounded-md bg-[#1B3428]/10" />
          </div>
          <div className="w-2.5 sm:w-3.5 h-4 sm:h-5 bg-[#E8722C]/40 rounded-b-xs" />
        </div>

        {/* Center: Book Title Lines */}
        <div className="my-auto pl-1.5 sm:pl-2 pr-1 space-y-2">
          <Skeleton className="h-3.5 w-[85%] rounded bg-[#1B3428]/20" />
          <Skeleton className="h-3 w-[60%] rounded bg-[#1B3428]/15" />
          <Skeleton className="h-2.5 w-[40%] rounded bg-[#1B3428]/10 mt-1" />
        </div>

        {/* Bottom Meta inside Cover */}
        <div className="pl-1.5 sm:pl-2 pt-1 border-t border-[#1B3428]/10 flex items-center justify-between">
          <Skeleton className="h-2.5 w-12 rounded bg-[#1B3428]/15" />
          <Skeleton className="h-2.5 w-8 rounded bg-[#1B3428]/15" />
        </div>
      </div>

      {/* 2. CARD METADATA BELOW BOOK */}
      <div className="mt-2.5 px-0.5 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded bg-[#1B3428]/15" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <Skeleton className="h-2 w-full rounded-full bg-[#1B3428]/10" />
          <Skeleton className="h-2.5 w-7 shrink-0 rounded bg-[#1B3428]/15" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full Dashboard Skeleton that matches `MyBooksDashboardContent`.
 * Renders header, search/filter bar, and responsive book grid with 5 items.
 */
export function DashboardSkeleton() {
  return (
    <div
      aria-label="Loading your personal library"
      aria-busy="true"
      className="space-y-6 sm:space-y-8 animate-fadeIn"
    >
      {/* Header Row: Title, Subtitle, and Add Material Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1B3428]/10">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-40 sm:w-48 rounded-xl bg-[#1B3428]/20" />
          <Skeleton className="h-4 w-64 sm:w-80 rounded-md bg-[#1B3428]/15" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full bg-[#E8722C]/40" />
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Skeleton className="h-9 w-full sm:max-w-xs rounded-full bg-[#FAF8F4] border border-[#1B3428]/15" />
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-hidden">
          <Skeleton className="h-8 w-24 rounded-full bg-[#1B3428]/20" />
          <Skeleton className="h-8 w-14 rounded-full bg-[#FAF8F4] border border-[#1B3428]/15" />
          <Skeleton className="h-8 w-16 rounded-full bg-[#FAF8F4] border border-[#1B3428]/15" />
          <Skeleton className="h-8 w-14 rounded-full bg-[#FAF8F4] border border-[#1B3428]/15" />
        </div>
      </div>

      {/* Section 1: "My Books" Header + Responsive Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-lg bg-[#1B3428]/20" />
          <Skeleton className="h-5 w-7 rounded-full bg-[#1B3428]/10" />
        </div>

        {/* Responsive Grid matching BookCard layout */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          <BookCardSkeleton />
          <BookCardSkeleton />
          <BookCardSkeleton />
          <BookCardSkeleton />
          <BookCardSkeleton />
        </div>
      </section>
    </div>
  );
}

/**
 * Dedicated Book Workspace Skeleton.
 * Accurately mirrors `TutorHeader`, collapsible sidebars, reading canvas, and mobile dock.
 */
export function WorkspaceSkeleton() {
  return (
    <div
      aria-label="Loading your book workspace"
      aria-busy="true"
      className="flex flex-col h-[100dvh] w-full bg-[#F4F0E5] overflow-hidden select-none"
    >
      {/* 1. TUTOR HEADER SKELETON (h-14, 3-zone grid) */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] h-14 w-full px-3 sm:px-6 bg-[#FAF8F4] border-b border-[#1B3428]/10 sticky top-0 z-30 items-center">
        {/* Zone 1: Back Button & Outline Toggle */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 sm:w-28 rounded-xl bg-[#1B3428]/15" />
          <Skeleton className="h-8 w-8 rounded-xl bg-[#1B3428]/10 hidden sm:block" />
        </div>

        {/* Zone 2: Navigation Pills (Read | Quizzes | Flashcards | Plan | Progress) */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#EAE4D3] rounded-full border border-[#1B3428]/15">
          <Skeleton className="h-7 w-14 sm:w-16 rounded-full bg-[#14261D]/30" />
          <Skeleton className="h-7 w-16 sm:w-18 rounded-full bg-[#FAF8F4]/80 hidden xs:block" />
          <Skeleton className="h-7 w-18 sm:w-20 rounded-full bg-[#FAF8F4]/80 hidden md:block" />
          <Skeleton className="h-7 w-14 sm:w-16 rounded-full bg-[#FAF8F4]/80 hidden lg:block" />
          <Skeleton className="h-7 w-16 sm:w-18 rounded-full bg-[#FAF8F4]/80 hidden lg:block" />
        </div>

        {/* Zone 3: Profile Button & Group Pill */}
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-7 w-20 rounded-full bg-[#E8722C]/20 hidden sm:block" />
          <Skeleton className="h-8 w-8 rounded-full bg-[#1B3428]/20" />
        </div>
      </header>

      {/* 2. THREE-PANE WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Outline Pane Skeleton (Desktop ≥ 1024px) */}
        <aside className="hidden lg:flex w-64 xl:w-72 border-r border-[#1B3428]/10 bg-[#FAF8F4] flex-col p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-[#1B3428]/10">
            <Skeleton className="h-4 w-28 rounded bg-[#1B3428]/20" />
            <Skeleton className="h-4 w-6 rounded bg-[#1B3428]/15" />
          </div>
          <div className="space-y-2 pt-1">
            <Skeleton className="h-7 w-full rounded-lg bg-[#1B3428]/15" />
            <Skeleton className="h-7 w-[90%] rounded-lg bg-[#1B3428]/10 ml-2" />
            <Skeleton className="h-7 w-[85%] rounded-lg bg-[#1B3428]/10 ml-2" />
            <Skeleton className="h-7 w-full rounded-lg bg-[#1B3428]/15" />
            <Skeleton className="h-7 w-[92%] rounded-lg bg-[#1B3428]/10 ml-2" />
            <Skeleton className="h-7 w-full rounded-lg bg-[#1B3428]/15" />
            <Skeleton className="h-7 w-[88%] rounded-lg bg-[#1B3428]/10 ml-2" />
          </div>
        </aside>

        {/* Center: Reading Canvas Skeleton */}
        <main className="flex-1 flex flex-col items-center bg-[#F4F0E5] overflow-y-auto p-3 sm:p-6 lg:p-8">
          {/* Secondary Reader Toolbar Placeholder */}
          <div className="w-full max-w-3xl h-10 sm:h-11 rounded-full bg-[#FAF8F4] border border-[#1B3428]/15 shadow-xs flex items-center justify-between px-3 sm:px-4 mb-4 sm:mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-[#1B3428]/15" />
              <Skeleton className="h-4 w-20 rounded bg-[#1B3428]/15" />
              <Skeleton className="h-5 w-5 rounded bg-[#1B3428]/15" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14 rounded bg-[#1B3428]/15" />
              <Skeleton className="h-5 w-5 rounded bg-[#1B3428]/15" />
            </div>
          </div>

          {/* Book Page Canvas Placeholder (Natural Book Paper Proportion) */}
          <div className="w-full max-w-2xl bg-white rounded-2xl border-[1.5px] border-[#1B3428]/15 shadow-[0_4px_16px_rgba(20,38,29,0.06)] p-6 sm:p-10 space-y-4 min-h-[480px] sm:min-h-[640px]">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-[#1B3428]/10 pb-3">
              <Skeleton className="h-4 w-32 rounded bg-[#1B3428]/20" />
              <Skeleton className="h-3.5 w-12 rounded bg-[#1B3428]/15" />
            </div>

            {/* Chapter Heading Placeholder */}
            <Skeleton className="h-6 sm:h-7 w-3/4 rounded-lg bg-[#1B3428]/25 my-4" />

            {/* Paragraph Text Lines */}
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-3.5 w-full rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[96%] rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[92%] rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[98%] rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[85%] rounded bg-[#1B3428]/15" />
            </div>

            <div className="space-y-2.5 pt-4">
              <Skeleton className="h-3.5 w-full rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[94%] rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[90%] rounded bg-[#1B3428]/15" />
              <Skeleton className="h-3.5 w-[75%] rounded bg-[#1B3428]/15" />
            </div>
          </div>
        </main>

        {/* Right Copilot / Companion Panel Skeleton (Desktop ≥ 768px) */}
        <aside className="hidden md:flex w-80 lg:w-96 border-l border-[#1B3428]/10 bg-[#FAF8F4] flex-col justify-between shrink-0">
          {/* Panel Top Bar */}
          <div className="h-12 border-b border-[#1B3428]/10 px-4 flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded bg-[#1B3428]/20" />
            <Skeleton className="h-6 w-6 rounded-md bg-[#1B3428]/10" />
          </div>

          {/* Conversation Bubble Placeholders */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="flex gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full bg-[#E8722C]/30 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-12 w-[85%] rounded-2xl bg-white border border-[#1B3428]/10" />
              </div>
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-[70%] rounded-2xl bg-[#14261D]/15" />
            </div>
            <div className="flex gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full bg-[#E8722C]/30 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-16 w-full rounded-2xl bg-white border border-[#1B3428]/10" />
              </div>
            </div>
          </div>

          {/* Input Box Placeholder */}
          <div className="p-3 border-t border-[#1B3428]/10 bg-white">
            <Skeleton className="h-16 w-full rounded-xl bg-[#FAF8F4] border border-[#1B3428]/15" />
          </div>
        </aside>
      </div>

      {/* 3. MOBILE BOTTOM DOCK SKELETON (< 768px) */}
      <nav
        aria-hidden="true"
        className="md:hidden flex h-14 bg-[#FAF8F4] border-t border-[#1B3428]/10 items-center justify-around px-4"
      >
        <Skeleton className="h-8 w-20 rounded-full bg-[#1B3428]/15" />
        <Skeleton className="h-8 w-20 rounded-full bg-[#1B3428]/15" />
        <Skeleton className="h-8 w-20 rounded-full bg-[#E8722C]/30" />
      </nav>
    </div>
  );
}

