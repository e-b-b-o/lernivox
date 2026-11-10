'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Pause,
  RotateCw,
  Plus,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type {
  LearningPlanDto,
  StudySessionDto,
  PlanActivityDto,
  DocumentDto,
} from '@lernivox/contracts';
import { GenerateLearningPlanModal } from './GenerateLearningPlanModal';

interface WorkspaceLearningPlanViewProps {
  workspaceId: string;
  document: DocumentDto | null;
  onNavigateToPage?: (page: number) => void;
  onSwitchTab?: (tab: 'read' | 'quizzes' | 'flashcards' | 'progress') => void;
  onOpenTutor?: () => void;
}

export function WorkspaceLearningPlanView({
  workspaceId,
  document: doc,
  onNavigateToPage,
  onSwitchTab,
  onOpenTutor,
}: WorkspaceLearningPlanViewProps) {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<LearningPlanDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);

  const fetchPlan = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const active = await api.learningPlans.getActivePlan(workspaceId, accessToken);
      setPlan(active);
      if (active) {
        // Expand the current pending session by default
        const current = active.sessions.find((s) => s.status !== 'COMPLETED');
        if (current) {
          setExpandedSessionIds({ [current.id]: true });
        }
      }
    } catch (err) {
      console.error('Failed to load study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [workspaceId, accessToken]);

  const toggleSessionExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleActivity = async (sessionId: string, activityId: string, currentCompleted: boolean) => {
    if (!accessToken || !plan) return;
    setUpdatingActivityId(activityId);

    try {
      const updated = await api.learningPlans.updateSession(
        workspaceId,
        sessionId,
        {
          activityId,
          activityCompleted: !currentCompleted,
        },
        accessToken,
      );
      setPlan(updated);
    } catch (err) {
      console.error('Failed to toggle activity:', err);
    } finally {
      setUpdatingActivityId(null);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!accessToken || !plan) return;
    try {
      const updated = await api.learningPlans.updateSession(
        workspaceId,
        sessionId,
        { status: 'COMPLETED' },
        accessToken,
      );
      setPlan(updated);
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleAdaptPlan = async () => {
    if (!accessToken || !plan) return;
    setIsAdapting(true);
    setAdaptationMessage(null);

    try {
      const adapted = await api.learningPlans.adaptPlan(
        workspaceId,
        { trigger: 'MANUAL' },
        accessToken,
      );
      setPlan(adapted);
      const latestHistory = adapted.adaptationHistory?.[adapted.adaptationHistory.length - 1];
      if (latestHistory && latestHistory.modifications.length > 0) {
        setAdaptationMessage(`Plan adapted: ${latestHistory.modifications.join(' • ')}`);
      } else {
        setAdaptationMessage('Your study plan is already well-aligned with your recent quiz scores and flashcard retention.');
      }
    } catch (err: any) {
      setAdaptationMessage(err.message || 'Failed to adapt plan.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handleTogglePause = async () => {
    if (!accessToken || !plan) return;
    const nextStatus = plan.lifecycleStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = await api.learningPlans.updateLifecycle(
        workspaceId,
        { status: nextStatus },
        accessToken,
      );
      setPlan(updated);
    } catch (err) {
      console.error('Failed to update lifecycle status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#FAF8F4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mb-3" />
        <p className="font-display font-bold text-sm text-[#14261D]">Loading your learning plan...</p>
      </div>
    );
  }

  // EMPTY STATE: No study plan yet
  if (!plan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-[#FAF8F4]">
        <div className="w-16 h-16 rounded-2xl bg-[#E8722C]/10 border border-[#E8722C]/20 flex items-center justify-center text-[#E8722C] mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="font-display font-bold text-lg sm:text-xl text-[#14261D]">
          No Active Study Plan
        </h3>
        <p className="text-xs sm:text-sm text-[#14261D]/70 font-sans max-w-md mt-1.5 leading-relaxed">
          Transform this textbook into a personalized, adaptive learning schedule with structured reading, AI tutoring sessions, quizzes, and flashcard drills.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-full bg-[#14261D] text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 hover:bg-[#1B3428] transition-all shadow-[0_4px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#E8722C]" />
            <span>Create Adaptive Study Plan</span>
            <ArrowRight className="w-4 h-4 text-[#E8722C]" />
          </button>
        </div>

        <GenerateLearningPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workspaceId={workspaceId}
          document={doc}
          onPlanCreated={(newPlan) => setPlan(newPlan)}
        />
      </div>
    );
  }

  const nextSession = plan.sessions.find((s) => s.status !== 'COMPLETED');

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF8F4] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header with Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F4F0E5] border border-[#EAE4D3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14261D] text-white uppercase font-bold tracking-wider">
              {plan.lifecycleStatus}
            </span>
            {plan.goal && (
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-white border border-[#1B3428]/15 text-[#14261D] font-medium">
                Goal: {plan.goal}
              </span>
            )}
            <span className="text-xs font-sans text-[#14261D]/60">
              {plan.preferences.daysPerWeek} days/wk • {plan.preferences.minutesPerSession} min/session
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#14261D]">
            {plan.title}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleAdaptPlan}
            disabled={isAdapting}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#1B3428]/20 text-[#14261D] text-xs font-display font-bold flex items-center gap-1.5 hover:border-[#E8722C] hover:bg-[#FBE8DC] transition-all cursor-pointer disabled:opacity-50"
            title="Recalibrate upcoming sessions based on quiz accuracy and flashcard retention"
          >
            {isAdapting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8722C]" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-[#E8722C]" />
            )}
            <span>Adapt Plan</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePause}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#1B3428]/20 text-[#14261D] text-xs font-display font-bold flex items-center gap-1.5 hover:border-[#E8722C] hover:bg-[#FBE8DC] transition-all cursor-pointer"
          >
            {plan.lifecycleStatus === 'ACTIVE' ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#14261D] text-white text-xs font-display font-bold flex items-center gap-1.5 hover:bg-[#1B3428] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#E8722C]" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Adaptation Message Banner */}
      {adaptationMessage && (
        <div className="p-3.5 rounded-xl bg-[#E2EBD8] border border-[#497E64]/30 text-[#14261D] text-xs font-sans flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#497E64] shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{adaptationMessage}</div>
        </div>
      )}

      {/* 2. Progress Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#1B3428]/10 shadow-xs">
          <div className="text-[11px] font-sans text-[#14261D]/60 font-medium">Curriculum Progress</div>
          <div className="text-xl font-display font-bold text-[#14261D] mt-1">
            {plan.progress.completedSessions} of {plan.progress.totalSessions} Sessions
          </div>
          <div className="w-full bg-[#14261D]/10 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#E8722C] h-full rounded-full transition-all duration-500"
              style={{ width: `${plan.progress.percentComplete}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-[#14261D]/50 text-right mt-1">
            {plan.progress.percentComplete}% Complete
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#1B3428]/10 shadow-xs">
          <div className="text-[11px] font-sans text-[#14261D]/60 font-medium">Time Investment</div>
          <div className="text-xl font-display font-bold text-[#14261D] mt-1">
            ~{Math.round(plan.progress.estimatedMinutesRemaining / 60 * 10) / 10} hrs
          </div>
          <p className="text-[11px] font-sans text-[#14261D]/60 mt-1">
            Estimated remaining study time
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#1B3428]/10 shadow-xs">
          <div className="text-[11px] font-sans text-[#14261D]/60 font-medium">Schedule Cadence</div>
          <div className="text-xl font-display font-bold text-[#14261D] mt-1">
            ~{plan.estimatedDurationWeeks || 1} {plan.estimatedDurationWeeks === 1 ? 'Week' : 'Weeks'}
          </div>
          <p className="text-[11px] font-sans text-[#14261D]/60 mt-1">
            At {plan.preferences.daysPerWeek} sessions per week
          </p>
        </div>
      </div>

      {/* 3. Next Session Spotlight Card */}
      {nextSession && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#E8722C]/40 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#E8722C]/10 border border-[#E8722C]/20 flex items-center justify-center text-[#E8722C] font-mono font-bold text-sm">
                {nextSession.sessionNumber}
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8722C] font-bold">
                  Active Focus Session
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D]">
                  {nextSession.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-[#14261D]/70 bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-[#1B3428]/10">
                {nextSession.estimatedMinutes} min
              </span>
              <button
                type="button"
                onClick={() => handleCompleteSession(nextSession.id)}
                className="px-3 py-1.5 rounded-lg bg-[#E2EBD8] text-[#14261D] border border-[#497E64]/30 text-xs font-display font-bold flex items-center gap-1.5 hover:bg-[#497E64] hover:text-white transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Session Finished</span>
              </button>
            </div>
          </div>

          {nextSession.description && (
            <p className="text-xs font-sans text-[#14261D]/70 leading-relaxed">
              {nextSession.description}
            </p>
          )}

          {/* Activities Checklist */}
          <div className="space-y-2 pt-2 border-t border-[#1B3428]/10">
            <h4 className="text-xs font-display font-bold text-[#14261D]">
              Session Activities Checklist
            </h4>
            <div className="space-y-2">
              {nextSession.activities.map((act) => {
                const isUpdating = updatingActivityId === act.id;
                return (
                  <div
                    key={act.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      act.completed
                        ? 'bg-[#E2EBD8]/30 border-[#497E64]/30 opacity-80'
                        : 'bg-[#FAF8F4] border-[#1B3428]/15 hover:border-[#1B3428]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActivity(nextSession.id, act.id, act.completed)}
                        disabled={isUpdating}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          act.completed
                            ? 'bg-[#497E64] border-[#497E64] text-white'
                            : 'bg-white border-[#1B3428]/30 hover:border-[#E8722C]'
                        }`}
                        aria-label={`Toggle ${act.title}`}
                      >
                        {act.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {act.type === 'READ' && <BookOpen className="w-3.5 h-3.5 text-[#497E64] shrink-0" />}
                          {act.type === 'EXPLAIN' && <Sparkles className="w-3.5 h-3.5 text-[#E8722C] shrink-0" />}
                          {act.type === 'QUIZ' && <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          {act.type === 'FLASHCARDS' && <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          <span
                            className={`font-display font-bold text-xs truncate ${
                              act.completed ? 'line-through text-[#14261D]/50' : 'text-[#14261D]'
                            }`}
                          >
                            {act.title}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-[11px] text-[#14261D]/60 font-sans mt-0.5 line-clamp-1">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Direct Deep Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className="text-[10px] font-mono text-[#14261D]/60">
                        {act.estimatedMinutes}m
                      </span>

                      {act.type === 'READ' && act.pageStart && onNavigateToPage && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToPage(act.pageStart!);
                            onSwitchTab?.('read');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#1B3428]/20 text-[11px] font-display font-bold text-[#14261D] flex items-center gap-1 hover:bg-[#FBE8DC] transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3 text-[#497E64]" />
                          <span>Go to Page {act.pageStart}</span>
                        </button>
                      )}

                      {act.type === 'EXPLAIN' && onOpenTutor && (
                        <button
                          type="button"
                          onClick={onOpenTutor}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#1B3428]/20 text-[11px] font-display font-bold text-[#14261D] flex items-center gap-1 hover:bg-[#FBE8DC] transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#E8722C]" />
                          <span>Ask Tutor</span>
                        </button>
                      )}

                      {act.type === 'QUIZ' && onSwitchTab && (
                        <button
                          type="button"
                          onClick={() => onSwitchTab('quizzes')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#1B3428]/20 text-[11px] font-display font-bold text-[#14261D] flex items-center gap-1 hover:bg-[#FBE8DC] transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3 text-blue-600" />
                          <span>Assess</span>
                        </button>
                      )}

                      {act.type === 'FLASHCARDS' && onSwitchTab && (
                        <button
                          type="button"
                          onClick={() => onSwitchTab('flashcards')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#1B3428]/20 text-[11px] font-display font-bold text-[#14261D] flex items-center gap-1 hover:bg-[#FBE8DC] transition-colors cursor-pointer"
                        >
                          <Layers className="w-3 h-3 text-purple-600" />
                          <span>Cards</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Curriculum Stepper */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-[#14261D] flex items-center justify-between">
          <span>Complete Study Schedule</span>
          <span className="text-xs font-sans text-[#14261D]/60 font-normal">
            {plan.sessions.length} structured sessions
          </span>
        </h3>

        <div className="space-y-2.5">
          {plan.sessions.map((sess) => {
            const isExpanded = !!expandedSessionIds[sess.id];
            const isCompleted = sess.status === 'COMPLETED';
            const isCurrent = sess.id === nextSession?.id;

            return (
              <div
                key={sess.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCurrent
                    ? 'border-[#E8722C] bg-white shadow-xs'
                    : isCompleted
                    ? 'border-[#497E64]/30 bg-[#E2EBD8]/20'
                    : 'border-[#1B3428]/15 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSessionExpand(sess.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-[#FAF8F4]/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-[#497E64] text-white'
                          : isCurrent
                          ? 'bg-[#E8722C] text-white'
                          : 'bg-[#14261D]/10 text-[#14261D]'
                      }`}
                    >
                      {isCompleted ? '✓' : sess.sessionNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-display font-bold text-sm truncate ${
                            isCompleted ? 'line-through text-[#14261D]/60' : 'text-[#14261D]'
                          }`}
                        >
                          {sess.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-[#E8722C]/10 text-[#E8722C] font-bold">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#14261D]/60 font-sans truncate">
                        {sess.sourceChapter} {sess.sourcePageStart ? `(pp. ${sess.sourcePageStart}–${sess.sourcePageEnd})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-[#14261D]/60">
                      {sess.estimatedMinutes}m
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#14261D]/50" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#14261D]/50" />
                    )}
                  </div>
                </button>

                {/* Expanded Session Activities */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-[#1B3428]/10 bg-[#FAF8F4]/40 space-y-2">
                    <div className="space-y-1.5 pt-2">
                      {sess.activities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#1B3428]/10 text-xs font-sans"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleActivity(sess.id, act.id, act.completed)}
                              className={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer ${
                                act.completed
                                  ? 'bg-[#497E64] border-[#497E64] text-white'
                                  : 'bg-white border-[#1B3428]/30'
                              }`}
                            >
                              {act.completed && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                            <span className={act.completed ? 'line-through text-[#14261D]/50' : 'text-[#14261D]'}>
                              {act.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#14261D]/50 shrink-0 ml-2">
                            {act.estimatedMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <GenerateLearningPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        document={doc}
        onPlanCreated={(newPlan) => setPlan(newPlan)}
      />
    </div>
  );
}

