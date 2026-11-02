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
  WorkspaceDto,
  WorkspaceListItemDto,
  WorkspacesListResponseDto,
  ConvertWorkspaceResponseDto,
} from '@lernivox/contracts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null,
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

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HttpOnly cookies
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    let details: unknown;

    try {
      const errorJson = await response.json();
      details = errorJson;
      if (Array.isArray(errorJson.message)) {
        errorMessage = errorJson.message.join(', ');
      } else if (typeof errorJson.message === 'string') {
        errorMessage = errorJson.message;
      }
    } catch {
      // response wasn't JSON
    }

    throw new ApiError(response.status, errorMessage, details);
  }

  return response.json();
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

    createFromText: (data: CreatePastedTextDto, token: string): Promise<DocumentUploadResponseDto> =>
      request<DocumentUploadResponseDto>(
        '/documents/text',
        { method: 'POST', body: JSON.stringify(data) },
        token,
      ),

    list: (token: string): Promise<DocumentDto[]> =>
      request<DocumentDto[]>('/documents', { method: 'GET' }, token),

    getById: (id: string, token: string): Promise<DocumentDto> =>
      request<DocumentDto>(`/documents/${id}`, { method: 'GET' }, token),

    getChunks: (id: string, token: string): Promise<DocumentChunkDto[]> =>
      request<DocumentChunkDto[]>(`/documents/${id}/chunks`, { method: 'GET' }, token),

    delete: (id: string, token: string): Promise<{ success: boolean; message: string }> =>
      request<{ success: boolean; message: string }>(`/documents/${id}`, { method: 'DELETE' }, token),

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

    delete: (quizId: string, token: string): Promise<{ success: boolean }> =>
      request<{ success: boolean }>(`/quizzes/${quizId}`, { method: 'DELETE' }, token),
  },
};
