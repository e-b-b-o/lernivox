'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Sliders,
  Bell,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Save,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  // Account State
  const [displayName, setDisplayName] = useState(user?.name || 'Student');
  const [email] = useState(user?.email || 'student@lernivox.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Learning Preferences State
  const [teachingStyle, setTeachingStyle] = useState<'SOCRATIC' | 'DIRECT' | 'ANALOGICAL'>('SOCRATIC');
  const [explanationLength, setExplanationLength] = useState<'CONCISE' | 'BALANCED' | 'DETAILED'>('BALANCED');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [dailyMinutes, setDailyMinutes] = useState(30);

  // Notifications State
  const [studyReminders, setStudyReminders] = useState(true);
  const [reviewReminders, setReviewReminders] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#14261D] tracking-tight">
          Account & Learning Settings
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#14261D]/70 mt-1 max-w-xl">
          Personalize your Lernivox AI tutor, adjust explanation depth, and configure your study routine.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-[#E2EBD8] border border-[#497E64]/30 text-[#497E64] text-xs sm:text-sm font-display font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#497E64]" />
          <span>Your preferences have been saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Account Information */}
        <div className="rounded-[24px] bg-[#FAF8F4] border-[2px] border-[#1B3428]/20 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10 mb-5">
            <User className="w-5 h-5 text-[#E8722C]" />
            <h2 className="font-display font-bold text-base text-[#14261D]">
              Student Account
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold text-[#14261D] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#1B3428]/20 rounded-xl text-[#14261D] focus:outline-none focus:border-[#E8722C]"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-[#14261D] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#1B3428]/5 border border-[#1B3428]/15 rounded-xl text-[#14261D]/60 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Tutoring & Learning Preferences */}
        <div className="rounded-[24px] bg-[#FAF8F4] border-[2px] border-[#1B3428]/20 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10 mb-5">
            <Sliders className="w-5 h-5 text-[#497E64]" />
            <div>
              <h2 className="font-display font-bold text-base text-[#14261D]">
                AI Learning Preferences
              </h2>
              <p className="font-sans text-xs text-[#14261D]/70">
                These preferences configure how Lernivox AI explains topics and generates practice.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Teaching Style */}
            <div>
              <label className="block text-xs font-display font-bold text-[#14261D] mb-2">
                Primary Teaching Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'SOCRATIC',
                    title: 'Socratic Tutor',
                    desc: 'Guides through questions, hints, and checks understanding step-by-step.',
                  },
                  {
                    id: 'DIRECT',
                    title: 'Direct & Concise',
                    desc: 'Provides authoritative, clear, and high-density textbook summaries.',
                  },
                  {
                    id: 'ANALOGICAL',
                    title: 'Intuitive & Analogies',
                    desc: 'Uses real-world metaphors and practical stories to build intuition.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTeachingStyle(item.id as typeof teachingStyle)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
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

            {/* Explanation Depth & Preferred Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-bold text-[#14261D] mb-1.5">
                  Explanation Depth
                </label>
                <div className="flex rounded-xl bg-[#1B3428]/5 p-1 border border-[#1B3428]/10">
                  {(['CONCISE', 'BALANCED', 'DETAILED'] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setExplanationLength(len)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                        explanationLength === len
                          ? 'bg-[#FAF8F4] text-[#14261D] shadow-xs'
                          : 'text-[#14261D]/60 hover:text-[#14261D]'
                      }`}
                    >
                      {len === 'CONCISE' ? 'Quick' : len === 'BALANCED' ? 'Standard' : 'Deep Dive'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-[#14261D] mb-1.5">
                  Default Question Difficulty
                </label>
                <div className="flex rounded-xl bg-[#1B3428]/5 p-1 border border-[#1B3428]/10">
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${
                        difficulty === diff
                          ? 'bg-[#FAF8F4] text-[#14261D] shadow-xs'
                          : 'text-[#14261D]/60 hover:text-[#14261D]'
                      }`}
                    >
                      {diff === 'BEGINNER' ? 'Foundational' : diff === 'INTERMEDIATE' ? 'Standard' : 'Rigorous'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Target Minutes */}
            <div>
              <label className="block text-xs font-display font-bold text-[#14261D] mb-1.5">
                Daily Study Target
              </label>
              <div className="flex items-center gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyMinutes(mins)}
                    className={`px-4 py-2 rounded-xl text-xs font-display font-bold border transition-all ${
                      dailyMinutes === mins
                        ? 'bg-[#E8722C] text-white border-[#1B3428] shadow-xs'
                        : 'bg-white text-[#14261D] border-[#1B3428]/20 hover:border-[#1B3428]'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Study Reminders & Notifications */}
        <div className="rounded-[24px] bg-[#FAF8F4] border-[2px] border-[#1B3428]/20 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#1B3428]/10 mb-5">
            <Bell className="w-5 h-5 text-[#B87B14]" />
            <h2 className="font-display font-bold text-base text-[#14261D]">
              Reminders & Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#1B3428]/15 cursor-pointer">
              <div>
                <p className="font-display font-bold text-xs text-[#14261D]">
                  Daily Study Reminders
                </p>
                <p className="font-sans text-[11px] text-[#14261D]/60">
                  In-app prompt to complete your recommended learning session.
                </p>
              </div>
              <input
                type="checkbox"
                checked={studyReminders}
                onChange={(e) => setStudyReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#E8722C] focus:ring-[#E8722C]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#1B3428]/15 cursor-pointer">
              <div>
                <p className="font-display font-bold text-xs text-[#14261D]">
                  Spaced Repetition Review Alerts
                </p>
                <p className="font-sans text-[11px] text-[#14261D]/60">
                  Notify when flashcards are due for review to prevent memory decay.
                </p>
              </div>
              <input
                type="checkbox"
                checked={reviewReminders}
                onChange={(e) => setReviewReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#E8722C] focus:ring-[#E8722C]"
              />
            </label>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E8722C] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Learning Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
