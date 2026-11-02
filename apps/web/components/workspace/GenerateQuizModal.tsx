'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { DocumentDto, QuizDifficulty, QuestionType } from '@lernivox/contracts';

interface GenerateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDocumentId?: string;
  preselectedChapter?: string;
  documents?: DocumentDto[];
}

export function GenerateQuizModal({
  isOpen,
  onClose,
  preselectedDocumentId,
  preselectedChapter = '',
  documents: initialDocuments,
}: GenerateQuizModalProps) {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [documents, setDocuments] = useState<DocumentDto[]>(initialDocuments || []);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDocumentId || '');
  const [sourceChapter, setSourceChapter] = useState(preselectedChapter);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('INTERMEDIATE');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'FILL_IN_THE_BLANK',
    'SHORT_ANSWER',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync props when opening
  useEffect(() => {
    if (preselectedDocumentId) setSelectedDocId(preselectedDocumentId);
    if (preselectedChapter) setSourceChapter(preselectedChapter);
  }, [preselectedDocumentId, preselectedChapter, isOpen]);

  // Load documents if not provided
  useEffect(() => {
    if (!isOpen || (initialDocuments && initialDocuments.length > 0) || !accessToken) return;

    let mounted = true;
    setLoadingDocs(true);
    api.documents
      .list(accessToken)
      .then((docs) => {
        if (mounted) {
          // Filter to ready documents
          const ready = docs.filter((d) => d.status === 'READY');
          setDocuments(ready);
          if (!selectedDocId && ready.length > 0) {
            setSelectedDocId(ready[0]!.id);
          }
        }
      })
      .catch((err) => {
        if (mounted) setError('Failed to load documents');
      })
      .finally(() => {
        if (mounted) setLoadingDocs(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, initialDocuments, accessToken, selectedDocId]);

  if (!isOpen) return null;

  const toggleType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return; // Keep at least one
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!selectedDocId) {
      setError('Please select a textbook or document.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const quiz = await api.quizzes.generate(
        selectedDocId,
        {
          sourceChapter: sourceChapter.trim() || undefined,
          numQuestions,
          difficulty,
          questionTypes: selectedTypes,
        },
        accessToken,
      );

      onClose();
      router.push(`/dashboard/practice/quizzes/${quiz.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[28px] shadow-[0_12px_0_0_#1B3428] p-6 sm:p-7 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1B3428]/15 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8722C] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#14261D] leading-tight">
                Generate Chapter Quiz
              </h2>
              <p className="font-sans text-xs text-[#14261D]/70">
                Craft source-grounded active recall questions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/60 hover:text-[#14261D] hover:bg-[#1B3428]/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Document */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Source Document / Textbook
            </label>
            {loadingDocs ? (
              <div className="h-10 rounded-xl bg-[#1B3428]/5 animate-pulse" />
            ) : documents.length === 0 ? (
              <p className="text-xs text-[#14261D]/60">
                No ready documents found. Please upload a textbook to your library first.
              </p>
            ) : (
              <div className="relative">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Chapter / Topic */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Specific Chapter or Topic <span className="font-normal text-[#14261D]/50">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 3: Virtual Memory or Paging"
              value={sourceChapter}
              onChange={(e) => setSourceChapter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-hidden focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C]"
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as QuizDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 px-2 rounded-xl border text-xs font-display font-bold capitalize transition-all ${
                    difficulty === d
                      ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                      : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
                  }`}
                >
                  {d.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Number of Questions: <span className="text-[#E8722C] font-mono">{numQuestions}</span>
            </label>
            <div className="flex gap-2">
              {[3, 5, 8, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumQuestions(count)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    numQuestions === count
                      ? 'bg-[#E8722C] text-white border-[#E8722C]'
                      : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label className="block font-display font-bold text-xs text-[#14261D] mb-1.5">
              Question Formats
            </label>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
              {[
                { type: 'MULTIPLE_CHOICE' as QuestionType, label: 'Multiple Choice' },
                { type: 'TRUE_FALSE' as QuestionType, label: 'True / False' },
                { type: 'FILL_IN_THE_BLANK' as QuestionType, label: 'Fill in the Blank' },
                { type: 'SHORT_ANSWER' as QuestionType, label: 'Short Answer' },
              ].map(({ type, label }) => {
                const checked = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`py-2 px-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-[#E2EBD8] border-[#497E64] text-[#14261D] font-medium'
                        : 'bg-white border-[#1B3428]/20 text-[#14261D]/50'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="font-mono text-[10px]">{checked ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || documents.length === 0}
              className="w-full py-3 rounded-full bg-[#14261D] border-[1.5px] border-[#1B3428] text-white font-display font-bold text-sm shadow-[0_4px_0_0_#1B3428] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8722C]" />
                  <span>Enqueuing Generation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E8722C]" />
                  <span>Generate Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
