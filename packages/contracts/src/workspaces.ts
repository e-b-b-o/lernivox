import type { DocumentDto, DocumentReadingProgressDto } from './documents';
import type { ConversationMessageDto } from './tutor';

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

export interface WorkspaceMembersResponseDto {
  members: WorkspaceMemberDto[];
  total: number;
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
  unreadDiscussionCount?: number;
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
  unreadDiscussionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingInvitationDto {
  id: string;
  workspaceId: string;
  workspaceTitle: string;
  inviterName: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
  status: 'PENDING';
}

export interface WorkspacesListResponseDto {
  myBooks: WorkspaceListItemDto[];
  sharedWithMe: WorkspaceListItemDto[];
  pendingInvites?: PendingInvitationDto[];
  sharedWorkspaces?: WorkspaceListItemDto[];
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

// -------------------------------------------------------------
// Workspace Invitations Contracts
// -------------------------------------------------------------

export interface CreateInvitationDto {
  email?: string;
  role?: WorkspaceRole;
}

export interface WorkspaceInvitationDto {
  id: string;
  workspaceId: string;
  email?: string | null;
  role: WorkspaceRole;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  declinedAt?: string | null;
  inviteToken?: string;
  inviteUrl?: string;
  createdByName?: string | null;
  createdAt: string;
}

export type InvitationStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED';

export interface PublicInvitationDetailsDto {
  workspaceId: string;
  workspaceTitle: string;
  inviterName: string;
  role: WorkspaceRole;
  isValid: boolean;
  status: InvitationStatus;
}

export interface AcceptInvitationResponseDto {
  success: boolean;
  workspaceId: string;
  workspaceTitle: string;
  role: WorkspaceRole;
}

// -------------------------------------------------------------
// Group Discussion Contracts (People <-> People)
// -------------------------------------------------------------

export interface CreateDiscussionMessageDto {
  content: string;
  pageNumber?: number;
  chapter?: string;
}

export interface DiscussionMessageDto {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: string;
  pageNumber?: number | null;
  chapter?: string | null;
  createdAt: string;
}

export interface DiscussionMessagesListResponseDto {
  messages: DiscussionMessageDto[];
  total: number;
}

export interface WorkspaceDiscussionUnreadDto {
  workspaceId: string;
  unreadCount: number;
  lastReadAt?: string | null;
}

export interface MarkDiscussionReadDto {
  lastReadMessageId?: string;
}

export interface MarkDiscussionReadResponseDto {
  success: boolean;
  workspaceId: string;
  unreadCount: number;
  lastReadAt: string;
}

// -------------------------------------------------------------
// Shared AI Conversation Snapshots
// -------------------------------------------------------------

export interface CreateSharedConversationDto {
  conversationId: string;
  title?: string;
}

export interface SharedConversationSnapshotData {
  title: string;
  messages: ConversationMessageDto[];
  sharedAt: string;
}

export interface SharedConversationSnapshotDto {
  id: string;
  workspaceId: string;
  conversationId: string;
  sharedById: string;
  sharedByName: string;
  title: string;
  snapshotData: SharedConversationSnapshotData;
  createdAt: string;
}

export interface SharedConversationsListResponseDto {
  shares: SharedConversationSnapshotDto[];
  total: number;
}
