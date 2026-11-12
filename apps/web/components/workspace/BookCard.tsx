'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Users,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import type { DocumentDto, DocumentReadingProgressDto, WorkspaceType } from '@lernivox/contracts';

interface BookCardProps {
  document: DocumentDto;
  workspaceId: string;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  readingProgress?: DocumentReadingProgressDto | null;
  unreadDiscussionCount?: number;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
  onRetry?: (id: string) => Promise<void> | void;
  isRetrying?: boolean;
  onCheckStatus?: (id: string) => Promise<{
    status: string;
    message: string;
    stage?: string;
    progress?: number;
  }>;
}

interface CoverPalette {
  bgClass: string;
  ribbonColor: string;
  pillBg: string;
  spineColor: string;
}

const COVER_PALETTES: CoverPalette[] = [
  {
    bgClass: 'bg-gradient-to-br from-[#1B3C2D] via-[#204635] to-[#142D22]',
    ribbonColor: '#E8722C',
    pillBg: 'bg-white/15 border-white/20 text-[#FAF8F4]',
    spineColor: 'from-black/30 via-black/10 to-transparent',
  },
  {
    bgClass: 'bg-gradient-to-br from-[#D96728] via-[#CC5C20] to-[#B24A16]',
    ribbonColor: '#1B3C2D',
    pillBg: 'bg-white/18 border-white/25 text-[#FAF8F4]',
    spineColor: 'from-black/25 via-black/8 to-transparent',
  },
  {
    bgClass: 'bg-gradient-to-br from-[#28523E] via-[#214635] to-[#173326]',
    ribbonColor: '#E8722C',
    pillBg: 'bg-white/15 border-white/20 text-[#FAF8F4]',
    spineColor: 'from-black/30 via-black/10 to-transparent',
  },
  {
    bgClass: 'bg-gradient-to-br from-[#C4581F] via-[#B44E1A] to-[#983E11]',
    ribbonColor: '#1B3C2D',
    pillBg: 'bg-white/18 border-white/25 text-[#FAF8F4]',
    spineColor: 'from-black/25 via-black/8 to-transparent',
  },
];

function getCoverPalette(id: string): CoverPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return COVER_PALETTES[hash % COVER_PALETTES.length]!;
}

