'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { UserCircle, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenu } from '../workspace/ProfileMenu';

const NAV_ITEMS = [
  { num: '01', label: 'How It Works', href: '#how-it-works' },
  { num: '02', label: 'Features', href: '#features' },
  { num: '03', label: 'Readiness', href: '#readiness' },
  { num: '04', label: 'Pricing', href: '#pricing' },
  { num: '05', label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('how-it-works');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  // Close explore dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Single Topmost Winner Scroll-Spy Engine
  useEffect(() => {
    const sectionIds = ['how-it-works', 'features', 'readiness', 'pricing', 'faq'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // Offset for navbar height + buffer

      // Find the section whose top edge has passed the scroll position, picking the last one that qualifies
      let currentId = sections[0]?.id ?? 'how-it-works';
      for (const section of sections) {
        if (section.offsetTop <= scrollPosition) {
          currentId = section.id;
        } else {
          break;
        }
      }

      setActiveSection(currentId);
    };

    // Run on mount and attach passive scroll listener
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body Scroll-Lock & Touch-Containment Engine
  useEffect(() => {
    if (mobileMenuOpen) {
      // Save original overflow and touch-action states
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      // Lock page scrolling and gesture drags
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [mobileMenuOpen]);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    setActiveSection(targetId);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', href);
    }
  };

  return (
    <>
      <header className="w-full bg-[#F4F0E5] py-3 md:py-[20px] h-[72px] md:h-[86px] sticky top-0 z-50 border-none transition-colors">
        <div className="max-w-[1440px] h-[46px] px-4 sm:px-6 md:px-8 mx-auto flex items-center justify-center">
          <div className="w-full max-w-[1380px] h-[46px] flex items-center justify-between gap-2 sm:gap-3 lg:gap-6 xl:gap-10">
            
            {/* Zone 1 — Left: Logo Lockup */}
            <div className="w-auto h-[32px] flex items-center shrink-0">
              <Link href="/" className="h-[32px] inline-flex items-center gap-[10px] group">
                <div className="w-[32px] h-[32px] rounded-[8px] bg-[#E8722C] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="font-display font-bold text-[20px] sm:text-[22px] leading-[32px] tracking-[-0.02em] text-[#14261D]">
                  Lernivox
                </span>
              </Link>
            </div>

            {/* Zone 2 — Center: Navigation Links (Inline above 1100px, Explore dropdown between 768px and 1100px) */}
            <div className="hidden md:flex items-center justify-center">
              {/* Tablet (768px - 1100px): Progressive Explore Dropdown */}
              <div className="relative min-[1101px]:hidden" ref={exploreRef}>
                <button
                  type="button"
                  onClick={() => setExploreOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] text-xs font-display font-bold text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-all cursor-pointer"
                  aria-expanded={exploreOpen}
                  aria-haspopup="true"
                >
                  <span>Explore</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#14261D]/70 transition-transform duration-200 ${
                      exploreOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {exploreOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-[20px] bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_6px_0_0_#1B3428] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          setExploreOpen(false);
                          handleNavClick(item.href);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] text-[#14261D]/40">{item.num}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop (above 1100px): Full Inline Navigation Links */}
              <nav className="hidden min-[1101px]:flex items-center justify-center gap-6 xl:gap-8">
                {NAV_ITEMS.map((item) => {
                  const targetId = item.href.replace('#', '');
                  const isActive = activeSection === targetId;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item.href);
                      }}
                      className={`font-sans text-[14px] xl:text-[15px] font-medium leading-[22.4px] transition-colors duration-200 relative whitespace-nowrap ${
                        isActive
                          ? 'text-[#E8722C] font-semibold after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:w-full after:h-[2px] after:bg-[#E8722C] after:rounded-full'
                          : 'text-[#14261D] hover:text-[#E8722C]'
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Zone 3 — Right: Auth Actions & Profile Menu */}
            <div className="flex items-center justify-end shrink-0 gap-2 sm:gap-3 lg:gap-4 h-[46px]">
              {isLoading ? (
                /* Subtle placeholder during session restoration to prevent button flashing */
                <div className="hidden md:flex items-center gap-3">
                  <div className="h-[40px] w-32 rounded-full bg-[#1B3428]/10 animate-pulse" />
                  <div className="h-9 w-9 rounded-full bg-[#1B3428]/10 animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="h-[40px] px-5 py-[8px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[14px] font-semibold shadow-[0_3px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_4px_0_0_#497E64] active:translate-y-[1px] active:shadow-[0_1px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap inline-flex items-center justify-center gap-2 select-none"
                  >
                    <span>Go to Dashboard</span>
                  </Link>

                  {/* Compact Profile Menu Trigger & Dropdown */}
                  <ProfileMenu compact />
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-[18px]">
                  <Link
                    href="/login"
                    className="font-sans text-[15px] font-medium leading-[22.4px] text-[#14261D] hover:text-[#E8722C] transition-colors duration-200 whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="h-[42px] px-6 py-[10px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[15px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#497E64] active:translate-y-[2px] active:shadow-[0_2px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap inline-flex items-center justify-center select-none"
                  >
                    Get started
                  </Link>
                </div>
              )}

              {/* Mobile Animated Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden relative w-10 h-10 rounded-full border border-[#1B3428]/15 bg-white/90 flex items-center justify-center text-[#14261D] hover:bg-white hover:text-[#E8722C] transition-all focus:outline-none shadow-sm"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
              >
                <div className="w-5 h-4 flex flex-col justify-between items-center">
                  <span
                    className={`w-5 h-[2px] bg-[#14261D] rounded-full transform transition-all duration-300 ease-out origin-center ${
                      mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`w-5 h-[2px] bg-[#14261D] rounded-full transition-all duration-200 ease-out ${
                      mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`w-5 h-[2px] bg-[#14261D] rounded-full transform transition-all duration-300 ease-out origin-center ${
                      mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                    }`}
                  />
                </div>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Full-Screen Bi-Directional Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 w-full h-[100dvh] bg-[#FAF8F4] flex flex-col px-6 pt-5 pb-8 overflow-y-auto select-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 -translate-y-4 pointer-events-none invisible'
        }`}
      >
        {/* 1. TOP HEADER BAR: Permanent Anchor */}
        <div className="flex items-center justify-between w-full pb-4 border-b border-[#1B3428]/10 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E8722C] text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-xl text-[#14261D] tracking-tight">
              Lernivox
            </span>
          </Link>

          {/* Close Button (✕) with Tactile Hover */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] flex items-center justify-center shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all"
            aria-label="Close Navigation Menu"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 2. NAVIGATION LINKS: Anchored Directly Below Header (No Middle-Screen Void) */}
        <nav className="flex flex-col mt-6 w-full">
          {NAV_ITEMS.map((item) => {
            const targetId = item.href.replace('#', '');
            const isActive = activeSection === targetId;
            return (
              <a
                key={item.num}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className={`flex items-center justify-between py-4 border-b border-[#1B3428]/10 transition-colors duration-200 group ${
                  isActive ? 'text-[#14261D] font-bold' : 'text-[#14261D]/75 hover:text-[#14261D]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono text-xs font-bold transition-colors ${
                      isActive ? 'text-[#E8722C]' : 'text-[#14261D]/35 group-hover:text-[#E8722C]'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`font-display text-2xl sm:text-3xl tracking-tight transition-transform duration-200 ${
                      isActive ? 'font-extrabold text-[#14261D] translate-x-1' : 'font-bold group-hover:translate-x-1'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Directional Arrow (Matching Video) */}
                <svg
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? 'text-[#E8722C] translate-x-0 opacity-100'
                      : 'text-[#14261D]/40 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            );
          })}
        </nav>

        {/* 3. BOTTOM ACTIONS: Pushed Cleanly to Bottom via mt-auto */}
        <div className="w-full flex flex-col items-center gap-4 mt-auto pt-8 border-t border-[#1B3428]/10 shrink-0">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-[#1B3428] text-white font-display font-bold text-base text-center shadow-[0_4px_0_0_#14261D] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#14261D] active:translate-y-1 active:shadow-[0_1px_0_0_#14261D] transition-all flex items-center justify-center gap-2"
              >
                <UserCircle className="h-5 w-5" />
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  window.location.href = '/';
                }}
                className="py-1 text-center font-sans text-sm font-semibold text-[#14261D]/70 hover:text-[#E8722C] transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {/* Full-Width 3D CTA Button */}
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-[#E8722C] text-white font-display font-bold text-base text-center shadow-[0_4px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_1px_0_0_#B26E45] transition-all"
              >
                Start Learning Free
              </Link>

              {/* High-Contrast Auth Link */}
              <div className="text-center py-1">
                <span className="font-sans text-sm text-[#14261D]/80">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-sm font-extrabold text-[#E8722C] hover:text-[#d46221] underline underline-offset-4 decoration-2 decoration-[#E8722C]/40 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
}
