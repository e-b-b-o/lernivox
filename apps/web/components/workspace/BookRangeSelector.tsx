'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Layers, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  DocumentOutlineItemDto,
  QuizRangeScopeDto,
  RangeSelectionType,
  RangeBoundaryDto,
} from '@lernivox/contracts';

interface FlatSection {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
}

function flattenOutline(nodes: DocumentOutlineItemDto[]): FlatSection[] {
  const result: FlatSection[] = [];
  function recurse(list: DocumentOutlineItemDto[]) {
    for (const item of list) {
      result.push({
        id: item.id,
        title: item.title,
        pageNumber: item.pageNumber,
        level: item.level,
      });
      if (item.subsections && item.subsections.length > 0) {
        recurse(item.subsections);
      }
    }
  }
  recurse(nodes);
  return result;
}

interface BookRangeSelectorProps {
  documentId: string;
  documentTitle?: string;
  pageCount?: number | null;
  preselectedChapter?: string;
  preselectedPage?: number;
  onChange: (rangeScope: QuizRangeScopeDto, isValid: boolean) => void;
}

export function BookRangeSelector({
  documentId,
  documentTitle = 'Document',
  pageCount = 1,
  preselectedChapter,
  preselectedPage,
  onChange,
}: BookRangeSelectorProps) {
  const { accessToken } = useAuth();
  const [scopeType, setScopeType] = useState<'ENTIRE_DOCUMENT' | 'CUSTOM_RANGE'>('ENTIRE_DOCUMENT');
  const [rangeType, setRangeType] = useState<RangeSelectionType>('CHAPTER');
  const [sections, setSections] = useState<FlatSection[]>([]);
  const [loadingOutline, setLoadingOutline] = useState(false);

  // Chapter selections
  const [fromSectionIndex, setFromSectionIndex] = useState<number>(0);
  const [toSectionIndex, setToSectionIndex] = useState<number>(0);

  // Dynamic outline max page detection
  const outlineMaxPage = useMemo(() => {
    return sections.reduce((max, s) => Math.max(max, s.pageNumber), 1);
  }, [sections]);

  const effectivePageCount = Math.max(pageCount && pageCount > 1 ? pageCount : outlineMaxPage, 1);

  // Page range selections with draft string states allowing free typing & backspacing
  const [fromPage, setFromPage] = useState<number>(preselectedPage || 1);
  const [toPage, setToPage] = useState<number>(() => {
    if (preselectedPage) return preselectedPage + 10;
    return pageCount && pageCount > 1 ? Math.min(pageCount, 20) : 20;
  });

  const [fromPageDraft, setFromPageDraft] = useState<string>(() => String(preselectedPage || 1));
  const [toPageDraft, setToPageDraft] = useState<string>(() => {
    if (preselectedPage) return String(preselectedPage + 10);
    return String(pageCount && pageCount > 1 ? Math.min(pageCount, 20) : 20);
  });

  // Sync draft states when preselectedPage changes
  useEffect(() => {
    if (preselectedPage) {
      setFromPage(preselectedPage);
      setFromPageDraft(String(preselectedPage));
      const end = preselectedPage + 10;
      setToPage(end);
      setToPageDraft(String(end));
    }
  }, [preselectedPage]);

  const handleFromPageChange = (val: string) => {
    setFromPageDraft(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      setFromPage(num);
    }
  };

  const handleFromPageBlur = () => {
    const num = parseInt(fromPageDraft, 10);
    if (isNaN(num) || num < 1) {
      setFromPageDraft(String(fromPage));
    } else {
      setFromPage(num);
      setFromPageDraft(String(num));
    }
  };

  const handleToPageChange = (val: string) => {
    setToPageDraft(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      setToPage(num);
    }
  };

  const handleToPageBlur = () => {
    const num = parseInt(toPageDraft, 10);
    if (isNaN(num) || num < 1) {
      setToPageDraft(String(toPage));
    } else {
      setToPage(num);
      setToPageDraft(String(num));
    }
  };

  // Fetch document outline
  useEffect(() => {
    if (!documentId || !accessToken) return;

    let mounted = true;
    setLoadingOutline(true);

    api.documents
      .getOutline(documentId, accessToken)
      .then((data) => {
        if (!mounted) return;
        const flat = flattenOutline(data.items || []);
        setSections(flat);

        if (flat.length > 0) {
          setRangeType('CHAPTER');

          // If preselected chapter was provided, match it
          if (preselectedChapter) {
            const lower = preselectedChapter.toLowerCase();
            const matchedIdx = flat.findIndex(
              (s) => s.title.toLowerCase().includes(lower) || lower.includes(s.title.toLowerCase()),
            );
            if (matchedIdx !== -1) {
              setFromSectionIndex(matchedIdx);
              setToSectionIndex(matchedIdx);
              setScopeType('CUSTOM_RANGE');
            }
          } else if (preselectedPage) {
            const matchedIdx = flat.findIndex((s) => s.pageNumber >= preselectedPage);
            if (matchedIdx !== -1) {
              setFromSectionIndex(matchedIdx);
              setToSectionIndex(Math.min(flat.length - 1, matchedIdx + 1));
              setScopeType('CUSTOM_RANGE');
            }
          }
        } else {
          // Fallback to page range if no outline headings exist
          setRangeType('PAGE');
          if (preselectedPage) {
            setScopeType('CUSTOM_RANGE');
          }
        }
      })
      .catch(() => {
        if (mounted) setRangeType('PAGE');
      })
      .finally(() => {
        if (mounted) setLoadingOutline(false);
      });

    return () => {
      mounted = false;
    };
  }, [documentId, accessToken, preselectedChapter, preselectedPage]);

  // Evaluate range and notify parent
  const { currentScope, isValid, validationError } = useMemo<{
    currentScope: QuizRangeScopeDto;
    isValid: boolean;
    validationError: string | null;
  }>(() => {
    if (scopeType === 'ENTIRE_DOCUMENT') {
      const scope: QuizRangeScopeDto = {
        scopeType: 'ENTIRE_DOCUMENT',
        summaryLabel: 'Entire Material',
      };
      return { currentScope: scope, isValid: true, validationError: null };
    }

    if (rangeType === 'CHAPTER' && sections.length > 0) {
      if (toSectionIndex < fromSectionIndex) {
        return {
          currentScope: {
            scopeType: 'CUSTOM_RANGE',
            rangeType: 'CHAPTER',
            summaryLabel: 'Invalid range',
          },
          isValid: false,
          validationError: 'Ending section cannot precede starting section.',
        };
      }

      const fromSec = sections[fromSectionIndex]!;
      const toSec = sections[toSectionIndex]!;

      const fromBoundary: RangeBoundaryDto = {
        label: fromSec.title,
        pageNumber: fromSec.pageNumber,
        chapterTitle: fromSec.title,
        sectionId: fromSec.id,
      };

      const toBoundary: RangeBoundaryDto = {
        label: toSec.title,
        pageNumber: toSec.pageNumber,
        chapterTitle: toSec.title,
        sectionId: toSec.id,
      };

      const startPage = fromSec.pageNumber;
      // End page is up to next section after toSec, or pageCount
      const nextSec = sections[toSectionIndex + 1];
      const endPage = nextSec ? Math.max(startPage, nextSec.pageNumber) : effectivePageCount;

      const resolvedSections = sections
        .slice(fromSectionIndex, toSectionIndex + 1)
        .map((s) => s.title);

      const summaryLabel =
        fromSectionIndex === toSectionIndex
          ? `${fromSec.title}`
          : `${fromSec.title} to ${toSec.title}`;

      const scope: QuizRangeScopeDto = {
        scopeType: 'CUSTOM_RANGE',
        rangeType: 'CHAPTER',
        from: fromBoundary,
        to: toBoundary,
        startPage,
        endPage,
        resolvedSections,
        summaryLabel,
      };

      return { currentScope: scope, isValid: true, validationError: null };
    }

    // By Page Range
    const parsedFrom = parseInt(fromPageDraft, 10) || fromPage;
    const parsedTo = parseInt(toPageDraft, 10) || toPage;

    if (parsedTo < parsedFrom) {
      return {
        currentScope: {
          scopeType: 'CUSTOM_RANGE',
          rangeType: 'PAGE',
          summaryLabel: 'Invalid page range',
        },
        isValid: false,
        validationError: 'Ending page cannot be less than starting page.',
      };
    }

    const scope: QuizRangeScopeDto = {
      scopeType: 'CUSTOM_RANGE',
      rangeType: 'PAGE',
      from: { label: `Page ${parsedFrom}`, pageNumber: parsedFrom },
      to: { label: `Page ${parsedTo}`, pageNumber: parsedTo },
      startPage: parsedFrom,
      endPage: parsedTo,
      summaryLabel: parsedFrom === parsedTo ? `Page ${parsedFrom}` : `Pages ${parsedFrom}–${parsedTo}`,
    };

    return { currentScope: scope, isValid: true, validationError: null };
  }, [
    scopeType,
    rangeType,
    sections,
    fromSectionIndex,
    toSectionIndex,
    fromPage,
    toPage,
    fromPageDraft,
    toPageDraft,
    effectivePageCount,
  ]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(currentScope, isValid);
  }, [currentScope, isValid]);

  return (
    <div className="space-y-3 p-3.5 bg-[#FAF7F3] rounded-[20px] border border-[#1B3428]/20 text-xs">
      {/* Scope Mode: Entire vs Range */}
      <div>
        <label className="block font-display font-bold text-[#14261D] mb-1.5">
          Select Content Scope
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScopeType('ENTIRE_DOCUMENT')}
            className={`py-2 px-3 rounded-xl border text-left flex items-center gap-2 font-display font-bold transition-all ${
              scopeType === 'ENTIRE_DOCUMENT'
                ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Entire Book</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeType('CUSTOM_RANGE')}
            className={`py-2 px-3 rounded-xl border text-left flex items-center gap-2 font-display font-bold transition-all ${
              scopeType === 'CUSTOM_RANGE'
                ? 'bg-[#14261D] text-white border-[#14261D] shadow-xs'
                : 'bg-white text-[#14261D]/70 border-[#1B3428]/20 hover:border-[#1B3428]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Specific Range</span>
          </button>
        </div>
      </div>

      {/* Range Configuration when CUSTOM_RANGE */}
      {scopeType === 'CUSTOM_RANGE' && (
        <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Sub-selector: Chapter/Section vs Page Range */}
          {sections.length > 0 && (
            <div className="flex items-center gap-2 pb-1 border-b border-[#1B3428]/10 text-[11px]">
              <span className="text-[#14261D]/60 font-medium">Range Strategy:</span>
              <button
                type="button"
                onClick={() => setRangeType('CHAPTER')}
                className={`px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                  rangeType === 'CHAPTER'
                    ? 'bg-[#E2EBD8] border-[#497E64] text-[#14261D]'
                    : 'bg-white border-[#1B3428]/20 text-[#14261D]/60'
                }`}
              >
                Outline Headings ({sections.length})
              </button>
              <button
                type="button"
                onClick={() => setRangeType('PAGE')}
                className={`px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                  rangeType === 'PAGE'
                    ? 'bg-[#E2EBD8] border-[#497E64] text-[#14261D]'
                    : 'bg-white border-[#1B3428]/20 text-[#14261D]/60'
                }`}
              >
                Page Numbers
              </button>
            </div>
          )}

          {/* Strategy 1: Headings / Chapter selection */}
          {rangeType === 'CHAPTER' && sections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1">
                  Starting point: <span className="text-[#E8722C]">From</span>
                </label>
                <select
                  value={fromSectionIndex}
                  onChange={(e) => setFromSectionIndex(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C]"
                >
                  {sections.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.title} (p. {s.pageNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1">
                  Ending point: <span className="text-[#E8722C]">To</span>
                </label>
                <select
                  value={toSectionIndex}
                  onChange={(e) => setToSectionIndex(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#1B3428]/30 font-sans text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C]"
                >
                  {sections.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.title} (p. {s.pageNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Strategy 2: Page numbers fallback */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1 flex items-center justify-between">
                  <span>From Page:</span>
                  <span className="text-[#E8722C] font-mono font-bold">p. {fromPage}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={fromPageDraft}
                  onChange={(e) => handleFromPageChange(e.target.value)}
                  onBlur={handleFromPageBlur}
                  placeholder="1"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-mono text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1 flex items-center justify-between">
                  <span>To Page:</span>
                  <span className="text-[#E8722C] font-mono font-bold">p. {toPage}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={toPageDraft}
                  onChange={(e) => handleToPageChange(e.target.value)}
                  onBlur={handleToPageBlur}
                  placeholder={String(effectivePageCount > 1 ? effectivePageCount : 20)}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-mono text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Validation Feedback */}
          {validationError ? (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/15 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#14261D]/80 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#497E64] shrink-0" />
                <span className="truncate">
                  Selected: <strong className="text-[#14261D]">{currentScope.summaryLabel}</strong>
                </span>
              </div>
              {currentScope.startPage && currentScope.endPage && (
                <span className="px-2 py-0.5 rounded-md bg-[#14261D]/5 font-mono text-[10px] text-[#14261D]/70 shrink-0">
                  Pages {currentScope.startPage}–{currentScope.endPage}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
