'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
  Quote,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  QuizDetailDto,
  QuizAttemptResultDto,
  QuestionResultDto,
} from '@lernivox/contracts';

interface WorkspaceQuizRunnerProps {
  quizId: string;
  onBackToQuizzes: () => void;
  onReturnToBook: () => void;
  onCitationClick?: (pageNumber: number) => void;
  isCompactSidecar?: boolean;
}

export function WorkspaceQuizRunner({
  quizId,
  onBackToQuizzes,
  onReturnToBook,
  onCitationClick,
  isCompactSidecar = false,
}: WorkspaceQuizRunnerProps) {
  const { accessToken } = useAuth();
  const [quiz, setQuiz] = useState<QuizDetailDto | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResultDto | null>(null);
  const [filterIncorrectOnly, setFilterIncorrectOnly] = useState(false);

  // Load quiz details and start attempt
  const initAttempt = async () => {
    if (!accessToken || !quizId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentIndex(0);
    setSelectedOptions({});
    setWrittenAnswers({});

    try {
      const q = await api.quizzes.getById(quizId, accessToken);

      // Defensively normalize questions so every item has a deterministic numeric questionOrder and is sorted
      const normalizedQuestions = (q.questions || [])
        .filter(Boolean)
        .map((question, index) => ({
          ...question,
          questionOrder:
            typeof question.questionOrder === 'number' && !Number.isNaN(question.questionOrder)
              ? question.questionOrder
              : index + 1,
        }))
        .sort((a, b) => a.questionOrder - b.questionOrder);

      const normalizedQuiz: QuizDetailDto = {
        ...q,
        questions: normalizedQuestions,
      };

      setQuiz(normalizedQuiz);

      if (q.status === 'READY') {
        if (normalizedQuestions.length === 0) {
          setError('This assessment does not contain any questions.');
          return;
        }
        const att = await api.quizzes.startAttempt(quizId, accessToken);
        setAttemptId(att.attemptId);
      } else if (q.status === 'GENERATING') {
        setError('Quiz is still generating questions. Please wait a moment.');
      } else if (q.status === 'FAILED') {
        setError(q.errorMessage || 'Quiz generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAttempt();
  }, [quizId, accessToken]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F0E5] text-[#14261D]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mb-3" />
        <p className="font-display font-bold text-sm">Preparing assessment...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F0E5] text-[#14261D]">
        <div className="max-w-md p-6 bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_6px_0_0_#1B3428] text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base mb-1">Assessment Unavailable</h3>
          <p className="font-sans text-xs text-[#14261D]/70 mb-4">{error || 'Could not load quiz.'}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={initAttempt}
              className="px-4 py-2 rounded-xl bg-[#14261D] text-white font-bold text-xs"
            >
              Retry
            </button>
            <button
              onClick={onBackToQuizzes}
              className="px-4 py-2 rounded-xl border border-[#1B3428]/30 text-xs font-bold"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBMIT ATTEMPT
  const handleSubmit = async () => {
    if (!attemptId || !accessToken || !quiz) return;
    setSubmitting(true);
    setError(null);

    const answersPayload = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selectedOptions[q.id] || null,
      submittedAnswer: writtenAnswers[q.id] || null,
    }));

    try {
      const res = await api.quizzes.submitAttempt(
        attemptId,
        { answers: answersPayload },
        accessToken,
      );
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Your answers are preserved, please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // RESULTS VIEW
  if (result) {
    const displayedResults = filterIncorrectOnly
      ? result.results.filter((r) => !r.isCorrect)
      : result.results;

    return (
      <div className={`flex-1 overflow-y-auto bg-[#F4F0E5] ${isCompactSidecar ? 'p-3 sm:p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
        <div className={`mx-auto space-y-4 ${isCompactSidecar ? 'w-full' : 'max-w-3xl'}`}>
          {/* Top Score Summary Card */}
          <div className={`bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_4px_0_0_#1B3428] ${isCompactSidecar ? 'p-4' : 'p-6 sm:p-8'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1B3428]/15">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] font-mono text-[10px] font-bold border border-[#497E64]/30">
                  {quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Complete Scope'}
                </span>
                <h1 className="font-display font-black text-lg sm:text-xl text-[#14261D] mt-1.5 leading-snug">
                  {quiz.title}
                </h1>
                <p className="font-sans text-[11px] text-[#14261D]/70 mt-0.5">
                  {quiz.documentTitle} • {quiz.difficulty} Level
                </p>
              </div>

              {/* Score pill */}
              <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border-[1.5px] border-[#1B3428] shadow-xs shrink-0">
                <Award className="w-6 h-6 text-[#E8722C]" />
                <div>
                  <div className="font-display font-black text-2xl text-[#14261D] leading-none">
                    {result.score}%
                  </div>
                  <div className="font-sans text-[10px] text-[#14261D]/60 font-medium mt-0.5">
                    {result.correctAnswers}/{result.totalQuestions} Correct
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
              <button
                type="button"
                onClick={() => setFilterIncorrectOnly(!filterIncorrectOnly)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  filterIncorrectOnly
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
                }`}
              >
                {filterIncorrectOnly ? 'Showing Missed' : 'Filter Missed'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={initAttempt}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#1B3428]/30 text-[#14261D] font-display font-bold text-[11px] hover:bg-[#1B3428]/5 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={onReturnToBook}
                  className="px-3 py-1.5 rounded-xl bg-[#14261D] text-white font-display font-bold text-[11px] shadow-xs hover:bg-[#1B3428] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Reader</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-3">
            {displayedResults.map((q, idx) => (
              <div
                key={q.questionId || idx}
                className="bg-[#FAF8F4] border-[1.5px] border-[#1B3428] rounded-[20px] p-4 shadow-[0_2px_0_0_#1B3428] space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#14261D] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                      {q.questionOrder ?? idx + 1}
                    </span>
                    <span className="font-mono text-[10px] text-[#14261D]/60 uppercase">
                      {(q.questionType || '').replace(/_/g, ' ')}
                    </span>
                  </div>

                  {q.isCorrect ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] font-bold text-[10px] flex items-center gap-1 border border-[#497E64]/30">
                      <CheckCircle2 className="w-3 h-3 text-[#497E64]" />
                      <span>Correct</span>
                    </span>
                  ) : q.isPartial ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 border border-amber-300">
                      <span>Partial</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] flex items-center gap-1 border border-red-300">
                      <XCircle className="w-3 h-3 text-red-600" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                {/* Prompt */}
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#14261D] leading-snug">
                  {q.prompt}
                </h3>

                {/* Options display if Multiple Choice / True-False */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {q.options.map((opt) => {
                      const isStudentSelected = q.selectedOptionId === opt.id;
                      const isCorrectAnswer = opt.isCorrect;

                      let rowClass = 'bg-white border-[#1B3428]/20 text-[#14261D]/75';
                      if (isCorrectAnswer) {
                        rowClass = 'bg-[#E2EBD8]/60 border-[#497E64] text-[#1B3428] font-semibold';
                      } else if (isStudentSelected && !isCorrectAnswer) {
                        rowClass = 'bg-red-50 border-red-300 text-red-800 font-medium';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between ${rowClass}`}
                        >
                          <span>{opt.text}</span>
                          {isCorrectAnswer && (
                            <span className="font-mono text-[9px] text-[#497E64] font-bold">
                              ✓ Correct
                            </span>
                          )}
                          {isStudentSelected && !isCorrectAnswer && (
                            <span className="font-mono text-[9px] text-red-600 font-bold">
                              ✗ Chosen
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Written Answer Comparison if Short Answer / Fill in blank */}
                {(!q.options || q.options.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                    <div className="p-2 rounded-lg bg-white border border-[#1B3428]/20">
                      <span className="block font-mono text-[9px] text-[#14261D]/50 uppercase mb-0.5">
                        Your Submitted Answer
                      </span>
                      <p className="font-sans text-[#14261D]">
                        {q.submittedAnswer || '<No answer submitted>'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#E2EBD8]/40 border border-[#497E64]/40">
                      <span className="block font-mono text-[9px] text-[#497E64] uppercase font-bold mb-0.5">
                        Expected Answer
                      </span>
                      <p className="font-sans text-[#1B3428] font-medium">{q.expectedAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Explanations & Citations */}
                {(q.explanation || q.feedback || q.sourceExcerpt) && (
                  <div className="pt-2 border-t border-[#1B3428]/10 space-y-1.5 text-[11px]">
                    {q.feedback && (
                      <div className="p-2 rounded-lg bg-white border border-[#1B3428]/15">
                        <span className="font-bold text-[#E8722C] block text-[10px] mb-0.5">
                          Tutor Feedback
                        </span>
                        <p className="text-[#14261D]/80 font-sans">{q.feedback}</p>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[#14261D]/80 font-sans">
                        <strong className="text-[#14261D] font-display">Why:</strong>{' '}
                        {q.explanation}
                      </div>
                    )}

                    {q.sourceExcerpt && (
                      <div className="p-2 rounded-lg bg-[#14261D]/5 border-l-[3px] border-[#14261D] flex items-start gap-1.5">
                        <Quote className="w-3 h-3 text-[#14261D]/40 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="italic text-[#14261D]/85 font-serif text-[10.5px]">
                            "{q.sourceExcerpt}"
                          </p>
                          {q.pageNumber && (
                            <button
                              type="button"
                              onClick={() => onCitationClick?.(q.pageNumber!)}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-[#E8722C] hover:underline font-bold cursor-pointer"
                              title={`Jump to page ${q.pageNumber} in reader`}
                            >
                              <span>Page {q.pageNumber} in Book</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
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

  // ACTIVE TAKING EXPERIENCE
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F4F0E5] text-[#14261D] text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
        <p className="font-display font-bold text-sm">No Questions Found</p>
        <p className="font-sans text-xs text-[#14261D]/70 mt-1 mb-4">
          This assessment does not contain any questions to answer.
        </p>
        <button
          type="button"
          onClick={onBackToQuizzes}
          className="px-4 py-2 rounded-xl bg-[#14261D] text-white text-xs font-bold cursor-pointer"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), quiz.questions.length - 1);
  const currentQuestion = quiz.questions[safeIndex]!;
  const isLastQuestion = safeIndex === quiz.questions.length - 1;
  const answeredCount =
    Object.keys(selectedOptions).length +
    Object.values(writtenAnswers).filter((v) => v.trim().length > 0).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F0E5]">
      {/* Top Runner Header */}
      <div className={`bg-[#FAF8F4] border-b-[2px] border-[#1B3428] flex items-center justify-between shrink-0 shadow-xs ${isCompactSidecar ? 'px-3 py-2.5' : 'px-4 sm:px-6 py-3.5'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToQuizzes}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md bg-[#E8722C]/10 text-[#E8722C] font-mono text-[9px] font-bold border border-[#E8722C]/30 shrink-0">
                {quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Assessment'}
              </span>
              <span className="font-sans text-[11px] text-[#14261D]/60 truncate">• {quiz.difficulty}</span>
            </div>
            <h2 className="font-display font-black text-xs sm:text-sm text-[#14261D] truncate">
              {quiz.title}
            </h2>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="text-right">
            <span className="font-mono text-[11px] font-bold text-[#14261D]">
              {safeIndex + 1}/{quiz.questions.length}
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-[#1B3428]/15 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-[#E8722C] transition-all duration-300"
                style={{
                  width: `${((safeIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Question View */}
      <div className={`flex-1 overflow-y-auto flex items-center justify-center ${isCompactSidecar ? 'p-3 sm:p-4' : 'p-4 sm:p-6 lg:p-8'}`}>
        <div className={`w-full bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] shadow-[0_4px_0_0_#1B3428] space-y-4 ${isCompactSidecar ? 'p-4' : 'max-w-2xl p-6 sm:p-8 shadow-[0_8px_0_0_#1B3428]'}`}>
          {/* Question order & format */}
          <div className="flex items-center justify-between border-b border-[#1B3428]/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#14261D] text-white font-mono text-xs font-bold flex items-center justify-center">
                {currentQuestion.questionOrder ?? safeIndex + 1}
              </span>
              <span className="font-mono text-[11px] text-[#14261D]/60 uppercase">
                {(currentQuestion.questionType || '').replace(/_/g, ' ')}
              </span>
            </div>

            {currentQuestion.pageNumber && (
              <button
                type="button"
                onClick={() => onCitationClick?.(currentQuestion.pageNumber!)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E8722C] hover:underline font-bold cursor-pointer"
                title={`Jump to page ${currentQuestion.pageNumber} in reader`}
              >
                <span>Page {currentQuestion.pageNumber}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Question Prompt */}
          <h2 className="font-display font-black text-sm sm:text-base text-[#14261D] leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* Answers Selection Container */}
          <div className="pt-1">
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' ||
            currentQuestion.questionType === 'TRUE_FALSE' ? (
              <div className="space-y-2">
                {(currentQuestion.options || []).map((opt) => {
                  const isSelected = selectedOptions[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelectedOptions({
                          ...selectedOptions,
                          [currentQuestion.id]: opt.id,
                        })
                      }
                      className={`w-full p-3 rounded-xl border-[1.5px] text-left text-xs font-sans flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-[0_2px_0_0_#1B3428]'
                          : 'bg-white text-[#14261D] border-[#1B3428]/25 hover:border-[#1B3428] hover:bg-[#FAF7F3]'
                      }`}
                    >
                      <span className="pr-2">{opt.text}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-white bg-[#E8722C]'
                            : 'border-[#1B3428]/30'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : currentQuestion.questionType === 'FILL_IN_THE_BLANK' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#14261D]/70">
                  Type the missing term:
                </label>
                <input
                  type="text"
                  placeholder="Enter the missing keyword..."
                  value={writtenAnswers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setWrittenAnswers({
                      ...writtenAnswers,
                      [currentQuestion.id]: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                />
              </div>
            ) : (
              /* SHORT ANSWER */
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#14261D]/70">
                  Provide your explanation:
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain clearly in your own words based on the book..."
                  value={writtenAnswers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setWrittenAnswers({
                      ...writtenAnswers,
                      [currentQuestion.id]: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C] resize-none"
                />
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="pt-3 border-t border-[#1B3428]/10 flex items-center justify-between">
            <button
              type="button"
              disabled={safeIndex === 0}
              onClick={() => setCurrentIndex(safeIndex - 1)}
              className="px-3 py-1.5 rounded-xl border border-[#1B3428]/25 text-xs font-bold text-[#14261D] hover:bg-[#1B3428]/5 transition-all flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-full bg-[#E8722C] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex(safeIndex + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#14261D] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#1B3428] transition-all cursor-pointer shadow-xs"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
