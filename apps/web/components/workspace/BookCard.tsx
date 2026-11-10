'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, Loader2, Users, User, Clock, BookOpen } from 'lucide-react';
import type { DocumentDto, DocumentReadingProgressDto, WorkspaceType } from '@lernivox/contracts';

interface BookCardProps {
  document: DocumentDto;
  workspaceId?: string;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  readingProgress?: DocumentReadingProgressDto | null;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
}

// Deterministic cover palette generator based on document UUID
const COVER_THEMES = [
  {
    bg: 'bg-[#1B3428]',
    border: 'border-[#1B3428]',
    text: 'text-[#FAF8F4]',
    tagBg: 'bg-[#FAF8F4]/15',
    tagText: 'text-[#E2EBD8]',
    ribbon: 'bg-[#E8722C]',
    accentBorder: 'border-[#FAF8F4]/20',
  },
  {
    bg: 'bg-[#E8722C]',
    border: 'border-[#1B3428]',
    text: 'text-[#FAF8F4]',
    tagBg: 'bg-[#FAF8F4]/20',
    tagText: 'text-[#FAF8F4]',
    ribbon: 'bg-[#1B3428]',
    accentBorder: 'border-[#FAF8F4]/25',
  },
  {
    bg: 'bg-[#497E64]',
    border: 'border-[#1B3428]',
    text: 'text-[#FAF8F4]',
    tagBg: 'bg-[#FAF8F4]/15',
    tagText: 'text-[#FAF8F4]',
    ribbon: 'bg-[#FBE8DC]',
    accentBorder: 'border-[#FAF8F4]/20',
  },
  {
    bg: 'bg-[#2A3B4C]',
    border: 'border-[#1B3428]',
    text: 'text-[#FAF8F4]',
    tagBg: 'bg-[#FAF8F4]/15',
    tagText: 'text-[#FAF8F4]',
    ribbon: 'bg-[#E8722C]',
    accentBorder: 'border-[#FAF8F4]/20',
  },
  {
    bg: 'bg-[#5B2E35]',
    border: 'border-[#1B3428]',
    text: 'text-[#FAF8F4]',
    tagBg: 'bg-[#FAF8F4]/15',
    tagText: 'text-[#FAF8F4]',
    ribbon: 'bg-[#E2EBD8]',
    accentBorder: 'border-[#FAF8F4]/20',
  },
];

