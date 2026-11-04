'use client';

import React, { useState, memo } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  ChevronRight,
  Hash,
  HelpCircle,
  List,
  PanelLeftOpen,
  Trash2,
  X,
} from 'lucide-react';
import type { DocumentBookmarkDto, DocumentOutlineItemDto } from '@lernivox/contracts';

interface DocumentOutlinePaneProps {
  isOpen: boolean;
  onToggle: () => void;
  outlineItems: DocumentOutlineItemDto[];
  loadingOutline: boolean;
  isNativeOutline?: boolean;
  currentPage: number;
  totalPages: number;
  onPageSelect: (pageNumber: number) => void;
  bookmarks: DocumentBookmarkDto[];
  onAddBookmark: (page: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onPracticeChapter?: (chapter: DocumentOutlineItemDto) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

function DocumentOutlinePaneComponent({
  isOpen,
  onToggle,
  outlineItems,
  loadingOutline,
  isNativeOutline = false,
  currentPage,
  totalPages,
  onPageSelect,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  onPracticeChapter,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: DocumentOutlinePaneProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'bookmarks'>('outline');
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [jumpError, setJumpError] = useState<string | null>(null);

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    setJumpError(null);
    const parsed = parseInt(jumpPageInput.trim(), 10);
    if (isNaN(parsed) || parsed < 1 || parsed > (totalPages || 9999)) {
      setJumpError(`Page 1–${totalPages || 1}`);
      return;
    }
    onPageSelect(parsed);
    setJumpPageInput('');
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  // Determine active outline item based on current page
  const activeChapter = [...outlineItems]
    .reverse()
    .find((item) => item.pageNumber <= currentPage);

  // 1. COLLAPSED DESKTOP RAIL (when not mobile drawer)
  if (!isOpen && !isMobileDrawer) {
    return (
      <aside className="hidden lg:flex w-12 h-full flex-col items-center py-4 bg-[#FAF8F4] border-r-[2px] border-[#1B3428]/15 shrink-0 select-none">
        <button
          type="button"
          onClick={onToggle}
          className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#1B3428]/30 flex items-center justify-center text-[#14261D] hover:bg-[#FBE8DC] transition-colors mb-4"
          title="Expand Table of Contents"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="flex-1 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => {
              onToggle();
              setActiveTab('outline');
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#14261D]/70 hover:bg-[#E2EBD8] hover:text-[#497E64] transition-colors"
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onToggle();
              setActiveTab('bookmarks');
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-colors"
            title="Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] font-mono text-[#14261D]/50 rotate-90 whitespace-nowrap mb-8">
          p. {currentPage}
        </div>
      </aside>
    );
  }

  // 2. EXPANDED PANE OR MOBILE SLIDE-OVER DRAWER
  const containerClasses = isMobileDrawer
    ? 'w-full h-full bg-[#FAF8F4] flex flex-col select-none'
    : 'hidden lg:flex w-64 sm:w-72 h-full bg-[#FAF8F4] border-r-[2px] border-[#1B3428]/15 flex-col shrink-0 select-none z-20';

  return (
    <aside className={containerClasses}>
      {/* Pane Top Header */}
      <div className="h-12 px-4 border-b border-[#1B3428]/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFECE6] border border-[#1B3428]/10 text-xs font-display font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'outline'
                ? 'bg-[#FAF8F4] text-[#14261D] shadow-2xs'
                : 'text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Contents</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'bg-[#FAF8F4] text-[#14261D] shadow-2xs'
                : 'text-[#14261D]/60 hover:text-[#14261D]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Marks ({bookmarks.length})</span>
          </button>
        </div>

        {/* Close Button only for mobile drawer */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC]"
            title="Close Table of Contents"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Page Jump Bar */}
      <div className="p-3 border-b border-[#1B3428]/10 bg-[#F4F0E5]/60 shrink-0">
        <form onSubmit={handlePageJump} className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#14261D]/50">
              #
            </span>
            <input
              type="number"
              min={1}
              max={totalPages || 9999}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={`Jump to (1–${totalPages || 1})`}
              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white border border-[#1B3428]/20 font-mono text-xs text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-none focus:border-[#E8722C]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#1B3428] text-white font-display font-bold text-xs hover:bg-[#14261D] transition-colors shrink-0"
          >
            Go
          </button>
        </form>
        {jumpError && (
          <p className="font-mono text-[10px] text-red-600 mt-1 pl-1">{jumpError}</p>
        )}
      </div>

      {/* Main Tab View: Outline vs Bookmarks */}
      <div id="toc-scroll-container" className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'outline' ? (
          loadingOutline ? (
            <div className="p-6 text-center text-xs text-[#14261D]/60 font-sans">
              Loading document outline...
            </div>
          ) : outlineItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#14261D]/60 font-sans leading-relaxed">
              No document outline available
            </div>
          ) : (
            <>
              <div className="px-2 py-1 mb-1 flex items-center justify-between text-[10px] font-mono text-[#14261D]/50 border-b border-[#1B3428]/10 pb-1.5">
                <span>SECTIONS</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1B3428]/5 border border-[#1B3428]/10 text-[9px]">
                  {isNativeOutline ? 'Embedded Outline' : 'Detected headings'}
                </span>
              </div>
              {outlineItems.map((item) => {
                const isActive = activeChapter?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`w-full p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 group ${
                      isActive
                        ? 'bg-[#1B3428] text-white shadow-xs'
                        : 'hover:bg-[#FAF8F4] text-[#14261D]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onPageSelect(item.pageNumber);
                        if (isMobileDrawer && onCloseMobileDrawer) {
                          onCloseMobileDrawer();
                        }
                      }}
                      className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722C] rounded"
                      title={`Go to page ${item.pageNumber}`}
                    >
                      <p
                        className={`text-xs leading-snug font-serif ${
                          isActive ? 'font-bold text-white' : 'font-medium text-[#14261D]/80'
                        }`}
                      >
                        {item.title}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {onPracticeChapter && (
                        <button
                          type="button"
                          onClick={() => {
                            onPracticeChapter(item);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722C] ${
                            isActive
                              ? 'text-white hover:bg-white/20'
                              : 'text-[#14261D]/60 hover:text-[#E8722C] hover:bg-[#FBE8DC]'
                          }`}
                          title={`Practice ${item.title}`}
                          aria-label={`Practice ${item.title}`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onPageSelect(item.pageNumber);
                          if (isMobileDrawer && onCloseMobileDrawer) {
                            onCloseMobileDrawer();
                          }
                        }}
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8722C] ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#1B3428]/5 text-[#14261D]/70 group-hover:bg-[#1B3428]/10'
                        }`}
                        title={`Go to page ${item.pageNumber}`}
                      >
                        p. {item.pageNumber}
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )
        ) : (
          /* Bookmarks View */
          <div className="space-y-2 p-1">
            <button
              type="button"
              onClick={() => onAddBookmark(currentPage)}
              className="w-full py-2 px-3 rounded-xl bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D] font-display font-bold text-xs shadow-[0_2px_0_0_#1B3428] hover:-translate-y-0.5 hover:shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[#E8722C]" />
              <span>+ Bookmark Page {currentPage}</span>
            </button>

            {bookmarks.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#14261D]/55 font-sans">
                No bookmarks saved yet. Click above to bookmark your current reading location.
              </p>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#1B3428]/15 hover:border-[#1B3428]/35 transition-colors flex items-start justify-between gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPageSelect(bm.pageNumber);
                      if (isMobileDrawer && onCloseMobileDrawer) {
                        onCloseMobileDrawer();
                      }
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bookmark className="w-3 h-3 text-[#E8722C] fill-[#E8722C]" />
                      <span className="font-mono font-bold text-xs text-[#14261D]">
                        Page {bm.pageNumber}
                      </span>
                    </div>
                    {bm.snippet && (
                      <p className="font-serif text-[11px] text-[#14261D]/70 line-clamp-2 italic">
                        "{bm.snippet}"
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBookmark(bm.id)}
                    className="p-1 text-[#14261D]/40 hover:text-red-600 transition-colors shrink-0"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Pane Footer: Current Location Summary */}
      <div className="p-3 border-t border-[#1B3428]/10 bg-[#FAF8F4] text-[11px] font-mono text-[#14261D]/60 flex items-center justify-between shrink-0">
        <span>Current: Page {currentPage}</span>
        <span>Total: {totalPages || 1} Pages</span>
      </div>
    </aside>
  );
}

export const DocumentOutlinePane = memo(DocumentOutlinePaneComponent);

