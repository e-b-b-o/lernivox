'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X, ArrowRight, UserCircle, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-lernivox-cream text-lernivox-forest selection:bg-lernivox-peach selection:text-lernivox-forest">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-lernivox-cream/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 md:h-24 max-w-[1440px] items-center justify-between px-6 md:px-12 xl:px-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lernivox-forest text-lernivox-peach shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-lernivox-forest">
              Lernivox
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-10 md:flex">
            <Link
              href="#how-it-works"
              className="text-base font-medium text-stone-600 transition hover:text-lernivox-forest"
            >
              How It Works
            </Link>
            <Link
              href="#sample-lesson"
              className="text-base font-medium text-stone-600 transition hover:text-lernivox-forest"
            >
              Interactive Preview
            </Link>
            <Link
              href="#features"
              className="text-base font-medium text-stone-600 transition hover:text-lernivox-forest"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-base font-medium text-stone-600 transition hover:text-lernivox-forest"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-base font-medium text-stone-600 transition hover:text-lernivox-forest"
            >
              FAQ
            </Link>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-2.5 px-6"
                  >
                    <UserCircle className="h-4 w-4" />
                    Workspace
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign out"
                  className="rounded-full p-2.5 text-stone-500 hover:bg-stone-200/60 hover:text-lernivox-forest transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-base font-medium text-stone-700 hover:text-lernivox-forest px-5"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="px-6 font-semibold"
                  >
                    Get Started Free
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full border border-stone-300 bg-white/80 p-2.5 text-lernivox-forest hover:bg-white transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-stone-200/80 bg-white/95 backdrop-blur-md px-6 py-8 md:hidden animate-fadeIn">
            <nav className="flex flex-col gap-5">
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-stone-700 hover:text-lernivox-terracotta transition"
              >
                How It Works
              </Link>
              <Link
                href="#sample-lesson"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-stone-700 hover:text-lernivox-terracotta transition"
              >
                Interactive Preview
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-stone-700 hover:text-lernivox-terracotta transition"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-stone-700 hover:text-lernivox-terracotta transition"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-stone-700 hover:text-lernivox-terracotta transition"
              >
                FAQ
              </Link>

              <div className="mt-4 pt-6 border-t border-stone-200 flex flex-col gap-3.5">
                {isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full justify-center">
                      Open Student Workspace
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="md" className="w-full justify-center">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full justify-center"
                      >
                        Create Free Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 backdrop-blur-sm py-20 md:py-32">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-16 border-b border-stone-200/80">
            {/* Brand column */}
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lernivox-forest text-lernivox-peach shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="font-display text-2xl font-extrabold tracking-tight text-lernivox-forest">
                  Lernivox
                </span>
              </Link>
              <p className="text-base text-stone-600 leading-relaxed max-w-sm">
                Transform textbooks and lecture materials into real understanding with verifiable citations and interactive tutor guidance.
              </p>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-subtle">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-lernivox-forest">
                Platform
              </h4>
              <ul className="space-y-3 text-base text-stone-600">
                <li>
                  <Link href="#how-it-works" className="hover:text-lernivox-forest transition">
                    Document Ingestion
                  </Link>
                </li>
                <li>
                  <Link href="#sample-lesson" className="hover:text-lernivox-forest transition">
                    Citation Grounding
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-lernivox-forest transition">
                    Worked Solutions
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-lernivox-forest transition">
                    Chapter Quizzes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Roadmap & Architecture */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-lernivox-forest">
                Architecture
              </h4>
              <ul className="space-y-3 text-base text-stone-600">
                <li>NestJS Modular API</li>
                <li>BullMQ Background Workers</li>
                <li>PostgreSQL + pgvector (768-dim)</li>
                <li>Provider-Agnostic Storage Layer</li>
              </ul>
            </div>

            {/* Privacy & Safety */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-lernivox-forest">
                Privacy Pledge
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Your uploaded textbooks and course notes belong solely to your student account. Documents are never shared or used to train external public models.
              </p>
              <p className="text-xs text-stone-500">
                Zero credentials in localStorage. Secure HttpOnly session rotation.
              </p>
            </div>
          </div>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-stone-500">
            <p>© {new Date().getFullYear()} Lernivox. Built with BrightPath editorial design principles.</p>
            <div className="flex gap-8">
              <Link href="#faq" className="hover:text-lernivox-forest transition">
                Frequently Asked Questions
              </Link>
              <Link href="/login" className="hover:text-lernivox-forest transition">
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

