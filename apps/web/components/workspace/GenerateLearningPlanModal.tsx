'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  DocumentDto,
  QuizRangeScopeDto,
  LearningPlanPreviewDto,
  LearningPlanDto,
} from '@lernivox/contracts';
import { BookRangeSelector } from './BookRangeSelector';

interface GenerateLearningPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  document: DocumentDto | null;
  onPlanCreated: (plan: LearningPlanDto) => void;
}

export function GenerateLearningPlanModal({
  isOpen,
  onClose,
  workspaceId,
  document: doc,
  onPlanCreated,
}: GenerateLearningPlanModalProps) {
  const { accessToken } = useAuth();

  // Wizard step: 'CONFIG' | 'PREVIEW'
  const [step, setStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');

  // Form parameters
  const [goal, setGoal] = useState('Comprehensive Material Mastery');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [minutesPerSession, setMinutesPerSession] = useState(30);
  const [targetExamDate, setTargetExamDate] = useState('');
  const [rangeScope, setRangeScope] = useState<QuizRangeScopeDto>({
    scopeType: 'ENTIRE_DOCUMENT',
    summaryLabel: 'Entire Material',
  });
  const [isRangeValid, setIsRangeValid] = useState(true);

  // Preview state
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<LearningPlanPreviewDto | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(1);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep('CONFIG');
      setErrorMessage(null);
      setPreviewData(null);
    }
  }, [isOpen]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Handle Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoadingPreview(true);
    setErrorMessage(null);

    try {
      const preview = await api.learningPlans.generatePreview(
        workspaceId,
        {
          goal,
          daysPerWeek,
          minutesPerSession,
          targetExamDate: targetExamDate ? new Date(targetExamDate).toISOString() : undefined,
          rangeScope: rangeScope.scopeType !== 'ENTIRE_DOCUMENT' ? rangeScope : undefined,
        },
        accessToken,
      );

      setPreviewData(preview);
      setStep('PREVIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate study plan preview. Please check your settings.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!accessToken || !previewData) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const plan = await api.learningPlans.createPlan(
        workspaceId,
        {
          title: previewData.title,
          goal: previewData.goal,
          preferences: previewData.preferences,
          sessions: previewData.sessions,
          targetExamDate: targetExamDate ? new Date(targetExamDate).toISOString() : undefined,
        },
        accessToken,
      );

      onPlanCreated(plan);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to activate study plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#14261D]/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#FAF8F4] border border-[#1B3428]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1B3428]/10 bg-[#F4F0E5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8722C]/10 border border-[#E8722C]/20 flex items-center justify-center text-[#E8722C] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 id="plan-modal-title" className="font-display font-bold text-base text-[#14261D]">
                {step === 'CONFIG' ? 'Create Adaptive Study Plan' : 'Review Study Plan'}
              </h3>
              <p className="text-xs text-[#14261D]/70 font-sans">
                {step === 'CONFIG'
                  ? 'Set your learning pace and goals to generate a grounded schedule.'
                  : 'Review the grounded sessions and activities before activating.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] hover:text-[#14261D] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {step === 'CONFIG' ? (
            <form id="plan-config-form" onSubmit={handleGeneratePreview} className="space-y-4">
              {/* Goal Input */}
              <div className="space-y-1.5">
                <label htmlFor="plan-goal-input" className="block text-xs font-display font-bold text-[#14261D]">
                  Primary Goal or Focus
                </label>
                <input
                  id="plan-goal-input"
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Master Midterm Material, Exam Readiness, Full Book Study"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B3428]/20 bg-white text-xs font-sans text-[#14261D] focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                />
              </div>

              {/* Schedule Cadence: Days Per Week */}
              <div className="space-y-1.5">
                <label className="block text-xs font-display font-bold text-[#14261D] flex items-center justify-between">
                  <span>Pacing: Days Per Week</span>
                  <span className="font-mono text-[11px] text-[#E8722C] font-bold">{daysPerWeek} days/week</span>
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-2 rounded-lg border text-xs font-display font-bold transition-all cursor-pointer ${
                        daysPerWeek === num
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                          : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#E8722C]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration: Minutes per session */}
              <div className="space-y-1.5">
                <label className="block text-xs font-display font-bold text-[#14261D] flex items-center justify-between">
                  <span>Session Length</span>
                  <span className="font-mono text-[11px] text-[#E8722C] font-bold">{minutesPerSession} minutes</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMinutesPerSession(mins)}
                      className={`py-2 px-2 rounded-lg border text-xs font-display font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        minutesPerSession === mins
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                          : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#E8722C]'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-[#E8722C]" />
                      <span>{mins}m</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Target Exam Date */}
              <div className="space-y-1.5">
                <label htmlFor="plan-exam-date" className="block text-xs font-display font-bold text-[#14261D] flex items-center justify-between">
                  <span>Target Exam / Deadline Date (Optional)</span>
                  <span className="text-[10px] text-[#14261D]/50 font-normal">Helps pace session dates</span>
                </label>
                <input
                  id="plan-exam-date"
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#1B3428]/20 bg-white text-xs font-sans text-[#14261D] focus:outline-hidden focus:border-[#E8722C]"
                />
              </div>

              {/* Book Range Scope Selector */}
              {doc && (
                <div className="pt-2 border-t border-[#1B3428]/10">
                  <BookRangeSelector
                    documentId={doc.id}
                    documentTitle={doc.title}
                    pageCount={doc.pageCount}
                    onChange={(scope, valid) => {
                      setRangeScope(scope);
                      setIsRangeValid(valid);
                    }}
                  />
                </div>
              )}
            </form>
          ) : (
            /* PREVIEW STEP */
            previewData && (
              <div className="space-y-4">
                {/* Overview Card */}
                <div className="p-4 rounded-xl bg-[#F4F0E5] border border-[#EAE4D3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14261D] text-white uppercase tracking-wider">
                      Grounding Summary
                    </span>
                    <span className="text-xs font-mono font-bold text-[#E8722C]">
                      ~{previewData.estimatedDurationWeeks} {previewData.estimatedDurationWeeks === 1 ? 'week' : 'weeks'}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#14261D]">{previewData.title}</h4>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#14261D]/10 text-center">
                    <div>
                      <div className="text-xs font-bold text-[#14261D]">{previewData.totalSessions}</div>
                      <div className="text-[10px] text-[#14261D]/60 font-sans">Sessions</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#14261D]">{previewData.preferences.minutesPerSession}m</div>
                      <div className="text-[10px] text-[#14261D]/60 font-sans">Per Session</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#14261D]">
                        {previewData.sourceGroundingSummary.pageCount}
                      </div>
                      <div className="text-[10px] text-[#14261D]/60 font-sans">Pages Grounded</div>
                    </div>
                  </div>
                </div>

                {/* Grounded Sessions Stepper */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-display font-bold text-[#14261D] flex items-center justify-between">
                    <span>Curriculum Outline ({previewData.sessions.length} sessions)</span>
                    <span className="text-[10px] font-sans text-[#14261D]/60">Click session to view activities</span>
                  </h5>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {previewData.sessions.map((sess) => {
                      const isExpanded = expandedSession === sess.sessionNumber;
                      return (
                        <div
                          key={sess.sessionNumber}
                          className="rounded-xl border border-[#1B3428]/15 bg-white overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedSession(isExpanded ? null : sess.sessionNumber)}
                            className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-[#14261D]/10 text-[#14261D] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                {sess.sessionNumber}
                              </span>
                              <div className="min-w-0">
                                <h6 className="font-display font-bold text-xs text-[#14261D] truncate">
                                  {sess.title}
                                </h6>
                                <p className="text-[11px] text-[#14261D]/60 font-sans truncate">
                                  {sess.sourceChapter} {sess.sourcePageStart ? `(pp. ${sess.sourcePageStart}–${sess.sourcePageEnd})` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-[#14261D]/70 bg-[#FAF8F4] px-2 py-0.5 rounded-md border border-[#1B3428]/10">
                                {sess.estimatedMinutes}m
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#14261D]/50" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[#14261D]/50" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Activities List */}
                          {isExpanded && (
                            <div className="p-3 pt-0 border-t border-[#1B3428]/10 bg-[#FAF8F4]/50 space-y-1.5">
                              {sess.activities.map((act) => (
                                <div
                                  key={act.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#1B3428]/10 text-xs font-sans"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {act.type === 'READ' && <BookOpen className="w-3.5 h-3.5 text-[#497E64] shrink-0" />}
                                    {act.type === 'EXPLAIN' && <Sparkles className="w-3.5 h-3.5 text-[#E8722C] shrink-0" />}
                                    {act.type === 'QUIZ' && <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                    {act.type === 'FLASHCARDS' && <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                                    <span className="truncate text-[#14261D] font-medium">{act.title}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-[#14261D]/60 shrink-0 ml-2">
                                    {act.estimatedMinutes}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#1B3428]/10 bg-[#F4F0E5] flex items-center justify-between gap-3 shrink-0">
          {step === 'CONFIG' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full border border-[#1B3428]/20 bg-white text-xs font-display font-bold text-[#14261D] hover:bg-[#FBE8DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-config-form"
                disabled={loadingPreview || !isRangeValid}
                className="px-5 py-2.5 rounded-full bg-[#14261D] text-white text-xs font-display font-bold flex items-center gap-2 hover:bg-[#1B3428] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                    <span>Analyzing Chapters...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E8722C]" />
                    <span>Preview Plan</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E8722C]" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('CONFIG')}
                className="px-4 py-2.5 rounded-full border border-[#1B3428]/20 bg-white text-xs font-display font-bold text-[#14261D] flex items-center gap-1.5 hover:bg-[#FBE8DC] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Pacing</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptPlan}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full bg-[#14261D] text-white text-xs font-display font-bold flex items-center gap-2 hover:bg-[#1B3428] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                    <span>Activating Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Accept & Start Plan</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
