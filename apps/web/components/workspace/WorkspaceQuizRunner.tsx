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
}

export function WorkspaceQuizRunner({
  quizId,
  onBackToQuizzes,
  onReturnToBook,
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
      setQuiz(q);

      if (q.status === 'READY') {
        const att = await api.quizzes.startAttempt(quizId, accessToken);
        setAttemptId(att.attemptId);
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
      <div className="flex-1 overflow-y-auto bg-[#F4F0E5] p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Score Summary Card */}
          <div className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-8 shadow-[0_8px_0_0_#1B3428]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#1B3428]/15">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#E2EBD8] text-[#1B3428] font-mono text-xs font-bold border border-[#497E64]/30">
                  {quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Complete Scope'}
                </span>
                <h1 className="font-display font-black text-2xl text-[#14261D] mt-2">
                  {quiz.title}
                </h1>
                <p className="font-sans text-xs text-[#14261D]/70">
                  {quiz.documentTitle} • {quiz.difficulty} Level
                </p>
              </div>

              {/* Score pill */}
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-[1.5px] border-[#1B3428] shadow-xs shrink-0">
                <Award className="w-8 h-8 text-[#E8722C]" />
                <div>
                  <div className="font-display font-black text-3xl text-[#14261D]">
                    {result.score}%
                  </div>
                  <div className="font-sans text-[11px] text-[#14261D]/60 font-medium">
                    {result.correctAnswers} of {result.totalQuestions} Correct
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterIncorrectOnly(!filterIncorrectOnly)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    filterIncorrectOnly
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
                  }`}
                >
                  {filterIncorrectOnly ? 'Showing Missed Only' : 'Filter Missed Questions'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={initAttempt}
                  className="px-4 py-2 rounded-xl bg-white border border-[#1B3428]/30 text-[#14261D] font-display font-bold text-xs hover:bg-[#1B3428]/5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={onReturnToBook}
                  className="px-4 py-2 rounded-xl bg-[#14261D] text-white font-display font-bold text-xs shadow-xs hover:bg-[#1B3428] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Return to Book</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-4">
            {displayedResults.map((q, idx) => (
              <div
                key={q.questionId}
                className="bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] p-5 sm:p-6 shadow-[0_4px_0_0_#1B3428] space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#14261D] text-white font-mono text-xs flex items-center justify-center font-bold">
                      {q.questionOrder}
                    </span>
                    <span className="font-mono text-xs text-[#14261D]/60 uppercase">
                      {q.questionType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {q.isCorrect ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E2EBD8] text-[#1B3428] font-bold text-xs flex items-center gap-1 border border-[#497E64]/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#497E64]" />
                      <span>Correct</span>
                    </span>
                  ) : q.isPartial ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-300">
                      <span>Partial Credit</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-xs flex items-center gap-1 border border-red-300">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                {/* Prompt */}
                <h3 className="font-display font-bold text-base text-[#14261D] leading-snug">
                  {q.prompt}
                </h3>

                {/* Options display if Multiple Choice / True-False */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1.5 pt-1">
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
                          className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${rowClass}`}
                        >
                          <span>{opt.text}</span>
                          {isCorrectAnswer && (
                            <span className="font-mono text-[10px] text-[#497E64] font-bold">
                              ✓ Correct Answer
                            </span>
                          )}
                          {isStudentSelected && !isCorrectAnswer && (
                            <span className="font-mono text-[10px] text-red-600 font-bold">
                              ✗ Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Written Answer Comparison if Short Answer / Fill in blank */}
                {(!q.options || q.options.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-white border border-[#1B3428]/20">
                      <span className="block font-mono text-[10px] text-[#14261D]/50 uppercase mb-1">
                        Your Submitted Answer
                      </span>
                      <p className="font-sans text-[#14261D]">
                        {q.submittedAnswer || '<No answer submitted>'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#E2EBD8]/40 border border-[#497E64]/40">
                      <span className="block font-mono text-[10px] text-[#497E64] uppercase font-bold mb-1">
                        Expected Answer
                      </span>
                      <p className="font-sans text-[#1B3428] font-medium">{q.expectedAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Explanations & Citations */}
                {(q.explanation || q.feedback || q.sourceExcerpt) && (
                  <div className="pt-3 border-t border-[#1B3428]/10 space-y-2 text-xs">
                    {q.feedback && (
                      <div className="p-3 rounded-xl bg-white border border-[#1B3428]/15">
                        <span className="font-bold text-[#E8722C] block text-[11px] mb-0.5">
                          Tutor Feedback
                        </span>
                        <p className="text-[#14261D]/80 font-sans">{q.feedback}</p>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[#14261D]/80 font-sans">
                        <strong className="text-[#14261D] font-display">Why this is correct:</strong>{' '}
                        {q.explanation}
                      </div>
                    )}

                    {q.sourceExcerpt && (
                      <div className="p-3 rounded-xl bg-[#14261D]/5 border-l-[3px] border-[#14261D] flex items-start gap-2">
                        <Quote className="w-4 h-4 text-[#14261D]/40 shrink-0 mt-0.5" />
                        <div>
                          <p className="italic text-[#14261D]/85 font-serif text-[11.5px]">
                            "{q.sourceExcerpt}"
                          </p>
                          {q.pageNumber && (
                            <span className="block text-[10px] font-mono text-[#14261D]/60 mt-1">
                              Source citation: Page {q.pageNumber}
                            </span>
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
  const currentQuestion = quiz.questions[currentIndex]!;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const answeredCount =
    Object.keys(selectedOptions).length +
    Object.values(writtenAnswers).filter((v) => v.trim().length > 0).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F0E5]">
      {/* Top Runner Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#FAF8F4] border-b-[2px] border-[#1B3428] flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToQuizzes}
            className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#E8722C]/10 text-[#E8722C] font-mono text-[10px] font-bold border border-[#E8722C]/30">
                {quiz.rangeScope?.summaryLabel || quiz.sourceChapter || 'Assessment'}
              </span>
              <span className="font-sans text-xs text-[#14261D]/60">• {quiz.difficulty}</span>
            </div>
            <h2 className="font-display font-black text-sm text-[#14261D] truncate max-w-sm sm:max-w-md">
              {quiz.title}
            </h2>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="font-mono text-xs font-bold text-[#14261D]">
              Question {currentIndex + 1} of {quiz.questions.length}
            </span>
            <div className="w-28 h-1.5 bg-[#1B3428]/15 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#E8722C] transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Question View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] p-6 sm:p-8 shadow-[0_8px_0_0_#1B3428] space-y-6">
          {/* Question order & format */}
          <div className="flex items-center justify-between border-b border-[#1B3428]/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#14261D] text-white font-mono text-xs font-bold flex items-center justify-center">
                {currentQuestion.questionOrder}
              </span>
              <span className="font-mono text-xs text-[#14261D]/60 uppercase">
                {currentQuestion.questionType.replace(/_/g, ' ')}
              </span>
            </div>

            {currentQuestion.pageNumber && (
              <span className="text-[11px] font-mono text-[#14261D]/50">
                Grounded on Page {currentQuestion.pageNumber}
              </span>
            )}
          </div>

          {/* Question Prompt */}
          <h2 className="font-display font-black text-lg sm:text-xl text-[#14261D] leading-snug">
            {currentQuestion.prompt}
          </h2>

          {/* Answers Selection Container */}
          <div className="pt-2">
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' ||
            currentQuestion.questionType === 'TRUE_FALSE' ? (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
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
                      className={`w-full p-3.5 rounded-2xl border-[1.5px] text-left text-xs font-sans flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#14261D] text-white border-[#14261D] shadow-[0_2px_0_0_#1B3428]'
                          : 'bg-white text-[#14261D] border-[#1B3428]/25 hover:border-[#1B3428] hover:bg-[#FAF7F3]'
                      }`}
                    >
                      <span>{opt.text}</span>
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
              <div className="space-y-2">
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
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                />
              </div>
            ) : (
              /* SHORT ANSWER */
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#14261D]/70">
                  Provide your explanation:
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain clearly in your own words based on the book..."
                  value={writtenAnswers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setWrittenAnswers({
                      ...writtenAnswers,
                      [currentQuestion.id]: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C] resize-none"
                />
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-[#1B3428]/10 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="px-4 py-2 rounded-xl border border-[#1B3428]/25 text-xs font-bold text-[#14261D] hover:bg-[#1B3428]/5 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-full bg-[#E8722C] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit Assessment</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 rounded-xl bg-[#14261D] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#1B3428] transition-all cursor-pointer shadow-xs"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
