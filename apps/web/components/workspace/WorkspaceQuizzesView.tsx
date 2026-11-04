'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  QuizSummaryDto,
  FailedQuestionDto,
  DocumentDto,
} from '@lernivox/contracts';
import { GenerateQuizModal } from './GenerateQuizModal';
import { WorkspaceQuizRunner } from './WorkspaceQuizRunner';

interface WorkspaceQuizzesViewProps {
  workspaceId: string;
  document: DocumentDto | null;
  onReturnToBook: () => void;
  preselectedChapter?: string;
  preselectedPage?: number;
  onCitationClick?: (pageNumber: number) => void;
  isCompactSidecar?: boolean;
}

export function WorkspaceQuizzesView({
  workspaceId,
  document,
  onReturnToBook,
  preselectedChapter,
  preselectedPage,
  onCitationClick,
  isCompactSidecar = false,
}: WorkspaceQuizzesViewProps) {
  const { accessToken } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummaryDto[]>([]);
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'failed'>('quizzes');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  const [retryingQuizId, setRetryingQuizId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<QuizSummaryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchQuizzesAndFailed = async (showLoading = true) => {
    if (!accessToken || !workspaceId) return;
    if (showLoading) setLoading(true);

    try {
      const [qz, fq] = await Promise.all([
        api.quizzes.listByWorkspace(workspaceId, accessToken),
        api.quizzes.getFailedQuestions(workspaceId, accessToken),
      ]);
      setQuizzes(qz);
      setFailedQuestions(fq);
    } catch (err) {
      console.error('Failed to load workspace quizzes:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndFailed(true);
  }, [workspaceId, accessToken]);

  // Active polling: automatically poll every 2.5s while any quiz is in GENERATING status
  useEffect(() => {
    const hasGenerating = quizzes.some((q) => q.status === 'GENERATING');
    if (!hasGenerating || !accessToken || !workspaceId) return;

    const interval = setInterval(() => {
      fetchQuizzesAndFailed(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [quizzes, workspaceId, accessToken]);

  const handleRetry = async (quizId: string) => {
    if (!accessToken) return;
    setRetryingQuizId(quizId);
    setRetryError(null);
    try {
      await api.quizzes.retry(quizId, accessToken);
      await fetchQuizzesAndFailed(false);
    } catch (err: any) {
      setRetryError(err.message || 'Failed to retry quiz generation.');
    } finally {
      setRetryingQuizId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quizToDelete || !accessToken) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.quizzes.delete(quizToDelete.id, accessToken, workspaceId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      setQuizToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete quiz. You may not have permission.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If active quiz is running, render dedicated runner
  if (activeQuizId) {
    return (
      <WorkspaceQuizRunner
        quizId={activeQuizId}
        onBackToQuizzes={() => {
          setActiveQuizId(null);
          fetchQuizzesAndFailed();
        }}
        onReturnToBook={onReturnToBook}
        onCitationClick={onCitationClick}
        isCompactSidecar={isCompactSidecar}
      />
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto bg-[#F4F0E5] ${isCompactSidecar ? 'p-3 sm:p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
      <div className={`mx-auto space-y-4 ${isCompactSidecar ? 'w-full' : 'max-w-5xl space-y-6'}`}>
        {/* Header Banner */}
        <div className={`bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_4px_0_0_#1B3428] flex flex-col ${isCompactSidecar ? 'p-4 gap-3' : 'sm:flex-row items-start sm:items-center justify-between p-6 sm:p-7 gap-4'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] text-[10px] font-bold border border-[#497E64]/30">
                Book Assessment Center
              </span>
            </div>
            <h1 className={`font-display font-black text-[#14261D] ${isCompactSidecar ? 'text-lg' : 'text-2xl'}`}>
              Quizzes & Assessments
            </h1>
            <p className="font-sans text-[11px] text-[#14261D]/70 mt-0.5 leading-snug">
              Targeted practice questions grounded exclusively in your selected chapters and page ranges
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Generate Range Quiz</span>
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1B3428]/15 pb-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`pb-1.5 px-2.5 text-xs font-display font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'border-[#E8722C] text-[#E8722C]'
                : 'border-transparent text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            Available ({quizzes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            className={`pb-1.5 px-2.5 text-xs font-display font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'failed'
                ? 'border-[#E8722C] text-[#E8722C]'
                : 'border-transparent text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            Review Tricky ({failedQuestions.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#14261D]/60">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8722C] mb-2" />
            <p className="font-sans text-xs">Loading assessments...</p>
          </div>
        ) : activeTab === 'quizzes' ? (
          /* QUIZZES LIST */
          quizzes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_4px_0_0_#1B3428]">
              <HelpCircle className="w-10 h-10 text-[#E8722C] mx-auto mb-3" />
              <h3 className="font-display font-bold text-base text-[#14261D] mb-1">
                No Quizzes Generated Yet
              </h3>
              <p className="font-sans text-xs text-[#14261D]/70 max-w-md mx-auto mb-5">
                Generate an assessment covering the whole book or select an exact chapter range to test your active retention.
              </p>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#B26E45] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Generate Range Quiz</span>
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 ${isCompactSidecar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              {retryError && (
                <div className="col-span-full p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{retryError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRetryError(null)}
                    className="text-xs font-bold text-red-800 hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {quizzes.map((quiz) => {
                const scopeLabel = quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Entire Material';
                return (
                  <div
                    key={quiz.id}
                    className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] p-5 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between hover:translate-y-[-2px] transition-all relative group"
                  >
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FAF7F3] border border-[#1B3428]/20 font-mono text-[10px] font-bold text-[#14261D] truncate max-w-[190px]">
                          {scopeLabel}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#14261D]/5 font-display font-bold text-[10px] text-[#14261D]/70 capitalize">
                            {quiz.difficulty.toLowerCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setQuizToDelete(quiz);
                            }}
                            className="p-1 rounded-md text-[#14261D]/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete quiz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold text-base text-[#14261D] mb-1 leading-snug">
                        {quiz.title}
                      </h3>

                      {/* Metadata row */}
                      <div className="flex items-center gap-3 text-xs text-[#14261D]/60 font-sans mt-2">
                        <span>{quiz.questionCount} Questions</span>
                        <span>•</span>
                        <span>{quiz.attemptsCount} Attempts</span>
                        {quiz.bestScore !== null && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-[#497E64]">Best: {quiz.bestScore}%</span>
                          </>
                        )}
                      </div>

                      {quiz.status === 'FAILED' && quiz.errorMessage && (
                        <div className="mt-2.5 p-2 rounded-lg bg-red-50/70 border border-red-200/60 text-[11px] text-red-700 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{quiz.errorMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-[#1B3428]/10 mt-4 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#14261D]/40">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>

                      {quiz.status === 'GENERATING' ? (
                        <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </span>
                      ) : quiz.status === 'FAILED' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-[11px] font-bold">
                            Failed
                          </span>
                          <button
                            type="button"
                            disabled={retryingQuizId === quiz.id}
                            onClick={() => handleRetry(quiz.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/30 text-[#14261D] font-display font-bold text-xs hover:bg-[#F4F0E5] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {retryingQuizId === quiz.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8722C]" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5 text-[#E8722C]" />
                            )}
                            <span>Retry</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveQuizId(quiz.id)}
                          className="px-4 py-2 rounded-xl bg-[#14261D] text-white font-display font-bold text-xs shadow-xs hover:bg-[#1B3428] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{quiz.attemptsCount > 0 ? 'Retake Quiz' : 'Take Quiz'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* FAILED QUESTIONS TAB */
          failedQuestions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_4px_0_0_#1B3428]">
              <CheckCircle2 className="w-10 h-10 text-[#497E64] mx-auto mb-3" />
              <h3 className="font-display font-bold text-base text-[#14261D] mb-1">
                Zero Missed Questions!
              </h3>
              <p className="font-sans text-xs text-[#14261D]/70 max-w-md mx-auto">
                Any questions you struggle with on quiz attempts will automatically appear here for focused reinforcement.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {failedQuestions.map((fq) => (
                <div
                  key={fq.questionId}
                  className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[20px] p-4 sm:p-5 shadow-[0_3px_0_0_#1B3428] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                      Missed {fq.failCount} {fq.failCount === 1 ? 'time' : 'times'}
                    </span>
                    <div className="font-sans text-[11px] text-[#14261D]/50 flex items-center gap-1">
                      <span className="truncate max-w-[140px]">From "{fq.quizTitle}"</span>
                      {fq.pageNumber && (
                        <button
                          type="button"
                          onClick={() => onCitationClick?.(fq.pageNumber!)}
                          className="text-[#E8722C] font-mono hover:underline font-bold cursor-pointer shrink-0"
                          title={`Jump to page ${fq.pageNumber} in reader`}
                        >
                          (Page {fq.pageNumber})
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-display font-bold text-sm text-[#14261D]">
                    {fq.prompt}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-[#1B3428]/15">
                      <span className="font-mono text-[10px] text-red-600 block font-bold mb-0.5">
                        Your submitted answer:
                      </span>
                      <p className="text-[#14261D]/80">{fq.submittedAnswer || '<Blank>'}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#E2EBD8]/50 border border-[#497E64]/30">
                      <span className="font-mono text-[10px] text-[#497E64] block font-bold mb-0.5">
                        Expected answer:
                      </span>
                      <p className="text-[#1B3428] font-medium">{fq.expectedAnswer}</p>
                    </div>
                  </div>

                  {fq.explanation && (
                    <p className="text-xs text-[#14261D]/75 font-sans pt-1">
                      <strong className="text-[#14261D]">Explanation:</strong> {fq.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Generate Quiz Modal */}
      {isGenerateModalOpen && document && (
        <GenerateQuizModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          workspaceId={workspaceId}
          preselectedDocumentId={document.id}
          preselectedChapter={preselectedChapter}
          preselectedPage={preselectedPage}
          documents={[document]}
          onQuizCreated={(quiz) => {
            fetchQuizzesAndFailed();
            setActiveQuizId(quiz.id);
          }}
        />
      )}

      {/* Delete Quiz Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 bg-[#14261D]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] max-w-md w-full p-6 shadow-[0_8px_0_0_#1B3428] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#14261D]">
                  Delete Quiz Definition
                </h3>
                <p className="font-sans text-xs text-[#14261D]/60">
                  Confirm quiz archiving
                </p>
              </div>
            </div>

            <p className="font-sans text-xs text-[#14261D]/80 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#14261D]">"{quizToDelete.title}"</strong>?
            </p>

            {/* Assessment Preservation Notice */}
            <div className="bg-[#E2EBD8]/60 border border-[#497E64]/30 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#497E64] shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] text-[#14261D]/80 leading-snug">
                <strong>Historical Records Kept:</strong> Any previous attempts, scores, and review analytics for this quiz will remain saved in your progress records. The quiz will be archived and will no longer accept new attempts.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1B3428]/10">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2 rounded-full border border-[#1B3428]/20 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:bg-[#F4F0E5] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 border-[1.5px] border-[#1B3428] text-white font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
