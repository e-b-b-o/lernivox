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
}

export function WorkspaceQuizzesView({
  workspaceId,
  document,
  onReturnToBook,
  preselectedChapter,
  preselectedPage,
}: WorkspaceQuizzesViewProps) {
  const { accessToken } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummaryDto[]>([]);
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'failed'>('quizzes');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  const fetchQuizzesAndFailed = async () => {
    if (!accessToken || !workspaceId) return;
    setLoading(true);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndFailed();
  }, [workspaceId, accessToken]);

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
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F0E5] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-7 shadow-[0_6px_0_0_#1B3428] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] text-xs font-bold border border-[#497E64]/30">
                Book Assessment Center
              </span>
              <span className="text-xs text-[#14261D]/60 font-sans">
                {document?.title || 'Current Book'}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl text-[#14261D]">
              Quizzes & Assessments
            </h1>
            <p className="font-sans text-xs text-[#14261D]/70 mt-0.5">
              Targeted practice questions grounded exclusively in your selected chapters and page ranges
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#14261D] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#E8722C]" />
            <span>Generate Range Quiz</span>
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-3 border-b border-[#1B3428]/15 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`pb-2 px-3 text-xs font-display font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'quizzes'
                ? 'border-[#E8722C] text-[#E8722C]'
                : 'border-transparent text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            Available Quizzes ({quizzes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            className={`pb-2 px-3 text-xs font-display font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'failed'
                ? 'border-[#E8722C] text-[#E8722C]'
                : 'border-transparent text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            Review Tricky Questions ({failedQuestions.length})
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
                className="px-5 py-2.5 rounded-full bg-[#14261D] text-white font-display font-bold text-xs shadow-xs hover:bg-[#1B3428] transition-all cursor-pointer"
              >
                + Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => {
                const scopeLabel = quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Entire Material';
                return (
                  <div
                    key={quiz.id}
                    className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] p-5 shadow-[0_4px_0_0_#1B3428] flex flex-col justify-between hover:translate-y-[-2px] transition-all"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FAF7F3] border border-[#1B3428]/20 font-mono text-[10px] font-bold text-[#14261D] truncate max-w-[200px]">
                          {scopeLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#14261D]/5 font-display font-bold text-[10px] text-[#14261D]/70 capitalize">
                          {quiz.difficulty.toLowerCase()}
                        </span>
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
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-[#1B3428]/10 mt-4 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#14261D]/40">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>

                      {quiz.status === 'GENERATING' ? (
                        <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </span>
                      ) : quiz.status === 'FAILED' ? (
                        <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                          Failed
                        </span>
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                      Missed {fq.failCount} {fq.failCount === 1 ? 'time' : 'times'}
                    </span>
                    <span className="font-sans text-[11px] text-[#14261D]/50">
                      From "{fq.quizTitle}" {fq.pageNumber ? `(Page ${fq.pageNumber})` : ''}
                    </span>
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
    </div>
  );
}
