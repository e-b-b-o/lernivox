'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X, ExternalLink, AlertCircle, ArrowLeft } from 'lucide-react';
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
} from '@lernivox/contracts';
import { useAuth } from '../../../../../context/AuthContext';
import { api } from '../../../../../lib/api';
import { TutorHeader } from '../../../../../components/workspace/TutorHeader';
import { DocumentOutlinePane } from '../../../../../components/workspace/DocumentOutlinePane';
import { DocumentReader } from '../../../../../components/workspace/DocumentReader';
import { RightWorkspacePanel } from '../../../../../components/workspace/RightWorkspacePanel';
import { GenerateQuizModal } from '../../../../../components/workspace/GenerateQuizModal';
import { ConvertToGroupModal } from '../../../../../components/workspace/ConvertToGroupModal';
import { ManageGroupModal } from '../../../../../components/workspace/ManageGroupModal';

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

  // Pane layout state (collapsible on desktop, mutually exclusive drawer on mobile)
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(true);

  type MobileDrawer = 'none' | 'toc' | 'chat';
  const [mobileDrawer, setMobileDrawer] = useState<MobileDrawer>('none');
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

  const toggleToc = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawer((prev) => (prev === 'toc' ? 'none' : 'toc'));
    } else {
      setOutlineOpen((prev) => !prev);
    }
  }, []);

  const toggleChat = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'));
    } else {
      setCopilotOpen((prev) => !prev);
    }
  }, []);

  const closeMobileDrawer = useCallback(() => setMobileDrawer('none'), []);

  // Close active mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawer !== 'none') {
        setMobileDrawer('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawer]);

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

  // Prepared Question from text selection ("Explain this paragraph")
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

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load Workspace by ID
  const fetchWorkspace = useCallback(async () => {
    if (!accessToken || !workspaceId) return;

    try {
      const ws = await api.workspaces.getById(workspaceId, accessToken);
      setWorkspace(ws);
      setCurrentDoc(ws.document);
      if (ws.document.pageCount) {
        setTotalPages(ws.document.pageCount);
      }
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access this workspace.';
      setError(msg);
    } finally {
      setLoadingWorkspace(false);
    }
  }, [accessToken, workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

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

  // Contextual text selection action callback
  const handleExplainParagraph = useCallback((selectedText: string, pageNum: number) => {
    setCopilotOpen(true);
    setMobileDrawer('chat');
    setPreparedQuestion(
      `Please explain this passage from Page ${pageNum} and how it fits into the material:\n\n"${selectedText}"`,
    );
  }, []);

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
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#F4F0E5]">
        <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-[0_4px_0_0_#B26E45] mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="font-display font-bold text-sm text-[#14261D]">
          Opening your workspace...
        </p>
      </div>
    );
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
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-[#F4F0E5] text-[#14261D] selection:bg-[#FBE8DC] overflow-hidden overscroll-none select-none">
      {/* 1. TOP STUDY HEADER (TutorHeader) - Fixed Height, Distraction-Free */}
      <header className="shrink-0 z-30">
        <TutorHeader
          document={currentDoc}
          workspaceType={workspace.type}
          isOwner={isOwner}
          memberCount={workspace.members?.length || 1}
          onOpenConvertModal={() => setIsConvertModalOpen(true)}
          onOpenManageGroupModal={() => setIsManageGroupModalOpen(true)}
          outlineOpen={mobileDrawer === 'toc' || (outlineOpen && mobileDrawer === 'none')}
          onToggleOutline={toggleToc}
          copilotOpen={mobileDrawer === 'chat' || (copilotOpen && mobileDrawer === 'none')}
          onToggleCopilot={toggleChat}
          onPractice={() => setIsPracticeModalOpen(true)}
        />
      </header>

      {/* 2. THREE-PANE MAIN WORKSPACE - Zero Outer Overflow */}
      <div className="flex-1 min-h-0 flex w-full relative overflow-hidden">
        {/* PANE 1: DESKTOP LEFT OUTLINE & NAVIGATION (Hidden on Mobile) */}
        <DocumentOutlinePane
          isOpen={outlineOpen}
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
        />

        {/* PANE 2: CENTER DOCUMENT READER */}
        <main className="w-full lg:flex-1 h-full min-h-0 flex flex-col min-w-0 bg-[#F4F0E5] relative overflow-hidden">
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
            onAddBookmark={handleAddBookmark}
            fileUrl={fileUrl}
            accessToken={accessToken || undefined}
          />
        </main>

        {/* PANE 3: DESKTOP RIGHT WORKSPACE PANEL (Lernivox AI or Group Discussion) */}
        <RightWorkspacePanel
          workspaceType={workspace.type}
          workspaceId={workspace.id}
          currentUserId={user?.id || ''}
          currentPage={currentPage}
          currentChapter={
            [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title || ''
          }
          isOpen={copilotOpen}
          onToggle={() => setCopilotOpen((c) => !c)}
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
        />

        {/* 4. MOBILE SLIDE-OVER OVERLAYS (Single Winner, Mutually Exclusive) */}
        {mobileDrawer !== 'none' && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs transition-opacity flex"
            onClick={closeMobileDrawer}
          >
            {/* TOC Mobile Drawer */}
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
                  isMobileDrawer={true}
                  onCloseMobileDrawer={closeMobileDrawer}
                />
              </div>
            )}

            {/* AI Chat / Group Discussion Mobile Drawer */}
            {mobileDrawer === 'chat' && (
              <div
                className="absolute inset-y-0 right-0 w-[90%] max-w-md bg-[#FAF8F4] border-l-[2px] border-[#1B3428] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <RightWorkspacePanel
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
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. SLIDE-OVER PASSAGE VERIFICATION DRAWER */}
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
                  <div className="p-4 rounded-2xl bg-[#F4F0E5] border border-[#1B3428]/15 font-serif text-xs leading-relaxed text-[#14261D] max-h-72 overflow-y-auto">
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
        preselectedDocumentId={currentDoc?.id}
        preselectedChapter={
          [...outlineItems].reverse().find((o) => o.pageNumber <= currentPage)?.title || ''
        }
      />

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
