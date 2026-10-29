import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Navbar } from '../../components/marketing/Navbar';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F0E5] text-lernivox-forest selection:bg-lernivox-peach selection:text-lernivox-forest overflow-x-hidden">
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#EAE4D3] bg-white/60 backdrop-blur-sm py-20 md:py-32">
        <div className="mx-auto max-w-[1380px] px-6 md:px-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-16 border-b border-[#EAE4D3]">
            {/* Brand column */}
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14261D] text-[#F9D8C0] shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="font-display text-2xl font-extrabold tracking-tight text-[#14261D]">
                  Lernivox
                </span>
              </Link>
              <p className="font-sans text-base text-[#45564B] leading-relaxed max-w-sm">
                Transform textbooks and lecture materials into real understanding with verifiable citations and interactive tutor guidance.
              </p>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-subtle">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#14261D]">
                Platform
              </h4>
              <ul className="space-y-3 font-sans text-base text-[#45564B]">
                <li>
                  <Link href="#how-it-works" className="hover:text-[#14261D] transition">
                    Document Ingestion
                  </Link>
                </li>
                <li>
                  <Link href="#sample-lesson" className="hover:text-[#14261D] transition">
                    Citation Grounding
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-[#14261D] transition">
                    Worked Solutions
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-[#14261D] transition">
                    Chapter Quizzes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Roadmap & Architecture */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#14261D]">
                Architecture
              </h4>
              <ul className="space-y-3 font-sans text-base text-[#45564B]">
                <li>NestJS Modular API</li>
                <li>BullMQ Background Workers</li>
                <li>PostgreSQL + pgvector (768-dim)</li>
                <li>Provider-Agnostic Storage Layer</li>
              </ul>
            </div>

            {/* Privacy & Safety */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#14261D]">
                Privacy Pledge
              </h4>
              <p className="font-sans text-sm text-[#45564B] leading-relaxed">
                Your uploaded textbooks and course notes belong solely to your student account. Documents are never shared or used to train external public models.
              </p>
              <p className="font-sans text-xs text-[#45564B]/80">
                Zero credentials in localStorage. Secure HttpOnly session rotation.
              </p>
            </div>
          </div>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#45564B]">
            <p>© {new Date().getFullYear()} Lernivox. Built with BrightPath editorial design principles.</p>
            <div className="flex gap-8">
              <Link href="#faq" className="hover:text-[#14261D] transition">
                Frequently Asked Questions
              </Link>
              <Link href="/login" className="hover:text-[#14261D] transition">
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

