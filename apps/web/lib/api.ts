import type {
  AuthResponseDto,
  CreateBookmarkDto,
  CreateConversationDto,
  CreatePastedTextDto,
  DocumentBookmarkDto,
  DocumentChunkDto,
  DocumentDto,
  DocumentOutlineDto,
  DocumentReaderContentDto,
  DocumentReadingProgressDto,
  DocumentStatusDto,
  DocumentUploadResponseDto,
  LoginRequestDto,
  LogoutResponseDto,
  RegisterRequestDto,
  RenameConversationDto,
  SendTutorMessageDto,
  TutorChunkDetailDto,
  UpdateReadingProgressDto,
  UserDto,
  ConversationSummaryDto,
  ConversationDetailDto,
  ConversationMessageDto,
  CreateQuizRequestDto,
  QuizSummaryDto,
  QuizDetailDto,
  StartQuizAttemptResponseDto,
  SubmitQuizAttemptRequestDto,
  QuizAttemptResultDto,
  FailedQuestionDto,
  FlashcardDeckSummaryDto,
  FlashcardDeckDetailDto,
  FlashcardItemDto,
  CreateFlashcardDeckDto,
  GenerateFlashcardsRequestDto,
  GenerateFlashcardsPreviewRequestDto,
  GenerateFlashcardsPreviewResponseDto,
  UpdateFlashcardDeckDto,
  UpdateFlashcardItemDto,
  FlashcardRating,
  FlashcardReviewResultDto,
  WorkspaceProgressOverviewDto,
  WorkspaceDto,
  WorkspaceListItemDto,
  WorkspacesListResponseDto,
  ConvertWorkspaceResponseDto,
  WorkspaceMemberDto,
  WorkspaceMembersResponseDto,
  CreateInvitationDto,
  WorkspaceInvitationDto,
  PublicInvitationDetailsDto,
  AcceptInvitationResponseDto,
  CreateDiscussionMessageDto,
  DiscussionMessageDto,
  DiscussionMessagesListResponseDto,
  WorkspaceDiscussionUnreadDto,
  MarkDiscussionReadResponseDto,
  CreateSharedConversationDto,
  SharedConversationSnapshotDto,
  SharedConversationsListResponseDto,
  LearningPlanDto,
  StudySessionDto,
  PlanOfferDto,
  LearningPlanPreviewDto,
  CreatePlanPreviewDto,
  AcceptPlanDto,
  UpdateSessionDto,
  AdaptPlanDto,
  UpdatePlanLifecycleDto,
} from '@lernivox/contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

type TokenRefreshedCallback = (token: string, user?: UserDto) => void;
type SessionExpiredCallback = () => void;

const tokenRefreshedListeners = new Set<TokenRefreshedCallback>();
const sessionExpiredListeners = new Set<SessionExpiredCallback>();

export function onTokenRefreshed(cb: TokenRefreshedCallback): () => void {
  tokenRefreshedListeners.add(cb);
  return () => {
    tokenRefreshedListeners.delete(cb);
  };
}

export function onSessionExpired(cb: SessionExpiredCallback): () => void {
  sessionExpiredListeners.add(cb);
  return () => {
    sessionExpiredListeners.delete(cb);
  };
}

