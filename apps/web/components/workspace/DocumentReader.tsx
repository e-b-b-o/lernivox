'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  RotateCw,
  Layers,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type {
  DocumentDto,
  DocumentOutlineItemDto,
  DocumentReaderContentDto,
  DocumentBookmarkDto,
} from '@lernivox/contracts';

// Configure PDF.js worker to local bundled static file in /public/pdf.worker.min.mjs
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface NativeVirtualPdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  pageWidth: number;
  defaultRatio: number;
  isActiveCitation: boolean;
  onDimensionsDetected?: (pageNumber: number, ratio: number) => void;
  isPinned?: boolean;
}

/**
 * High-fidelity native PDF.js page renderer with separate Canvas and TextLayer.
 * Mounts only when virtualized in view, cancelling obsolete render tasks on unmount/zoom.
 * Ensures transparent text alignment over canvas with zero black text ghosting.
 */
const NativeVirtualPdfPage = memo(function NativeVirtualPdfPage({
  pdfDoc,
  pageNumber,
  pageWidth,
  defaultRatio,
  isActiveCitation,
  onDimensionsDetected,
  isPinned,
}: NativeVirtualPdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(defaultRatio);

  const calculatedHeight = Math.round(pageWidth * aspectRatio);

  useEffect(() => {
    if (!pdfDoc || pageWidth <= 0) return;

    let isCancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;
    let textLayerInstance: { cancel?: () => void } | null = null;

    setIsRendering(true);
    setPageError(null);

    pdfDoc
      .getPage(pageNumber)
      .then(async (page) => {
        if (isCancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const detectedRatio = unscaledViewport.height / unscaledViewport.width;
        if (Math.abs(detectedRatio - aspectRatio) > 0.01) {
          setAspectRatio(detectedRatio);
          onDimensionsDetected?.(pageNumber, detectedRatio);
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Display scale matching container
        const displayScale = pageWidth / unscaledViewport.width;
        const displayViewport = page.getViewport({ scale: displayScale });

        // Hi-DPI / Retina rendering capped at 2x to prevent GPU memory exhaustion
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
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

        // Render PDF.js Text Layer for native selectable, copyable text
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
          setPageError(null);
        }
      })
      .catch((err) => {
        if (isCancelled || err?.name === 'RenderingCancelledException') {
          return;
        }
        console.error(`Page ${pageNumber} render error:`, err);
        setPageError(err instanceof Error ? err.message : 'Render failed');
        setIsRendering(false);
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
  }, [pdfDoc, pageNumber, pageWidth, retryCount]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      ref={containerRef}
      style={{
        width: `${pageWidth}px`,
        maxWidth: '100%',
        height: `${calculatedHeight}px`,
      }}
      className={`relative bg-white rounded-lg transition-shadow duration-200 overflow-hidden flex flex-col items-center shrink-0 shadow-md mx-auto ${
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

      <div
        className="relative w-full h-full overflow-hidden"
        style={{ width: `${pageWidth}px`, height: `${calculatedHeight}px` }}
      >
        {isRendering && !pageError && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center z-10 transition-opacity pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8722C]" />
          </div>
        )}

        {pageError && (
          <div className="absolute inset-0 bg-[#FAF8F4] flex flex-col items-center justify-center p-6 text-center z-10 select-none">
            <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-xs font-bold text-[#14261D] mb-1 font-display">
              Page {pageNumber} failed to render
            </p>
            <p className="text-[11px] text-[#14261D]/60 mb-3">{pageError}</p>
            <button
              type="button"
              onClick={() => {
                setPageError(null);
                setRetryCount((c) => c + 1);
              }}
              className="px-3 py-1.5 rounded-full bg-[#1B3428] text-white text-[11px] font-display font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#14261D] transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry Page</span>
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="block pdf-canvas pointer-events-none select-none" />
        <div ref={textLayerRef} className="textLayer select-text" />
      </div>
    </div>
  );
});

interface NativeDocxViewerProps {
  fileUrl: string;
  accessToken?: string;
  zoomLevel: number;
}

/**
 * Native Word DOCX Renderer using docx-preview.
 * Faithfully renders Word document structures, tables, page breaks, fonts, and images.
 * Runs completely in-browser without browser Embed/iframe or external Microsoft Office Online.
 */
const NativeDocxViewer = memo(function NativeDocxViewer({
  fileUrl,
  accessToken,
  zoomLevel,
}: NativeDocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const authorizedUrl = accessToken
      ? `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}token=${accessToken}`
      : fileUrl;

    fetch(authorizedUrl, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to download document binary`);
        return res.blob();
      })
      .then(async (blob) => {
        if (isCancelled || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        const docxPreview = await import('docx-preview');
        await docxPreview.renderAsync(blob, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
        });
        if (!isCancelled) setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to render DOCX document:', err);
        setError(err instanceof Error ? err.message : 'Failed to render DOCX document');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, accessToken]);

  return (
    <div className="w-full flex flex-col items-center py-6 px-3 sm:px-6 select-text">
      {loading && (
        <div className="p-16 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10 my-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mx-auto mb-3" />
          <p className="font-display font-bold text-sm text-[#14261D]">
            Rendering Word document...
          </p>
        </div>
      )}
      {error && (
        <div className="p-8 text-center bg-red-50 text-red-700 rounded-2xl border border-red-200 my-8">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
          <p className="font-display font-bold text-sm mb-1">Failed to load Word document</p>
          <p className="text-xs">{error}</p>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
        }}
        className="w-full max-w-4xl transition-transform duration-150 ease-out select-text"
      />
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
  onCreateCardSelection?: (text: string, pageNumber: number) => void;
  onAddBookmark: (pageNumber: number) => void;
  bookmarks?: DocumentBookmarkDto[];
  onToggleBookmark?: (pageNumber: number) => void;
  fileUrl: string;
  accessToken?: string;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSelectionActiveChange?: (isActive: boolean) => void;
  onScrollDelta?: (deltaY: number, scrollTop: number) => void;
  onCanvasTap?: () => void;
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
  onCreateCardSelection,
  onAddBookmark,
  bookmarks,
  onToggleBookmark,
  fileUrl,
  accessToken,
  isFocusMode = false,
  onToggleFocusMode,
  onSelectionActiveChange,
  onScrollDelta,
  onCanvasTap,
}: DocumentReaderProps) {
  const isPdf = Boolean(
    doc?.mimeType === 'application/pdf' || doc?.fileName?.toLowerCase().endsWith('.pdf'),
  );
  const isDocx = Boolean(
    doc?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      doc?.fileName?.toLowerCase().endsWith('.docx'),
  );

  // Standardized reader zoom and navigation
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [pageJumpInput, setPageJumpInput] = useState<string>('');

  // Reader Scroll Container Measurement
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 0) {
      return Math.min(window.innerWidth, 860);
    }
    return 860;
  });
  const [documentAspectRatio, setDocumentAspectRatio] = useState<number>(1.414);
  const pageAspectRatiosRef = useRef<Map<number, number>>(new Map());

  // Current visible page tracked dynamically
  const [visiblePage, setVisiblePage] = useState<number>(currentPage || 1);
  const visiblePageRef = useRef<number>(visiblePage);
  visiblePageRef.current = visiblePage;

  // Track initial scroll restoration
  const hasScrolledToInitialRef = useRef(false);

  // PDF Document Lifecycle
  const [lifecycle, setLifecycle] = useState<'INITIALIZING' | 'FETCHING' | 'LOADED' | 'ERROR'>(
    isPdf ? 'INITIALIZING' : 'LOADED',
  );
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Client-side mount flag for React portal rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Text Selection State for Contextual Floating Action Toolbar
  const [selectedText, setSelectedText] = useState<string>('');
  const selectedPageRef = useRef<number>(visiblePage);
  const [pinnedPage, setPinnedPage] = useState<number | null>(null);
  const [selectionCoords, setSelectionCoords] = useState<{
    x: number;
    y: number;
    placement: 'above' | 'below';
  } | null>(null);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [highlightRects, setHighlightRects] = useState<
    Array<{ top: number; left: number; width: number; height: number }>
  >([]);

  const activeLoadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const loadedDocIdRef = useRef<string | null>(null);

  // Stable callback refs
  const onTotalPagesDetectedRef = useRef(onTotalPagesDetected);
  onTotalPagesDetectedRef.current = onTotalPagesDetected;

  const onNativeOutlineLoadedRef = useRef(onNativeOutlineLoaded);
  onNativeOutlineLoadedRef.current = onNativeOutlineLoaded;

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const onSelectionActiveChangeRef = useRef(onSelectionActiveChange);
  onSelectionActiveChangeRef.current = onSelectionActiveChange;

  const onScrollDeltaRef = useRef(onScrollDelta);
  onScrollDeltaRef.current = onScrollDelta;

  const onCanvasTapRef = useRef(onCanvasTap);
  onCanvasTapRef.current = onCanvasTap;

  // Responsive page width calculation based on viewport and zoom
  const isMobile = containerWidth < 640;
  const pageGap = isMobile ? 12 : 24;

  const basePageWidth = isFocusMode
    ? Math.min(containerWidth - 32, 1024)
    : isMobile
    ? Math.round(containerWidth * 0.96)
    : containerWidth < 1024
    ? Math.min(Math.round(containerWidth * 0.94), 768)
    : Math.min(containerWidth - 64, 896);
  const calculatedPageWidth = Math.round(basePageWidth * zoomLevel);

  const totalDocPages = pdfDoc ? pdfDoc.numPages : totalPages || 1;

  // Ref to virtualizer instance for measurement callbacks
  const virtualizerRef = useRef<any>(null);

  // Update aspect ratio map dynamically when individual page dimensions are detected
  const handleDimensionsDetected = useCallback(
    (pageNum: number, ratio: number) => {
      const prev = pageAspectRatiosRef.current.get(pageNum);
      pageAspectRatiosRef.current.set(pageNum, ratio);
      if (pageNum === 1 && Math.abs(documentAspectRatio - ratio) > 0.01) {
        setDocumentAspectRatio(ratio);
      }
      if (!prev || Math.abs(prev - ratio) > 0.01) {
        try {
          virtualizerRef.current?.resizeItem(pageNum - 1, Math.round(calculatedPageWidth * ratio));
        } catch {
          // ignore if virtualizer not mounted yet
        }
      }
    },
    [calculatedPageWidth, documentAspectRatio],
  );

  // Measure container width responsively
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

  // Sync page jump input with visible page
  useEffect(() => {
    setPageJumpInput(String(visiblePage));
  }, [visiblePage]);

  // Load PDF Document via PDF.js with Range / Streaming Support
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

    const separator = fileUrl.includes('?') ? '&' : '?';
    const authorizedUrl = accessToken ? `${fileUrl}${separator}token=${accessToken}` : fileUrl;

    const loadingTask = pdfjsLib.getDocument({
      url: authorizedUrl,
      withCredentials: true,
      cMapPacked: true,
    });
    activeLoadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then(async (docProxy) => {
        if (isCancelled) return;
        activeLoadingTaskRef.current = null;
        loadedDocIdRef.current = doc.id;

        // Immediately inspect page 1 dimensions to prevent slide vs portrait layout shifts
        try {
          const firstPage = await docProxy.getPage(1);
          const firstVp = firstPage.getViewport({ scale: 1 });
          const initialRatio = firstVp.height / firstVp.width;
          if (initialRatio > 0) {
            setDocumentAspectRatio(initialRatio);
            pageAspectRatiosRef.current.set(1, initialRatio);
          }
        } catch (pageErr) {
          console.warn('Initial aspect ratio probe skipped:', pageErr);
        }

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

  // Virtualizer for 400+ page documents with native gap support
  const virtualizer = useVirtualizer({
    count: isPdf ? totalDocPages : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const pageNum = index + 1;
        const ratio = pageAspectRatiosRef.current.get(pageNum) || documentAspectRatio;
        return Math.round(calculatedPageWidth * ratio);
      },
      [calculatedPageWidth, documentAspectRatio],
    ),
    gap: pageGap,
    overscan: 3,
  });
  virtualizerRef.current = virtualizer;

  // Re-measure virtual item heights and maintain scroll anchor when calculatedPageWidth changes
  const prevWidthRef = useRef(calculatedPageWidth);
  useEffect(() => {
    if (prevWidthRef.current !== calculatedPageWidth) {
      prevWidthRef.current = calculatedPageWidth;
      virtualizer.measure();
      if (visiblePageRef.current > 1 && isPdf) {
        virtualizer.scrollToIndex(visiblePageRef.current - 1, {
          align: 'start',
          behavior: 'auto',
        });
      }
    }
  }, [calculatedPageWidth, isPdf, virtualizer]);

  // Smooth programmatic navigation to specific page
  const scrollToPage = useCallback(
    (pageNum: number, smooth = true) => {
      const clamped = Math.max(1, Math.min(pageNum, totalDocPages));
      setVisiblePage(clamped);
      visiblePageRef.current = clamped;
      if (isPdf) {
        virtualizer.scrollToIndex(clamped - 1, {
          align: 'start',
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      }
    },
    [totalDocPages, isPdf, virtualizer],
  );

  // Initial scroll to saved currentPage upon document load
  useEffect(() => {
    if (pdfDoc && !hasScrolledToInitialRef.current && currentPage > 1) {
      hasScrolledToInitialRef.current = true;
      scrollToPage(currentPage, false);
    }
  }, [pdfDoc, currentPage, scrollToPage]);

  // Respond to parent currentPage changes (e.g. from TOC outline click)
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

  // Track active visible page while scrolling and notify parent of mobile scroll delta
  const lastScrollTopRef = useRef<number>(0);
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const deltaY = scrollTop - lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    if (Math.abs(deltaY) > 0) {
      onScrollDeltaRef.current?.(deltaY, scrollTop);
    }

    if (isPdf) {
      const readingLine = scrollTop + container.clientHeight * 0.35;

      const items = virtualizer.getVirtualItems();
      if (items.length > 0) {
        const activeItem =
          items.find((it) => it.start <= readingLine && it.start + it.size >= readingLine) ||
          items[0];

        if (activeItem) {
          const pageNum = activeItem.index + 1;
          if (pageNum !== visiblePageRef.current) {
            setVisiblePage(pageNum);
            visiblePageRef.current = pageNum;
            onPageChangeRef.current?.(pageNum);
          }
        }
      }
    }
  }, [isPdf, virtualizer]);

  // Touch and tap coordination for mobile auto-hide and restore
  const touchStartYRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartYRef.current - currentY; // positive = swipe up = scroll down
    touchStartYRef.current = currentY;
    const container = scrollContainerRef.current;
    const scrollTop = container?.scrollTop ?? 0;
    if (Math.abs(diff) > 2) {
      onScrollDeltaRef.current?.(diff, scrollTop);
    }
  }, []);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // If text was selected, do not treat as an intentional canvas tap
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      return;
    }

    // Ignore clicks on buttons, links, inputs, or toolbars
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, [role="button"], #selection-toolbar')) {
      return;
    }

    // Check pointer movement distance from touchStart (ignore drags/swipes)
    if (touchStartPosRef.current) {
      const dx = Math.abs(e.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        return;
      }
    }

    onCanvasTapRef.current?.();
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
    setPinnedPage(null);
    setHighlightRects([]);
    onSelectionActiveChangeRef.current?.(false);
  }, []);

  // Robust Native Text Selection Tracking
  const handleSelectionUpdate = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
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

      // Determine page number from nearest page element
      const node = commonAncestor.nodeType === Node.ELEMENT_NODE
        ? (commonAncestor as HTMLElement)
        : commonAncestor.parentElement;
      const pageEl = node?.closest?.('[data-page-number]');
      const detectedPage = pageEl
        ? parseInt(pageEl.getAttribute('data-page-number') || '1', 10)
        : visiblePageRef.current;

      setSelectedText(text);
      selectedPageRef.current = detectedPage;
      setPinnedPage(detectedPage);

      const rect = range.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Clamp X position within viewport margins
      const rawX = rect.left + rect.width / 2;
      const clampedX = Math.max(120, Math.min(viewportWidth - 120, rawX));

      // Position above selection, or below if near top
      const isNearTop = rect.top < 70;
      const y = isNearTop ? rect.bottom + 10 : rect.top - 10;
      const placement = isNearTop ? 'below' : 'above';

      setSelectionCoords({ x: clampedX, y, placement });

      // Calculate non-destructive highlight rects
      try {
        const domRects = Array.from(range.getClientRects());
        if (domRects.length > 0) {
          const containerRect = container.getBoundingClientRect();
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
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalDocPages) {
      scrollToPage(parsed, true);
      onPageChange(parsed);
    } else {
      setPageJumpInput(String(visiblePage));
    }
  };

  // Virtual items rendered directly on each scroll frame, with pinned page protected against recycling
  const virtualRows = isPdf ? virtualizer.getVirtualItems() : [];
  const renderedVirtualItems = [...virtualRows];

  // Pin page if active selection or active citation requires it
  if (isPdf && pinnedPage && !renderedVirtualItems.some((it) => it.index === pinnedPage - 1)) {
    const pinnedIndex = pinnedPage - 1;
    let start = 0;
    for (let i = 0; i < pinnedIndex; i++) {
      const r = pageAspectRatiosRef.current.get(i + 1) || documentAspectRatio;
      start += Math.round(calculatedPageWidth * r) + pageGap;
    }
    const r = pageAspectRatiosRef.current.get(pinnedPage) || documentAspectRatio;
    const size = Math.round(calculatedPageWidth * r);
    renderedVirtualItems.push({
      index: pinnedIndex,
      start,
      size,
      key: `pinned-${pinnedPage}`,
      end: start + size,
      lane: 0,
    } as any);
    renderedVirtualItems.sort((a, b) => a.index - b.index);
  }

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
        <div className="hidden md:flex min-h-12 py-1 bg-[#FAF8F4] border-b border-[#1B3428]/10 px-3 sm:px-4 md:px-6 items-center justify-between shrink-0 select-none z-20 shadow-2xs relative gap-2 sm:gap-4">
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
      {mounted && selectedText && selectionCoords && createPortal(
        <div
          id="selection-toolbar"
          style={{
            position: 'fixed',
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform:
              selectionCoords.placement === 'below'
                ? 'translate(-50%, 0)'
                : 'translate(-50%, -100%)',
          }}
          className="z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1 rounded-full bg-[#14261D] border border-[#FAF8F4]/20 shadow-[0_4px_16px_rgba(0,0,0,0.35)] select-none"
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
              onExplainParagraph(selectedText, selectedPageRef.current || visiblePage);
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
                onPracticeSelection(selectedPageRef.current || visiblePage);
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

          {/* Flashcard from Selection Button */}
          {onCreateCardSelection && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onCreateCardSelection(selectedText, selectedPageRef.current || visiblePage);
                clearSelection();
              }}
              className="py-1 px-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Create flashcard from selection"
              aria-label="Create flashcard from selection"
            >
              <Layers className="w-3.5 h-3.5 text-[#E8722C]" />
              <span className="hidden sm:inline">Card</span>
            </button>
          )}
        </div>,
        document.body
      )}

      {/* 3. MAIN NATIVE READING STAGE */}
      <div
        id="pdf-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onClick={handleContainerClick}
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
          /* NATIVE VIRTUALIZED PDF.JS READER */
          <div
            className={`w-full flex flex-col items-center py-2 sm:py-6 px-1 sm:px-4 mx-auto ${
              isFocusMode ? 'max-w-5xl mx-auto' : 'max-w-6xl mx-auto'
            }`}
          >
            {lifecycle === 'FETCHING' && (
              <div className="p-16 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10 my-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mx-auto mb-3" />
                <p className="font-display font-bold text-sm text-[#14261D]">
                  Loading document pages...
                </p>
              </div>
            )}

            {lifecycle === 'ERROR' && (
              <div className="p-8 text-center bg-red-50 text-red-700 rounded-2xl border border-red-200 my-8 max-w-md">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                <p className="font-display font-bold text-sm mb-1">Failed to load PDF</p>
                <p className="text-xs mb-4">{pdfError || 'Network or decoding error'}</p>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  className="px-4 py-1.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {pdfDoc && (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {renderedVirtualItems.map((virtualRow) => {
                  const pageNum = virtualRow.index + 1;
                  const isCurrentCitation = citationPage === pageNum;
                  return (
                    <div
                      key={`virtual-row-${pageNum}`}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className="w-full flex justify-center"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <NativeVirtualPdfPage
                        key={`page-comp-${pageNum}`}
                        pdfDoc={pdfDoc}
                        pageNumber={pageNum}
                        pageWidth={calculatedPageWidth}
                        defaultRatio={documentAspectRatio}
                        isActiveCitation={isCurrentCitation}
                        onDimensionsDetected={handleDimensionsDetected}
                        isPinned={pinnedPage === pageNum}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : isDocx ? (
          /* NATIVE DOCX WORD DOCUMENT VIEWER */
          <NativeDocxViewer
            fileUrl={fileUrl}
            accessToken={accessToken}
            zoomLevel={zoomLevel}
          />
        ) : (
          /* NON-PDF EXTRACTED TEXT NOTES VIEW (Fully Selectable) */
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
