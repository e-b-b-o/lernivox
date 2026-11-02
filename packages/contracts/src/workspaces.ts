import type { DocumentDto, DocumentReadingProgressDto } from './documents';

export type WorkspaceType = 'PERSONAL' | 'GROUP';
export type WorkspaceRole = 'OWNER' | 'MEMBER';

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  userName?: string | null;
  userEmail?: string | null;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  documentId: string;
  document: DocumentDto;
  members: WorkspaceMemberDto[];
  myRole: WorkspaceRole;
  myReadingProgress?: DocumentReadingProgressDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceListItemDto {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  isOwner: boolean;
  document: DocumentDto;
  myReadingProgress?: DocumentReadingProgressDto | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacesListResponseDto {
  myBooks: WorkspaceListItemDto[];
  sharedWithMe: WorkspaceListItemDto[];
}

export interface CreateWorkspaceDto {
  name?: string;
  type?: WorkspaceType;
}

export interface ConvertWorkspaceResponseDto {
  success: boolean;
  workspace: WorkspaceDto;
  message: string;
}
