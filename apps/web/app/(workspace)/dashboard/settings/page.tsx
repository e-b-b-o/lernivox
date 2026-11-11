'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Sliders,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Save,
  Shield,
  Sparkles,
  BookOpen,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

type SettingsCategory = 'account' | 'tutor' | 'schedule';

const SETTINGS_STORAGE_KEY = 'lernivox_user_preferences';

export default function SettingsPage() {
  const { user } = useAuth();

  // Active Category State for Master-Detail Information Architecture
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account');

  // Account State
  const [displayName, setDisplayName] = useState(user?.name || 'Student');
  const [email] = useState(user?.email || 'student@lernivox.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Learning Preferences State
  const [teachingStyle, setTeachingStyle] = useState<'SOCRATIC' | 'DIRECT' | 'ANALOGICAL'>('SOCRATIC');
  const [explanationLength, setExplanationLength] = useState<'CONCISE' | 'BALANCED' | 'DETAILED'>('BALANCED');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [dailyMinutes, setDailyMinutes] = useState<number>(30);

  // Schedule & Notifications State
  const [studyReminders, setStudyReminders] = useState(true);
  const [reviewReminders, setReviewReminders] = useState(true);

  // Load saved preferences from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.teachingStyle) setTeachingStyle(parsed.teachingStyle);
        if (parsed.explanationLength) setExplanationLength(parsed.explanationLength);
        if (parsed.difficulty) setDifficulty(parsed.difficulty);
        if (parsed.dailyMinutes) setDailyMinutes(parsed.dailyMinutes);
        if (typeof parsed.studyReminders === 'boolean') setStudyReminders(parsed.studyReminders);
        if (typeof parsed.reviewReminders === 'boolean') setReviewReminders(parsed.reviewReminders);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          displayName,
          teachingStyle,
          explanationLength,
          difficulty,
          dailyMinutes,
          studyReminders,
          reviewReminders,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore storage errors
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const categories = [
    {
      id: 'account' as const,
      label: 'Profile & Account',
      description: 'Display name & account information',
      icon: User,
    },
    {
      id: 'tutor' as const,
      label: 'AI Tutor & Learning',
      description: 'Teaching style, depth & difficulty',
      icon: Sliders,
    },
    {
      id: 'schedule' as const,
      label: 'Schedule & Reviews',
      description: 'Daily study habits & spaced alerts',
      icon: Clock,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-10 flex-1 flex flex-col">
      <div className="w-full max-w-[1380px] mx-auto py-8 sm:py-10 flex-1 space-y-6">
        {/* 1. Header with Breadcrumb & Back Navigation */}
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#14261D]/70 hover:text-[#14261D] transition-colors py-1 px-2.5 -ml-2.5 rounded-lg hover:bg-[#1B3428]/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#14261D] tracking-tight">
              Settings & Preferences
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#14261D]/70 mt-0.5">
              Customize how Lernivox AI explains course topics, formats questions, and supports your study routine.
            </p>
          </div>

          {savedSuccess && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2EBD8] border border-[#497E64]/30 text-[#497E64] text-xs font-display font-bold shadow-xs animate-in fade-in duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#497E64]" />
              <span>Preferences saved</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Responsive Mobile Tab Navigation (< md) */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#1B3428]/10">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-display font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#14261D] text-[#FAF8F4] shadow-xs'
                  : 'bg-[#FAF8F4] text-[#14261D]/70 hover:text-[#14261D] border border-[#1B3428]/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Master-Detail Layout (Desktop 2-Column: Sidebar + Content) */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
        {/* Left Sidebar (Desktop Navigation) */}
        <aside className="hidden md:flex flex-col gap-1.5 bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/15 rounded-[22px] p-2.5 shadow-xs sticky top-24">
          <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-wider uppercase text-[#14261D]/50">
            Categories
          </div>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#14261D] text-[#FAF8F4] shadow-xs font-bold'
                    : 'text-[#14261D]/75 hover:bg-[#1B3428]/5 hover:text-[#14261D]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#E8722C]' : 'text-[#14261D]/60'
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-display text-xs truncate">{cat.label}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Detail Pane */}
        <main className="min-w-0">
          <form onSubmit={handleSave} className="space-y-6">
            {/* CATEGORY 1: Profile & Account */}
            {activeCategory === 'account' && (
              <div className="rounded-[24px] bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/15 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10">
                  <User className="w-5 h-5 text-[#E8722C]" />
                  <div>
                    <h2 className="font-display font-bold text-base text-[#14261D]">
                      Student Profile & Account
                    </h2>
                    <p className="font-sans text-xs text-[#14261D]/70">
                      Your public name and authenticated account details.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-display font-bold text-[#14261D]">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-11 px-4 text-xs sm:text-sm bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 rounded-xl text-[#14261D] focus:outline-none focus:bg-white focus:border-[#E8722C] transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-display font-bold text-[#14261D]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full h-11 px-4 text-xs sm:text-sm bg-[#1B3428]/5 border-[1.5px] border-[#1B3428]/10 rounded-xl text-[#14261D]/60 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1B3428]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#14261D]/70">
                    <Shield className="w-4 h-4 text-[#497E64]" />
                    <span>Protected with JWT session authentication</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono text-[11px] font-bold self-start sm:self-auto">
                    Active Student
                  </span>
                </div>
              </div>
            )}

            {/* CATEGORY 2: AI Tutor & Learning Preferences */}
            {activeCategory === 'tutor' && (
              <div className="rounded-[24px] bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/15 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10">
                  <Sliders className="w-5 h-5 text-[#E8722C]" />
                  <div>
                    <h2 className="font-display font-bold text-base text-[#14261D]">
                      AI Tutor & Learning Style
                    </h2>
                    <p className="font-sans text-xs text-[#14261D]/70">
                      Configure how the AI tutor guides your understanding and generates practice.
                    </p>
                  </div>
                </div>

                {/* 1. Primary Teaching Style */}
                <div className="space-y-2">
                  <label className="block text-xs font-display font-bold text-[#14261D]">
                    Primary Teaching Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'SOCRATIC' as const,
                        title: 'Socratic Tutor',
                        desc: 'Guides through questions, hints, and checks understanding step-by-step.',
                      },
                      {
                        id: 'DIRECT' as const,
                        title: 'Direct & Concise',
                        desc: 'Provides authoritative, clear, and high-density textbook summaries.',
                      },
                      {
                        id: 'ANALOGICAL' as const,
                        title: 'Intuitive & Analogies',
                        desc: 'Uses real-world metaphors and practical stories to build intuition.',
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTeachingStyle(item.id)}
                        className={`p-4 rounded-2xl border-[1.5px] text-left transition-all cursor-pointer ${
                          teachingStyle === item.id
                            ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                            : 'bg-white text-[#14261D] border-[#1B3428]/20 hover:border-[#1B3428]/40'
                        }`}
                      >
                        <p className="font-display font-bold text-xs sm:text-sm">{item.title}</p>
                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            teachingStyle === item.id ? 'text-white/80' : 'text-[#14261D]/70'
                          }`}
                        >
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Unified Segmented Controls: Explanation Depth & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-[#14261D]">
                      Explanation Depth
                    </label>
                    <div className="flex rounded-xl bg-[#1B3428]/5 p-1 border border-[#1B3428]/10">
                      {(['CONCISE', 'BALANCED', 'DETAILED'] as const).map((len) => {
                        const isSelected = explanationLength === len;
                        return (
                          <button
                            key={len}
                            type="button"
                            onClick={() => setExplanationLength(len)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#14261D] text-[#FAF8F4] shadow-xs'
                                : 'text-[#14261D]/70 hover:text-[#14261D]'
                            }`}
                          >
                            {len === 'CONCISE' ? 'Quick' : len === 'BALANCED' ? 'Standard' : 'Deep Dive'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-[#14261D]">
                      Question Difficulty
                    </label>
                    <div className="flex rounded-xl bg-[#1B3428]/5 p-1 border border-[#1B3428]/10">
                      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((diff) => {
                        const isSelected = difficulty === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setDifficulty(diff)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#14261D] text-[#FAF8F4] shadow-xs'
                                : 'text-[#14261D]/70 hover:text-[#14261D]'
                            }`}
                          >
                            {diff === 'BEGINNER' ? 'Foundational' : diff === 'INTERMEDIATE' ? 'Standard' : 'Rigorous'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Daily Study Target */}
                <div className="space-y-2">
                  <label className="block text-xs font-display font-bold text-[#14261D]">
                    Daily Study Target
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[15, 30, 45, 60].map((mins) => {
                      const isSelected = dailyMinutes === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDailyMinutes(mins)}
                          className={`px-4 py-2 rounded-xl text-xs font-display font-bold border-[1.5px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#14261D] text-[#FAF8F4] border-[#14261D] shadow-xs'
                              : 'bg-white text-[#14261D] border-[#1B3428]/20 hover:border-[#1B3428]/40'
                          }`}
                        >
                          {mins} Minutes / Day
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 3: Study Schedule & Reviews */}
            {activeCategory === 'schedule' && (
              <div className="rounded-[24px] bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/15 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10">
                  <Clock className="w-5 h-5 text-[#E8722C]" />
                  <div>
                    <h2 className="font-display font-bold text-base text-[#14261D]">
                      Study Schedule & Spaced Repetition
                    </h2>
                    <p className="font-sans text-xs text-[#14261D]/70">
                      Configure retention alerts and learning plan pacing.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#1B3428]/15 cursor-pointer hover:border-[#1B3428]/30 transition-colors">
                    <div className="pr-4">
                      <p className="font-display font-bold text-xs text-[#14261D]">
                        Daily Study Prompts
                      </p>
                      <p className="font-sans text-[11px] text-[#14261D]/60 mt-0.5">
                        In-app highlights suggesting your next recommended chapter or quiz session.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={studyReminders}
                      onChange={(e) => setStudyReminders(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E8722C] focus:ring-[#E8722C] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#1B3428]/15 cursor-pointer hover:border-[#1B3428]/30 transition-colors">
                    <div className="pr-4">
                      <p className="font-display font-bold text-xs text-[#14261D]">
                        Spaced Repetition Review Alerts
                      </p>
                      <p className="font-sans text-[11px] text-[#14261D]/60 mt-0.5">
                        Alerts when flashcards or concepts approach memory decay thresholds.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reviewReminders}
                      onChange={(e) => setReviewReminders(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E8722C] focus:ring-[#E8722C] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Persistent Save Button Row */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E8722C] hover:bg-[#D65E1E] text-white font-display font-bold text-xs sm:text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  </div>
);
}