function notifyTokenRefreshed(token: string, user?: UserDto) {
  for (const listener of tokenRefreshedListeners) {
    try {
      listener(token, user);
    } catch (e) {
      console.error('Error in onTokenRefreshed listener', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('auth:token-refreshed', { detail: { accessToken: token, user } }),
    );
  }
}

function notifySessionExpired() {
  for (const listener of sessionExpiredListeners) {
    try {
      listener();
    } catch (e) {
      console.error('Error in onSessionExpired listener', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
}

let refreshPromise: Promise<string | null> | null = null;

export async function silentRefreshToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          return null;
        }
        const data = (await res.json()) as AuthResponseDto;
        const newToken = data.accessToken || null;
        if (newToken) {
          notifyTokenRefreshed(newToken, data.user);
        }
        return newToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function isAuthEndpoint(endpoint: string): boolean {
  return (
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/logout')
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null,
  isRetry = false,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always send and receive HttpOnly cookies
    });
  } catch (netErr: any) {
    throw new ApiError(
      0,
      `Cannot connect to API at ${API_BASE_URL}. Please verify your network connection and server status.`,
      netErr,
    );
  }

  // Handle 401 Unauthorized: silent refresh and single-flight retry for protected endpoints
  if (response.status === 401 && !isRetry && !isAuthEndpoint(endpoint)) {
    const newToken = await silentRefreshToken();
    if (newToken) {
      // Retry once with the refreshed access token, preserving body and method
      return request<T>(endpoint, options, newToken, true);
    }
    // Refresh failed or revoked: notify subscribers that session expired
    notifySessionExpired();
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  if (response.status === 204) {
    return null as T;
  }

  const rawText = await response.text();
  const trimmed = rawText.trim();

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    let details: unknown;

    if (trimmed.length > 0) {
      try {
        const errorJson = JSON.parse(trimmed);
        details = errorJson;
        const rawMsg =
          errorJson.error?.message ||
          errorJson.message ||
          (typeof errorJson.error === 'string' ? errorJson.error : null);

        if (Array.isArray(rawMsg)) {
          errorMessage = rawMsg.join(', ');
        } else if (typeof rawMsg === 'string') {
          errorMessage = rawMsg;
        }
      } catch {
        errorMessage = trimmed;
      }
    }

    throw new ApiError(response.status, errorMessage, details);
  }

  if (trimmed.length === 0) {
    return null as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (err) {
    throw new ApiError(
      response.status,
      `Failed to parse server response as JSON: ${err instanceof Error ? err.message : String(err)}`,
      trimmed,
    );
  }
}

export const api = {
  auth: {
    register: (data: RegisterRequestDto): Promise<AuthResponseDto> =>
      request<AuthResponseDto>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginRequestDto): Promise<AuthResponseDto> =>
      request<AuthResponseDto>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    refresh: (): Promise<AuthResponseDto> =>
      request<AuthResponseDto>('/auth/refresh', {
        method: 'POST',
      }),

    logout: (): Promise<LogoutResponseDto> =>
      request<LogoutResponseDto>('/auth/logout', {
        method: 'POST',
      }),

    getMe: (token: string): Promise<UserDto> =>
      request<UserDto>('/auth/me', { method: 'GET' }, token),

    getGoogleAuthUrl: (): string => `${API_BASE_URL}/auth/google`,
  },

  documents: {
    uploadFile: (
      file: File,
      token: string,
      title?: string,
      workspaceType?: 'PERSONAL' | 'GROUP',
    ): Promise<DocumentUploadResponseDto> => {
      if (file.size > 1048576) {
        throw new Error('This file is larger than the 1 MB upload limit. Choose a smaller file.');
      }
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (workspaceType) formData.append('workspaceType', workspaceType);
      return request<DocumentUploadResponseDto>(
        '/documents/upload',
        { method: 'POST', body: formData },
        token,
      );
    },

    createFromText: (data: CreatePastedTextDto, token: string): Promise<DocumentUploadResponseDto> => {
      const byteLen =
        typeof window !== 'undefined'
          ? new TextEncoder().encode(data.content || '').length
          : Buffer.byteLength(data.content || '', 'utf8');
      if (byteLen > 1048576) {
        throw new Error('This text content is larger than the 1 MB upload limit. Choose a smaller text.');
      }
      return request<DocumentUploadResponseDto>(
        '/documents/text',
        { method: 'POST', body: JSON.stringify(data) },
        token,
      );
    },

    list: (token: string): Promise<DocumentDto[]> =>
      request<DocumentDto[]>('/documents', { method: 'GET' }, token),

    getById: (id: string, token: string): Promise<DocumentDto> =>
      request<DocumentDto>(`/documents/${id}`, { method: 'GET' }, token),

    getStatus: (id: string, token: string): Promise<DocumentStatusDto> =>
      request<DocumentStatusDto>(`/documents/${id}/status`, { method: 'GET' }, token),

    getChunks: (id: string, token: string): Promise<DocumentChunkDto[]> =>
      request<DocumentChunkDto[]>(`/documents/${id}/chunks`, { method: 'GET' }, token),

    delete: (id: string, token: string): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(`/documents/${id}`, { method: 'DELETE' }, token),

    retry: (id: string, token: string): Promise<DocumentDto> =>
      request<DocumentDto>(`/documents/${id}/retry`, { method: 'POST' }, token),

    getFileUrl: (id: string): string => `${API_BASE_URL}/documents/${id}/file`,

    fetchFileBlob: async (id: string, token: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE_URL}/documents/${id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new ApiError(res.status, 'Failed to fetch document file');
      return res.blob();
    },

    getOutline: (id: string, token: string): Promise<DocumentOutlineDto> =>
      request<DocumentOutlineDto>(`/documents/${id}/outline`, { method: 'GET' }, token),

    getReaderContent: (
      id: string,
      token: string,
      page?: number,
      limit = 50,
    ): Promise<DocumentReaderContentDto> => {
      const q = new URLSearchParams();
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<DocumentReaderContentDto>(
        `/documents/${id}/reader-content${qs}`,
        { method: 'GET' },
        token,
      );
    },

    getProgress: (id: string, token: string): Promise<DocumentReadingProgressDto | null> =>
      request<DocumentReadingProgressDto | null>(`/documents/${id}/progress`, { method: 'GET' }, token),

    updateProgress: (
      id: string,
      data: UpdateReadingProgressDto,
      token: string,
    ): Promise<DocumentReadingProgressDto> =>
      request<DocumentReadingProgressDto>(
        `/documents/${id}/progress`,
        { method: 'PUT', body: JSON.stringify(data) },
        token,
      ),

    listBookmarks: (id: string, token: string): Promise<DocumentBookmarkDto[]> =>
      request<DocumentBookmarkDto[]>(`/documents/${id}/bookmarks`, { method: 'GET' }, token),

    createBookmark: (
      id: string,
      data: CreateBookmarkDto,
      token: string,
    ): Promise<DocumentBookmarkDto> =>
      request<DocumentBookmarkDto>(
        `/documents/${id}/bookmarks`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    deleteBookmark: (
      id: string,
      bookmarkId: string,
      token: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/documents/${id}/bookmarks/${bookmarkId}`,
        { method: 'DELETE' },
        token,
      ),
  },

  workspaces: {
    list: (token: string): Promise<WorkspacesListResponseDto> =>
      request<WorkspacesListResponseDto>('/workspaces', { method: 'GET' }, token),

    getById: (id: string, token: string): Promise<WorkspaceDto> =>
      request<WorkspaceDto>(`/workspaces/${id}`, { method: 'GET' }, token),

    getByDocumentId: (
      documentId: string,
      token: string,
    ): Promise<{ workspaceId: string; workspace: WorkspaceDto }> =>
      request<{ workspaceId: string; workspace: WorkspaceDto }>(
        `/workspaces/by-document/${documentId}`,
        { method: 'GET' },
        token,
      ),

    convertToGroup: (
      id: string,
      token: string,
    ): Promise<ConvertWorkspaceResponseDto> =>
      request<ConvertWorkspaceResponseDto>(
        `/workspaces/${id}/convert-to-group`,
        { method: 'POST' },
        token,
      ),

    getMembers: (workspaceId: string, token: string): Promise<WorkspaceMembersResponseDto> =>
      request<WorkspaceMembersResponseDto>(`/workspaces/${workspaceId}/members`, { method: 'GET' }, token),

    removeMember: (
      workspaceId: string,
      userId: string,
      token: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/workspaces/${workspaceId}/members/${userId}`,
        { method: 'DELETE' },
        token,
      ),

    leave: (
      workspaceId: string,
      token: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/workspaces/${workspaceId}/leave`,
        { method: 'POST' },
        token,
      ),

    createInvitation: (
      workspaceId: string,
      data: CreateInvitationDto,
      token: string,
    ): Promise<WorkspaceInvitationDto> =>
      request<WorkspaceInvitationDto>(
        `/workspaces/${workspaceId}/invitations`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    listInvitations: (
      workspaceId: string,
      token: string,
    ): Promise<WorkspaceInvitationDto[]> =>
      request<WorkspaceInvitationDto[]>(
        `/workspaces/${workspaceId}/invitations`,
        { method: 'GET' },
        token,
      ),

    revokeInvitation: (
      workspaceId: string,
      invitationId: string,
      token: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/workspaces/${workspaceId}/invitations/${invitationId}`,
        { method: 'DELETE' },
        token,
      ),

    acceptPendingInvite: (
      id: string,
      accessToken: string,
    ): Promise<AcceptInvitationResponseDto> =>
      request<AcceptInvitationResponseDto>(
        `/invitations/pending/${id}/accept`,
        { method: 'POST' },
        accessToken,
      ),

    declinePendingInvite: (
      id: string,
      accessToken: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/invitations/pending/${id}/decline`,
        { method: 'POST' },
        accessToken,
      ),

    getDiscussions: (
      workspaceId: string,
      token: string,
      limit = 50,
      before?: string,
    ): Promise<DiscussionMessagesListResponseDto> => {
      const q = new URLSearchParams();
      if (limit) q.set('limit', String(limit));
      if (before) q.set('before', before);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<DiscussionMessagesListResponseDto>(
        `/workspaces/${workspaceId}/discussions${qs}`,
        { method: 'GET' },
        token,
      );
    },

    createDiscussion: (
      workspaceId: string,
      data: CreateDiscussionMessageDto,
      token: string,
    ): Promise<DiscussionMessageDto> =>
      request<DiscussionMessageDto>(
        `/workspaces/${workspaceId}/discussions`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    getUnreadDiscussionCount: (
      workspaceId: string,
      token: string,
    ): Promise<WorkspaceDiscussionUnreadDto> =>
      request<WorkspaceDiscussionUnreadDto>(
        `/workspaces/${workspaceId}/discussions/unread`,
        { method: 'GET' },
        token,
      ),

    markDiscussionAsRead: (
      workspaceId: string,
      token: string,
      lastReadMessageId?: string,
    ): Promise<MarkDiscussionReadResponseDto> =>
      request<MarkDiscussionReadResponseDto>(
        `/workspaces/${workspaceId}/discussions/read`,
        {
          method: 'POST',
          body: JSON.stringify({ lastReadMessageId }),
        },
        token,
      ),

    createSharedConversation: (
      workspaceId: string,
      data: CreateSharedConversationDto,
      token: string,
    ): Promise<SharedConversationSnapshotDto> =>
      request<SharedConversationSnapshotDto>(
        `/workspaces/${workspaceId}/shared-conversations`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    listSharedConversations: (
      workspaceId: string,
      token: string,
    ): Promise<SharedConversationsListResponseDto> =>
      request<SharedConversationsListResponseDto>(
        `/workspaces/${workspaceId}/shared-conversations`,
        { method: 'GET' },
        token,
      ),

    revokeSharedConversation: (
      workspaceId: string,
      shareId: string,
      token: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/workspaces/${workspaceId}/shared-conversations/${shareId}`,
        { method: 'DELETE' },
        token,
      ),

    getProgress: (
      workspaceId: string,
      token: string,
    ): Promise<WorkspaceProgressOverviewDto> =>
      request<WorkspaceProgressOverviewDto>(
        `/workspaces/${workspaceId}/progress`,
        { method: 'GET' },
        token,
      ),
  },

  invitations: {
    getPublicDetails: (token: string): Promise<PublicInvitationDetailsDto> =>
      request<PublicInvitationDetailsDto>(`/invitations/${token}`, { method: 'GET' }),

    accept: (
      token: string,
      accessToken: string,
    ): Promise<AcceptInvitationResponseDto> =>
      request<AcceptInvitationResponseDto>(
        `/invitations/${token}/accept`,
        { method: 'POST' },
        accessToken,
      ),

    acceptPending: (
      id: string,
      accessToken: string,
    ): Promise<AcceptInvitationResponseDto> =>
      request<AcceptInvitationResponseDto>(
        `/invitations/pending/${id}/accept`,
        { method: 'POST' },
        accessToken,
      ),

    declinePending: (
      id: string,
      accessToken: string,
    ): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(
        `/invitations/pending/${id}/decline`,
        { method: 'POST' },
        accessToken,
      ),
  },

  tutor: {
    createConversation: (
      data: CreateConversationDto,
      token: string,
    ): Promise<ConversationSummaryDto> =>
      request<ConversationSummaryDto>(
        '/tutor/conversations',
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    listConversations: (
      token: string,
      documentId?: string,
    ): Promise<ConversationSummaryDto[]> => {
      const query = documentId ? `?documentId=${encodeURIComponent(documentId)}` : '';
      return request<ConversationSummaryDto[]>(
        `/tutor/conversations${query}`,
        { method: 'GET' },
        token,
      );
    },

    getConversation: (id: string, token: string): Promise<ConversationDetailDto> =>
      request<ConversationDetailDto>(`/tutor/conversations/${id}`, { method: 'GET' }, token),

    renameConversation: (
      id: string,
      data: RenameConversationDto,
      token: string,
    ): Promise<ConversationSummaryDto> =>
      request<ConversationSummaryDto>(
        `/tutor/conversations/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
        token,
      ),

    deleteConversation: (id: string, token: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(`/tutor/conversations/${id}`, { method: 'DELETE' }, token),

    sendMessage: (
      conversationId: string,
      data: SendTutorMessageDto,
      token: string,
    ): Promise<ConversationMessageDto> =>
      request<ConversationMessageDto>(
        `/tutor/conversations/${conversationId}/messages`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    getChunkDetail: (chunkId: string, token: string): Promise<TutorChunkDetailDto> =>
      request<TutorChunkDetailDto>(`/tutor/chunks/${chunkId}`, { method: 'GET' }, token),
  },

  quizzes: {
    generate: (
      documentId: string,
      data: CreateQuizRequestDto,
      token: string,
    ): Promise<QuizSummaryDto> =>
      request<QuizSummaryDto>(
        `/quizzes/generate/${documentId}`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    list: (token: string): Promise<QuizSummaryDto[]> =>
      request<QuizSummaryDto[]>('/quizzes', { method: 'GET' }, token),

    listByWorkspace: (workspaceId: string, token: string): Promise<QuizSummaryDto[]> =>
      request<QuizSummaryDto[]>(
        `/quizzes/workspace/${workspaceId}`,
        { method: 'GET' },
        token,
      ),

    getFailedQuestions: (workspaceId: string, token: string): Promise<FailedQuestionDto[]> =>
      request<FailedQuestionDto[]>(
        `/quizzes/workspace/${workspaceId}/failed-questions`,
        { method: 'GET' },
        token,
      ),

    listByDocument: (documentId: string, token: string): Promise<QuizSummaryDto[]> =>
      request<QuizSummaryDto[]>(
        `/quizzes/document/${documentId}`,
        { method: 'GET' },
        token,
      ),

    getById: (quizId: string, token: string): Promise<QuizDetailDto> =>
      request<QuizDetailDto>(`/quizzes/${quizId}`, { method: 'GET' }, token),

    startAttempt: (quizId: string, token: string): Promise<StartQuizAttemptResponseDto> =>
      request<StartQuizAttemptResponseDto>(
        `/quizzes/${quizId}/attempts`,
        { method: 'POST' },
        token,
      ),

    submitAttempt: (
      attemptId: string,
      data: SubmitQuizAttemptRequestDto,
      token: string,
    ): Promise<QuizAttemptResultDto> =>
      request<QuizAttemptResultDto>(
        `/quizzes/attempts/${attemptId}/submit`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    getAttempt: (attemptId: string, token: string): Promise<QuizAttemptResultDto> =>
      request<QuizAttemptResultDto>(
        `/quizzes/attempts/${attemptId}`,
        { method: 'GET' },
        token,
      ),

    retry: (quizId: string, token: string): Promise<QuizSummaryDto> =>
      request<QuizSummaryDto>(`/quizzes/${quizId}/retry`, { method: 'POST' }, token),

    delete: (
      quizId: string,
      token: string,
      workspaceId?: string,
    ): Promise<{ success: boolean }> => {
      const url = workspaceId
        ? `/quizzes/workspace/${workspaceId}/${quizId}`
        : `/quizzes/${quizId}`;
      return request<{ success: boolean }>(url, { method: 'DELETE' }, token);
    },
  },

  flashcards: {
    generatePreview: (
      workspaceId: string,
      data: GenerateFlashcardsPreviewRequestDto,
      token: string,
    ): Promise<GenerateFlashcardsPreviewResponseDto> =>
      request<GenerateFlashcardsPreviewResponseDto>(
        `/workspaces/${workspaceId}/flashcards/generate-preview`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    generate: (
      workspaceId: string,
      data: GenerateFlashcardsRequestDto,
      token: string,
    ): Promise<FlashcardDeckSummaryDto> =>
      request<FlashcardDeckSummaryDto>(
        `/workspaces/${workspaceId}/flashcards/generate`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    createManual: (
      workspaceId: string,
      data: CreateFlashcardDeckDto,
      token: string,
    ): Promise<FlashcardDeckDetailDto> =>
      request<FlashcardDeckDetailDto>(
        `/workspaces/${workspaceId}/flashcards`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    listByWorkspace: (
      workspaceId: string,
      token: string,
    ): Promise<FlashcardDeckSummaryDto[]> =>
      request<FlashcardDeckSummaryDto[]>(
        `/workspaces/${workspaceId}/flashcards`,
        { method: 'GET' },
        token,
      ),

    getDeck: (deckId: string, token: string): Promise<FlashcardDeckDetailDto> =>
      request<FlashcardDeckDetailDto>(
        `/flashcards/decks/${deckId}`,
        { method: 'GET' },
        token,
      ),

    updateDeck: (
      deckId: string,
      data: UpdateFlashcardDeckDto,
      token: string,
    ): Promise<FlashcardDeckDetailDto> =>
      request<FlashcardDeckDetailDto>(
        `/flashcards/decks/${deckId}`,
        { method: 'PATCH', body: JSON.stringify(data) },
        token,
      ),

    updateCard: (
      cardId: string,
      data: UpdateFlashcardItemDto,
      token: string,
    ): Promise<FlashcardItemDto> =>
      request<FlashcardItemDto>(
        `/flashcards/items/${cardId}`,
        { method: 'PATCH', body: JSON.stringify(data) },
        token,
      ),

    deleteCard: (cardId: string, token: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(
        `/flashcards/items/${cardId}`,
        { method: 'DELETE' },
        token,
      ),

    reviewCard: (
      cardId: string,
      rating: FlashcardRating,
      token: string,
    ): Promise<FlashcardReviewResultDto> =>
      request<FlashcardReviewResultDto>(
        `/flashcards/items/${cardId}/review`,
        { method: 'POST', body: JSON.stringify({ rating }) },
        token,
      ),

    deleteDeck: (deckId: string, token: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(
        `/flashcards/decks/${deckId}`,
        { method: 'DELETE' },
        token,
      ),
  },

  learningPlans: {
    getOffer: (workspaceId: string, token: string): Promise<PlanOfferDto> =>
      request<PlanOfferDto>(
        `/workspaces/${workspaceId}/learning-plan/offer`,
        { method: 'GET' },
        token,
      ),

    dismissOffer: (workspaceId: string, token: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(
        `/workspaces/${workspaceId}/learning-plan/offer/dismiss`,
        { method: 'POST' },
        token,
      ),

    generatePreview: (
      workspaceId: string,
      data: CreatePlanPreviewDto,
      token: string,
    ): Promise<LearningPlanPreviewDto> =>
      request<LearningPlanPreviewDto>(
        `/workspaces/${workspaceId}/learning-plan/preview`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    createPlan: (
      workspaceId: string,
      data: AcceptPlanDto,
      token: string,
    ): Promise<LearningPlanDto> =>
      request<LearningPlanDto>(
        `/workspaces/${workspaceId}/learning-plan`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    getActivePlan: (workspaceId: string, token: string): Promise<LearningPlanDto | null> =>
      request<LearningPlanDto | null>(
        `/workspaces/${workspaceId}/learning-plan`,
        { method: 'GET' },
        token,
      ),

    getNextSession: (workspaceId: string, token: string): Promise<StudySessionDto | null> =>
      request<StudySessionDto | null>(
        `/workspaces/${workspaceId}/learning-plan/next-session`,
        { method: 'GET' },
        token,
      ),

    updateSession: (
      workspaceId: string,
      sessionId: string,
      data: UpdateSessionDto,
      token: string,
    ): Promise<LearningPlanDto> =>
      request<LearningPlanDto>(
        `/workspaces/${workspaceId}/learning-plan/sessions/${sessionId}`,
        { method: 'PATCH', body: JSON.stringify(data) },
        token,
      ),

    adaptPlan: (
      workspaceId: string,
      data: AdaptPlanDto = {},
      token: string,
    ): Promise<LearningPlanDto> =>
      request<LearningPlanDto>(
        `/workspaces/${workspaceId}/learning-plan/adapt`,
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    updateLifecycle: (
      workspaceId: string,
      data: UpdatePlanLifecycleDto,
      token: string,
    ): Promise<LearningPlanDto> =>
      request<LearningPlanDto>(
        `/workspaces/${workspaceId}/learning-plan/lifecycle`,
        { method: 'PATCH', body: JSON.stringify(data) },
        token,
      ),
  },
};
