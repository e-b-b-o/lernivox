import type {
  AuthResponseDto,
  CreatePastedTextDto,
  DocumentChunkDto,
  DocumentDto,
  DocumentUploadResponseDto,
  LoginRequestDto,
  LogoutResponseDto,
  RegisterRequestDto,
  UserDto,
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
    uploadFile: (file: File, token: string, title?: string): Promise<DocumentUploadResponseDto> => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
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
  },
};
