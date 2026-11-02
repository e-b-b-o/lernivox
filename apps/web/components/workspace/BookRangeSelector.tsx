'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  // Page range selections
  const effectivePageCount = Math.max(1, pageCount || 1);
  const [fromPage, setFromPage] = useState<number>(preselectedPage || 1);
  const [toPage, setToPage] = useState<number>(
    preselectedPage ? Math.min(effectivePageCount, preselectedPage + 10) : Math.min(effectivePageCount, 20),
  );

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
    if (toPage < fromPage) {
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
      from: { label: `Page ${fromPage}`, pageNumber: fromPage },
      to: { label: `Page ${toPage}`, pageNumber: toPage },
      startPage: fromPage,
      endPage: toPage,
      summaryLabel: fromPage === toPage ? `Page ${fromPage}` : `Pages ${fromPage}–${toPage}`,
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
    effectivePageCount,
  ]);

  useEffect(() => {
    onChange(currentScope, isValid);
  }, [currentScope, isValid, onChange]);

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
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1 flex items-center gap-1">
                  <span>From Page:</span>
                  <span className="text-[#E8722C] font-mono">{fromPage}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={effectivePageCount}
                  value={fromPage}
                  onChange={(e) => setFromPage(Math.max(1, Number(e.target.value)))}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-mono text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261D]/80 mb-1 flex items-center gap-1">
                  <span>To Page:</span>
                  <span className="text-[#E8722C] font-mono">{toPage}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={effectivePageCount}
                  value={toPage}
                  onChange={(e) =>
                    setToPage(Math.min(effectivePageCount, Math.max(1, Number(e.target.value))))
                  }
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#1B3428]/30 font-mono text-xs text-[#14261D] focus:outline-hidden focus:border-[#E8722C]"
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
