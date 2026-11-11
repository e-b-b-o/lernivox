'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  X,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  PanelRightClose,
  Sparkles,
  HelpCircle,
  Layers,
  TrendingUp,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Users,
} from 'lucide-react';
import type {
  ConversationDetailDto,
  ConversationMessageDto,
  ConversationSummaryDto,
  DocumentBookmarkDto,
  DocumentDto,
  DocumentOutlineItemDto,
  DocumentReaderContentDto,
  MessageCitationDto,
  TutorChunkDetailDto,
  WorkspaceDto,
  PlanOfferDto,
} from '@lernivox/contracts';
import { useAuth } from '../../../../../context/AuthContext';
import { api } from '../../../../../lib/api';
import { clientCache } from '../../../../../lib/client-cache';
import { TutorHeader, type WorkspaceViewMode, type CompanionToolMode } from '../../../../../components/workspace/TutorHeader';
import { DocumentOutlinePane } from '../../../../../components/workspace/DocumentOutlinePane';
import { DocumentReader } from '../../../../../components/workspace/DocumentReader';
import { RightWorkspacePanel } from '../../../../../components/workspace/RightWorkspacePanel';
import { GenerateQuizModal } from '../../../../../components/workspace/GenerateQuizModal';
import { ConvertToGroupModal } from '../../../../../components/workspace/ConvertToGroupModal';
import { ManageGroupModal } from '../../../../../components/workspace/ManageGroupModal';
import { WorkspaceQuizzesView } from '../../../../../components/workspace/WorkspaceQuizzesView';
import { WorkspaceFlashcardsView } from '../../../../../components/workspace/WorkspaceFlashcardsView';
import { WorkspaceProgressView } from '../../../../../components/workspace/WorkspaceProgressView';
import { WorkspaceLearningPlanView } from '../../../../../components/workspace/WorkspaceLearningPlanView';
import { GenerateLearningPlanModal } from '../../../../../components/workspace/GenerateLearningPlanModal';
import { ProfileMenu } from '../../../../../components/workspace/ProfileMenu';
import { WorkspaceSkeleton } from '../../../../../components/ui/loading';

function WorkspaceInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = typeof params?.workspaceId === 'string' ? params.workspaceId : '';
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();

  const urlPage = Number(searchParams?.get('page'));
  const initialPage = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1;

  // Workspace and Document metadata state
  const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DocumentDto | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadDiscussionCount, setUnreadDiscussionCount] = useState<number>(0);

  // Companion Tool State ('ai-tutor' | 'quizzes' | 'flashcards' | 'progress') - NO 'read' mode!
  const [activeView, setActiveView] = useState<CompanionToolMode>('ai-tutor');

  // Pane layout state (collapsible on desktop, mutually exclusive drawer on mobile)
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(true);

  type MobileDrawer = 'none' | 'toc' | 'review' | 'chat';
  const [mobileDrawer, setMobileDrawer] = useState<MobileDrawer>('none');
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [preselectedPracticeChapter, setPreselectedPracticeChapter] = useState<string>('');
  const [preselectedPracticePage, setPreselectedPracticePage] = useState<number | undefined>(undefined);

  // Learning Plan State
  const [planOffer, setPlanOffer] = useState<PlanOfferDto | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Desktop Zen Focus Mode State
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Mobile Immersive Auto-Hide State
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const [isTextSelectionActive, setIsTextSelectionActive] = useState(false);
  const lastScrollYRef = useRef(0);

  // Viewport tracking for single-docked-sidebar rule below 1280px and tablet slide-over
  const [isBelow1280, setIsBelow1280] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const w = window.innerWidth;
        const below1280 = w < 1280;
        setIsBelow1280(below1280);
        setIsTablet(w >= 768 && w < 1024);

        // If viewport shrinks below 1280px while both sidebars are docked,
        // enforce single-docked-sidebar rule by auto-collapsing Copilot
        if (below1280) {
          setOutlineOpen((currentOutline) => {
            if (currentOutline) {
              setCopilotOpen((currentCopilot) => {
                return currentCopilot ? false : currentCopilot;
              });
            }
            return currentOutline;
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewChange = useCallback((view: WorkspaceViewMode) => {
    setActiveView(view);
    setCopilotOpen(true);
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        if (view === 'read') {
          setMobileDrawer('chat');
        } else {
          setMobileDrawer('review');
        }
      } else if (window.innerWidth < 1280) {
        // Single-docked-sidebar rule below 1280px: opening Copilot auto-collapses Outline
        setOutlineOpen(false);
      }
    }
  }, []);

  const handleToggleAiTutor = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'));
    } else {
      if (activeView !== 'read' && activeView !== 'ai-tutor') {
        setActiveView('read');
        setCopilotOpen(true);
        if (typeof window !== 'undefined' && window.innerWidth < 1280) {
          // Single-docked-sidebar rule below 1280px
          setOutlineOpen(false);
        }
      } else {
        setCopilotOpen((prev) => {
          const next = !prev;
          if (next && typeof window !== 'undefined' && window.innerWidth < 1280) {
            setOutlineOpen(false);
          }
          return next;
        });
      }
    }
  }, [activeView]);

  const toggleToc = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDrawer((prev) => (prev === 'toc' ? 'none' : 'toc'));
    } else {
      setOutlineOpen((prev) => {
        const next = !prev;
        if (next && typeof window !== 'undefined' && window.innerWidth < 1280) {
          // Mutually exclusive single-docked-sidebar rule below 1280px: opening Outline collapses Copilot
          setCopilotOpen(false);
        }
        return next;
      });
    }
  }, []);

  const closeMobileDrawer = useCallback(() => setMobileDrawer('none'), []);

  // Close active mobile drawer, tablet overlay, or outline drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileDrawer !== 'none') {
          setMobileDrawer('none');
        } else if (typeof window !== 'undefined') {
          if (window.innerWidth < 1280 && outlineOpen && copilotOpen) {
            setOutlineOpen(false);
          } else if (window.innerWidth < 1024) {
            if (outlineOpen) setOutlineOpen(false);
            if (copilotOpen) setCopilotOpen(false);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawer, outlineOpen, copilotOpen]);

  // Reader state
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [readerContent, setReaderContent] = useState<DocumentReaderContentDto | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [activeCitationChunkId, setActiveCitationChunkId] = useState<string | null>(null);

  // Outline state
  const [outlineItems, setOutlineItems] = useState<DocumentOutlineItemDto[]>([]);
  const [loadingOutline, setLoadingOutline] = useState(true);
  const [isNativeOutline, setIsNativeOutline] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<DocumentBookmarkDto[]>([]);

  // Conversations state
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetailDto | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Prepared Question from text selection ("Ask AI")
  const [preparedQuestion, setPreparedQuestion] = useState<string | null>(null);

  // Slide-over Citation Inspector State
  const [inspectingCitation, setInspectingCitation] = useState<MessageCitationDto | null>(null);
  const [chunkDetail, setChunkDetail] = useState<TutorChunkDetailDto | null>(null);
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);

  // Group Collaboration & Modal States
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isManageGroupModalOpen, setIsManageGroupModalOpen] = useState(false);
  const [isSharingConversation, setIsSharingConversation] = useState(false);

  const isOwner = Boolean(
    workspace && (workspace.ownerId === user?.id || workspace.myRole === 'OWNER'),
  );

  const handleConvertToGroup = async () => {
    if (!accessToken || !workspaceId || isConverting) return;
    setIsConverting(true);
    try {
      const res = await api.workspaces.convertToGroup(workspaceId, accessToken);
      setWorkspace(res.workspace);
      setIsConvertModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to convert workspace to group');
    } finally {
      setIsConverting(false);
    }
  };

  const handleShareConversation = async (conversationId: string, title: string) => {
    if (!accessToken || !workspaceId || isSharingConversation) return;
    setIsSharingConversation(true);
    try {
      await api.workspaces.createSharedConversation(
        workspaceId,
        { conversationId, title },
        accessToken,
      );
      alert('Snapshot of this conversation has been shared with workspace members.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to share conversation');
    } finally {
      setIsSharingConversation(false);
    }
  };

  // Debounce ref for reading progress updates
  const progressDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Ensure window scroll is strictly locked to 0 on workspace mount & navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const preventWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };

    window.addEventListener('scroll', preventWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', preventWindowScroll);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
  }, []);

  // Mobile Immersive Reading Scroll Coordination (auto-hides header and dock on scroll down, restores on scroll up, canvas tap, or 2.5s inactivity)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Cleanup inactivity timer on unmount
  useEffect(() => {
    return () => {
      clearInactivityTimer();
    };
  }, [clearInactivityTimer]);

  const handleReaderScrollDelta = useCallback(
    (deltaY: number, scrollTop: number) => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) return; // Strict mobile-only (<768px) rule

      // Keep navigation visible when modals, drawers, or text selection are active
      const isAutoHidingAllowed =
        mobileDrawer === 'none' &&
        !isTextSelectionActive &&
        !isPlanModalOpen &&
        !isPracticeModalOpen &&
        !isConvertModalOpen &&
        !isManageGroupModalOpen &&
        !inspectingCitation &&
        (activeView === 'read' || activeView === 'ai-tutor');

      if (!isAutoHidingAllowed) {
        clearInactivityTimer();
        setMobileNavHidden(false);
        return;
      }

      // If near the top (within first 30px), always keep bars visible
      if (scrollTop <= 30) {
        clearInactivityTimer();
        setMobileNavHidden(false);
        return;
      }

      // Directional auto-hide thresholds:
      // Upward finger swipe (deltaY > 20 && scrollTop > 50) advances down -> hides navigation
      if (deltaY > 20 && scrollTop > 50) {
        setMobileNavHidden(true);
        // Start 2.5-second inactivity timeout: reveals navigation if user pauses reading
        clearInactivityTimer();
        inactivityTimerRef.current = setTimeout(() => {
          setMobileNavHidden(false);
        }, 2500);
      } else if (deltaY > 0 && scrollTop > 50) {
        // Continuous upward finger swiping keeps bars hidden and resets the 2.5s timer
        clearInactivityTimer();
        inactivityTimerRef.current = setTimeout(() => {
          setMobileNavHidden(false);
        }, 2500);
      } else if (deltaY < -15) {
        // Downward finger swipe toward earlier content -> reveals navigation immediately
        clearInactivityTimer();
        setMobileNavHidden(false);
      }
    },
    [
      mobileDrawer,
      isTextSelectionActive,
      isPracticeModalOpen,
      isConvertModalOpen,
      isManageGroupModalOpen,
      isPlanModalOpen,
      inspectingCitation,
      activeView,
      clearInactivityTimer,
    ],
  );

  const handleReaderCanvasTap = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (
        mobileDrawer !== 'none' ||
        isTextSelectionActive ||
        isPracticeModalOpen ||
        isConvertModalOpen ||
        isManageGroupModalOpen ||
        isPlanModalOpen ||
        inspectingCitation
      ) {
        return;
      }
      clearInactivityTimer();
      setMobileNavHidden((hidden) => !hidden);
    }
  }, [
    mobileDrawer,
    isTextSelectionActive,
    isPracticeModalOpen,
    isConvertModalOpen,
    isManageGroupModalOpen,
    isPlanModalOpen,
    inspectingCitation,
    clearInactivityTimer,
  ]);

  // Desktop Zen Focus Mode: restore standard workspace on Escape key
  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (
          mobileDrawer !== 'none' ||
          isPracticeModalOpen ||
          isConvertModalOpen ||
          isManageGroupModalOpen ||
          inspectingCitation
        ) {
          return;
        }
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    mobileDrawer,
    isPracticeModalOpen,
    isConvertModalOpen,
    isManageGroupModalOpen,
    inspectingCitation,
  ]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load Workspace by ID with instantaneous cache recovery
  const fetchWorkspace = useCallback(
    async (isBackground = false) => {
      if (!accessToken || !workspaceId) return;

      try {
        const ws = await api.workspaces.getById(workspaceId, accessToken);
        setWorkspace(ws);
        if (user) {
          clientCache.setWorkspace(workspaceId, user.id, ws);
        }
        if (ws.unreadDiscussionCount !== undefined) {
          setUnreadDiscussionCount(ws.unreadDiscussionCount);
        }
        setCurrentDoc(ws.document);
        if (ws.document.pageCount) {
          setTotalPages(ws.document.pageCount);
        }
        setError(null);

        // Load contextual study plan offer
        api.learningPlans
          .getOffer(workspaceId, accessToken)
          .then((offer) => setPlanOffer(offer))
          .catch((err) => console.warn('Failed to load learning plan offer:', err));
      } catch (err: unknown) {
        if (!isBackground) {
          const msg =
            err instanceof Error ? err.message : 'Unable to access this workspace.';
          setError(msg);
        }
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [accessToken, workspaceId, user],
  );

  const handleDismissPlanOffer = async () => {
    if (!accessToken || !workspaceId) return;
    try {
      await api.learningPlans.dismissOffer(workspaceId, accessToken);
      setPlanOffer({ shouldOffer: false, dismissed: true });
    } catch (err) {
      console.error('Failed to dismiss plan offer:', err);
    }
  };

  useEffect(() => {
    if (!accessToken || !workspaceId) return;
    if (user) {
      const cached = clientCache.getWorkspace(workspaceId, user.id);
      if (cached) {
        setWorkspace(cached);
        setCurrentDoc(cached.document);
        if (cached.document.pageCount) {
          setTotalPages(cached.document.pageCount);
        }
        setLoadingWorkspace(false);
        void fetchWorkspace(true);
        return;
      }
    }
    void fetchWorkspace(false);
  }, [accessToken, workspaceId, user, fetchWorkspace]);

  // Poll workspace/document if document is still processing
  useEffect(() => {
    if (!accessToken || !workspaceId) return;
    if (currentDoc?.status === 'READY' || currentDoc?.status === 'FAILED') {
      return;
    }

    const interval = setInterval(() => {
      api.workspaces
        .getById(workspaceId, accessToken)
        .then((ws) => {
          setWorkspace(ws);
          setCurrentDoc(ws.document);
          if (ws.document.pageCount) {
            setTotalPages(ws.document.pageCount);
          }
        })
        .catch((err) => {
          console.warn('Workspace polling check failed:', err);
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [accessToken, workspaceId, currentDoc?.status]);

  const handleMarkDiscussionAsRead = useCallback(async () => {
    if (!accessToken || !workspaceId || workspace?.type !== 'GROUP') return;
    try {
      await api.workspaces.markDiscussionAsRead(workspaceId, accessToken);
      setUnreadDiscussionCount(0);
    } catch {
      // ignore
    }
  }, [accessToken, workspaceId, workspace?.type]);

  // Polling unread discussion count every 6 seconds for group workspaces
  useEffect(() => {
    if (!accessToken || !workspaceId || workspace?.type !== 'GROUP') return;

    let isMounted = true;
    const pollUnread = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const res = await api.workspaces.getUnreadDiscussionCount(workspaceId, accessToken);
        if (isMounted) {
          setUnreadDiscussionCount(res.unreadCount);
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(pollUnread, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [accessToken, workspaceId, workspace?.type]);

  const documentId = currentDoc?.id;

  // Load initial reading progress, outline, and bookmarks once document is ready
  useEffect(() => {
    if (!accessToken || !documentId || currentDoc?.status !== 'READY') {
      return;
    }

    let isMounted = true;

    // Restore saved reading progress (unless URL explicitly specifies a page)
    if (!urlPage || urlPage <= 0) {
      api.documents
        .getProgress(documentId, accessToken)
        .then((prog) => {
          if (!isMounted) return;
          if (prog?.currentPage && prog.currentPage > 0) {
            setCurrentPage(prog.currentPage);
            if (prog.totalPages) setTotalPages(prog.totalPages);
          }
        })
        .catch((err) => {
          console.warn('No existing reading progress found:', err);
        });
    }

    // Load outline
    api.documents
      .getOutline(documentId, accessToken)
      .then((outline) => {
        if (!isMounted) return;
        setOutlineItems(outline.items);
        if (outline.totalPages) setTotalPages(outline.totalPages);
        setLoadingOutline(false);
      })
      .catch((err) => {
        console.error('Failed to load outline:', err);
        if (isMounted) setLoadingOutline(false);
      });

    // Load bookmarks
    api.documents
      .listBookmarks(documentId, accessToken)
      .then((bms) => {
        if (!isMounted) return;
        setBookmarks(bms);
      })
      .catch((err) => {
        console.error('Failed to load bookmarks:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, documentId, currentDoc?.status, urlPage]);

  // Load Reader Content for Current Window
  const loadReaderContent = useCallback(
    async (pageToLoad: number) => {
      if (!accessToken || !documentId || currentDoc?.status !== 'READY') return;
      setLoadingContent(true);
      try {
        const data = await api.documents.getReaderContent(documentId, accessToken, pageToLoad, 30);
        setReaderContent(data);
        if (data.pageCount) setTotalPages(data.pageCount);
      } catch (err) {
        console.error('Failed to load reader content:', err);
      } finally {
        setLoadingContent(false);
      }
    },
    [accessToken, documentId, currentDoc?.status],
  );

  useEffect(() => {
    loadReaderContent(currentPage);
  }, [loadReaderContent, currentPage]);

  // Stable handlers for DocumentReader to eliminate remounting loops
  const handleTotalPagesDetected = useCallback((detected: number) => {
    if (detected > 0) {
      setTotalPages((prev) => (prev === detected ? prev : detected));
    }
  }, []);

  const handleNativeOutlineLoaded = useCallback((nativeItems: DocumentOutlineItemDto[]) => {
    if (nativeItems && nativeItems.length > 0) {
      setOutlineItems(nativeItems);
      setIsNativeOutline(true);
      setLoadingOutline(false);
    }
  }, []);

  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  // Handle page change & debounced reading progress persistence
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Debounce server progress persistence
      if (progressDebounceTimer.current) {
        clearTimeout(progressDebounceTimer.current);
      }
      progressDebounceTimer.current = setTimeout(() => {
        if (accessToken && documentId) {
          api.documents
            .updateProgress(
              documentId,
              {
                currentPage: newPage,
                totalPages: totalPagesRef.current,
              },
              accessToken,
            )
            .catch((err) => console.warn('Failed to persist progress:', err));
        }
      }, 1000);
    },
    [accessToken, documentId],
  );

  // Add bookmark
  const handleAddBookmark = useCallback(
    async (page: number) => {
      if (!accessToken || !documentId) return;
      try {
        const newBm = await api.documents.createBookmark(
          documentId,
          {
            pageNumber: page,
            title: `Page ${page}`,
          },
          accessToken,
        );
        setBookmarks((prev) => [...prev, newBm].sort((a, b) => a.pageNumber - b.pageNumber));
      } catch (err) {
        console.error('Failed to create bookmark:', err);
      }
    },
    [accessToken, documentId],
  );

  // Delete bookmark
  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!accessToken || !documentId) return;
      try {
        await api.documents.deleteBookmark(documentId, bookmarkId, accessToken);
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      } catch (err) {
        console.error('Failed to delete bookmark:', err);
      }
    },
    [accessToken, documentId],
  );

  // Toggle bookmark for page
  const handleToggleBookmark = useCallback(
    async (page: number) => {
      if (!accessToken || !documentId) return;
      const existing = bookmarks.find((b) => b.pageNumber === page);
      if (existing) {
        await handleDeleteBookmark(existing.id);
      } else {
        await handleAddBookmark(page);
      }
    },
    [accessToken, documentId, bookmarks, handleDeleteBookmark, handleAddBookmark],
  );

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!accessToken || !documentId) return;
    try {
      const list = await api.tutor.listConversations(accessToken, documentId);
      setConversations(list);

      // Select first conversation if none active
      if (!activeConversationId && list.length > 0 && list[0]) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [accessToken, documentId, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load active conversation detail
  useEffect(() => {
    if (!accessToken || !activeConversationId) {
      setActiveConversation(null);
      return;
    }

    let isMounted = true;
    setLoadingConv(true);
    api.tutor
      .getConversation(activeConversationId, accessToken)
      .then((detail) => {
        if (!isMounted) return;
        setActiveConversation(detail);
        setLoadingConv(false);
      })
      .catch((err) => {
        console.error('Failed to load conversation messages:', err);
        if (isMounted) setLoadingConv(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, activeConversationId]);

  // Start new conversation
  const handleNewSession = async () => {
    if (!accessToken || !documentId) return;
    try {
      const created = await api.tutor.createConversation(
        {
          documentId,
          title: `Study Session (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        },
        accessToken,
      );
      setConversations((prev) => [created, ...prev]);
      setActiveConversationId(created.id);
      const detail = await api.tutor.getConversation(created.id, accessToken);
      setActiveConversation(detail);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  // Rename session
  const handleRenameSession = async (id: string, newTitle: string) => {
    if (!accessToken) return;
    try {
      const updated = await api.tutor.renameConversation(id, { title: newTitle }, accessToken);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
      if (activeConversationId === id) {
        setActiveConversation((prev) => (prev ? { ...prev, title: updated.title } : null));
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.tutor.deleteConversation(id, accessToken);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConversationId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send tutor message
  const handleSendMessage = async (content: string) => {
    if (!accessToken || !documentId) return;
    setSendingMessage(true);
    setSendError(null);

    try {
      let targetConvId = activeConversationId;
      if (!targetConvId) {
        const newConv = await api.tutor.createConversation(
          {
            documentId,
            title: content.slice(0, 30) + '...',
          },
          accessToken,
        );
        targetConvId = newConv.id;
        setActiveConversationId(newConv.id);
        setConversations((prev) => [newConv, ...prev]);
      }

      // Optimistic user message in UI
      const tempUserMsg: ConversationMessageDto = {
        id: `temp-${Date.now()}`,
        conversationId: targetConvId,
        sender: 'USER',
        content,
        tokenCount: null,
        citations: [],
        createdAt: new Date().toISOString(),
      };

      setActiveConversation((prev) => {
        if (!prev) {
          return {
            id: targetConvId!,
            userId: user?.id || '',
            documentId,
            title: content.slice(0, 30),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [tempUserMsg],
          };
        }
        return {
          ...prev,
          messages: [...prev.messages, tempUserMsg],
        };
      });

      const assistantMsg = await api.tutor.sendMessage(
        targetConvId,
        {
          message: content,
        },
        accessToken,
      );

      // Append assistant response
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, assistantMsg],
        };
      });

      // Update conversations summary list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messageCount: c.messageCount + 2,
                lastMessagePreview: assistantMsg.content.slice(0, 80),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to receive tutor explanation.';
      setSendError(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  // Contextual text selection action callback ("Ask AI")
  const handleExplainParagraph = useCallback(
    (selectedText: string, pageNum: number) => {
      setActiveView('ai-tutor');
      setCopilotOpen(true);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileDrawer('chat');
      }
      const currentChapter =
        [...outlineItems].reverse().find((o) => o.pageNumber <= pageNum)?.title || '';
      const sourceRef = currentChapter
        ? `("${currentChapter}", Page ${pageNum})`
        : `(Page ${pageNum})`;

      setPreparedQuestion(
        `Please explain this passage from ${currentDoc?.title || 'the textbook'} ${sourceRef}:\n\n"${selectedText}"`,
      );
    },
    [currentDoc?.title, outlineItems],
  );

  // Handle citation click: resolve chunk, navigate center reader, apply highlight
  const handleCitationClick = useCallback(
    async (chunkId: string, pageNumber?: number | null) => {
      setActiveCitationChunkId(chunkId);

      if (pageNumber && pageNumber > 0) {
        handlePageChange(pageNumber);
      } else if (accessToken) {
        try {
          const detail = await api.tutor.getChunkDetail(chunkId, accessToken);
          if (detail.pageNumber && detail.pageNumber !== currentPage) {
            handlePageChange(detail.pageNumber);
          }
        } catch (err) {
          console.warn('Could not resolve chunk page:', err);
        }
      }

      // Auto-clear highlight after 6 seconds
      setTimeout(() => {
        setActiveCitationChunkId((current) => (current === chunkId ? null : current));
      }, 6000);
    },
    [accessToken, currentPage, handlePageChange],
  );

  // Open Citation Inspector Slide-Over
  const handleOpenCitationInspector = async (citation: MessageCitationDto) => {
    setInspectingCitation(citation);
    setLoadingChunk(true);
    setChunkError(null);

    if (accessToken && citation.chunkId) {
      try {
        const detail = await api.tutor.getChunkDetail(citation.chunkId, accessToken);
        setChunkDetail(detail);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to inspect passage.';
        setChunkError(msg);
      } finally {
        setLoadingChunk(false);
      }
    } else {
      setLoadingChunk(false);
    }
  };

  if (loadingWorkspace) {
    return <WorkspaceSkeleton />;
  }

  if (error || !workspace || !currentDoc) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5] px-4">
        <div className="w-full max-w-md p-6 bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-2xl shadow-[0_4px_0_0_#1B3428] text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8722C]/10 text-[#E8722C] flex items-center justify-center mx-auto mb-4 border border-[#E8722C]/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-lg text-[#14261D] mb-2">
            Unable to Open Workspace
          </h2>
          <p className="text-xs text-[#14261D]/70 mb-6 leading-relaxed">
            {error || 'This workspace does not exist or you do not have permission to access it.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Books</span>
          </Link>
        </div>
      </div>
    );
  }

  // If document is still processing
  if (currentDoc.status !== 'READY' && currentDoc.status !== 'FAILED') {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5] px-4">
        <div className="w-full max-w-md p-8 bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-2xl shadow-[0_4px_0_0_#1B3428] text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_0_#B26E45]">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <h2 className="font-display font-bold text-lg text-[#14261D] mb-2">
            Processing Your Material
          </h2>
          <p className="text-xs text-[#14261D]/70 mb-6 leading-relaxed">
            Lernivox is reading, chunking, and indexing &ldquo;{currentDoc.title}&rdquo; for AI-grounded study. This workspace will open automatically when ready.
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#14261D]/70 hover:text-[#14261D] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If document processing failed
  if (currentDoc.status === 'FAILED') {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5] px-4">
        <div className="w-full max-w-md p-6 bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-2xl shadow-[0_4px_0_0_#1B3428] text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-lg text-[#14261D] mb-2">
            Processing Error
          </h2>
          <p className="text-xs text-[#14261D]/70 mb-6 leading-relaxed">
            {currentDoc.errorMessage || 'An error occurred while indexing this document. Please try uploading it again.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs shadow-[0_3px_0_0_#0D1B14] hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Books</span>
          </Link>
        </div>
      </div>
    );
  }

  const fileUrl = documentId ? api.documents.getFileUrl(documentId) : '';

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-[#F4F0E5] text-[#14261D] selection:bg-[#FBE8DC] overflow-hidden overscroll-none">
      {/* =========================================================================
          1. TOP NAVIGATION
          Desktop & Tablet (>=768px): Balanced Three-Zone True-Center Grid
          Mobile (<768px): Unified Coordinated 2-Row Header (48px Header + 40px Reader Toolbar)
          ========================================================================= */}
      <div
        className={`hidden md:block shrink-0 z-30 transition-transform duration-300 ${
          isFocusMode ? '-translate-y-full h-0 overflow-hidden pointer-events-none' : 'translate-y-0 h-14'
        }`}
      >
        <TutorHeader
          document={currentDoc}
          workspaceType={workspace.type}
          isOwner={isOwner}
          memberCount={workspace.members?.length || 1}
          unreadDiscussionCount={unreadDiscussionCount}
          activeView={activeView}
          onViewChange={handleViewChange}
          onToggleAiTutor={handleToggleAiTutor}
          onOpenConvertModal={() => setIsConvertModalOpen(true)}
          onOpenManageGroupModal={() => setIsManageGroupModalOpen(true)}
          outlineOpen={mobileDrawer === 'toc' || (outlineOpen && mobileDrawer === 'none')}
          onToggleOutline={toggleToc}
          copilotOpen={copilotOpen}
          onToggleCopilot={handleToggleAiTutor}
        />
      </div>

      {/* Mobile (<768px) Unified Coordinated Header Wrapper (Row 1: 48px Header + Row 2: 40px Reader Toolbar) */}
      <header
        className={`md:hidden fixed top-0 inset-x-0 z-30 w-full bg-[#FAF8F4] transition-transform duration-300 ease-in-out motion-reduce:transition-none select-none ${
          mobileNavHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Row 1: 48px Application Header (Constrained 3-column grid prevents 320px collisions) */}
        <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 h-12 w-full border-b-[1.5px] border-[#1B3428]/10 px-3 bg-[#FAF8F4]">
          {/* Left: Fixed 32x32 Back Button */}
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full border-[1.5px] border-[#1B3428] bg-[#FAF8F4] flex items-center justify-center text-[#14261D] shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
            title="Back to Books"
            aria-label="Back to Books"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          {/* Center: Flexible Truncatable Title */}
          <div className="min-w-0 w-full overflow-hidden text-center px-1">
            <h2
              className="font-display font-bold text-xs text-[#14261D] truncate"
              title={currentDoc?.title || 'Textbook'}
            >
              {currentDoc?.title || 'Textbook'}
            </h2>
          </div>

          {/* Right: Unclipped Avatar Trigger with Protected Right Margin */}
          <div className="shrink-0 flex items-center justify-end">
            <ProfileMenu compact />
          </div>
        </div>

        {/* Row 2: 40px Secondary Reader Toolbar */}
        <div className="h-10 w-full border-b border-[#1B3428]/15 px-3 flex items-center justify-between bg-[#FAF8F4]">
          {/* Left: Group Hub Collaboration Action (Mobile) */}
          {workspace?.type === 'GROUP' ? (
            <button
              type="button"
              onClick={() => {
                setMobileNavHidden(false);
                setIsManageGroupModalOpen(true);
              }}
              className="relative h-7 px-2.5 rounded-full border border-[#1B3428]/25 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:bg-[#FBE8DC] hover:border-[#E8722C] shadow-2xs active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title={`Manage group members (${workspace.members?.length || 1})${unreadDiscussionCount > 0 ? ` • ${unreadDiscussionCount} unread message${unreadDiscussionCount > 1 ? 's' : ''}` : ''}`}
              aria-label={`Manage group members (${workspace.members?.length || 1})${unreadDiscussionCount > 0 ? `, ${unreadDiscussionCount} unread messages` : ''}`}
            >
              <Users className="w-3.5 h-3.5 text-[#E8722C]" />
              <span className="font-mono text-xs font-bold text-[#14261D]">
                {workspace.members?.length || 1}
              </span>
              {unreadDiscussionCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-[#E8722C] text-white text-[9px] font-mono font-bold rounded-full border border-[#FAF8F4] flex items-center justify-center shadow-xs">
                  {unreadDiscussionCount > 99 ? '99+' : unreadDiscussionCount}
                </span>
              )}
            </button>
          ) : isOwner ? (
            <button
              type="button"
              onClick={() => {
                setMobileNavHidden(false);
                setIsConvertModalOpen(true);
              }}
              className="h-7 px-2.5 rounded-full border border-[#1B3428]/25 bg-[#FAF8F4] text-[#14261D] font-display font-bold text-xs hover:bg-[#FBE8DC] hover:border-[#E8722C] shadow-2xs active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Convert to shared group workspace"
              aria-label="Convert to shared group workspace"
            >
              <Users className="w-3.5 h-3.5 text-[#E8722C]" />
              <span className="text-[11px] font-display font-bold text-[#14261D]">Group</span>
            </button>
          ) : (
            <div className="w-7 h-7" />
          )}

          {/* Center: Authoritative Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (currentPage > 1) {
                  handlePageChange(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="px-2 py-0.5 rounded-lg bg-white border border-[#1B3428]/20 font-mono text-[11px] font-bold text-[#14261D]">
              <span className="text-[#E8722C]">{currentPage}</span>
              <span className="text-[#14261D]/40 mx-1">/</span>
              <span>{totalPages || 1}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (currentPage < (totalPages || 1)) {
                  handlePageChange(currentPage + 1);
                }
              }}
              disabled={currentPage >= (totalPages || 1)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Bookmark Ribbon */}
          {(() => {
            const isBookmarked = Boolean(bookmarks?.some((b) => b.pageNumber === currentPage));
            return (
              <button
                type="button"
                onClick={() => handleToggleBookmark(currentPage)}
                className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#FBE8DC] border-[#E8722C]/40 text-[#E8722C]'
                    : 'bg-[#FAF8F4] border-[#1B3428]/20 text-[#14261D]/60'
                }`}
                title={isBookmarked ? `Remove Bookmark (Page ${currentPage})` : `Bookmark Page ${currentPage}`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E8722C] text-[#E8722C]' : ''}`} />
              </button>
            );
          })()}
        </div>
      </header>

      {/* =========================================================================
          2. MAIN STUDY WORKSPACE
          Left TOC & Central PDF Reader are permanently mounted.
          They NEVER unmount or reload on companion mode changes.
          ========================================================================= */}
      <div
        className={`flex-1 min-h-0 flex w-full relative overflow-hidden transition-[padding] duration-300 ease-in-out motion-reduce:transition-none md:pt-0 md:pb-0 ${
          mobileNavHidden ? 'pt-0' : 'pt-[88px]'
        } ${mobileNavHidden ? 'pb-0' : 'pb-14'}`}
      >
        {/* PANE 1: DESKTOP LEFT OUTLINE (Hidden on Mobile, Single Docked Sidebar below 1280px) */}
        <DocumentOutlinePane
          isOpen={!isFocusMode && outlineOpen && (!isBelow1280 || !copilotOpen)}
          onToggle={() => setOutlineOpen((o) => !o)}
          outlineItems={outlineItems}
          loadingOutline={loadingOutline}
          isNativeOutline={isNativeOutline}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageSelect={handlePageChange}
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onPracticeChapter={(item) => {
            setPreselectedPracticeChapter(item.title);
            setPreselectedPracticePage(item.pageNumber);
            setIsPracticeModalOpen(true);
          }}
        />

        {/* PANE 2: CENTER DOCUMENT READER (The Permanent Central Reading Stage) */}
        <main className="w-full lg:flex-1 h-full min-h-0 flex flex-col min-w-0 md:min-w-[620px] max-md:min-w-0 max-md:w-full bg-[#F4F0E5] relative overflow-hidden">
          <DocumentReader
            document={currentDoc}
            readerContent={readerContent}
            loadingContent={loadingContent}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            totalPages={totalPages}
            onTotalPagesDetected={handleTotalPagesDetected}
            onNativeOutlineLoaded={handleNativeOutlineLoaded}
            activeCitationChunkId={activeCitationChunkId}
            citationPage={chunkDetail?.pageNumber || null}
            onExplainParagraph={handleExplainParagraph}
            onPracticeSelection={(page) => {
              const currentChapter =
                [...outlineItems].reverse().find((o) => o.pageNumber <= page)?.title || '';
              setPreselectedPracticeChapter(currentChapter);
              setPreselectedPracticePage(page);
              setIsPracticeModalOpen(true);
            }}
            onCreateCardSelection={(_text, page) => {
              const currentChapter =
                [...outlineItems].reverse().find((o) => o.pageNumber <= page)?.title || '';
              setPreselectedPracticeChapter(currentChapter);
              setPreselectedPracticePage(page);
              setActiveView('flashcards');
              setCopilotOpen(true);
            }}
            onAddBookmark={handleAddBookmark}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            fileUrl={fileUrl}
            accessToken={accessToken || undefined}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((f) => !f)}
            onSelectionActiveChange={setIsTextSelectionActive}
            onScrollDelta={handleReaderScrollDelta}
            onCanvasTap={handleReaderCanvasTap}
          />
        </main>

        {/* PANE 3: DESKTOP COMPANION SIDECAR (Multi-Mode Study Tools) */}
        {!isFocusMode && copilotOpen && (!isBelow1280 || !outlineOpen) && (
          <aside className="hidden lg:flex flex-col h-full shrink-0 border-l-[2px] border-[#1B3428]/20 bg-[#FAF8F4] z-20 shadow-[-4px_0_12px_rgba(20,38,29,0.05)] w-[340px] xl:w-[420px]">
            {/* Unified 44px Sidecar Title Bar */}
            <div className="h-11 px-4 bg-[#FAF8F4] border-b-[1.5px] border-[#1B3428]/15 flex items-center justify-between shrink-0 select-none">
              <h3 className="font-display font-bold text-xs sm:text-sm text-[#14261D] truncate">
                {activeView === 'read' || activeView === 'ai-tutor'
                  ? 'AI Study Tutor'
                  : activeView === 'quizzes'
                  ? 'Quizzes & Tests'
                  : activeView === 'flashcards'
                  ? 'Flashcard Decks'
                  : 'My Progress'}
              </h3>
              <button
                type="button"
                onClick={() => setCopilotOpen(false)}
                className="w-7 h-7 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 transition-all cursor-pointer"
                title="Collapse sidecar"
                aria-label="Collapse sidecar"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {(activeView === 'read' || activeView === 'ai-tutor') && (
                <RightWorkspacePanel
                  hideHeader={true}
                  workspaceType={workspace.type}
                  workspaceId={workspace.id}
                  currentUserId={user?.id || ''}
                  currentPage={currentPage}
                  currentChapter={
                    [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title || ''
                  }
                  isOpen={true}
                  onToggle={() => setCopilotOpen(false)}
                  document={currentDoc}
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  activeConversation={activeConversation}
                  loadingConv={loadingConv}
                  onSelectConversation={setActiveConversationId}
                  onNewSession={handleNewSession}
                  onRenameSession={handleRenameSession}
                  onDeleteSession={handleDeleteSession}
                  onSendMessage={handleSendMessage}
                  sendingMessage={sendingMessage}
                  sendError={sendError}
                  onRetryMessage={() => {
                    if (activeConversation?.messages.length) {
                      const lastUser = [...activeConversation.messages].reverse().find((m) => m.sender === 'USER');
                      if (lastUser) handleSendMessage(lastUser.content);
                    }
                  }}
                  onCitationClick={handleCitationClick}
                  onOpenCitationInspector={handleOpenCitationInspector}
                  preparedQuestion={preparedQuestion}
                  onClearPreparedQuestion={() => setPreparedQuestion(null)}
                  onShareConversation={handleShareConversation}
                  isSharingConversation={isSharingConversation}
                  planOffer={planOffer}
                  onOpenPlanModal={() => setIsPlanModalOpen(true)}
                  onDismissPlanOffer={handleDismissPlanOffer}
                  unreadDiscussionCount={unreadDiscussionCount}
                  onDiscussionRead={handleMarkDiscussionAsRead}
                />
              )}
              {activeView === 'quizzes' && (
                <WorkspaceQuizzesView
                  workspaceId={workspace.id}
                  document={currentDoc}
                  onReturnToBook={() => setCopilotOpen(false)}
                  preselectedChapter={preselectedPracticeChapter}
                  preselectedPage={preselectedPracticePage}
                  onCitationClick={(page) => handlePageChange(page)}
                  isCompactSidecar={true}
                />
              )}
              {activeView === 'flashcards' && (
                <WorkspaceFlashcardsView
                  workspaceId={workspace.id}
                  document={currentDoc}
                  onReturnToBook={() => setCopilotOpen(false)}
                  preselectedChapter={preselectedPracticeChapter}
                  preselectedPage={preselectedPracticePage}
                  onCitationClick={(page) => handlePageChange(page)}
                  isCompactSidecar={true}
                />
              )}
              {activeView === 'plan' && (
                <WorkspaceLearningPlanView
                  workspaceId={workspace.id}
                  document={currentDoc}
                  onNavigateToPage={(page) => handlePageChange(page)}
                  onSwitchTab={(tab) => {
                    if (tab === 'read') {
                      setActiveView('ai-tutor');
                    } else {
                      setActiveView(tab as any);
                    }
                  }}
                  onOpenTutor={() => setActiveView('ai-tutor')}
                />
              )}
              {activeView === 'progress' && (
                <WorkspaceProgressView
                  workspaceId={workspace.id}
                  document={currentDoc}
                  onReturnToBook={() => setCopilotOpen(false)}
                  onTakeQuiz={() => setActiveView('quizzes')}
                  onStudyFlashcards={() => setActiveView('flashcards')}
                  onNavigateToPage={(page) => handlePageChange(page)}
                  isCompactSidecar={true}
                />
              )}
            </div>
          </aside>
        )}

        {/* Right-edge tactile companion anchor tab when sidecar is collapsed (Desktop) */}
        {!isFocusMode && !copilotOpen && (
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 w-7 py-3 px-1 rounded-l-xl bg-[#FAF8F4] border-[1.5px] border-r-0 border-[#1B3428] text-[#14261D] shadow-[-2px_2px_8px_rgba(20,38,29,0.12)] hover:-translate-x-0.5 hover:bg-[#FBE8DC] hover:text-[#E8722C] transition-all flex-col items-center gap-2 cursor-pointer group"
            title={`Open ${
              activeView === 'ai-tutor'
                ? 'AI Study Tutor'
                : activeView === 'quizzes'
                ? 'Quizzes & Tests'
                : activeView === 'flashcards'
                ? 'Flashcard Decks'
                : 'My Progress'
            }`}
            aria-label="Open Companion Study Sidecar"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8722C] group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-[10px] tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase text-[#14261D]/80 group-hover:text-[#E8722C]">
              {activeView === 'ai-tutor' ? 'AI Tutor' : activeView === 'quizzes' ? 'Quizzes' : activeView === 'flashcards' ? 'Cards' : 'Progress'}
            </span>
          </button>
        )}

        {/* =========================================================================
            TABLET & SINGLE-DOCKED-SIDEBAR SLIDE-OVER OVERLAYS
            Prevents crushed PDF reader width below 1280px while preserving full outline and study sidecar access
            ========================================================================= */}
        {/* Tablet Left Outline Overlay & Single-Docked-Sidebar Overlay when Copilot is docked below 1280px */}
        {!isFocusMode && outlineOpen && (isTablet || (isBelow1280 && copilotOpen)) && (
          <div
            className="hidden md:block fixed inset-0 top-14 z-40 bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200"
            onClick={() => setOutlineOpen(false)}
          >
            <div
              className="absolute inset-y-0 left-0 w-72 sm:w-80 bg-[#FAF8F4] border-r-[2px] border-[#1B3428] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <DocumentOutlinePane
                isOpen={true}
                onToggle={() => setOutlineOpen(false)}
                outlineItems={outlineItems}
                loadingOutline={loadingOutline}
                isNativeOutline={isNativeOutline}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageSelect={(p) => {
                  handlePageChange(p);
                  setOutlineOpen(false);
                }}
                bookmarks={bookmarks}
                onAddBookmark={handleAddBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onPracticeChapter={(item) => {
                  setPreselectedPracticeChapter(item.title);
                  setPreselectedPracticePage(item.pageNumber);
                  setOutlineOpen(false);
                  setIsPracticeModalOpen(true);
                }}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setOutlineOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Tablet Right Companion Sidecar Overlay */}
        {!isFocusMode && copilotOpen && (
          <div
            className="hidden md:block lg:hidden fixed inset-0 top-14 z-40 bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200"
            onClick={() => setCopilotOpen(false)}
          >
            <div
              className="absolute inset-y-0 right-0 w-[380px] max-w-[85vw] bg-[#FAF8F4] border-l-[2px] border-[#1B3428] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 44px Unified Tablet Sidecar Header */}
              <div className="h-11 px-4 bg-[#FAF8F4] border-b-[1.5px] border-[#1B3428]/15 flex items-center justify-between shrink-0 select-none">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#14261D] truncate">
                  {activeView === 'read' || activeView === 'ai-tutor'
                    ? 'AI Study Tutor'
                    : activeView === 'quizzes'
                    ? 'Quizzes & Tests'
                    : activeView === 'flashcards'
                    ? 'Flashcard Decks'
                    : 'My Progress'}
                </h3>
                <button
                  type="button"
                  onClick={() => setCopilotOpen(false)}
                  className="w-7 h-7 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:text-[#14261D] hover:bg-[#1B3428]/5 transition-all cursor-pointer"
                  title="Close sidecar"
                  aria-label="Close sidecar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {(activeView === 'read' || activeView === 'ai-tutor') && (
                  <RightWorkspacePanel
                    hideHeader={true}
                    workspaceType={workspace.type}
                    workspaceId={workspace.id}
                    currentUserId={user?.id || ''}
                    currentPage={currentPage}
                    currentChapter={
                      [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title || ''
                    }
                    isOpen={true}
                    onToggle={() => setCopilotOpen(false)}
                    document={currentDoc}
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    activeConversation={activeConversation}
                    loadingConv={loadingConv}
                    onSelectConversation={setActiveConversationId}
                    onNewSession={handleNewSession}
                    onRenameSession={handleRenameSession}
                    onDeleteSession={handleDeleteSession}
                    onSendMessage={handleSendMessage}
                    sendingMessage={sendingMessage}
                    sendError={sendError}
                    onRetryMessage={() => {
                      if (activeConversation?.messages.length) {
                        const lastUser = [...activeConversation.messages].reverse().find((m) => m.sender === 'USER');
                        if (lastUser) handleSendMessage(lastUser.content);
                      }
                    }}
                    onCitationClick={(chunkId, pageNum) => {
                      handleCitationClick(chunkId, pageNum);
                      setCopilotOpen(false);
                    }}
                    onOpenCitationInspector={handleOpenCitationInspector}
                    preparedQuestion={preparedQuestion}
                    onClearPreparedQuestion={() => setPreparedQuestion(null)}
                    onShareConversation={handleShareConversation}
                    isSharingConversation={isSharingConversation}
                    isMobileDrawer={true}
                    onCloseMobileDrawer={() => setCopilotOpen(false)}
                    planOffer={planOffer}
                    onOpenPlanModal={() => setIsPlanModalOpen(true)}
                    onDismissPlanOffer={handleDismissPlanOffer}
                    unreadDiscussionCount={unreadDiscussionCount}
                    onDiscussionRead={handleMarkDiscussionAsRead}
                  />
                )}
                {activeView === 'quizzes' && (
                  <WorkspaceQuizzesView
                    workspaceId={workspace.id}
                    document={currentDoc}
                    onReturnToBook={() => setCopilotOpen(false)}
                    preselectedChapter={preselectedPracticeChapter}
                    preselectedPage={preselectedPracticePage}
                    onCitationClick={(page) => {
                      handlePageChange(page);
                      setCopilotOpen(false);
                    }}
                    isCompactSidecar={true}
                  />
                )}
                {activeView === 'flashcards' && (
                  <WorkspaceFlashcardsView
                    workspaceId={workspace.id}
                    document={currentDoc}
                    onReturnToBook={() => setCopilotOpen(false)}
                    preselectedChapter={preselectedPracticeChapter}
                    preselectedPage={preselectedPracticePage}
                    onCitationClick={(page) => {
                      handlePageChange(page);
                      setCopilotOpen(false);
                    }}
                    isCompactSidecar={true}
                  />
                )}
                {activeView === 'plan' && (
                  <WorkspaceLearningPlanView
                    workspaceId={workspace.id}
                    document={currentDoc}
                    onNavigateToPage={(page) => {
                      handlePageChange(page);
                      setCopilotOpen(false);
                    }}
                    onSwitchTab={(tab) => {
                      if (tab === 'read') {
                        setCopilotOpen(false);
                      } else {
                        setActiveView(tab as any);
                      }
                    }}
                    onOpenTutor={() => setActiveView('ai-tutor')}
                  />
                )}
                {activeView === 'progress' && (
                  <WorkspaceProgressView
                    workspaceId={workspace.id}
                    document={currentDoc}
                    onReturnToBook={() => setCopilotOpen(false)}
                    onTakeQuiz={() => setActiveView('quizzes')}
                    onStudyFlashcards={() => setActiveView('flashcards')}
                    onNavigateToPage={(page) => handlePageChange(page)}
                    isCompactSidecar={true}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. MOBILE SLIDE-OVER DRAWERS & PRACTICE SHEET (Mutually Exclusive)
            ========================================================================= */}
        {mobileDrawer !== 'none' && (
          <div
            className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs transition-opacity flex"
            onClick={closeMobileDrawer}
          >
            {/* A. Mobile TOC Drawer */}
            {mobileDrawer === 'toc' && (
              <div
                className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-[#FAF8F4] border-r-[2px] border-[#1B3428] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <DocumentOutlinePane
                  isOpen={true}
                  onToggle={closeMobileDrawer}
                  outlineItems={outlineItems}
                  loadingOutline={loadingOutline}
                  isNativeOutline={isNativeOutline}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageSelect={(p) => {
                    handlePageChange(p);
                    closeMobileDrawer();
                  }}
                  bookmarks={bookmarks}
                  onAddBookmark={handleAddBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onPracticeChapter={(item) => {
                    setPreselectedPracticeChapter(item.title);
                    setPreselectedPracticePage(item.pageNumber);
                    closeMobileDrawer();
                    setIsPracticeModalOpen(true);
                  }}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={closeMobileDrawer}
                />
              </div>
            )}

            {/* B. Mobile Review Bottom Sheet (Quizzes | Flashcards | My Progress) */}
            {mobileDrawer === 'review' && (
              <div
                className="absolute inset-x-0 bottom-0 max-h-[85vh] h-[85vh] bg-[#FAF8F4] border-t-[2px] border-[#1B3428] shadow-2xl rounded-t-3xl flex flex-col z-10 animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Review Sheet Header with Switcher & Close */}
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b-[1.5px] border-[#1B3428]/15 flex items-center justify-between gap-2 shrink-0 bg-[#FAF8F4] rounded-t-3xl">
                  {/* Internal Review Switcher */}
                  <nav className="flex items-center gap-1 bg-[#F4F0E5] p-1 rounded-full border border-[#1B3428]/15 shadow-2xs overflow-x-auto scrollbar-none min-w-0 max-w-[calc(100%-36px)]">
                    <button
                      type="button"
                      onClick={() => setActiveView('quizzes')}
                      className={`px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeView === 'quizzes' || !['flashcards', 'plan', 'progress'].includes(activeView)
                          ? 'bg-[#14261D] text-white shadow-xs'
                          : 'text-[#14261D]/70'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quizzes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('flashcards')}
                      className={`px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeView === 'flashcards'
                          ? 'bg-[#14261D] text-white shadow-xs'
                          : 'text-[#14261D]/70'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('plan')}
                      className={`px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeView === 'plan'
                          ? 'bg-[#14261D] text-white shadow-xs'
                          : 'text-[#14261D]/70'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('progress')}
                      className={`px-3 py-1 rounded-full font-display font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeView === 'progress'
                          ? 'bg-[#14261D] text-white shadow-xs'
                          : 'text-[#14261D]/70'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Progress</span>
                    </button>
                  </nav>

                  <button
                    type="button"
                    onClick={closeMobileDrawer}
                    className="w-7 h-7 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#1B3428]/5 cursor-pointer shrink-0"
                    title="Close review sheet"
                    aria-label="Close review sheet"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Review Sheet Content Body */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {(activeView === 'quizzes' || !['flashcards', 'plan', 'progress'].includes(activeView)) && (
                    <WorkspaceQuizzesView
                      workspaceId={workspace.id}
                      document={currentDoc}
                      onReturnToBook={closeMobileDrawer}
                      preselectedChapter={preselectedPracticeChapter}
                      preselectedPage={preselectedPracticePage}
                      onCitationClick={(page) => {
                        handlePageChange(page);
                        closeMobileDrawer();
                      }}
                      isCompactSidecar={true}
                    />
                  )}
                  {activeView === 'flashcards' && (
                    <WorkspaceFlashcardsView
                      workspaceId={workspace.id}
                      document={currentDoc}
                      onReturnToBook={closeMobileDrawer}
                      preselectedChapter={preselectedPracticeChapter}
                      preselectedPage={preselectedPracticePage}
                      onCitationClick={(page) => {
                        handlePageChange(page);
                        closeMobileDrawer();
                      }}
                      isCompactSidecar={true}
                    />
                  )}
                  {activeView === 'plan' && (
                    <WorkspaceLearningPlanView
                      workspaceId={workspace.id}
                      document={currentDoc}
                      onNavigateToPage={(page) => {
                        handlePageChange(page);
                        closeMobileDrawer();
                      }}
                      onSwitchTab={(tab) => {
                        if (tab === 'read') {
                          closeMobileDrawer();
                        } else {
                          setActiveView(tab as any);
                        }
                      }}
                      onOpenTutor={() => setMobileDrawer('chat')}
                    />
                  )}
                  {activeView === 'progress' && (
                    <WorkspaceProgressView
                      workspaceId={workspace.id}
                      document={currentDoc}
                      onReturnToBook={closeMobileDrawer}
                      onTakeQuiz={() => setActiveView('quizzes')}
                      onStudyFlashcards={() => setActiveView('flashcards')}
                      onNavigateToPage={(page) => {
                        handlePageChange(page);
                        closeMobileDrawer();
                      }}
                      isCompactSidecar={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* C. Mobile AI Tutor Drawer */}
            {mobileDrawer === 'chat' && (
              <div
                className="absolute inset-y-0 right-0 w-[90%] max-w-md bg-[#FAF8F4] border-l-[2px] border-[#1B3428] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 44px Drawer Header */}
                <div className="h-11 px-4 bg-[#FAF8F4] border-b-[1.5px] border-[#1B3428]/15 flex items-center justify-between shrink-0 select-none">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-[#14261D] truncate">
                    AI Study Tutor
                  </h3>
                  <button
                    type="button"
                    onClick={closeMobileDrawer}
                    className="w-7 h-7 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#1B3428]/5 cursor-pointer"
                    title="Close tutor"
                    aria-label="Close tutor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <RightWorkspacePanel
                    hideHeader={true}
                    workspaceType={workspace.type}
                    workspaceId={workspace.id}
                    currentUserId={user?.id || ''}
                    currentPage={currentPage}
                    currentChapter={
                      [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title || ''
                    }
                    isOpen={true}
                    onToggle={closeMobileDrawer}
                    document={currentDoc}
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    activeConversation={activeConversation}
                    loadingConv={loadingConv}
                    onSelectConversation={setActiveConversationId}
                    onNewSession={handleNewSession}
                    onRenameSession={handleRenameSession}
                    onDeleteSession={handleDeleteSession}
                    onSendMessage={handleSendMessage}
                    sendingMessage={sendingMessage}
                    sendError={sendError}
                    onRetryMessage={() => {
                      if (activeConversation?.messages.length) {
                        const lastUser = [...activeConversation.messages].reverse().find((m) => m.sender === 'USER');
                        if (lastUser) handleSendMessage(lastUser.content);
                      }
                    }}
                    onCitationClick={(chunkId, pageNum) => {
                      handleCitationClick(chunkId, pageNum);
                      closeMobileDrawer();
                    }}
                    onOpenCitationInspector={handleOpenCitationInspector}
                    preparedQuestion={preparedQuestion}
                    onClearPreparedQuestion={() => setPreparedQuestion(null)}
                    onShareConversation={handleShareConversation}
                    isSharingConversation={isSharingConversation}
                    isMobileDrawer={true}
                    onCloseMobileDrawer={closeMobileDrawer}
                    planOffer={planOffer}
                    onOpenPlanModal={() => setIsPlanModalOpen(true)}
                    onDismissPlanOffer={handleDismissPlanOffer}
                    unreadDiscussionCount={unreadDiscussionCount}
                    onDiscussionRead={handleMarkDiscussionAsRead}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          4. MOBILE 56px BOTTOM THUMB DOCK (No 'Read' button! Resting state is the book)
          ========================================================================= */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 h-14 bg-[#FAF8F4]/95 backdrop-blur-md border-t-[1.5px] border-[#1B3428]/15 z-40 px-6 flex items-center justify-around pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out motion-reduce:transition-none select-none ${
          mobileNavHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Outline Button */}
        <button
          type="button"
          onClick={() => {
            setMobileNavHidden(false);
            setMobileDrawer((prev) => (prev === 'toc' ? 'none' : 'toc'));
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            mobileDrawer === 'toc' ? 'text-[#E8722C]' : 'text-[#14261D]/75 active:text-[#14261D]'
          }`}
          title="Outline"
          aria-label="Outline"
        >
          <List className="w-4 h-4" />
          <span className="text-[10px] font-display font-bold">Outline</span>
        </button>

        {/* Review Button (opens Quizzes, Flashcards, Progress) */}
        <button
          type="button"
          onClick={() => {
            setMobileNavHidden(false);
            setMobileDrawer((prev) => {
              if (prev === 'review') return 'none';
              // If current activeView is not one of the review views, default to quizzes
              if (!['quizzes', 'flashcards', 'plan', 'progress'].includes(activeView)) {
                setActiveView('quizzes');
              }
              return 'review';
            });
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            mobileDrawer === 'review' ? 'text-[#E8722C]' : 'text-[#14261D]/75 active:text-[#14261D]'
          }`}
          title="Review"
          aria-label="Review"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] font-display font-bold">Review</span>
        </button>

        {/* AI Tutor Button */}
        <button
          type="button"
          onClick={() => {
            setMobileNavHidden(false);
            setMobileDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'));
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors cursor-pointer ${
            mobileDrawer === 'chat' ? 'text-[#E8722C]' : 'text-[#14261D]/75 active:text-[#14261D]'
          }`}
          title="AI Tutor"
          aria-label="AI Tutor"
        >
          <Sparkles className="w-4 h-4 text-[#E8722C]" />
          <span className="text-[10px] font-display font-bold">AI Tutor</span>
        </button>
      </div>

      {/* 5. SLIDE-OVER PASSAGE VERIFICATION DRAWER */}
      {inspectingCitation && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FAF8F4] h-full border-l-[2px] border-[#1B3428] shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1B3428]/15 mb-6">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-[#E2EBD8] text-[#497E64] font-mono font-bold text-[10px] uppercase tracking-wider">
                  Verified Citation {inspectingCitation.sourceId}
                </span>
                <h3 className="font-display font-extrabold text-lg text-[#14261D] mt-1">
                  Source Grounding Evidence
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCitation(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/70 hover:bg-[#FBE8DC] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Verbatim Quote Snippet */}
              <div className="p-4 rounded-2xl bg-[#FBE8DC] border border-[#E8722C]/30 shadow-2xs">
                <span className="font-mono text-[10px] uppercase font-bold text-[#E8722C] tracking-wider block mb-1">
                  Supported Verbatim Quote
                </span>
                <p className="font-serif text-xs text-[#14261D] italic leading-relaxed">
                  &ldquo;{inspectingCitation.quoteSnippet}&rdquo;
                </p>
              </div>

              {/* Surrounding Passage in Textbook */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xs text-[#14261D]">
                    Surrounding Passage in Material
                  </span>
                  {chunkDetail?.pageNumber && (
                    <span className="font-mono text-[11px] text-[#14261D]/60 font-bold">
                      Page {chunkDetail.pageNumber}
                    </span>
                  )}
                </div>

                {loadingChunk ? (
                  <div className="p-8 text-center bg-[#F4F0E5] rounded-2xl border border-[#1B3428]/10">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E8722C] mx-auto mb-2" />
                    <p className="font-display font-bold text-xs text-[#14261D]">
                      Retrieving passage from database...
                    </p>
                  </div>
                ) : chunkError ? (
                  <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs">{chunkError}</div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 font-serif text-xs leading-relaxed text-[#14261D] max-h-72 overflow-y-auto select-text">
                    {chunkDetail?.content}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#1B3428]/15 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (chunkDetail?.pageNumber) {
                    handlePageChange(chunkDetail.pageNumber);
                    if (inspectingCitation.chunkId) {
                      setActiveCitationChunkId(inspectingCitation.chunkId);
                    }
                  }
                  setInspectingCitation(null);
                }}
                className="px-4 py-2 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-xs hover:bg-[#d46524] transition-all flex items-center gap-1.5"
              >
                <span>Navigate to Page {chunkDetail?.pageNumber || currentPage}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setInspectingCitation(null)}
                className="px-4 py-2 rounded-full font-display font-bold text-xs text-[#14261D]/70 hover:text-[#14261D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Chapter Quiz Modal */}
      <GenerateQuizModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        workspaceId={workspace?.id}
        preselectedDocumentId={currentDoc?.id}
        preselectedChapter={
          preselectedPracticeChapter ||
          [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title ||
          ''
        }
        preselectedPage={preselectedPracticePage || currentPage}
        onQuizCreated={() => {
          setActiveView('quizzes');
        }}
      />

      {/* Generate Learning Plan Modal */}
      {workspace && (
        <GenerateLearningPlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          workspaceId={workspace.id}
          document={currentDoc}
          onPlanCreated={() => {
            setActiveView('plan');
            setCopilotOpen(true);
          }}
        />
      )}

      {/* Convert to Group Confirmation Modal */}
      {workspace && (
        <ConvertToGroupModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onConfirm={handleConvertToGroup}
          isConverting={isConverting}
          workspaceName={workspace.name || currentDoc?.title || 'Book Workspace'}
        />
      )}

      {/* Group Members and Invitations Modal */}
      {workspace && (
        <ManageGroupModal
          isOpen={isManageGroupModalOpen}
          onClose={() => setIsManageGroupModalOpen(false)}
          workspaceId={workspace.id}
          workspaceTitle={workspace.name || currentDoc?.title || 'Group Workspace'}
          isOwner={isOwner}
          currentUserId={user?.id || ''}
          onWorkspaceUpdated={fetchWorkspace}
          onLeaveSuccess={() => router.replace('/dashboard')}
        />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F4F0E5]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
        </div>
      }
    >
      <WorkspaceInner />
    </Suspense>
  );
}
