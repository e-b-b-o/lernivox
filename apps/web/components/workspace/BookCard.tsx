'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Trash2, Loader2, Users, User, Clock, BookOpen, RotateCw, AlertCircle } from 'lucide-react';
import type { DocumentDto, DocumentReadingProgressDto, WorkspaceType } from '@lernivox/contracts';

interface BookCardProps {
  document: DocumentDto;
  workspaceId?: string;
  workspaceType?: WorkspaceType;
  isOwner?: boolean;
  readingProgress?: DocumentReadingProgressDto | null;
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
  onRetry,
  isRetrying = false,
  onCheckStatus,
}: BookCardProps) {
  // Deterministic palette pick from UUID
  const hash = doc.id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const theme = COVER_THEMES[hash % COVER_THEMES.length]!;

  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    message: string;
    type: 'info' | 'success' | 'warning';
  } | null>(null);

  const handleCheckStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckingStatus || !onCheckStatus) return;
    setIsCheckingStatus(true);
    try {
      const res = await onCheckStatus(doc.id);
      const isSuccess = res.status === 'READY';
      const isWarn = res.status === 'FAILED' || res.status === 'ERROR';
      setFeedback({
        message: res.message,
        type: isSuccess ? 'success' : isWarn ? 'warning' : 'info',
      });
      setTimeout(() => setFeedback(null), 6000);
    } catch {
      setFeedback({
        message: "We couldn't check the status right now. Please try again.",
        type: 'warning',
      });
      setTimeout(() => setFeedback(null), 6000);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const isReady = doc.status === 'READY';
  const isFailed = doc.status === 'FAILED';
  const isWaiting =
    !isReady &&
    !isFailed &&
    (doc.status === 'UPLOADED' ||
      doc.processingStage === 'QUEUED' ||
      doc.processingProgress == null ||
      doc.processingProgress <= 5);
  const isProcessing = !isReady && !isFailed && !isWaiting;

  // Real elapsed time calculation from persisted timestamps
  const now = Date.now();
  const createdAtMs = doc.createdAt ? new Date(doc.createdAt).getTime() : now;
  const updatedAtMs = doc.updatedAt ? new Date(doc.updatedAt).getTime() : createdAtMs;
  const elapsedSinceCreatedSec = Math.max(0, Math.floor((now - createdAtMs) / 1000));
  const elapsedSinceUpdatedSec = Math.max(0, Math.floor((now - updatedAtMs) / 1000));

  // Taking longer than expected: waiting > 40s without starting or processing unchanged > 75s
  const isDelayed =
    !isReady &&
    !isFailed &&
    ((isWaiting && elapsedSinceCreatedSec > 40) || (isProcessing && elapsedSinceUpdatedSec > 75));

  const isStale =
    !isReady &&
    !isFailed &&
    ((isWaiting && elapsedSinceCreatedSec > 90) || (isProcessing && elapsedSinceUpdatedSec > 150));

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
    <div className="w-full min-w-0 max-w-full h-full flex flex-col justify-between group select-none">
      {/* 1. PHYSICAL 3D BOOK COVER (Real 1:1.45 book proportions with spine and page edge) */}
      <Link
        href={isReady ? targetHref : '#'}
        aria-label={isReady ? `Open and study ${doc.title}` : doc.title}
        onClick={(e) => {
          if (!isReady) e.preventDefault();
        }}
        className={`relative w-full aspect-[1/1.45] rounded-l-xs rounded-r-xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden transition-all duration-300 border-[1.5px] border-[#1B3428]/35 border-r-[4px] border-r-[#FAF8F4]/80 shadow-[0_4px_12px_rgba(27,52,40,0.12),0_2px_4px_rgba(27,52,40,0.08),inset_-2px_0_4px_rgba(0,0,0,0.2)] ${
          isReady
            ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_14px_28px_-6px_rgba(27,52,40,0.25),0_6px_10px_rgba(27,52,40,0.12),inset_-2px_0_4px_rgba(0,0,0,0.2)] active:translate-y-0'
            : 'cursor-default opacity-90'
        } ${theme.bg} ${theme.text}`}
      >
        {/* Spine Crease Accent (Left Edge) */}
        <div className="absolute top-0 left-0 bottom-0 w-3 sm:w-4 bg-gradient-to-r from-black/35 via-black/15 to-transparent border-r border-white/10 pointer-events-none" />

        {/* Top Meta Row inside Book */}
        <div className="flex items-start justify-between gap-1 pl-2 sm:pl-3 relative z-10">
          <div className="flex items-center gap-1 min-w-0 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white font-mono text-[8px] sm:text-[9px] font-bold tracking-wider uppercase truncate">
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
          {/* Triangular Notched Bookmark Ribbon */}
          <div
            className={`w-3 sm:w-3.5 h-5 sm:h-6 ${theme.ribbon} shadow-xs shrink-0 -mt-3 sm:-mt-4 transition-transform group-hover:translate-y-0.5`}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
          />
        </div>

        {/* Center: Book Title inside Cover with Natural Serif Wrapping */}
        <div className="my-auto pl-2 sm:pl-3 pr-1.5 relative z-10 min-w-0 w-full space-y-1">
          <div className="w-4 h-0.5 bg-white/30 rounded-full mb-1" />
          <h3 className="font-serif font-bold text-xs sm:text-sm md:text-[15px] text-white leading-snug line-clamp-3 drop-shadow-xs break-words">
            {doc.title}
          </h3>
          <p className="font-sans text-[8px] sm:text-[9px] font-medium tracking-wide uppercase text-white/60 truncate pt-0.5">
            {doc.fileName ? doc.fileName.replace(/\.[^/.]+$/, '') : 'Lernivox Edition'}
          </p>
        </div>

        {/* Bottom Meta inside Cover */}
        <div className="flex flex-col gap-1 pl-2 sm:pl-3 relative z-10 pt-1.5 border-t border-white/15 text-[8px] sm:text-[10px] font-sans font-medium text-white/80">
          <div className="flex items-center justify-between">
            <span className="truncate">{doc.pageCount ? `${doc.pageCount} Pages` : 'Document'}</span>
            {isReady && <span className="text-[#A3E635] font-bold shrink-0">Ready</span>}
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
      <div className="mt-2.5 px-0.5 min-w-0 w-full flex-1 flex flex-col justify-between space-y-1.5">
        <h4
          title={doc.title}
          className="font-display font-bold text-xs sm:text-sm text-[#14261D] line-clamp-2 min-h-[2.5rem] leading-snug break-words"
        >
          {doc.title}
        </h4>

        {/* Reserved Status & Progress Slot for Perfect Baseline Alignment */}
        <div className="min-h-[3.25rem] flex flex-col justify-center">
          {feedback ? (
            /* Visible Feedback from User Action (e.g. Check Status) */
            <div
              className={`px-2 py-1.5 rounded-lg text-[10px] font-sans font-medium flex items-center gap-1.5 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-[#E2EBD8] text-[#1B3428] border border-[#497E64]/30'
                  : feedback.type === 'warning'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                  : 'bg-[#F4F0E5] text-[#14261D] border border-[#1B3428]/15'
              }`}
            >
              <span className="truncate">{feedback.message}</span>
            </div>
          ) : isStale ? (
            /* Stale / Delayed: Taking longer than expected */
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-amber-900 truncate flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="truncate">Taking longer than expected</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-amber-200/50 overflow-hidden">
                <div className="h-full rounded-full bg-amber-600 animate-pulse w-full" />
              </div>
              <p className="text-[9px] font-sans text-amber-900/80 leading-tight truncate">
                Your upload is safe. We&apos;re checking what happened.
              </p>
            </div>
          ) : isWaiting ? (
            /* Waiting in queue: Honest waiting state without fake 0% */
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-[#14261D] truncate flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
                  <span className="truncate">
                    {isDelayed ? 'Starting processing service...' : 'Waiting to prepare...'}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1B3428]/10 overflow-hidden">
                <div className="h-full rounded-full bg-[#E8722C]/40 animate-pulse w-full" />
              </div>
              <p className="text-[9px] font-sans text-[#14261D]/65 leading-tight truncate">
                {isDelayed
                  ? 'Our processing service is taking a little longer to start. Your book is safely uploaded.'
                  : 'Your book is uploaded and waiting to be prepared.'}
              </p>
            </div>
          ) : isProcessing ? (
            /* Active Processing with real stages & % */
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-[#14261D] truncate flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
                  <span className="truncate">{doc.processingStage || 'Preparing material...'}</span>
                </span>
                <span className="font-bold text-[#E8722C] shrink-0 ml-1">
                  {doc.processingProgress != null ? `${doc.processingProgress}%` : ''}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1B3428]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E8722C] transition-all duration-300"
                  style={{ width: `${Math.max(5, Math.min(100, doc.processingProgress ?? 10))}%` }}
                />
              </div>
              <p className="text-[9px] font-mono text-[#14261D]/65 truncate">
                {doc.completedUnits != null && doc.totalUnits != null
                  ? `${doc.completedUnits} of ${doc.totalUnits} sections completed`
                  : doc.processingMessage || 'Extracting text and organizing chapters...'}
              </p>
            </div>
          ) : isFailed ? (
            /* Terminal Failed state with clear guidance */
            <div className="space-y-0.5 pt-0.5">
              <p className="text-[10px] font-sans font-medium text-amber-900/90 leading-tight">
                We couldn&apos;t prepare this book. Please try again.
              </p>
              <p className="text-[9px] font-sans text-[#14261D]/60 truncate">
                Your uploaded book is still here.
              </p>
            </div>
          ) : (
            /* Ready: Page numbers or Unread with clean progress bar */
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#14261D]/70">
                <span>
                  {currentPage && totalPages ? (
                    <span className="font-bold text-[#1B3428]">
                      Page {currentPage}/{totalPages}
                    </span>
                  ) : (
                    <span className="text-[#14261D]/55">Ready to study</span>
                  )}
                </span>
                <span className="font-bold text-[#497E64]">
                  {progressPercent > 0 ? `${progressPercent}%` : '0%'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1B3428]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#497E64] transition-all duration-300"
                  style={{ width: `${Math.max(progressPercent, currentPage ? 4 : 0)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RESPONSIVE ACTION BUTTONS ROW (Consistent Pinned Baseline) */}
      <div className="mt-auto pt-2.5 flex items-center gap-1.5 w-full min-w-0">
        {/* Primary Open & Study Button */}
        {isReady ? (
          <Link
            href={targetHref}
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-[10px] sm:text-xs text-center shadow-[0_2px_0_0_#B26E45] active:translate-y-0.5 active:shadow-none hover:bg-[#d66522] transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 shrink-0 hidden xs:block" />
            <span className="truncate">Open Workspace</span>
          </Link>
        ) : isFailed ? (
          /* Failed state: dedicated Retry processing button */
          isOwner && onRetry ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry(doc.id);
              }}
              disabled={isRetrying}
              className="flex-1 min-w-0 py-1.5 sm:py-2 px-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-[10px] sm:text-xs text-center shadow-[0_2px_0_0_#0D1B14] active:translate-y-0.5 active:shadow-none hover:bg-[#264838] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={`Retry processing ${doc.title}`}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
                  <span className="truncate">Retrying...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-3 h-3 shrink-0" />
                  <span className="truncate">Retry processing</span>
                </>
              )}
            </button>
          ) : null
        ) : isDelayed || isStale ? (
          /* Delayed / Stale state: genuine Check status button */
          <button
            type="button"
            onClick={handleCheckStatusClick}
            disabled={isCheckingStatus}
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-[10px] sm:text-xs text-center shadow-[0_2px_0_0_#0D1B14] active:translate-y-0.5 active:shadow-none hover:bg-[#264838] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={`Check status for ${doc.title}`}
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
                <span className="truncate">Checking...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3 h-3 shrink-0" />
                <span className="truncate">Check status</span>
              </>
            )}
          </button>
        ) : (
          /* In-flight processing/waiting: NO REDUNDANT SECONDARY PILL */
          <div className="flex-1 min-w-0 flex items-center text-[10px] font-mono text-[#14261D]/55 px-1 py-1">
            <span className="flex items-center gap-1.5 truncate">
              <Loader2 className="w-3 h-3 animate-spin text-[#E8722C] shrink-0" />
              <span className="truncate">
                {isWaiting ? 'Waiting in queue...' : 'Processing in background...'}
              </span>
            </span>
          </div>
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
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/25 text-[#14261D]/60 hover:text-red-600 hover:border-red-600 shadow-[0_1.5px_0_0_#1B3428]/20 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
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
