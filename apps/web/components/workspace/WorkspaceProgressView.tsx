'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  Loader2,
  RefreshCw,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  WorkspaceProgressOverviewDto,
  TopicUnderstandingDto,
  TopicUnderstandingStatus,
  DocumentDto,
} from '@lernivox/contracts';

interface WorkspaceProgressViewProps {
  workspaceId: string;
  document: DocumentDto | null;
  onReturnToBook: () => void;
  onTakeQuiz?: () => void;
  onStudyFlashcards?: () => void;
}

export function WorkspaceProgressView({
  workspaceId,
  document,
  onReturnToBook,
  onTakeQuiz,
  onStudyFlashcards,
}: WorkspaceProgressViewProps) {
  const { accessToken } = useAuth();
  const [progress, setProgress] = useState<WorkspaceProgressOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!accessToken || !workspaceId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await api.workspaces.getProgress(workspaceId, accessToken);
      setProgress(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [workspaceId, accessToken]);

  const getStatusBadge = (status: TopicUnderstandingStatus) => {
    switch (status) {
      case 'CONFIDENT':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Confident
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            Needs Review
          </span>
        );
      case 'LEARNING':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <Clock className="w-2.5 h-2.5 text-blue-600" />
            Learning
          </span>
        );
      case 'NOT_STARTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#14261D]/50 bg-[#14261D]/5 px-2.5 py-1 rounded-full border border-[#14261D]/10">
            Not Started
          </span>
        );
    }
  };

  const getReadinessBadge = (level: string) => {
    switch (level) {
      case 'EXAM_READY':
        return {
          title: 'Exam Ready',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeColor: 'bg-emerald-600 text-white',
        };
      case 'WELL_PREPARED':
        return {
          title: 'Well Prepared',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          badgeColor: 'bg-blue-600 text-white',
        };
      case 'IN_PROGRESS':
        return {
          title: 'Making Progress',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeColor: 'bg-amber-600 text-white',
        };
      case 'GETTING_STARTED':
      default:
        return {
          title: 'Getting Started',
          color: 'bg-[#FAF8F4] text-[#14261D] border-[#1B3428]/20',
          badgeColor: 'bg-[#1B3428] text-white',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#F4F0E5]">
        <Loader2 className="w-7 h-7 animate-spin text-[#E8722C] mb-3" />
        <p className="font-display font-bold text-xs text-[#14261D]">
          Calculating learning progress...
        </p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F0E5]">
        <div className="p-6 rounded-2xl bg-[#FAF8F4] border-[2px] border-[#1B3428] text-center max-w-md shadow-[0_4px_0_0_#1B3428]">
          <p className="text-xs text-red-600 mb-4">{error || 'Unable to load progress data.'}</p>
          <button
            type="button"
            onClick={fetchProgress}
            className="px-4 py-2 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const readiness = getReadinessBadge(progress.overallStatus);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F0E5] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-7 shadow-[0_6px_0_0_#1B3428] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] text-xs font-bold border border-[#497E64]/30">
                Individual Learning Report
              </span>
              <span className="text-xs text-[#14261D]/60 font-sans">
                {document?.title || progress.documentTitle}
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-[#14261D] tracking-tight">
              My Learning & Understanding Progress
            </h1>
            <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1 max-w-xl">
              Derived strictly from your verified reading positions, quiz attempts, and spaced-repetition flashcard ratings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReturnToBook}
              className="px-4 py-2.5 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] font-display font-bold text-xs text-[#14261D] shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1B3428]" />
              <span>Back to Reader</span>
            </button>

            <button
              type="button"
              onClick={fetchProgress}
              className="p-2.5 rounded-full border-[1.5px] border-[#1B3428]/25 bg-[#FAF8F4] text-[#14261D] hover:bg-[#F4F0E5] shadow-2xs transition-all"
              title="Refresh Progress"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Readiness Overview Card */}
        <div
          className={`border-[2px] border-[#1B3428] rounded-3xl p-5 sm:p-6 shadow-[0_4px_0_0_#1B3428] ${readiness.color}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl ${readiness.badgeColor} flex items-center justify-center shrink-0 shadow-xs`}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-0.5">
                  Current Mastery Status
                </span>
                <h2 className="font-display font-black text-lg sm:text-xl text-[#14261D]">
                  {readiness.title}
                </h2>
                <p className="text-xs text-[#14261D]/80 font-sans mt-0.5">
                  Assessment and spaced-repetition status in &ldquo;{progress.documentTitle}&rdquo;
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onTakeQuiz && (
                <button
                  type="button"
                  onClick={onTakeQuiz}
                  className="px-4 py-2 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_2px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all"
                >
                  Take Practice Quiz
                </button>
              )}
              {onStudyFlashcards && (
                <button
                  type="button"
                  onClick={onStudyFlashcards}
                  className="px-4 py-2 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 transition-all"
                >
                  Study Cards
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3 Evidence Cards: Reading, Assessments, Flashcards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Reading Activity */}
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-5 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-[#14261D]/60 tracking-wider">
                  Reading Activity
                </span>
                <BookOpen className="w-4 h-4 text-[#E8722C]" />
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display font-black text-3xl text-[#14261D]">
                  {progress.reading.percentage}%
                </span>
                <span className="text-xs text-[#14261D]/60 font-sans">
                  of book read
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#1B3428]/10 overflow-hidden mb-3">
                <div
                  className="h-full bg-[#E8722C] rounded-full transition-all duration-300"
                  style={{ width: `${progress.reading.percentage}%` }}
                />
              </div>

              <div className="space-y-1 text-xs text-[#14261D]/70 font-sans">
                <p>
                  Current page: <strong className="text-[#14261D] font-mono">{progress.reading.currentPage}</strong> of{' '}
                  <span className="font-mono">{progress.reading.totalPages}</span>
                </p>
                <p className="text-[11px] text-[#14261D]/50">
                  {progress.reading.lastReadAt
                    ? `Last active ${new Date(progress.reading.lastReadAt).toLocaleDateString()}`
                    : 'Reading not yet recorded'}
                </p>
              </div>
            </div>

            <p className="mt-4 pt-3 border-t border-[#1B3428]/10 text-[10px] text-[#14261D]/50 italic">
              Measures reader traversal, not tested comprehension.
            </p>
          </div>

          {/* Card 2: Assessment Evidence */}
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-5 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-[#14261D]/60 tracking-wider">
                  Quiz Performance
                </span>
                <HelpCircle className="w-4 h-4 text-[#1B3428]" />
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display font-black text-3xl text-[#14261D]">
                  {progress.assessment.averageScore}%
                </span>
                <span className="text-xs text-[#14261D]/60 font-sans">
                  average score
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#14261D]/80 font-sans">
                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Quizzes Attempted:</span>
                  <span className="font-mono font-bold text-[#14261D]">
                    {progress.assessment.totalAttempts}
                  </span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Latest Score:</span>
                  <span className="font-mono font-bold text-[#14261D]">
                    {progress.assessment.latestScore !== null
                      ? `${progress.assessment.latestScore}%`
                      : 'None'}
                  </span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Missed Questions:</span>
                  <span
                    className={`font-mono font-bold ${
                      progress.assessment.totalFailedQuestions > 0
                        ? 'text-red-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {progress.assessment.totalFailedQuestions}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 pt-3 border-t border-[#1B3428]/10 text-[10px] text-[#14261D]/50 italic">
              Based on {progress.assessment.totalQuizzes} saved quiz definition(s).
            </p>
          </div>

          {/* Card 3: Spaced Repetition Retention */}
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-3xl p-5 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-[#14261D]/60 tracking-wider">
                  Flashcard Recall
                </span>
                <Layers className="w-4 h-4 text-[#E8722C]" />
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display font-black text-3xl text-[#14261D]">
                  {progress.flashcards.retentionRate}%
                </span>
                <span className="text-xs text-[#14261D]/60 font-sans">
                  retention rate
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#14261D]/80 font-sans">
                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Cards Reviewed:</span>
                  <span className="font-mono font-bold text-[#14261D]">
                    {progress.flashcards.cardsReviewed} of {progress.flashcards.totalCards}
                  </span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Due Today:</span>
                  <span
                    className={`font-mono font-bold ${
                      progress.flashcards.cardsDue > 0 ? 'text-[#E8722C]' : 'text-emerald-700'
                    }`}
                  >
                    {progress.flashcards.cardsDue}
                  </span>
                </div>

                <div className="flex justify-between py-0.5">
                  <span className="text-[#14261D]/60">Needs Practice:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {progress.flashcards.cardsNeedingReview}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 pt-3 border-t border-[#1B3428]/10 text-[10px] text-[#14261D]/50 italic">
              Computed using verified SM-2 spaced repetition schedules.
            </p>
          </div>
        </div>

        {/* Topic Understanding Matrix */}
        <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-7 shadow-[0_6px_0_0_#1B3428]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-black text-lg text-[#14261D]">
                Topic & Section Understanding Matrix
              </h3>
              <p className="text-xs text-[#14261D]/70 mt-0.5">
                Evaluates comprehension across document chapters based on objective assessment and flashcard recall data.
              </p>
            </div>
            <span className="font-mono text-xs text-[#14261D]/60 font-bold hidden sm:inline">
              {progress.topics.length} Document Sections
            </span>
          </div>

          {progress.topics.length === 0 ? (
            <p className="text-xs text-[#14261D]/60 py-6 text-center">
              No sections detected in this document.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-[1.5px] border-[#1B3428]/15 text-[11px] font-mono font-bold text-[#14261D]/60 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Chapter / Topic</th>
                    <th className="py-2.5 px-3">Understanding Status</th>
                    <th className="py-2.5 px-3 text-right">Success Rate</th>
                    <th className="py-2.5 px-3 text-right">Failed Questions</th>
                    <th className="py-2.5 px-3 text-right">Cards Mastered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B3428]/10 text-xs font-sans text-[#14261D]">
                  {progress.topics.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F4F0E5]/50 transition-colors">
                      <td className="py-3 px-3 font-display font-bold text-[#14261D]">
                        {t.title}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {t.successRate}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {t.failedQuestionsCount > 0 ? (
                          <span className="text-red-600 font-bold">{t.failedQuestionsCount}</span>
                        ) : (
                          <span className="text-[#14261D]/40">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {t.flashcardsMastered}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Group Workspace Privacy Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-[#E2EBD8]/60 border border-[#497E64]/30 flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#1B3428] shrink-0 mt-0.5" />
          <div className="text-xs text-[#14261D] leading-relaxed">
            <strong className="font-display font-bold text-[#1B3428] block mb-0.5">
              Individual Learning Privacy
            </strong>
            Even in shared GROUP workspaces, your reading progress, quiz scores, question attempts, and flashcard review schedules remain strictly private to you. Other group members cannot view your personal performance.
          </div>
        </div>
      </div>
    </div>
  );
}