function getFormatBadge(mimeType: string, fileName?: string | null): 'PDF' | 'DOCX' | 'TXT' {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (mime.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'DOCX';
  return 'TXT';
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return 'Study file';
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'Just added';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function resolveIngestionStageLabel(doc: DocumentDto): string {
  const stage = (doc.processingStage || '').toUpperCase();
  const status = (doc.status || '').toUpperCase();
  if (stage === 'WORKER_STARTING') return 'Worker starting...';
  if (stage === 'ENQUEUE_FAILED') return 'Queue connection busy';
  if (stage === 'QUEUED' || status === 'UPLOADED') return 'Queued — Waiting to prepare...';
  if (status === 'EXTRACTING' || stage === 'EXTRACTING') return 'Extracting document text';
  if (status === 'CHUNKING' || stage === 'CHUNKING') return 'Organizing sections';
  if (status === 'EMBEDDING' || stage === 'EMBEDDING') return 'Building search index';
  if (stage === 'INDEXING') return 'Finalizing study workspace';
  return doc.processingMessage || doc.processingStage || 'Preparing material...';
}

export function BookCard({
  document: doc,
  workspaceId,
  workspaceType = 'PERSONAL',
  isOwner = true,
  readingProgress,
  unreadDiscussionCount = 0,
  onDelete,
  onRetry,
  isRetrying = false,
  onCheckStatus,
}: BookCardProps) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<{
    message: string;
    tone: 'ready' | 'info' | 'warn';
  } | null>(null);

  const handleCheckStatusClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCheckingStatus || !onCheckStatus) return;

    setIsCheckingStatus(true);
    setCheckFeedback(null);
    try {
      const res = await onCheckStatus(doc.id);
      setCheckFeedback({
        message: res.message,
        tone: res.status === 'READY' ? 'ready' : res.status === 'FAILED' ? 'warn' : 'info',
      });
    } catch {
      setCheckFeedback({
        message: "We couldn't check the status right now.",
        tone: 'warn',
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const palette = getCoverPalette(doc.id);
  const formatLabel = getFormatBadge(doc.mimeType, doc.fileName);
  const isReady = doc.status === 'READY';
  const isFailed = doc.status === 'FAILED';
  const isIngesting = !isReady && !isFailed;
  const ingestionProgress = doc.processingProgress ?? 0;

  const isWorkerStarting = doc.processingStage === 'WORKER_STARTING';
  const isEnqueueFailed = doc.processingStage === 'ENQUEUE_FAILED';
  const isWaitingInQueue =
    isIngesting && ingestionProgress <= 5 && (!doc.processingStage || doc.processingStage === 'QUEUED');
  const createdMs = doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now();
  const ageSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
  const isDelayedInQueue = isIngesting && ingestionProgress <= 5 && ageSec > 90;

  // Compute REAL persisted reading progress ONLY (never invent or fallback to fake percentages)
  const totalPages = readingProgress?.totalPages || doc.pageCount || null;
  const currentPage = readingProgress?.currentPage || null;
  let readingPercent: number | null = null;
  if (isReady && readingProgress) {
    if (currentPage && totalPages && totalPages > 0) {
      readingPercent = Math.min(100, Math.max(1, Math.round((currentPage / totalPages) * 100)));
    } else if (
      typeof readingProgress.scrollProgress === 'number' &&
      readingProgress.scrollProgress > 0
    ) {
      readingPercent = Math.min(100, Math.max(1, Math.round(readingProgress.scrollProgress * 100)));
    }
  }

  const coverSubtitle = doc.pageCount
    ? `${doc.pageCount} pages • ${formatFileSize(doc.sizeBytes)}`
    : `${formatLabel} • ${formatFileSize(doc.sizeBytes)}`;

  const lastActivityLabel = readingProgress?.lastReadAt
    ? `Last opened ${formatTimeAgo(readingProgress.lastReadAt)}`
    : `Added ${formatTimeAgo(doc.createdAt)}`;

  const workspaceHref = `/dashboard/workspaces/${workspaceId}`;

  return (
    <article
      className="group w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF6EE] border-[1.5px] border-[#1B3428]/15 shadow-[0_6px_18px_rgba(20,38,29,0.09)] hover:shadow-[0_14px_30px_rgba(20,38,29,0.15)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* 1. UPPER REFERENCE BOOK COVER */}
      <Link
        href={workspaceHref}
        className={`relative block w-full min-h-[146px] xs:min-h-[164px] sm:min-h-[205px] p-3 xs:p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden ${palette.bgClass} text-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8722C]`}
      >
        {/* Subtle Spine Shadow Crease */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-2.5 sm:w-3.5 bg-gradient-to-r ${palette.spineColor} border-r border-white/10`}
        />

        {/* Reference Architectural Arch Motif Watermark */}
        <svg
          aria-hidden="true"
          viewBox="0 0 180 180"
          fill="none"
          className="pointer-events-none select-none absolute -right-4 -bottom-4 sm:-right-6 sm:-bottom-6 w-28 h-28 sm:w-40 sm:h-40 text-white/[0.09] transition-transform duration-300 group-hover:scale-105"
        >
          <path
            d="M36 175V92C36 62.1766 60.1766 38 90 38C119.823 38 144 62.1766 144 92V175"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M60 175V96C60 79.4315 73.4315 66 90 66C106.569 66 120 79.4315 120 96V175"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="90" cy="96" r="14" stroke="currentColor" strokeWidth="2" />
        </svg>

        {/* Notched Top-Right Bookmark Ribbon */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 32"
          className="pointer-events-none absolute top-0 right-2.5 sm:right-4 w-4 h-6 sm:w-5 sm:h-7 drop-shadow-sm"
        >
          <path
            d="M0 0H24V31L12 23.5L0 31V0Z"
            fill={palette.ribbonColor}
          />
        </svg>

        {/* Top Row: Format Pill & Shared Group Badge */}
        <div className="relative z-10 flex flex-wrap items-center gap-1 sm:gap-1.5 pr-5 sm:pr-8 pl-1 sm:pl-1.5">
          <span
            className={`px-1.5 py-0.5 sm:px-2.5 rounded border text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-xs ${palette.pillBg}`}
          >
            {formatLabel}
          </span>
          {workspaceType === 'GROUP' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 rounded bg-black/25 border border-white/15 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#FAF8F4]">
              <Users className="w-2.5 h-2.5 shrink-0" />
              <span>Group</span>
            </span>
          )}
          {unreadDiscussionCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#E8722C] text-white text-[9px] sm:text-[10px] font-mono font-bold">
              {unreadDiscussionCount > 9 ? '9+' : unreadDiscussionCount}
            </span>
          )}
        </div>

        {/* Cover Bottom Title & Meta */}
        <div className="relative z-10 pl-1 sm:pl-1.5 mt-auto pt-4 sm:pt-8">
          <h3 className="font-display font-bold text-xs xs:text-[13px] sm:text-[17px] text-[#FAF8F4] leading-snug line-clamp-2 drop-shadow-2xs">
            {doc.title}
          </h3>
          <p className="font-sans text-[10px] sm:text-xs text-white/75 mt-0.5 sm:mt-1 truncate">
            {coverSubtitle}
          </p>
        </div>
      </Link>

      {/* 2. LOWER CREAM INFO & ACTION STRIP (#FAF6EE) */}
      <div className="bg-[#FAF6EE] px-2.5 py-2.5 xs:px-3 xs:py-3 sm:px-5 sm:py-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={workspaceHref} className="block focus-visible:outline-none">
            <h4 className="font-display font-bold text-xs xs:text-[13px] sm:text-[15px] text-[#14261D] leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-[#E8722C] transition-colors">
              {doc.title}
            </h4>
          </Link>

          {/* Truthful Progress / Ingestion Status Slot */}
          <div className="mt-2 sm:mt-2.5 min-h-[2.5rem] sm:min-h-[3.25rem] flex flex-col justify-center">
            {isReady ? (
              readingPercent !== null && readingPercent > 0 ? (
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <div className="flex-1 h-1.5 rounded-full bg-[#1B3428]/12 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E8722C] transition-all duration-300"
                        style={{ width: `${readingPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-[#14261D] tabular-nums shrink-0">
                      {readingPercent}%
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-sans text-[#14261D]/60 truncate">
                    {currentPage && totalPages
                      ? `Page ${currentPage} of ${totalPages}`
                      : 'Reading progress saved'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-sans text-[#4A7D64] font-medium min-w-0">
                  <FileCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">
                    {doc.pageCount
                      ? `Ready • ${doc.pageCount} pages`
                      : 'Ready to read'}
                  </span>
                </div>
              )
            ) : isFailed ? (
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-rose-700 min-w-0">
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">
                    {doc.errorMessage || "Couldn't prepare book."}
                  </span>
                </div>
                {isOwner && onRetry && (
                  <button
                    type="button"
                    disabled={isRetrying}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRetry(doc.id);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[9px] sm:text-[11px] font-display font-bold text-rose-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    <span>Retry</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-1.5">
                {ingestionProgress > 5 ? (
                  <>
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-[#14261D]/80">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 truncate">
                        <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-[#E8722C] shrink-0" />
                        <span className="truncate">{resolveIngestionStageLabel(doc)}</span>
                      </span>
                      <span className="font-mono font-bold text-[#14261D] tabular-nums shrink-0">
                        {ingestionProgress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#1B3428]/12 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#E8722C] transition-all duration-300"
                        style={{ width: `${ingestionProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-medium text-[#14261D]/75 truncate">
                        <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-[#E8722C] shrink-0" />
                        <span className="truncate">
                          {isDelayedInQueue
                            ? 'Delayed — Waiting for worker'
                            : isWorkerStarting
                              ? 'Worker starting...'
                              : isEnqueueFailed
                                ? 'Queue connection busy'
                                : isWaitingInQueue
                                  ? 'Queued — Waiting to prepare...'
                                  : resolveIngestionStageLabel(doc)}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      {onCheckStatus && (
                        <button
                          type="button"
                          disabled={isCheckingStatus}
                          onClick={handleCheckStatusClick}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FAF8F4] hover:bg-white border border-[#1B3428]/20 text-[9px] sm:text-[10px] font-display font-bold text-[#14261D] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isCheckingStatus ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-2.5 h-2.5" />
                          )}
                          <span>Check status</span>
                        </button>
                      )}
                      {(isDelayedInQueue || isEnqueueFailed) && isOwner && onRetry && (
                        <button
                          type="button"
                          disabled={isRetrying}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRetry(doc.id);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FBE8DC] hover:bg-[#F9D8C0] border border-[#E8722C]/35 text-[9px] sm:text-[10px] font-display font-bold text-[#B34E18] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span>Retry processing</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {checkFeedback && (
                  <p
                    className={`text-[9px] sm:text-[10px] leading-tight flex items-center gap-1 ${
                      checkFeedback.tone === 'ready'
                        ? 'text-emerald-700 font-semibold'
                        : checkFeedback.tone === 'warn'
                          ? 'text-rose-700'
                          : 'text-[#14261D]/70'
                    }`}
                  >
                    {checkFeedback.tone === 'ready' && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />}
                    <span className="truncate">{checkFeedback.message}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Metadata & Action Row */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#1B3428]/10 flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-sans text-[#14261D]/60 min-w-0">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#14261D]/45" />
            <span className="truncate">{lastActivityLabel}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {isOwner && onDelete && (
              <button
                type="button"
                aria-label={`Delete ${doc.title}`}
                title="Delete material"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(doc.id, doc.title);
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#14261D]/45 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <Link
              href={workspaceHref}
              aria-label={`Open ${doc.title}`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1B3C2D] text-[#FAF8F4] flex items-center justify-center hover:bg-[#E8722C] transition-colors shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
