'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Bookmark,
  FileText,
  HelpCircle,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Loader2,
  BookOpen,
  AlertCircle,
  Eye,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowLeft,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type {
  DocumentDto,
  DocumentOutlineItemDto,
  DocumentReaderContentDto,
  DocumentBookmarkDto,
} from '@lernivox/contracts';
import { scrollToInternalElement } from '../../lib/scroll-utils';

// Configure PDF.js worker to local static file in /public/pdf.worker.min.mjs
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ContinuousPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  pageWidth: number;
  aspectRatio: number;
  isActiveCitation: boolean;
  onDimensionsDetected?: (aspectRatio: number) => void;
}

/**
 * High-performance virtualized page renderer for continuous vertical PDF flow.
 * Uses IntersectionObserver to render pages only when near the viewport,
 * avoiding canvas memory exhaustion on 400+ page textbooks.
 */
const ContinuousPdfPage = memo(function ContinuousPdfPage({
  pdfDoc,
  pageNumber,
  pageWidth,
  aspectRatio,
  isActiveCitation,
  onDimensionsDetected,
}: ContinuousPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [actualHeight, setActualHeight] = useState<number>(Math.round(pageWidth * aspectRatio));

  // Observe container intersection with generous margins for seamless scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsNearViewport(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: '1000px 0px 1000px 0px', // Preload 1000px ahead/behind
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update calculated height when width or aspect ratio changes
  useEffect(() => {
    setActualHeight(Math.round(pageWidth * aspectRatio));
  }, [pageWidth, aspectRatio]);

  // Render PDF page into canvas and text layer when near viewport
  useEffect(() => {
    if (!isNearViewport || !pdfDoc) return;

    let isCancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let textLayerInstance: { cancel?: () => void } | null = null;

    setIsRendering(true);

    pdfDoc
      .getPage(pageNumber)
      .then(async (page) => {
        if (isCancelled || !canvasRef.current) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const detectedRatio = unscaledViewport.height / unscaledViewport.width;
        setActualHeight(Math.round(pageWidth * detectedRatio));

        if (pageNumber === 1 && onDimensionsDetected) {
          onDimensionsDetected(detectedRatio);
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Display scale matching container
        const displayScale = pageWidth / unscaledViewport.width;
        const displayViewport = page.getViewport({ scale: displayScale });

        // Retina / Hi-DPI scaling for crisp canvas rendering
        const pixelRatio = window.devicePixelRatio || 1;
        const renderScale = displayScale * pixelRatio;
        const renderViewport = page.getViewport({ scale: renderScale });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(pageWidth)}px`;
        canvas.style.height = `${Math.floor(displayViewport.height)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: renderViewport,
        };

        const task = page.render(renderContext);
        renderTask = task;
        await task.promise;

        if (isCancelled || !textLayerRef.current) return;

        // Render PDF.js Text Layer for native text selection and copying
        const textLayerDiv = textLayerRef.current;
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(pageWidth)}px`;
        textLayerDiv.style.height = `${Math.floor(displayViewport.height)}px`;
        textLayerDiv.style.setProperty('--scale-factor', `${displayScale}`);

        try {
          const textContent = await page.getTextContent();
          if (isCancelled) return;

          if (typeof pdfjsLib.TextLayer === 'function') {
            const textLayer = new pdfjsLib.TextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport: displayViewport,
            });
            textLayerInstance = textLayer;
            await textLayer.render();
          }
        } catch (textErr) {
          console.warn(`Text layer rendering failed for page ${pageNumber}:`, textErr);
        }
      })
      .then(() => {
        if (!isCancelled) {
          setIsRendering(false);
        }
      })
      .catch((err) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
        if (!isCancelled) {
          setIsRendering(false);
        }
      });

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation exception
        }
      }
      if (textLayerInstance && typeof textLayerInstance.cancel === 'function') {
        try {
          textLayerInstance.cancel();
        } catch {
          // ignore cancellation exception
        }
      }
    };
  }, [isNearViewport, pdfDoc, pageNumber, pageWidth, onDimensionsDetected]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      ref={containerRef}
      style={{
        width: `${pageWidth}px`,
        maxWidth: '100%',
        minHeight: `${actualHeight}px`,
      }}
      className={`relative bg-white rounded-lg transition-all duration-200 overflow-hidden flex flex-col items-center shrink-0 shadow-md mx-auto ${
        isActiveCitation
          ? 'border-[2.5px] border-[#E8722C] ring-4 ring-[#E8722C]/25 shadow-xl'
          : 'border border-[#1B3428]/15 hover:shadow-lg'
      }`}
    >
      {/* Active Citation Header Pill */}
      {isActiveCitation && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-[#E8722C] text-white font-mono text-[10px] font-bold shadow-sm flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>Verified Citation Passage</span>
        </div>
      )}

      {/* Page Number Label in Corner for Reader Context */}
      <div className="absolute bottom-2 right-3 z-10 px-2 py-0.5 rounded bg-black/5 text-[#14261D]/50 font-mono text-[9px] pointer-events-none select-none">
        p. {pageNumber}
      </div>

      {isNearViewport ? (
        <div
          className="relative w-full overflow-hidden"
          style={{ width: `${pageWidth}px`, height: `${actualHeight}px` }}
        >
          {isRendering && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs flex items-center justify-center z-10 transition-opacity pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin text-[#E8722C]" />
            </div>
          )}
          <canvas ref={canvasRef} className="block pdf-canvas pointer-events-none select-none" />
          <div ref={textLayerRef} className="textLayer select-text" />
        </div>
      ) : (
        /* Lightweight Skeleton Card while out of viewport to preserve scroll height */
        <div className="flex flex-col items-center justify-center p-8 text-[#14261D]/30 select-none min-h-[300px]">
          <div className="w-8 h-8 rounded-full border-2 border-[#1B3428]/10 border-t-[#E8722C] animate-spin mb-2" />
          <span className="font-mono text-xs font-bold text-[#14261D]/40">
            Page {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
});

export interface DocumentReaderProps {
  document: DocumentDto | null;
  readerContent: DocumentReaderContentDto | null;
  loadingContent: boolean;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  totalPages: number;
  onTotalPagesDetected?: (total: number) => void;
  onNativeOutlineLoaded?: (items: DocumentOutlineItemDto[]) => void;
  activeCitationChunkId: string | null;
  citationPage?: number | null;
  onExplainParagraph: (text: string, pageNumber: number) => void;
  onPracticeSelection?: (pageNumber: number) => void;
  onAddBookmark: (pageNumber: number) => void;
  bookmarks?: DocumentBookmarkDto[];
  onToggleBookmark?: (pageNumber: number) => void;
  fileUrl: string;
  accessToken?: string;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSelectionActiveChange?: (isActive: boolean) => void;
}

function DocumentReaderComponent({
  document: doc,
  readerContent,
  loadingContent,
  currentPage,
  onPageChange,
  totalPages,
  onTotalPagesDetected,
  onNativeOutlineLoaded,
  activeCitationChunkId,
  citationPage,
  onExplainParagraph,
  onPracticeSelection,
  onAddBookmark,
  bookmarks,
  onToggleBookmark,
  fileUrl,
  accessToken,
  isFocusMode = false,
  onToggleFocusMode,
  onSelectionActiveChange,
}: DocumentReaderProps) {
  const isPdf = Boolean(doc?.mimeType === 'application/pdf' || doc?.fileName?.endsWith('.pdf'));

  // Standardized reader zoom and navigation
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [pageJumpInput, setPageJumpInput] = useState<string>('');

  // Reader Scroll Container Measurement for Container Width Expansion
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(860);
  const [documentAspectRatio, setDocumentAspectRatio] = useState<number>(1.414);

  // Current visible page tracked dynamically
  const [visiblePage, setVisiblePage] = useState<number>(currentPage || 1);
  const visiblePageRef = useRef<number>(visiblePage);
  visiblePageRef.current = visiblePage;

  // Track user scroll vs program-initiated scroll
  const isProgrammaticScrollRef = useRef(false);
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledToInitialRef = useRef(false);

  // PDF Document Lifecycle
  const [lifecycle, setLifecycle] = useState<
    'INITIALIZING' | 'FETCHING' | 'LOADED' | 'ERROR'
  >(isPdf ? 'INITIALIZING' : 'LOADED');
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Text Selection State for Contextual Floating Action Toolbar
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [highlightRects, setHighlightRects] = useState<
    Array<{ top: number; left: number; width: number; height: number }>
  >([]);

  const activeLoadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const loadedDocIdRef = useRef<string | null>(null);

  // Callback refs to maintain stable effect dependencies
  const onTotalPagesDetectedRef = useRef(onTotalPagesDetected);
  onTotalPagesDetectedRef.current = onTotalPagesDetected;

  const onNativeOutlineLoadedRef = useRef(onNativeOutlineLoaded);
  onNativeOutlineLoadedRef.current = onNativeOutlineLoaded;

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const onSelectionActiveChangeRef = useRef(onSelectionActiveChange);
  onSelectionActiveChangeRef.current = onSelectionActiveChange;

  // Stable aspect ratio callback to prevent ContinuousPdfPage memo invalidation
  const handleDimensionsDetected = useCallback((ratio: number) => {
    setDocumentAspectRatio(ratio);
  }, []);

  // Measure container width responsively to expand PDF to available space
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleResize = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  // Sync page jump input with current visible page
  useEffect(() => {
    setPageJumpInput(String(visiblePage));
  }, [visiblePage]);

  // Load PDF Document
  useEffect(() => {
    if (!isPdf || !doc?.id || !fileUrl) {
      if (!isPdf) setLifecycle('LOADED');
      return;
    }

    if (loadedDocIdRef.current === doc.id && pdfDoc) {
      return;
    }

    let isCancelled = false;
    setLifecycle('FETCHING');
    setPdfError(null);

    if (activeLoadingTaskRef.current) {
      try {
        activeLoadingTaskRef.current.destroy();
      } catch {
        // ignore cancellation
      }
      activeLoadingTaskRef.current = null;
    }

    const authorizedUrl = accessToken ? `${fileUrl}?token=${accessToken}` : fileUrl;

    const loadingTask = pdfjsLib.getDocument({
      url: authorizedUrl,
      withCredentials: true,
    });
    activeLoadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then(async (docProxy) => {
        if (isCancelled) return;
        activeLoadingTaskRef.current = null;
        loadedDocIdRef.current = doc.id;
        setPdfDoc(docProxy);
        setLifecycle('LOADED');

        if (onTotalPagesDetectedRef.current && docProxy.numPages > 0) {
          onTotalPagesDetectedRef.current(docProxy.numPages);
        }

        // Native PDF Outline Extraction
        try {
          const rawOutline = await docProxy.getOutline();
          if (rawOutline && rawOutline.length > 0 && onNativeOutlineLoadedRef.current) {
            const resolvedItems: DocumentOutlineItemDto[] = [];

            const resolveNode = async (node: any, level = 1) => {
              let targetPage = 1;
              let dest = node.dest;
              if (typeof dest === 'string') {
                dest = await docProxy.getDestination(dest);
              }
              if (Array.isArray(dest) && dest[0]) {
                const pIndex = await docProxy.getPageIndex(dest[0]);
                targetPage = pIndex + 1;
              }

              resolvedItems.push({
                id: `pdf-outline-${node.title}-${targetPage}-${resolvedItems.length}`,
                title: node.title,
                pageNumber: targetPage,
                level,
              });

              if (node.items && node.items.length > 0) {
                for (const child of node.items) {
                  await resolveNode(child, level + 1);
                }
              }
            };

            for (const root of rawOutline) {
              await resolveNode(root, 1);
            }

            if (resolvedItems.length > 0 && onNativeOutlineLoadedRef.current) {
              onNativeOutlineLoadedRef.current(resolvedItems);
            }
          }
        } catch (err) {
          console.warn('Native PDF outline extraction skipped:', err);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        activeLoadingTaskRef.current = null;
        console.error('Failed to load PDF document:', err);
        setPdfError(err instanceof Error ? err.message : 'Failed to load PDF file');
        setLifecycle('ERROR');
      });

    return () => {
      isCancelled = true;
    };
  }, [isPdf, doc?.id, fileUrl, accessToken, retryTrigger]);

  // Smooth programmatic navigation to specific page (strictly container-scoped)
  const scrollToPage = useCallback((pageNum: number, smooth = true) => {
    const total = pdfDoc ? pdfDoc.numPages : totalPages || 1;
    const clamped = Math.max(1, Math.min(pageNum, total));
    setVisiblePage(clamped);
    visiblePageRef.current = clamped;
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }, [pdfDoc, totalPages]);

  // Initial scroll to saved currentPage upon document load
  useEffect(() => {
    if (pdfDoc && !hasScrolledToInitialRef.current && currentPage > 1) {
      hasScrolledToInitialRef.current = true;
      scrollToPage(currentPage, false);
    }
  }, [pdfDoc, currentPage, scrollToPage]);

  // Respond to parent currentPage changes (e.g., from TOC outline or bookmark click)
  useEffect(() => {
    if (currentPage && currentPage !== visiblePageRef.current) {
      scrollToPage(currentPage, true);
    }
  }, [currentPage, scrollToPage]);

  // Active citation scroll
  useEffect(() => {
    if (citationPage && citationPage > 0 && citationPage !== visiblePageRef.current) {
      scrollToPage(citationPage, true);
    }
  }, [citationPage, scrollToPage]);

  // Track scroll position if needed
  const handleScroll = useCallback(() => {
    // Paginated reading preserves scroll at top
  }, []);

  const handleRetryLoad = () => {
    loadedDocIdRef.current = null;
    hasScrolledToInitialRef.current = false;
    setPdfDoc(null);
    setRetryTrigger((prev) => prev + 1);
  };

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionCoords(null);
    setHighlightRects([]);
    onSelectionActiveChangeRef.current?.(false);
  }, []);

  // Robust Native Text Selection Tracking for PDF and Workspace Text
  const handleSelectionUpdate = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 3) {
      const container = scrollContainerRef.current;
      if (!container) return;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const isInsideReader =
        container.contains(commonAncestor) ||
        (commonAncestor.nodeType === Node.TEXT_NODE &&
          commonAncestor.parentElement &&
          container.contains(commonAncestor.parentElement));

      if (!isInsideReader) {
        clearSelection();
        return;
      }

      setSelectedText(text);
      const containerRect = container.getBoundingClientRect();
      const rect = range.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Clamp X position so the toolbar is never clipped horizontally
      const rawX = rect.left + rect.width / 2;
      const clampedX = Math.max(120, Math.min(viewportWidth - 120, rawX));

      // Position above selection, or below if near top of viewport
      const y = rect.top < 60 ? rect.bottom + 12 : rect.top - 10;

      setSelectionCoords({ x: clampedX, y });

      // Calculate non-destructive persistent highlight overlay rects
      try {
        const domRects = Array.from(range.getClientRects());
        if (domRects.length > 0) {
          const rects = domRects.map((r) => ({
            top: r.top - containerRect.top + container.scrollTop,
            left: r.left - containerRect.left + container.scrollLeft,
            width: r.width,
            height: r.height,
          }));
          setHighlightRects(rects);
        }
      } catch (err) {
        console.warn('Could not extract selection client rects:', err);
      }

      onSelectionActiveChangeRef.current?.(true);
    }
  }, [clearSelection]);

  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(handleSelectionUpdate, 20);
    };

    const onTouchEnd = () => {
      setTimeout(handleSelectionUpdate, 100);
    };

    const onMouseDown = (e: MouseEvent) => {
      // Clear persistent highlight when clicking outside the selection toolbar
      const target = e.target as HTMLElement | null;
      if (target?.closest('#selection-toolbar')) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        clearSelection();
      }
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [handleSelectionUpdate, clearSelection]);

  const handleCopyText = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopiedRecently(true);
      setTimeout(() => setCopiedRecently(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageJumpInput.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (totalPages || 1)) {
      scrollToPage(parsed, true);
      onPageChange(parsed);
    } else {
      setPageJumpInput(String(visiblePage));
    }
  };

  // Fluid responsive page width calculation: eliminates excessive beige gutters
  const basePageWidth = isFocusMode
    ? Math.min(containerWidth - 32, 1024)
    : containerWidth < 640
    ? Math.round(containerWidth * 0.96)
    : containerWidth < 1024
    ? Math.min(Math.round(containerWidth * 0.94), 768)
    : Math.min(containerWidth - 64, 896);
  const calculatedPageWidth = Math.round(basePageWidth * zoomLevel);

  const totalDocPages = pdfDoc ? pdfDoc.numPages : totalPages || 1;
  const authorizedEmbedUrl = useMemo(() => {
    const zoomParam = Math.round(zoomLevel * 100);
    const separator = fileUrl.includes('?') ? '&' : '?';
    const baseUrl = accessToken ? `${fileUrl}${separator}token=${accessToken}` : fileUrl;
    return `${baseUrl}#page=${visiblePage}&zoom=${zoomParam}`;
  }, [fileUrl, accessToken, visiblePage, zoomLevel]);

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#F4F0E5] relative w-full">
      {/* 1. READER SECONDARY TOOLBAR */}
      {isFocusMode ? (
        /* Minimal Desktop Zen Focus Mode Ghost Bar (~36px) */
        <div className="h-9 bg-[#FAF8F4]/90 backdrop-blur-xs border-b border-[#1B3428]/10 px-4 flex items-center justify-between shrink-0 select-none z-20 shadow-2xs relative text-xs">
          {/* Left: Exit Focus Button */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1B3428]/5 hover:bg-[#1B3428]/10 text-[#14261D] font-display font-bold text-xs transition-colors cursor-pointer"
            title="Exit Focus Mode (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Focus (Esc)</span>
          </button>

          {/* Center: Minimal Page Status */}
          <div className="font-mono text-xs font-bold text-[#14261D]/80">
            Page {visiblePage} of {totalDocPages}
          </div>

          {/* Right: Bookmark Toggle */}
          {(() => {
            const isBookmarked = Boolean(bookmarks?.some((b) => b.pageNumber === visiblePage));
            return (
              <button
                type="button"
                onClick={() => {
                  if (onToggleBookmark) {
                    onToggleBookmark(visiblePage);
                  } else {
                    onAddBookmark(visiblePage);
                  }
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isBookmarked ? 'text-[#E8722C]' : 'text-[#14261D]/60 hover:text-[#14261D]'
                }`}
                title={isBookmarked ? `Remove Bookmark (Page ${visiblePage})` : `Bookmark Page ${visiblePage}`}
                aria-label={isBookmarked ? `Remove Bookmark (Page ${visiblePage})` : `Bookmark Page ${visiblePage}`}
              >
                <Bookmark
                  className={`w-4 h-4 transition-colors ${
                    isBookmarked ? 'fill-[#E8722C] text-[#E8722C]' : ''
                  }`}
                />
              </button>
            );
          })()}
        </div>
      ) : (
        /* Standard Reader Secondary Toolbar (Desktop; Mobile uses unified 2-row header) */
        <div className="hidden md:flex min-h-12 py-1 bg-[#FAF8F4] border-b border-[#1B3428]/15 px-3 sm:px-4 md:px-6 items-center justify-between shrink-0 select-none z-20 shadow-2xs relative gap-2 sm:gap-4">
          {/* Left: Document Identity / Title */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <div className="w-6 h-6 rounded-md bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center shrink-0 border border-[#E8722C]/20">
              <FileText className="w-3.5 h-3.5" />
            </div>
            {doc?.title && (
              <span
                className="text-xs font-display font-bold text-[#14261D] truncate max-w-[130px] lg:max-w-[200px] xl:max-w-[300px]"
                title={doc.title}
              >
                {doc.title}
              </span>
            )}
          </div>

          {/* Center: Authoritative Page Navigation */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mx-auto">
            <button
              type="button"
              onClick={() => {
                if (visiblePage > 1) {
                  const target = visiblePage - 1;
                  scrollToPage(target, true);
                  onPageChange(target);
                }
              }}
              disabled={visiblePage <= 1}
              className="w-7 h-7 rounded-lg border border-[#1B3428]/15 bg-[#FAF8F4] flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form
              onSubmit={handlePageJumpSubmit}
              className="flex items-center gap-1 font-mono text-xs bg-white border border-[#1B3428]/20 px-2 py-0.5 rounded-lg shadow-2xs"
            >
              <span className="text-[#14261D]/60 font-sans text-[11px] font-medium hidden lg:inline">
                Page
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageJumpInput}
                onChange={(e) => setPageJumpInput(e.target.value)}
                onBlur={handlePageJumpSubmit}
                className="w-9 sm:w-10 h-5 text-center rounded bg-[#FAF8F4] border border-[#1B3428]/20 font-bold text-[#E8722C] focus:outline-none focus:border-[#E8722C] text-xs"
                title="Enter page number to jump"
              />
              <span className="text-[#14261D]/40">/</span>
              <span className="font-bold text-[#14261D]/80">{totalDocPages}</span>
            </form>

            <button
              type="button"
              onClick={() => {
                if (visiblePage < totalDocPages) {
                  const target = visiblePage + 1;
                  scrollToPage(target, true);
                  onPageChange(target);
                }
              }}
              disabled={visiblePage >= totalDocPages}
              className="w-7 h-7 rounded-lg border border-[#1B3428]/15 bg-[#FAF8F4] flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Zoom Controls, Bookmark & Focus Mode Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#1B3428]/10 transition-colors flex items-center justify-center cursor-pointer"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#14261D]" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="font-mono text-[11px] font-bold text-[#14261D]/80 px-1 sm:px-1.5 py-0.5 rounded hover:bg-[#1B3428]/10 transition-colors hidden sm:inline-block cursor-pointer"
                title="Reset to Fit Width"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#1B3428]/10 transition-colors flex items-center justify-center cursor-pointer"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#14261D]" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-[#1B3428]/15 mx-0.5" />

            {/* Compact Icon-Only Bookmark Ribbon Toggle */}
            {(() => {
              const isBookmarked = Boolean(bookmarks?.some((b) => b.pageNumber === visiblePage));
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleBookmark) {
                      onToggleBookmark(visiblePage);
                    } else {
                      onAddBookmark(visiblePage);
                    }
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                    isBookmarked
                      ? 'bg-[#FBE8DC] border-[#E8722C]/40 text-[#E8722C] shadow-2xs'
                      : 'bg-[#FAF8F4] border-[#1B3428]/20 text-[#14261D]/60 hover:text-[#14261D] hover:bg-[#1B3428]/5'
                  }`}
                  title={isBookmarked ? `Remove Bookmark (Page ${visiblePage})` : `Bookmark Page ${visiblePage}`}
                  aria-label={isBookmarked ? `Remove Bookmark (Page ${visiblePage})` : `Bookmark Page ${visiblePage}`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 transition-colors ${
                      isBookmarked ? 'fill-[#E8722C] text-[#E8722C]' : ''
                    }`}
                  />
                </button>
              );
            })()}

            {/* Desktop Zen Focus Mode Button */}
            {onToggleFocusMode && (
              <button
                type="button"
                onClick={onToggleFocusMode}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#1B3428]/5 text-[#14261D]/80 hover:text-[#14261D] font-display font-bold text-xs transition-colors cursor-pointer shrink-0"
                title="Zen Reading Mode"
                aria-label="Zen Reading Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#14261D]" />
                <span>Focus</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. FLOATING CONTEXTUAL SELECTION TOOLBAR ("Copy", "Ask AI", "Practice") */}
      {selectedText && selectionCoords && (
        <div
          id="selection-toolbar"
          style={{
            position: 'fixed',
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1 rounded-full bg-[#14261D] border border-[#FAF8F4]/20 shadow-[0_4px_0_0_#0D1B14] select-none"
        >
          {/* Copy Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopyText}
            className="py-1 px-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy selected text"
            aria-label="Copy selected text"
          >
            {copiedRecently ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#FAF8F4]/80" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Ask AI Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onExplainParagraph(selectedText, visiblePage);
              clearSelection();
            }}
            className="py-1 px-3 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Ask AI about this selection"
            aria-label="Ask AI about this selection"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Ask AI</span>
          </button>

          {/* Practice Section Button */}
          {onPracticeSelection && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPracticeSelection(visiblePage);
                clearSelection();
              }}
              className="py-1 px-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Practice this chapter or section"
              aria-label="Practice this section"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#E8722C]" />
              <span className="hidden sm:inline">Practice</span>
            </button>
          )}
        </div>
      )}

      {/* 3. MAIN CONTINUOUS CANVAS STAGE OR BROWSER EMBED */}
      <div
        id="pdf-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-auto overscroll-contain overflow-x-auto relative"
      >
        {/* Persistent Selection Highlight Rectangles */}
        {highlightRects.map((rect, idx) => (
          <div
            key={`selection_highlight_${idx}`}
            className="pointer-events-none absolute rounded-xs select-none"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: 'rgba(232, 114, 44, 0.25)',
              zIndex: 15,
            }}
          />
        ))}
        {isPdf ? (
          /* BROWSER EMBEDDED PDF VIEWER (Standardized Reading Engine) */
          <div className="w-full h-full p-2 sm:p-4 md:p-6 flex flex-col items-center">
            <div
              className={`w-full h-full ${
                isFocusMode ? 'max-w-5xl mx-auto' : 'max-w-6xl'
              } rounded-[16px] border-[2px] border-[#1B3428] shadow-[0_4px_0_0_#1B3428] bg-white overflow-hidden flex flex-col min-h-[500px]`}
            >
              <iframe
                id="pdf-embed-frame"
                src={authorizedEmbedUrl}
                className="w-full flex-1 border-0 h-full"
                title={doc?.title || 'Original Textbook PDF Viewer'}
              />
            </div>
          </div>
        ) : (
          /* NON-PDF EXTRACTED TEXT READING VIEW (Fully Selectable) */
          <div className="w-full min-h-full flex flex-col items-center py-8 px-4 select-text">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl transition-transform duration-150 ease-out select-text"
            >
              {loadingContent ? (
                <div className="p-16 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10 select-none">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mx-auto mb-3" />
                  <p className="font-display font-bold text-sm text-[#14261D]">
                    Loading extracted text notes...
                  </p>
                </div>
              ) : (
                <article className="w-full bg-[#FAF8F4] rounded-[16px] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-8 sm:p-12 md:p-16 relative select-text">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1B3428]/15 mb-8 text-[11px] font-mono text-[#14261D]/60 select-none">
                    <span className="uppercase tracking-widest">{doc?.title || 'Lernivox Notes'}</span>
                    <span>Extracted Section</span>
                  </div>
                  <div className="font-serif text-[15px] sm:text-[17px] text-[#14261D] leading-[1.75] space-y-4 select-text">
                    {readerContent?.pages
                      .find((p) => p.pageNumber === visiblePage)
                      ?.text.split('\n\n')
                      .map((paragraph, idx) => (
                        <p key={idx} className="select-text">{paragraph}</p>
                      )) || <p className="select-text">No text content for this section.</p>}
                  </div>
                </article>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const DocumentReader = memo(DocumentReaderComponent);
