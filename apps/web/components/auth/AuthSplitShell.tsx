import React from 'react';
import Link from 'next/link';
import { AuthShowcase } from './AuthShowcase';

export interface AuthSplitShellProps {
  mode: 'login' | 'register';
  children: React.ReactNode;
}

/**
 * Shared split-screen authentication shell uniting the cozy library WebP atmosphere,
 * localized frosted form surface, minimal editorial center divider, and integrated portrait showcase.
 */
export function AuthSplitShell({ mode, children }: AuthSplitShellProps) {
  return (
    <div className="relative isolate min-h-screen w-full overflow-x-clip bg-[#F4EFE4] text-[#14261D]">
      {/* Single Shared Cozy Library Atmosphere Background (reused across Hero, Dashboard, and Auth) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center sm:bg-top bg-no-repeat opacity-95"
        style={{ backgroundImage: `url('/images/library-cozy-bg.webp')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4EFE4]/40 via-[#F4EFE4]/25 to-[#F4EFE4]/55" />
      </div>

      {/* Main Split Container */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full">
        {/* Clean Architectural Center Divider (Desktop Split Only — hidden when stacked on < lg) */}
        <div
          aria-hidden="true"
          className="hidden lg:flex pointer-events-none absolute inset-y-8 xl:inset-y-12 left-1/2 -translate-x-1/2 z-20 w-[2px]"
        >
          <span className="h-full w-px bg-gradient-to-b from-transparent via-[#1B3428]/20 to-transparent" />
          <span className="h-full w-px bg-gradient-to-b from-transparent via-[#FAF8F4]/70 to-transparent" />
        </div>

        {/* Left Column: Localized Frosted Form Area */}
        <div className="relative flex flex-col justify-between min-h-screen w-full px-4 py-5 sm:px-8 sm:py-8 lg:px-8 xl:px-14 lg:col-span-6 bg-gradient-to-r from-[#FAF8F4]/55 via-[#FAF8F4]/35 to-[#FAF8F4]/10 lg:to-transparent">
          {/* Top Navigation Link (Flow-positioned to prevent overlapping taller forms on small phones) */}
          <div className="w-full max-w-[464px] mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F4]/88 backdrop-blur-sm border border-[#1B3428]/12 px-3.5 py-1.5 text-xs font-semibold text-[#14261D]/80 hover:text-[#14261D] hover:bg-[#FAF8F4] shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to homepage
            </Link>
          </div>

          {/* Vertically Centered Localized Cream Card for Maximum Readability */}
          <div className="my-auto w-full py-5 sm:py-6 flex justify-center">
            <div className="w-full max-w-[464px] rounded-[28px] bg-[#FAF8F4]/92 backdrop-blur-md border border-[#1B3428]/12 shadow-[0_22px_54px_-18px_rgba(20,38,29,0.16)] px-5 py-7 sm:px-8 sm:py-9">
              {children}
            </div>
          </div>

          {/* Subtle Desktop Vertical Balance Spacer */}
          <div aria-hidden="true" className="hidden lg:block h-6 shrink-0" />
        </div>

        {/* Right Column: Integrated Student Portrait & Value Showcase */}
        <AuthShowcase mode={mode} />
      </div>
    </div>
  );
}

