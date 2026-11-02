'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type {
  DocumentDto,
  DocumentOutlineItemDto,
  DocumentReaderContentDto,
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
        minHeight: `${actualHeight}px`,
      }}
      className={`relative bg-white rounded-lg transition-all duration-200 overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-md ${
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
        <>
          {isRendering && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs flex items-center justify-center z-10 transition-opacity pointer-events-none">
              <Loader2 className="w-6 h-6 animate-spin text-[#E8722C]" />
            </div>
          )}
          <canvas ref={canvasRef} className="block pdf-canvas pointer-events-none select-none" />
          <div ref={textLayerRef} className="textLayer select-text" />
        </>
      ) : (
        /* Lightweight Skeleton Card while out of viewport to preserve scroll height */
        <div className="flex flex-col items-center justify-center p-8 text-[#14261D]/30 select-none">
          <div className="w-8 h-8 rounded-full border-2 border-[#1B3428]/10 border-t-[#E8722C] animate-spin mb-2" />
          <span className="font-mono text-xs font-bold text-[#14261D]/40">
            Page {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
});

interface DocumentReaderProps {
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
  fileUrl: string;
  accessToken?: string;
}

export function DocumentReader({
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
  fileUrl,
  accessToken,
}: DocumentReaderProps) {
  const isPdf = Boolean(doc?.mimeType === 'application/pdf' || doc?.fileName?.endsWith('.pdf'));

  // View Mode: 'canvas' (continuous crisp PDF stream) | 'embed' (browser native iframe)
  const [viewMode, setViewMode] = useState<'canvas' | 'embed'>('canvas');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [pageJumpInput, setPageJumpInput] = useState<string>('');

  // Reader Scroll Container Measurement for Container Width Expansion
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(860);
  const [documentAspectRatio, setDocumentAspectRatio] = useState<number>(1.414);

  // Current visible page tracked dynamically from vertical scrolling
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

  // Text Selection State for "Explain this paragraph"
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const activeLoadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);
  const loadedDocIdRef = useRef<string | null>(null);

  // Callback refs to maintain stable effect dependencies
  const onTotalPagesDetectedRef = useRef(onTotalPagesDetected);
  onTotalPagesDetectedRef.current = onTotalPagesDetected;

  const onNativeOutlineLoadedRef = useRef(onNativeOutlineLoaded);
  onNativeOutlineLoadedRef.current = onNativeOutlineLoaded;

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  // Measure container width responsively to expand PDF to 100% of available space
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

  // Smooth programmatic scroll to specific page (strictly container-scoped)
  const scrollToPage = useCallback((pageNum: number, smooth = true) => {
    const container = scrollContainerRef.current;
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (container && el) {
      isProgrammaticScrollRef.current = true;
      scrollToInternalElement(container, el, 0, smooth ? 'smooth' : 'auto');

      setVisiblePage(pageNum);
      visiblePageRef.current = pageNum;

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
    }
  }, []);

  // Initial scroll to saved currentPage upon document load
  useEffect(() => {
    if (pdfDoc && !hasScrolledToInitialRef.current && currentPage > 1) {
      hasScrolledToInitialRef.current = true;
      setTimeout(() => {
        scrollToPage(currentPage, false);
      }, 300);
    }
  }, [pdfDoc, currentPage, scrollToPage]);

  // Respond to parent currentPage changes (e.g., from TOC outline or bookmark click)
  useEffect(() => {
    if (currentPage && currentPage !== visiblePageRef.current && !isProgrammaticScrollRef.current) {
      scrollToPage(currentPage, true);
    }
  }, [currentPage, scrollToPage]);

  // Active citation scroll
  useEffect(() => {
    if (citationPage && citationPage > 0) {
      scrollToPage(citationPage, true);
    }
  }, [citationPage, scrollToPage]);

  // Track visible page on scroll
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const sampleY = containerRect.top + Math.min(containerRect.height / 3, 220);
    const sampleX = containerRect.left + containerRect.width / 2;

    const targetEl = document.elementFromPoint(sampleX, sampleY);
    const pageWrapper = targetEl?.closest('[data-page-number]');

    if (pageWrapper) {
      const pageNum = parseInt(pageWrapper.getAttribute('data-page-number') || '0', 10);
      if (pageNum > 0 && pageNum !== visiblePageRef.current) {
        visiblePageRef.current = pageNum;
        setVisiblePage(pageNum);

        // Debounce reporting to parent to keep reading progress in sync without spamming
        if (scrollDebounceTimer.current) {
          clearTimeout(scrollDebounceTimer.current);
        }
        scrollDebounceTimer.current = setTimeout(() => {
          onPageChangeRef.current(pageNum);
        }, 350);
      }
    }
  }, []);

  const handleRetryLoad = () => {
    loadedDocIdRef.current = null;
    hasScrolledToInitialRef.current = false;
    setPdfDoc(null);
    setRetryTrigger((prev) => prev + 1);
  };

  // Text Selection for "Explain this paragraph"
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setSelectionCoords(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 5) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectedText('');
      setSelectionCoords(null);
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

  // Responsive page width calculation: expands to container width with balanced editorial padding
  const editorialPadding = containerWidth < 640 ? 16 : containerWidth < 1024 ? 32 : 48;
  const availableContentWidth = Math.max(280, containerWidth - editorialPadding);
  const basePageWidth = Math.min(availableContentWidth, 920);
  const calculatedPageWidth = Math.round(basePageWidth * zoomLevel);

  const totalDocPages = pdfDoc ? pdfDoc.numPages : totalPages || 1;
  const authorizedEmbedUrl = accessToken
    ? `${fileUrl}?token=${accessToken}#page=${visiblePage}`
    : `${fileUrl}#page=${visiblePage}`;

  return (
    <div
      onMouseUp={handleMouseUp}
      className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#F4F0E5] relative w-full"
    >
      {/* 1. READER TOP CONTROL TOOLBAR */}
      <div className="h-12 bg-[#FAF8F4] border-b border-[#1B3428]/15 px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-20 shadow-2xs">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1.5">
          {isPdf ? (
            <div className="flex items-center p-1 rounded-xl bg-[#EFECE6] border border-[#1B3428]/10 text-xs font-display font-bold">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'canvas'
                    ? 'bg-[#FAF8F4] text-[#14261D] shadow-2xs'
                    : 'text-[#14261D]/60 hover:text-[#14261D]'
                }`}
                title="Continuous Vertical Reader"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Continuous PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('embed')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'embed'
                    ? 'bg-[#FAF8F4] text-[#14261D] shadow-2xs'
                    : 'text-[#14261D]/60 hover:text-[#14261D]'
                }`}
                title="Browser Native PDF Embed"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Embed View</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono text-xs font-bold border border-[#497E64]/20">
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Notes View</span>
            </div>
          )}
        </div>

        {/* Center: Authoritative Continuous Page Status & Jump Input */}
        <div className="flex items-center gap-2">
          <form
            onSubmit={handlePageJumpSubmit}
            className="flex items-center gap-1.5 font-mono text-xs bg-[#FAF8F4] border border-[#1B3428]/20 px-2.5 py-1 rounded-xl shadow-2xs"
          >
            <span className="text-[#14261D]/70 font-sans text-[11px] font-medium hidden sm:inline">
              Page
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              onBlur={handlePageJumpSubmit}
              className="w-11 h-6 text-center rounded-md bg-white border border-[#1B3428]/25 font-bold text-[#E8722C] focus:outline-none focus:border-[#E8722C]"
              title="Enter page number to jump"
            />
            <span className="text-[#14261D]/40">/</span>
            <span className="font-bold text-[#14261D]/80">{totalDocPages}</span>
          </form>
        </div>

        {/* Right: Zoom Controls & Bookmark Button */}
        <div className="flex items-center gap-1 sm:gap-2">
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                className="p-1.5 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#1B3428]/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#14261D]" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="font-mono text-[11px] font-bold text-[#14261D]/80 px-1.5 py-0.5 rounded hover:bg-[#1B3428]/10 transition-colors hidden sm:inline-block"
                title="Reset to Fit Width"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
                className="p-1.5 rounded-lg border border-[#1B3428]/20 bg-[#FAF8F4] hover:bg-[#1B3428]/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#14261D]" />
              </button>
            </div>
          )}

          <div className="w-[1px] h-4 bg-[#1B3428]/15 mx-0.5" />

          {/* Bookmark Current Page */}
          <button
            type="button"
            onClick={() => onAddBookmark(visiblePage)}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#FAF8F4] border border-[#1B3428]/20 text-[#14261D] font-display font-bold text-xs hover:bg-[#FBE8DC] transition-colors flex items-center gap-1.5 shadow-2xs"
            title={`Bookmark Page ${visiblePage}`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#E8722C]" />
            <span className="hidden sm:inline">Bookmark p. {visiblePage}</span>
          </button>
        </div>
      </div>

      {/* 2. FLOATING TEXT-SELECTION ACTION ("Explain this paragraph" & "Practice this part") */}
      {selectedText && selectionCoords && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1 rounded-full bg-[#14261D] border border-[#FAF8F4]/20 shadow-[0_4px_0_0_#0D1B14]"
        >
          <button
            type="button"
            onClick={() => {
              onExplainParagraph(selectedText, visiblePage);
              setSelectedText('');
              setSelectionCoords(null);
            }}
            className="py-1 px-3 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8722C]" />
            <span>Explain</span>
          </button>

          {onPracticeSelection && (
            <button
              type="button"
              onClick={() => {
                onPracticeSelection(visiblePage);
                setSelectedText('');
                setSelectionCoords(null);
              }}
              className="py-1 px-3 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Practice this part</span>
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
        {isPdf ? (
          viewMode === 'canvas' ? (
            /* CONTINUOUS VERTICAL SCROLL STREAM */
            <div className="w-full min-h-full flex flex-col items-center py-6 px-2 sm:px-4 md:px-6 space-y-6">
              {lifecycle === 'FETCHING' || (lifecycle === 'INITIALIZING' && !pdfDoc) ? (
                <div className="p-16 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10 max-w-md mx-auto my-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mx-auto mb-3" />
                  <p className="font-display font-bold text-sm text-[#14261D]">
                    Loading original uploaded PDF...
                  </p>
                </div>
              ) : lifecycle === 'ERROR' && !pdfDoc ? (
                <div className="p-12 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10 max-w-md mx-auto my-auto">
                  <AlertCircle className="w-8 h-8 text-[#E8722C] mx-auto mb-3" />
                  <p className="font-display font-bold text-sm text-[#14261D] mb-4">
                    {pdfError || 'Failed to load PDF file'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetryLoad}
                      className="px-4 py-2 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs hover:bg-[#d0601e] transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('embed')}
                      className="px-4 py-2 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs hover:bg-[#14261D] transition-colors"
                    >
                      Switch to Browser Embed
                    </button>
                  </div>
                </div>
              ) : pdfDoc ? (
                /* Stacked Continuous Pages Stream */
                Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                  <ContinuousPdfPage
                    key={`pdf_page_${pageNum}`}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    pageWidth={calculatedPageWidth}
                    aspectRatio={documentAspectRatio}
                    isActiveCitation={
                      citationPage === pageNum ||
                      Boolean(
                        activeCitationChunkId &&
                          readerContent?.pages.some(
                            (p) =>
                              p.pageNumber === pageNum &&
                              p.chunkIds.includes(activeCitationChunkId),
                          ),
                      )
                    }
                    onDimensionsDetected={(ratio) => setDocumentAspectRatio(ratio)}
                  />
                ))
              ) : null}
            </div>
          ) : (
            /* BROWSER EMBEDDED PDF VIEWER */
            <div className="w-full h-full p-4 sm:p-6 flex flex-col items-center">
              <div className="w-full h-full max-w-5xl rounded-[16px] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] bg-white overflow-hidden flex flex-col min-h-[500px]">
                <iframe
                  src={authorizedEmbedUrl}
                  className="w-full flex-1 border-0"
                  title="Original Textbook PDF Viewer"
                />
              </div>
            </div>
          )
        ) : (
          /* NON-PDF EXTRACTED TEXT READING VIEW */
          <div className="w-full min-h-full flex flex-col items-center py-8 px-4">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl transition-transform duration-150 ease-out"
            >
              {loadingContent ? (
                <div className="p-16 text-center bg-[#FAF8F4] rounded-[24px] border-[2px] border-[#1B3428]/20 shadow-[0_4px_0_0_#1B3428]/10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E8722C] mx-auto mb-3" />
                  <p className="font-display font-bold text-sm text-[#14261D]">
                    Loading extracted text notes...
                  </p>
                </div>
              ) : (
                <article className="w-full bg-[#FAF8F4] rounded-[16px] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-8 sm:p-12 md:p-16 relative">
                  <div className="flex items-center justify-between pb-4 border-b border-[#1B3428]/15 mb-8 text-[11px] font-mono text-[#14261D]/60">
                    <span className="uppercase tracking-widest">{doc?.title || 'Lernivox Notes'}</span>
                    <span>Extracted Section</span>
                  </div>
                  <div className="font-serif text-[15px] sm:text-[17px] text-[#14261D] leading-[1.75] space-y-4">
                    {readerContent?.pages
                      .find((p) => p.pageNumber === visiblePage)
                      ?.text.split('\n\n')
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      )) || <p>No text content for this section.</p>}
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
