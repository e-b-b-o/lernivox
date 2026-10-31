'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [activeHash, setActiveHash] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const ids = ['how-it-works', 'features', 'pricing', 'faq'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => {
      if (window.scrollY < 180) setActiveHash('');
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="w-full bg-[#F4F0E5] py-[20px] h-[86px] sticky top-0 z-50 border-none transition-colors">
      <div className="max-w-[1440px] h-[46px] px-[30px] mx-auto flex items-center justify-center">
        <div className="w-full max-w-[1380px] h-[46px] flex items-center justify-between gap-4 lg:gap-[100px]">
          
          {/* Zone 1 — Left (Logo Lockup: 236x32) */}
          <div className="w-[236px] min-w-[236px] h-[32px] flex items-center shrink-0">
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
              <span className="font-display font-bold text-[22px] leading-[32px] tracking-[-0.02em] text-[#14261D]">
                Lernivox
              </span>
            </Link>
          </div>

          {/* Zone 2 — Center (Nav Links: 708x22, gap 40px) */}
          <nav className="hidden md:flex items-center justify-center w-[708px] h-[22px] gap-[40px]">
            {NAV_LINKS.map((link) => {
              const isActive = activeHash === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveHash(link.href);
                    const el = document.querySelector(link.href);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', link.href);
                    }
                  }}
                  className={`font-sans text-[16px] font-medium leading-[22.4px] transition-colors duration-200 relative ${
                    isActive
                      ? 'text-[#E8722C] after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:w-full after:h-[2px] after:bg-[#E8722C] after:rounded-full'
                      : 'text-[#14261D] hover:text-[#E8722C]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3 — Right (Sign In + "Get started" Button: 236x46, gap 20px) */}
          <div className="flex items-center justify-end shrink-0 gap-[20px] md:w-[236px] md:min-w-[236px] h-[46px]">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-[16px]">
                <Link
                  href="/dashboard"
                  className="h-[46px] px-[30px] py-[12px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[16px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#497E64] active:translate-y-[2px] active:shadow-[0_2px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap inline-flex items-center justify-center gap-2 select-none"
                >
                  <UserCircle className="h-4 w-4" />
                  Workspace
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign out"
                  className="rounded-full p-2 text-[#14261D] hover:text-[#E8722C] hover:bg-[#14261D]/5 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-[20px]">
                <Link
                  href="/login"
                  className="font-sans text-[16px] font-medium leading-[22.4px] text-[#14261D] hover:text-[#E8722C] transition-colors duration-200 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="h-[46px] px-[30px] py-[12px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[16px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#497E64] active:translate-y-[2px] active:shadow-[0_2px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap inline-flex items-center justify-center select-none"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-full border border-stone-300 bg-white/80 p-2.5 text-[#14261D] hover:bg-white hover:text-[#E8722C] transition"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#EAE4D3] bg-[#F4F0E5] px-6 py-8 md:hidden animate-fadeIn shadow-lg">
          <nav className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => {
              const isActive = activeHash === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveHash(link.href);
                    setMobileMenuOpen(false);
                    const el = document.querySelector(link.href);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', link.href);
                    }
                  }}
                  className={`font-sans text-[16px] font-medium leading-[22.4px] transition-colors ${
                    isActive ? 'text-[#E8722C]' : 'text-[#14261D] hover:text-[#E8722C]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="mt-4 pt-6 border-t border-[#EAE4D3] flex flex-col gap-3.5">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <span className="h-[46px] px-[30px] py-[12px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[16px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#497E64] active:translate-y-[2px] active:shadow-[0_2px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap flex items-center justify-center select-none">
                    Workspace
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center font-sans text-[16px] font-medium leading-[22.4px] text-[#14261D] hover:text-[#E8722C] py-2 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <span className="h-[46px] px-[30px] py-[12px] rounded-[100px] bg-[#1B3428] text-white font-sans text-[16px] font-medium leading-[22.4px] shadow-[0_4px_0_0_#497E64] hover:-translate-y-[1px] hover:shadow-[0_5px_0_0_#497E64] active:translate-y-[2px] active:shadow-[0_2px_0_0_#497E64] transition-all duration-150 ease-out whitespace-nowrap flex items-center justify-center select-none">
                      Get started
                    </span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
