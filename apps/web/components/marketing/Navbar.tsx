'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle, ChevronDown, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileMenu } from '../workspace/ProfileMenu';

const NAV_ITEMS = [
  { num: '01', label: 'How It Works', href: '#how-it-works' },
  { num: '02', label: 'Features', href: '#features' },
  { num: '03', label: 'Readiness', href: '#readiness' },
  { num: '04', label: 'Pricing', href: '#pricing' },
  { num: '05', label: 'FAQ', href: '#faq' },
];

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function Navbar() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isAtTop, setIsAtTop] = useState<boolean>(isHomepage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Transparent strictly at the actual top of the homepage; solid as soon as scrolling begins
  useIsomorphicLayoutEffect(() => {
    if (!isHomepage) {
      setIsAtTop(false);
      return;
    }

    const syncTopState = () => {
      const scrollTop = Math.max(
        0,
        window.scrollY ?? document.documentElement.scrollTop ?? 0,
      );
      const nextAtTop = scrollTop <= 1;
      setIsAtTop((prev) => (prev === nextAtTop ? prev : nextAtTop));
    };

    syncTopState();
    window.addEventListener('scroll', syncTopState, { passive: true });
    window.addEventListener('resize', syncTopState, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncTopState);
      window.removeEventListener('resize', syncTopState);
    };
  }, [isHomepage]);

  // Section Tracking Scroll-Spy Engine
  useEffect(() => {
    const sectionIds = ['how-it-works', 'features', 'readiness', 'pricing', 'faq'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const handleScroll = () => {
      // 140px offset accounts for sticky navbar height (64px-80px) plus threshold buffer
      const scrollPosition = window.scrollY + 140;

      // When at top of page in hero section (before first section), no section is active
      if (sections[0] && scrollPosition < sections[0].offsetTop) {
        setActiveSection(null);
        return;
      }

      // Find the active section whose top edge has passed scroll position
      let currentId: string | null = null;
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
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

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

  const isTransparent = isHomepage && isAtTop && !mobileMenuOpen;

  return (
    <>
      <header
        className={`w-full z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 motion-reduce:transition-none px-4 sm:px-6 md:px-10 ${
          isHomepage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        } ${
          isTransparent
            ? 'bg-transparent border-b-[1.5px] border-transparent'
            : 'bg-[#F4EFE4]/85 backdrop-blur-md border-b-[1.5px] border-[#1B3428]/10 shadow-[0_2px_12px_rgba(27,52,40,0.05)]'
        }`}
      >
        <div className="w-full max-w-[1380px] mx-auto h-16 md:h-20 flex lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-between">
          
          {/* Zone 1 — Left: Logo Lockup anchored to left boundary */}
          <div className="flex items-center justify-start shrink-0">
            <Link href="/" className="h-8 inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#E8722C] text-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="font-display font-bold text-xl sm:text-[22px] leading-none tracking-tight text-[#14261D]">
                Lernivox
              </span>
            </Link>
          </div>

          {/* Zone 2 — Center: Mathematically Centered Public Navigation (Desktop >= 1024px) */}
          <div className="hidden lg:flex items-center justify-center">
            <nav className="flex items-center justify-center gap-6 xl:gap-8">
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
                    className={`font-sans text-sm xl:text-[15px] font-medium transition-colors duration-200 motion-reduce:transition-none relative whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E77130]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE4] rounded-xs ${
                      isActive
                        ? 'text-[#14261D] hover:text-[#E77130] after:content-[\'\'] after:absolute after:-bottom-[6px] after:left-0 after:w-full after:h-[2px] after:bg-[#E8722C] after:rounded-full'
                        : 'text-[#14261D]/75 hover:text-[#E77130]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Zone 3 — Right: Authentication-Aware Actions aligned to right content margin */}
          <div className="flex items-center justify-end shrink-0 gap-2">
            {isLoading ? (
              <>
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#1B3428]/10 animate-pulse shrink-0" />
                  <div className="w-9 h-9 rounded-full bg-[#1B3428]/10 animate-pulse shrink-0" />
                </div>
                <div className="lg:hidden w-9 h-9 rounded-full bg-[#1B3428]/10 animate-pulse shrink-0" />
              </>
            ) : isAuthenticated ? (
              <>
                {/* Direct Dashboard Icon Shortcut — Visible on all screen sizes */}
                <Link
                  href="/dashboard"
                  className="w-9 h-9 rounded-full bg-[#F4EFE4] border-[1.5px] border-[#1B3428]/20 flex items-center justify-center text-[#14261D] hover:text-[#E8722C] hover:border-[#E8722C] shadow-2xs active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                  title="Go to Dashboard"
                  aria-label="Go to Dashboard"
                >
                  <BookOpen className="w-4 h-4" />
                </Link>

                {/* Desktop Profile Menu (>= 1024px) */}
                <div className="hidden lg:flex items-center">
                  <ProfileMenu compact />
                </div>
              </>
            ) : (
              <>
                {/* Desktop Unauthenticated Layout (>= 1024px): Restrained, Quiet Actions */}
                <div className="hidden lg:flex items-center gap-4">
                  <Link
                    href="/login"
                    className="font-sans text-sm font-medium text-[#14261D]/75 hover:text-[#E77130] transition-colors duration-200 motion-reduce:transition-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E77130]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE4] rounded-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="h-9 px-5 rounded-full border-[1.5px] border-[#1B3428] text-[#14261D] font-sans text-sm font-semibold hover:bg-[#1B3428] hover:text-white shadow-xs transition-all duration-150 inline-flex items-center justify-center whitespace-nowrap select-none"
                  >
                    Get started
                  </Link>
                </div>

                {/* Mobile & Tablet Sign In Link (< 1024px) */}
                <Link
                  href="/login"
                  className="lg:hidden font-sans text-xs font-semibold px-2 py-1 text-[#14261D]/80 hover:text-[#14261D] transition-colors shrink-0"
                >
                  Sign In
                </Link>
              </>
            )}

            {/* Mobile Animated Hamburger Button (< 1024px) — Shared 36px Tactile Button System */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative w-9 h-9 rounded-full border-[1.5px] border-[#1B3428]/20 bg-[#F4EFE4] flex items-center justify-center text-[#14261D] hover:text-[#E8722C] hover:border-[#E8722C] transition-all focus:outline-none shadow-2xs active:translate-y-0.5 shrink-0"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-4 h-3.5 flex flex-col justify-between items-center">
                <span
                  className={`w-4 h-[2px] bg-[#14261D] rounded-full transform transition-all duration-300 ease-out origin-center ${
                    mobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`w-4 h-[2px] bg-[#14261D] rounded-full transition-all duration-200 ease-out ${
                    mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`w-4 h-[2px] bg-[#14261D] rounded-full transform transition-all duration-300 ease-out origin-center ${
                    mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Full-Screen Bi-Directional Mobile/Tablet Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 w-full h-[100dvh] bg-[#F4EFE4] flex flex-col px-6 pt-5 pb-8 overflow-y-auto select-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
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
            className="w-10 h-10 rounded-full bg-[#F4EFE4] border-[1.5px] border-[#1B3428] text-[#14261D] flex items-center justify-center shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all"
            aria-label="Close Navigation Menu"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 2. NAVIGATION LINKS: Anchored Directly Below Header */}
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
                className={`flex items-center justify-between py-4 border-b border-[#1B3428]/10 transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E77130]/60 rounded-xs group ${
                  isActive ? 'text-[#14261D] font-bold' : 'text-[#14261D]/75 hover:text-[#E77130]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono text-xs font-bold transition-colors duration-200 ${
                      isActive ? 'text-[#E8722C]' : 'text-[#14261D]/35 group-hover:text-[#E77130]'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`font-display text-2xl sm:text-3xl tracking-tight transition-transform duration-200 motion-reduce:transition-none font-bold ${
                      isActive ? 'text-[#14261D] translate-x-1' : 'group-hover:translate-x-1 group-hover:text-[#E77130]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

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
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-[#E8722C] text-white font-display font-bold text-base text-center shadow-[0_4px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#B26E45] active:translate-y-1 active:shadow-[0_1px_0_0_#B26E45] transition-all"
              >
                Start Learning Free
              </Link>

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
