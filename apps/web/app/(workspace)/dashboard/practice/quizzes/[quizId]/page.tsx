'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { api } from '../../../../../../lib/api';
import type {
  QuizDetailDto,
  QuizAttemptResultDto,
  SubmitAnswerItemDto,
  QuestionType,
} from '@lernivox/contracts';

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default function QuizTakingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.quizId;
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();

  const [quiz, setQuiz] = useState<QuizDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Taking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionId?: string; submittedAnswer?: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results state
  const [result, setResult] = useState<QuizAttemptResultDto | null>(null);

  // 1. Fetch Quiz details and poll if GENERATING
  useEffect(() => {
    if (!accessToken || !quizId) return;

    let timer: NodeJS.Timeout;
    let isCancelled = false;

    const fetchQuiz = async () => {
      try {
        const data = await api.quizzes.getById(quizId, accessToken);
        if (isCancelled) return;
        setQuiz(data);
        setLoading(false);

        if (data.status === 'GENERATING') {
          timer = setTimeout(fetchQuiz, 2500);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load quiz');
          setLoading(false);
        }
      }
    };

    fetchQuiz();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [quizId, accessToken]);

  const handleStartAttempt = async () => {
    if (!accessToken || !quiz) return;
    setError(null);
    try {
      const resp = await api.quizzes.startAttempt(quiz.id, accessToken);
      setAttemptId(resp.attemptId);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start attempt.');
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOptionId: optionId },
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { submittedAnswer: text },
    }));
  };

  const handleSubmitAttempt = async () => {
    if (!accessToken || !attemptId || !quiz) return;
    setIsSubmitting(true);
    setError(null);

    const payloadAnswers: SubmitAnswerItemDto[] = quiz.questions.map((q) => {
      const userAns = answers[q.id];
      return {
        questionId: q.id,
        selectedOptionId: userAns?.selectedOptionId || null,
        submittedAnswer: userAns?.submittedAnswer || null,
      };
    });

    try {
      const res = await api.quizzes.submitAttempt(
        attemptId,
        { answers: payloadAnswers },
        accessToken,
      );
      setResult(res);
      setAttemptId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
        <p className="font-display font-bold text-sm text-[#14261D]">Loading assessment...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-2xl text-[#14261D]">Quiz Not Found</h1>
        <p className="font-sans text-sm text-[#14261D]/70">{error}</p>
        <Link
          href="/dashboard/practice"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14261D] text-white font-display font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Practice Center</span>
        </Link>
      </div>
    );
  }

  // STATE A: GENERATING IN PROGRESS
  if (quiz?.status === 'GENERATING') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_6px_0_0_#1B3428] flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-[#E8722C] animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#14261D]">
            Crafting Grounded Questions...
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#14261D]/70 max-w-md mx-auto">
            Extracting chapter concepts and generating rigorous assessment questions strictly backed by your source textbook.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#14261D]/50 pt-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
          <span>Analyzing textbook passages</span>
        </div>
      </div>
    );
  }

  // STATE B: FAILED GENERATION
  if (quiz?.status === 'FAILED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-2xl text-[#14261D]">Quiz Generation Failed</h1>
        <p className="font-sans text-xs sm:text-sm text-[#14261D]/70">
          {quiz.errorMessage || 'Unable to generate questions from the selected passages.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard/practice"
            className="px-5 py-2.5 rounded-full border border-[#1B3428]/20 font-display font-bold text-xs text-[#14261D]"
          >
            Practice Center
          </Link>
        </div>
      </div>
    );
  }

  // STATE C: RESULTS & REVIEW
  if (result) {
    const isPassing = result.score >= 70;
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/practice"
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#14261D]/60 hover:text-[#14261D]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Practice Center</span>
          </Link>
          <button
            type="button"
            onClick={handleStartAttempt}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#14261D] text-white font-display font-bold text-xs shadow-xs hover:-translate-y-0.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E8722C]" />
            <span>Retake Quiz</span>
          </button>
        </div>

        {/* Score Hero Banner */}
        <div
          className={`rounded-[28px] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
            isPassing ? 'bg-[#E2EBD8]' : 'bg-[#FDF2D6]'
          }`}
        >
          <div className="space-y-2 text-center md:text-left">
            <span
              className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                isPassing ? 'bg-[#497E64]/20 text-[#497E64]' : 'bg-[#B87B14]/20 text-[#B87B14]'
              }`}
            >
              {isPassing ? 'Assessment Mastered' : 'Needs Reinforcement'}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#14261D]">
              {result.quizTitle}
            </h1>
            <p className="font-sans text-xs text-[#14261D]/75">
              Completed on {new Date(result.completedAt || Date.now()).toLocaleDateString()} • {result.correctAnswers} of {result.totalQuestions} questions answered correctly.
            </p>
          </div>

          <div className="w-28 h-28 rounded-full bg-white border-[2px] border-[#1B3428] shadow-xs flex flex-col items-center justify-center shrink-0">
            <span className="font-display font-black text-3xl text-[#14261D] leading-none">
              {result.score}%
            </span>
            <span className="font-mono text-[10px] text-[#14261D]/60 mt-1 uppercase font-bold">
              Final Score
            </span>
          </div>
        </div>

        {/* Question-by-question review */}
        <div className="space-y-6">
          <h2 className="font-display font-black text-xl text-[#14261D]">
            Educational Review & Textbook Citations
          </h2>

          <div className="space-y-5">
            {result.results.map((q, idx) => (
              <div
                key={q.questionId}
                className={`rounded-2xl border-[1.5px] p-5 sm:p-6 transition-all ${
                  q.isCorrect
                    ? 'bg-white border-[#497E64]/40 shadow-xs'
                    : q.isPartial
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-red-50/40 border-red-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#14261D]/60 uppercase">
                      Question {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#1B3428]/5 font-mono text-[10px] text-[#14261D]/70 uppercase">
                      {q.questionType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 font-display font-bold text-xs px-2.5 py-0.5 rounded-full ${
                      q.isCorrect
                        ? 'bg-[#E2EBD8] text-[#497E64]'
                        : q.isPartial
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {q.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </>
                    ) : q.isPartial ? (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>Partial Credit</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Prompt */}
                <h3 className="font-display font-bold text-base text-[#14261D] mb-4">
                  {q.prompt}
                </h3>

                {/* Options (for MCQ & True/False) */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      const isUserChoice = opt.id === q.selectedOptionId;
                      const isCorrectChoice = opt.isCorrect;

                      let optStyles = 'bg-white border-[#1B3428]/15 text-[#14261D]';
                      if (isCorrectChoice) {
                        optStyles = 'bg-[#E2EBD8] border-[#497E64] font-semibold text-[#14261D]';
                      } else if (isUserChoice && !isCorrectChoice) {
                        optStyles = 'bg-red-50 border-red-400 text-red-800 line-through';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyles}`}
                        >
                          <span>{opt.text}</span>
                          {isCorrectChoice && (
                            <span className="font-mono text-[10px] font-bold text-[#497E64]">
                              ✓ Correct Answer
                            </span>
                          )}
                          {isUserChoice && !isCorrectChoice && (
                            <span className="font-mono text-[10px] font-bold text-red-600">
                              ✗ Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* For Fill in the blank / Short answer */}
                {(!q.options || q.options.length === 0) && (
                  <div className="space-y-2 mb-4 text-xs font-sans">
                    <div className="p-3 rounded-xl bg-white border border-[#1B3428]/15">
                      <span className="font-bold text-[#14261D]/60 block mb-0.5">Your Answer:</span>
                      <span className="text-[#14261D]">
                        {q.submittedAnswer ? `"${q.submittedAnswer}"` : 'No answer provided'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#E2EBD8]/60 border border-[#497E64]/30">
                      <span className="font-bold text-[#497E64] block mb-0.5">Expected Answer:</span>
                      <span className="text-[#14261D] font-medium">{q.expectedAnswer}</span>
                    </div>
                  </div>
                )}

                {/* Feedback / Explanation */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/10 text-xs font-sans text-[#14261D]/80 mb-3">
                    <span className="font-display font-bold text-[#14261D] block mb-1">
                      Textbook Explanation:
                    </span>
                    {q.explanation}
                  </div>
                )}

                {/* Source Excerpt & Citation link */}
                {q.sourceExcerpt && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start justify-between gap-3 text-xs font-sans">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-amber-800 uppercase">
                        <BookOpen className="w-3 h-3" />
                        <span>Source Citation {q.pageNumber ? `(Page ${q.pageNumber})` : ''}</span>
                      </div>
                      <p className="italic text-[#14261D]/80">&quot;{q.sourceExcerpt}&quot;</p>
                    </div>

                    {result.documentId && q.pageNumber && (
                      <Link
                        href={`/dashboard/tutor?documentId=${result.documentId}&page=${q.pageNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 font-display font-bold text-[11px] text-[#14261D] hover:bg-amber-100 transition-all shrink-0"
                        title="View page in Study Space"
                      >
                        <span>View Page</span>
                        <ExternalLink className="w-3 h-3 text-[#E8722C]" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STATE D: TAKING QUIZ (QUESTIONS STEPPER)
  if (attemptId && quiz) {
    const currentQ = quiz.questions[currentIndex];
    const totalQ = quiz.questions.length;
    const progressPercent = Math.round(((currentIndex + 1) / totalQ) * 100);

    const isAnswered =
      Boolean(answers[currentQ?.id || '']?.selectedOptionId) ||
      Boolean(answers[currentQ?.id || '']?.submittedAnswer?.trim());

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1 w-full">
        {/* Top Header & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#14261D]/60 uppercase tracking-wider">
              {quiz.title}
            </span>
            <span className="font-mono text-xs font-bold text-[#E8722C]">
              Question {currentIndex + 1} of {totalQ}
            </span>
          </div>

          {/* Stepper bar */}
          <div className="h-2 w-full bg-[#1B3428]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8722C] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Index Pills */}
          <div className="flex gap-1.5 pt-1 overflow-x-auto pb-1">
            {quiz.questions.map((q, idx) => {
              const answered =
                Boolean(answers[q.id]?.selectedOptionId) ||
                Boolean(answers[q.id]?.submittedAnswer?.trim());
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-[#14261D] text-white shadow-xs'
                      : answered
                      ? 'bg-[#E2EBD8] text-[#497E64] border border-[#497E64]'
                      : 'bg-white border border-[#1B3428]/20 text-[#14261D]/60'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="rounded-[24px] bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-[#1B3428]/5 font-mono text-[10px] font-bold text-[#14261D]/70 uppercase tracking-wider">
                {currentQ.questionType.replace(/_/g, ' ')}
              </span>
              {currentQ.pageNumber && (
                <span className="font-mono text-[11px] text-[#14261D]/50">
                  Ref: Page {currentQ.pageNumber}
                </span>
              )}
            </div>

            <h2 className="font-display font-black text-lg sm:text-xl text-[#14261D] leading-snug">
              {currentQ.prompt}
            </h2>

            {/* Answer Input Controls */}
            {currentQ.questionType === 'MULTIPLE_CHOICE' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full p-4 rounded-xl border-[1.5px] text-left text-xs sm:text-sm font-sans flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                          : 'bg-white text-[#14261D] border-[#1B3428]/20 hover:border-[#1B3428]'
                      }`}
                    >
                      <span>{opt.text}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-white bg-[#E8722C]' : 'border-[#1B3428]/30'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.questionType === 'TRUE_FALSE' && (
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((val) => {
                  const opt = currentQ.options?.find(
                    (o) => o.text.toLowerCase() === val.toLowerCase(),
                  );
                  const isSelected =
                    answers[currentQ.id]?.selectedOptionId === opt?.id ||
                    answers[currentQ.id]?.submittedAnswer?.toLowerCase() === val.toLowerCase();

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        if (opt) handleSelectOption(currentQ.id, opt.id);
                        handleTextAnswer(currentQ.id, val);
                      }}
                      className={`py-4 rounded-xl border-[1.5px] font-display font-bold text-sm transition-all ${
                        isSelected
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                          : 'bg-white text-[#14261D] border-[#1B3428]/20 hover:border-[#1B3428]'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.questionType === 'FILL_IN_THE_BLANK' && (
              <div>
                <label className="block font-sans text-xs text-[#14261D]/70 mb-2">
                  Type the exact missing term:
                </label>
                <input
                  type="text"
                  placeholder="Enter answer..."
                  value={answers[currentQ.id]?.submittedAnswer || ''}
                  onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white border-[1.5px] border-[#1B3428]/30 font-sans text-sm text-[#14261D] focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                />
              </div>
            )}

            {currentQ.questionType === 'SHORT_ANSWER' && (
              <div>
                <label className="block font-sans text-xs text-[#14261D]/70 mb-2">
                  Provide your conceptual explanation:
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain clearly in 1–3 sentences..."
                  value={answers[currentQ.id]?.submittedAnswer || ''}
                  onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-white border-[1.5px] border-[#1B3428]/30 font-sans text-sm text-[#14261D] focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                />
              </div>
            )}

            {/* Stepper Navigation buttons */}
            <div className="pt-4 border-t border-[#1B3428]/15 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-full border border-[#1B3428]/20 font-display font-bold text-xs text-[#14261D] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1B3428]/5 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {currentIndex < totalQ - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-full bg-[#14261D] text-white font-display font-bold text-xs shadow-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitAttempt}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#E8722C] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit for Evaluation</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!quiz) return null;

  // STATE E: READY INTRO SCREEN
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6 flex-1 w-full text-center">
      <div className="w-16 h-16 rounded-3xl bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_6px_0_0_#1B3428] flex items-center justify-center mx-auto text-[#E8722C]">
        <Award className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#E8722C]/10 text-[#E8722C] font-mono text-[10px] font-bold uppercase tracking-wider">
            {quiz.difficulty} Level
          </span>
          {quiz.sourceChapter && (
            <span className="px-3 py-1 rounded-full bg-[#1B3428]/5 text-[#14261D]/70 font-mono text-[10px] uppercase">
              {quiz.sourceChapter}
            </span>
          )}
        </div>

        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#14261D]">
          {quiz.title}
        </h1>
        {quiz.documentTitle && (
          <p className="font-sans text-xs sm:text-sm text-[#14261D]/70">
            Source Document: <span className="font-semibold">{quiz.documentTitle}</span>
          </p>
        )}
      </div>

      {/* Summary Specs */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
        <div className="p-4 rounded-2xl bg-white border border-[#1B3428]/15 text-center">
          <span className="font-display font-black text-2xl text-[#14261D] block">
            {quiz.questions.length}
          </span>
          <span className="font-mono text-[10px] text-[#14261D]/60 uppercase font-bold">
            Questions
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#1B3428]/15 text-center">
          <span className="font-display font-black text-2xl text-[#497E64] block">Instant</span>
          <span className="font-mono text-[10px] text-[#14261D]/60 uppercase font-bold">
            Citation Grading
          </span>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dashboard/practice"
          className="w-full sm:w-auto px-5 py-3 rounded-full border border-[#1B3428]/20 font-display font-bold text-xs text-[#14261D] hover:bg-[#1B3428]/5 transition-all"
        >
          Back to Practice Center
        </Link>
        <button
          type="button"
          onClick={handleStartAttempt}
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#14261D] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-sm shadow-[0_4px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#E8722C]" />
          <span>Start Assessment</span>
        </button>
      </div>
    </div>
  );
}