export function BookCard({
  document: doc,
  workspaceId,
  workspaceType = (doc.workspaceType || 'PERSONAL'),
  isOwner = true,
  readingProgress,
  onDelete,
  isDeleting = false,
}: BookCardProps) {
  // Deterministic palette pick from UUID
  const hash = doc.id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const theme = COVER_THEMES[hash % COVER_THEMES.length]!;

  const isReady = doc.status === 'READY';
  const isFailed = doc.status === 'FAILED';
  const isProcessing = ['UPLOADED', 'PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING'].includes(
    doc.status,
  );

  const formatFileType = (mime: string, name?: string | null) => {
    if (mime.includes('pdf') || name?.endsWith('.pdf')) return 'PDF';
    if (mime.includes('word') || name?.endsWith('.docx')) return 'DOCX';
    return 'TXT';
  };

  const fileType = formatFileType(doc.mimeType, doc.fileName);

  // Target workspace route: canonical /dashboard/workspaces/[workspaceId]
  const targetHref = workspaceId
    ? `/dashboard/workspaces/${workspaceId}`
    : `/dashboard/tutor?documentId=${doc.id}`;

  // Actual reading progress calculation
  const totalPages = readingProgress?.totalPages || doc.pageCount || null;
  const currentPage = readingProgress?.currentPage || null;
  const progressPercent =
    currentPage && totalPages && totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100))
      : 0;

  // Format relative last accessed time
  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const lastAccessed = formatTimeAgo(readingProgress?.lastReadAt || doc.updatedAt);

  return (
    <div className="w-full min-w-0 max-w-full flex flex-col group select-none">
      {/* 1. PHYSICAL 3D BOOK COVER (Fluid aspect ratio, scales to column width) */}
      <Link
        href={isReady ? targetHref : '#'}
        aria-label={isReady ? `Open and study ${doc.title}` : doc.title}
        onClick={(e) => {
          if (!isReady) e.preventDefault();
        }}
        className={`relative w-full aspect-[3/4.2] rounded-[14px] sm:rounded-[20px] p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden transition-transform duration-200 hover:-translate-y-1 active:translate-y-0.5 shadow-[0_3px_0_0_#1B3428] sm:shadow-[0_4px_0_0_#1B3428] border-[1.5px] sm:border-[2px] border-[#1B3428] ${
          isReady
            ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0.5'
            : 'cursor-default opacity-85'
        } ${theme.bg} ${theme.text}`}
      >
        {/* Spine Crease Accent (Left Edge) */}
        <div className="absolute top-0 left-0 bottom-0 w-2 sm:w-3 bg-black/15 border-r border-white/10 pointer-events-none" />

        {/* Top Meta Row inside Book */}
        <div className="flex items-start justify-between gap-1 pl-1.5 sm:pl-2 relative z-10">
          <div className="flex items-center gap-1 min-w-0 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white font-mono text-[8px] sm:text-[10px] font-bold tracking-wider uppercase truncate">
              {fileType}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/25 backdrop-blur-xs text-white/90 font-mono text-[8px] sm:text-[9px] font-semibold tracking-wide flex items-center gap-0.5 truncate">
              {workspaceType === 'GROUP' ? (
                <>
                  <Users className="w-2.5 h-2.5 shrink-0" />
                  <span>Group</span>
                </>
              ) : (
                <>
                  <User className="w-2.5 h-2.5 shrink-0" />
                  <span>Personal</span>
                </>
              )}
            </span>
          </div>
          {/* Subtle Bookmark Ribbon */}
          <div className={`w-2.5 sm:w-3.5 h-4 sm:h-5 ${theme.ribbon} rounded-b-xs shadow-xs shrink-0`} />
        </div>

        {/* Center: Book Title inside Cover */}
        <div className="my-auto pl-1.5 sm:pl-2 pr-1 relative z-10 min-w-0 w-full">
          <h3 className="font-serif font-bold text-[11px] sm:text-sm text-white leading-tight line-clamp-3 drop-shadow-xs break-words">
            {doc.title}
          </h3>
          {doc.fileName && (
            <p className="font-mono text-[8px] sm:text-[10px] text-white/60 truncate mt-1">
              {doc.fileName}
            </p>
          )}
        </div>

        {/* Bottom Meta inside Cover */}
        <div className="flex flex-col gap-1 pl-1.5 sm:pl-2 relative z-10 pt-1 border-t border-white/15 text-[8px] sm:text-[10px] font-sans font-medium text-white/80">
          <div className="flex items-center justify-between">
            <span className="truncate">{doc.pageCount ? `${doc.pageCount} Pages` : 'Document'}</span>
            {isProcessing && (
              <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-amber-300 shrink-0">
                <Loader2 className="w-2 sm:w-2.5 h-2 sm:h-2.5 animate-spin" />
                <span>Preparing</span>
              </span>
            )}
            {isReady && <span className="text-[#A3E635] font-bold shrink-0">Ready</span>}
            {isFailed && <span className="text-rose-300 font-bold shrink-0">Failed</span>}
          </div>

          {/* Persistent Reading Progress Bar inside cover for ready documents */}
          {isReady && (
            <div className="w-full bg-black/25 rounded-full h-1 overflow-hidden mt-0.5">
              <div
                className="bg-[#A3E635] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* 2. EXTERNAL TITLE & READING/INGESTION PROGRESS DETAILS BELOW COVER */}
      <div className="mt-2.5 px-0.5 min-w-0 w-full space-y-1">
        <h4
          title={doc.title}
          className="font-display font-bold text-[11px] sm:text-xs text-[#14261D] truncate leading-tight"
        >
          {doc.title}
        </h4>

        {isProcessing ? (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="font-semibold text-[#14261D] truncate flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#E8722C] shrink-0" />
                <span className="truncate">{doc.processingStage || 'Preparing your material...'}</span>
              </span>
              <span className="font-bold text-[#E8722C] shrink-0 ml-1">{doc.processingProgress ?? 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#1B3428]/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E8722C] transition-all duration-300"
                style={{ width: `${Math.max(4, Math.min(100, doc.processingProgress ?? 0))}%` }}
              />
            </div>
            <p className="text-[9px] font-mono text-[#14261D]/60 truncate">
              {doc.completedUnits != null && doc.totalUnits != null
                ? `${doc.completedUnits} of ${doc.totalUnits} completed`
                : doc.processingMessage || 'Preparing text and chapters...'}
            </p>
          </div>
        ) : isFailed ? (
          <div className="space-y-0.5 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-rose-600 font-bold">
              <span>Preparation Failed</span>
              {doc.errorCode && <span className="text-[9px] text-rose-500 font-normal">{doc.errorCode}</span>}
            </div>
            <p className="text-[9px] text-rose-700/80 truncate">
              {doc.errorMessage || 'We could not prepare this material.'}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] font-mono text-[#14261D]/70">
            <span>
              {currentPage && totalPages ? (
                <span className="font-bold text-[#1B3428]">
                  Page {currentPage}/{totalPages} ({progressPercent}%)
                </span>
              ) : (
                <span className="text-[#14261D]/50">Unread</span>
              )}
            </span>
            {lastAccessed && (
              <span className="flex items-center gap-0.5 text-[9px] text-[#14261D]/50 truncate">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{lastAccessed}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. RESPONSIVE ACTION BUTTONS ROW */}
      <div className="flex items-center gap-1.5 mt-2.5 w-full min-w-0">
        {/* Primary Open & Study Button */}
        {isReady ? (
          <Link
            href={targetHref}
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-2 rounded-full bg-[#E8722C] text-white font-display font-bold text-[10px] sm:text-xs text-center shadow-[0_2px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none hover:bg-[#d66522] transition-all flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 shrink-0 hidden xs:block" />
            <span className="truncate">Open Workspace</span>
          </Link>
        ) : isProcessing ? (
          <button
            type="button"
            disabled
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-2 rounded-full bg-[#1B3428]/10 text-[#14261D]/70 font-display font-bold text-[10px] sm:text-xs text-center cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
            <span className="truncate">Preparing ({doc.processingProgress ?? 0}%)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-2 rounded-full bg-rose-100/70 text-rose-700 font-display font-bold text-[10px] sm:text-xs text-center cursor-not-allowed flex items-center justify-center gap-1"
          >
            <span className="truncate">Processing Failed</span>
          </button>
        )}

        {/* Delete Button (Only for Workspace Owner) */}
        {isOwner && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(doc.id, doc.title);
            }}
            disabled={isDeleting}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428] text-[#14261D]/60 hover:text-red-600 hover:border-red-600 shadow-[0_1.5px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
            aria-label={`Delete ${doc.title}`}
            title="Delete workspace"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
