import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type {
  AcceptInvitationResponseDto,
  ConvertWorkspaceResponseDto,
  CreateDiscussionMessageDto,
  CreateInvitationDto,
  CreateSharedConversationDto,
  DiscussionMessageDto,
  DiscussionMessagesListResponseDto,
  DocumentDto,
  DocumentReadingProgressDto,
  PublicInvitationDetailsDto,
  SharedConversationSnapshotDto,
  SharedConversationsListResponseDto,
  WorkspaceDto,
  WorkspaceInvitationDto,
  WorkspaceListItemDto,
  WorkspaceMemberDto,
  WorkspaceMembersResponseDto,
  WorkspaceRole,
  WorkspaceType,
  WorkspacesListResponseDto,
} from '@lernivox/contracts';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a Document record into DocumentDto
   */
  private formatDocument(doc: {
    id: string;
    workspaceId: string | null;
    ownerId: string | null;
    title: string;
    fileName: string | null;
    mimeType: string;
    sizeBytes: number;
    storageProvider: string;
    visibility: string;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    pageCount: number | null;
    totalTokens: number | null;
    processingStartedAt: Date | null;
    processingCompletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentDto {
    return {
      id: doc.id,
      workspaceId: doc.workspaceId,
      ownerId: doc.ownerId ?? '',
      title: doc.title,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      storageProvider: doc.storageProvider as 'LOCAL' | 'CLOUDINARY' | 'S3',
      visibility: doc.visibility as 'PRIVATE' | 'SHARED' | 'COURSE_ONLY',
      status: doc.status as DocumentDto['status'],
      errorCode: doc.errorCode,
      errorMessage: doc.errorMessage,
      pageCount: doc.pageCount,
      totalTokens: doc.totalTokens,
      processingStartedAt: doc.processingStartedAt?.toISOString() ?? null,
      processingCompletedAt: doc.processingCompletedAt?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  /**
   * Helper to format a DocumentReadingProgress record into DocumentReadingProgressDto
   */
  private formatReadingProgress(prog: {
    id: string;
    userId: string;
    documentId: string;
    currentPage: number;
    totalPages: number | null;
    scrollProgress: number | null;
    zoomLevel: number | null;
    lastReadAt: Date;
  } | null): DocumentReadingProgressDto | null {
    if (!prog) return null;
    return {
      id: prog.id,
      userId: prog.userId,
      documentId: prog.documentId,
      currentPage: prog.currentPage,
      totalPages: prog.totalPages,
      scrollProgress: prog.scrollProgress,
      zoomLevel: prog.zoomLevel,
      lastReadAt: prog.lastReadAt.toISOString(),
    };
  }

  /**
   * Centralized document & workspace authorization policy:
   * A user can access a document/workspace if:
   * 1. They are the workspace owner, OR
   * 2. They are the document owner, OR
   * 3. They are an active, authorized member of the workspace.
   */
  async verifyDocumentAccess(
    userId: string,
    documentId: string,
  ): Promise<{
    hasAccess: boolean;
    isOwner: boolean;
    document: any;
    workspace: any | null;
  }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const workspace = document.workspace;
    const isDocOwner = document.ownerId === userId;
    const isWsOwner = workspace?.ownerId === userId;
    const isOwner = isDocOwner || isWsOwner;

    const isMember = workspace?.members.some((m) => m.userId === userId) ?? false;

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have permission to access this learning workspace or document.',
      );
    }

    return {
      hasAccess: true,
      isOwner,
      document,
      workspace,
    };
  }

  /**
   * Lists all workspaces for the current student, separated into:
   * - myBooks: Workspaces owned by this user
   * - sharedWithMe: Group workspaces where user is an authorized member
   */
  async listUserWorkspaces(userId: string): Promise<WorkspacesListResponseDto> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        document: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Extract all relevant document IDs to load reading progress in one query
    const docIds = (workspaces as any[])
      .map((w: any) => w.document?.id)
      .filter((id): id is string => Boolean(id));

    const progressRecords = await this.prisma.documentReadingProgress.findMany({
      where: {
        userId,
        documentId: { in: docIds },
      },
    });

    const progressMap = new Map(
      progressRecords.map((p) => [p.documentId, this.formatReadingProgress(p)]),
    );

    const myBooks: WorkspaceListItemDto[] = [];
    const sharedWithMe: WorkspaceListItemDto[] = [];

    for (const ws of workspaces) {
      if (!ws.document) continue; // Skip orphaned workspaces without attached material

      const isOwner = ws.ownerId === userId;
      const readingProgress = progressMap.get(ws.document.id) ?? null;

      const item: WorkspaceListItemDto = {
        id: ws.id,
        name: ws.name,
        type: ws.type as WorkspaceType,
        ownerId: ws.ownerId,
        isOwner,
        document: {
          ...this.formatDocument(ws.document),
          workspaceId: ws.id,
          workspaceType: ws.type as WorkspaceType,
        },
        myReadingProgress: readingProgress,
        memberCount: ws.members.length,
        createdAt: ws.createdAt.toISOString(),
        updatedAt: ws.updatedAt.toISOString(),
      };

      if (isOwner) {
        myBooks.push(item);
      } else {
        sharedWithMe.push(item);
      }
    }

    return {
      myBooks,
      sharedWithMe,
    };
  }

  /**
   * Retrieves a single workspace with its document, members, role, and current student's reading progress.
   */
  async getWorkspaceById(userId: string, workspaceId: string): Promise<WorkspaceDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        document: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const memberRecord = (workspace.members as any[]).find((m: any) => m.userId === userId);

    if (!isOwner && !memberRecord) {
      throw new ForbiddenException(
        'You do not have permission to access this workspace.',
      );
    }

    if (!workspace.document) {
      throw new NotFoundException('Workspace does not have attached learning material.');
    }

    // Load reading progress specifically for the requesting user
    const readingProgressRecord = await this.prisma.documentReadingProgress.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId: workspace.document.id,
        },
      },
    });

    const myRole: WorkspaceRole = isOwner ? 'OWNER' : ((memberRecord?.role as WorkspaceRole) ?? 'MEMBER');

    const members: WorkspaceMemberDto[] = (workspace.members as any[]).map((m: any) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role as WorkspaceRole,
      joinedAt: m.joinedAt.toISOString(),
      userName: m.user?.name,
      userEmail: m.user?.email,
    }));

    return {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type as WorkspaceType,
      ownerId: workspace.ownerId,
      documentId: workspace.document.id,
      document: {
        ...this.formatDocument(workspace.document),
        workspaceId: workspace.id,
        workspaceType: workspace.type as WorkspaceType,
      },
      members,
      myRole,
      myReadingProgress: this.formatReadingProgress(readingProgressRecord),
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  /**
   * Resolves a document ID to its persistent workspace ID.
   * If a document somehow lacks a workspace, creates one safely and idempotently.
   */
  async getWorkspaceByDocumentId(
    userId: string,
    documentId: string,
  ): Promise<{ workspaceId: string; workspace: WorkspaceDto }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    let workspaceId = document.workspaceId;

    if (!workspaceId) {
      // Safe, idempotent creation of personal workspace
      const newWs = await this.prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
          data: {
            name: document.title,
            type: 'PERSONAL',
            ownerId: document.ownerId || userId,
            createdAt: document.createdAt,
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: ws.id,
            userId: document.ownerId || userId,
            role: 'OWNER',
            joinedAt: document.createdAt,
          },
        });

        await tx.document.update({
          where: { id: document.id },
          data: { workspaceId: ws.id },
        });

        await tx.conversation.updateMany({
          where: { documentId: document.id, workspaceId: null },
          data: { workspaceId: ws.id },
        });

        return ws;
      });

      workspaceId = newWs.id;
    }

    const workspace = await this.getWorkspaceById(userId, workspaceId);

    return {
      workspaceId,
      workspace,
    };
  }

  /**
   * Enforces the critical one-way transition rule:
   * - PERSONAL -> GROUP is permitted (only by workspace owner).
   * - GROUP -> PERSONAL is NEVER permitted under any circumstances.
   * Preserves:
   * - Original document, chunks, embeddings, storage keys
   * - Workspace ID and owner
   * - Existing reading progress
   * - Existing conversations (remain private to user)
   * - Existing bookmarks
   */
  async convertToGroupWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<ConvertWorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { document: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the workspace owner can convert this workspace to a group workspace.',
      );
    }

    if (workspace.type === 'GROUP') {
      const current = await this.getWorkspaceById(userId, workspaceId);
      return {
        success: true,
        workspace: current,
        message: 'Workspace is already a group workspace.',
      };
    }

    // Update workspace type to GROUP
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        type: 'GROUP',
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `[Workspace Conversion] Workspace ${workspaceId} converted to GROUP by owner ${userId}`,
    );

    const updated = await this.getWorkspaceById(userId, workspaceId);

    return {
      success: true,
      workspace: updated,
      message: 'Workspace successfully converted to a collaborative group workspace.',
    };
  }

  // =========================================================================
  // MEMBER MANAGEMENT
  // =========================================================================

  /**
   * Retrieves all members of a workspace.
   */
  async getWorkspaceMembers(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMembersResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to view this workspace.');
    }

    const members: WorkspaceMemberDto[] = workspace.members.map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role as WorkspaceRole,
      joinedAt: m.joinedAt.toISOString(),
      userName: m.user.name,
      userEmail: m.user.email,
    }));

    return {
      members,
      total: members.length,
    };
  }

  /**
   * Removes a member from a workspace (owner only, cannot remove owner).
   */
  async removeMember(
    userId: string,
    workspaceId: string,
    memberUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can remove members.');
    }

    if (memberUserId === workspace.ownerId) {
      throw new BadRequestException('Cannot remove the workspace owner.');
    }

    const deleted = await this.prisma.workspaceMember.deleteMany({
      where: { workspaceId, userId: memberUserId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Member not found in this workspace.');
    }

    return {
      success: true,
      message: 'Member removed from workspace.',
    };
  }

  /**
   * Allows an authorized member to leave a workspace (owner cannot leave).
   */
  async leaveWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId === userId) {
      throw new BadRequestException(
        'The workspace owner cannot leave the workspace. Ownership must be transferred or workspace deleted.',
      );
    }

    const deleted = await this.prisma.workspaceMember.deleteMany({
      where: { workspaceId, userId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('You are not a member of this workspace.');
    }

    return {
      success: true,
      message: 'Successfully left the workspace.',
    };
  }

  // =========================================================================
  // INVITATIONS
  // =========================================================================

  /**
   * Generates a secure, cryptographically random invitation link/token.
   */
  async createInvitation(
    userId: string,
    workspaceId: string,
    dto: CreateInvitationDto,
  ): Promise<WorkspaceInvitationDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can create invitations.');
    }

    if (workspace.type !== 'GROUP') {
      throw new BadRequestException(
        'Please convert this workspace to a Group Workspace before creating invitations.',
      );
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiration

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: dto.email ? dto.email.toLowerCase().trim() : null,
        tokenHash,
        role: dto.role === 'OWNER' ? 'OWNER' : 'MEMBER',
        expiresAt,
        createdById: userId,
      },
    });

    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      role: invitation.role as WorkspaceRole,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      revokedAt: invitation.revokedAt?.toISOString() ?? null,
      inviteToken: rawToken,
      inviteUrl: `/invite/${rawToken}`,
      createdByName: workspace.owner.name,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  /**
   * Lists all active invitations for a workspace (owner only).
   */
  async listInvitations(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceInvitationDto[]> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: { select: { name: true } } },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can view invitations.');
    }

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      email: inv.email,
      role: inv.role as WorkspaceRole,
      expiresAt: inv.expiresAt.toISOString(),
      acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      revokedAt: inv.revokedAt?.toISOString() ?? null,
      createdByName: workspace.owner.name,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  /**
   * Revokes an invitation link/token (owner only).
   */
  async revokeInvitation(
    userId: string,
    workspaceId: string,
    invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can revoke invitations.');
    }

    const inv = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });

    if (!inv) {
      throw new NotFoundException('Invitation not found.');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'Invitation revoked successfully.',
    };
  }

  /**
   * Resolves public invitation details for the landing/acceptance page.
   */
  async getPublicInvitationDetails(rawToken: string): Promise<PublicInvitationDetailsDto> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: {
          include: {
            owner: { select: { name: true } },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or non-existent invitation link.');
    }

    let status: 'VALID' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED' = 'VALID';
    let isValid = true;

    if (invitation.revokedAt) {
      status = 'REVOKED';
      isValid = false;
    } else if (invitation.acceptedAt) {
      status = 'ACCEPTED';
      isValid = false;
    } else if (invitation.expiresAt < new Date()) {
      status = 'EXPIRED';
      isValid = false;
    }

    return {
      workspaceId: invitation.workspaceId,
      workspaceTitle: invitation.workspace.name,
      inviterName: invitation.workspace.owner.name ?? 'A fellow student',
      role: invitation.role as WorkspaceRole,
      isValid,
      status,
    };
  }

  /**
   * Accepts an invitation and joins the workspace.
   */
  async acceptInvitation(
    userId: string,
    rawToken: string,
  ): Promise<AcceptInvitationResponseDto> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation link.');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('This invitation has been revoked by the workspace owner.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired.');
    }

    if (invitation.acceptedAt) {
      if (invitation.acceptedById === userId) {
        return {
          success: true,
          workspaceId: invitation.workspaceId,
          workspaceTitle: invitation.workspace.name,
          role: invitation.role as WorkspaceRole,
        };
      }
      throw new BadRequestException('This invitation link has already been used.');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      if (!existingMember) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId,
            role: invitation.role,
          },
        });
      }

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          acceptedById: userId,
        },
      });
    });

    return {
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceTitle: invitation.workspace.name,
      role: invitation.role as WorkspaceRole,
    };
  }

  // =========================================================================
  // GROUP DISCUSSION MESSAGES (People <-> People)
  // =========================================================================

  /**
   * Lists discussion messages in a group workspace.
   */
  async getDiscussionMessages(
    userId: string,
    workspaceId: string,
    limit = 50,
    before?: string,
  ): Promise<DiscussionMessagesListResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this workspace discussion.');
    }

    if (workspace.type !== 'GROUP') {
      return { messages: [], total: 0 };
    }

    const messages = await this.prisma.workspaceDiscussionMessage.findMany({
      where: {
        workspaceId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted: DiscussionMessageDto[] = messages.map((m) => {
      const name = m.user.name || m.user.email?.split('@')[0] || 'Student';
      const initials =
        name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'ST';

      return {
        id: m.id,
        workspaceId: m.workspaceId,
        userId: m.userId,
        userName: name,
        userInitials: initials,
        content: m.content,
        pageNumber: m.pageNumber,
        chapter: m.chapter,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return {
      messages: formatted,
      total: formatted.length,
    };
  }

  /**
   * Posts a discussion message in a group workspace.
   */
  async createDiscussionMessage(
    userId: string,
    workspaceId: string,
    dto: CreateDiscussionMessageDto,
  ): Promise<DiscussionMessageDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have access to post in this workspace discussion.',
      );
    }

    if (workspace.type !== 'GROUP') {
      throw new BadRequestException('Discussions are only available in Group Workspaces.');
    }

    const msg = await this.prisma.workspaceDiscussionMessage.create({
      data: {
        workspaceId,
        userId,
        content: dto.content.trim(),
        pageNumber: dto.pageNumber,
        chapter: dto.chapter,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const name = msg.user.name || msg.user.email?.split('@')[0] || 'Student';
    const initials =
      name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST';

    return {
      id: msg.id,
      workspaceId: msg.workspaceId,
      userId: msg.userId,
      userName: name,
      userInitials: initials,
      content: msg.content,
      pageNumber: msg.pageNumber,
      chapter: msg.chapter,
      createdAt: msg.createdAt.toISOString(),
    };
  }

  // =========================================================================
  // SHARED CONVERSATION SNAPSHOTS
  // =========================================================================

  /**
   * Shares a selected private AI conversation with the group workspace.
   * Creates an immutable snapshot; the private conversation remains private.
   */
  async createSharedConversation(
    userId: string,
    workspaceId: string,
    dto: CreateSharedConversationDto,
  ): Promise<SharedConversationSnapshotDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have permission to share conversations in this workspace.',
      );
    }

    if (workspace.type !== 'GROUP') {
      throw new BadRequestException(
        'Sharing conversations is only available in Group Workspaces.',
      );
    }

    // Must be the owner of the private conversation!
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: {
        messages: {
          include: { citations: true },
          orderBy: { createdAt: 'asc' },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You can only share your own private conversations.');
    }

    const snapshotData = {
      title: dto.title?.trim() || conversation.title,
      sharedAt: new Date().toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.sender as 'USER' | 'ASSISTANT' | 'SYSTEM',
        content: m.content,
        tokenCount: m.tokenCount,
        citations: m.citations.map((c) => ({
          id: c.id,
          messageId: c.messageId,
          sourceId: c.chunkId ?? 'src-1',
          chunkId: c.chunkId,
          quoteSnippet: c.quoteSnippet,
          pageNumber: c.pageNumber,
          chapter: c.chapter,
          relevanceScore: c.relevanceScore,
        })),
        createdAt: m.createdAt.toISOString(),
      })),
    };

    const snapshot = await this.prisma.sharedConversationSnapshot.create({
      data: {
        workspaceId,
        conversationId: conversation.id,
        sharedById: userId,
        title: dto.title?.trim() || conversation.title,
        snapshotData,
      },
      include: {
        sharedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: snapshot.id,
      workspaceId: snapshot.workspaceId,
      conversationId: snapshot.conversationId,
      sharedById: snapshot.sharedById,
      sharedByName:
        snapshot.sharedBy.name || snapshot.sharedBy.email?.split('@')[0] || 'Student',
      title: snapshot.title,
      snapshotData: snapshot.snapshotData as any,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  /**
   * Lists all active shared conversation snapshots in a group workspace.
   */
  async listSharedConversations(
    userId: string,
    workspaceId: string,
  ): Promise<SharedConversationsListResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this workspace.');
    }

    const shares = await this.prisma.sharedConversationSnapshot.findMany({
      where: { workspaceId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        sharedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted: SharedConversationSnapshotDto[] = shares.map((s) => ({
      id: s.id,
      workspaceId: s.workspaceId,
      conversationId: s.conversationId,
      sharedById: s.sharedById,
      sharedByName:
        s.sharedBy.name || s.sharedBy.email?.split('@')[0] || 'Student',
      title: s.title,
      snapshotData: s.snapshotData as any,
      createdAt: s.createdAt.toISOString(),
    }));

    return {
      shares: formatted,
      total: formatted.length,
    };
  }

  /**
   * Revokes a shared conversation snapshot (sharer or workspace owner only).
   */
  async revokeSharedConversation(
    userId: string,
    workspaceId: string,
    shareId: string,
  ): Promise<{ success: boolean; message: string }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const share = await this.prisma.sharedConversationSnapshot.findUnique({
      where: { id: shareId },
    });

    if (!share || share.workspaceId !== workspaceId) {
      throw new NotFoundException('Shared conversation snapshot not found.');
    }

    const isSharer = share.sharedById === userId;
    const isWsOwner = workspace.ownerId === userId;

    if (!isSharer && !isWsOwner) {
      throw new ForbiddenException(
        'Only the student who shared this conversation or the workspace owner can revoke it.',
      );
    }

    await this.prisma.sharedConversationSnapshot.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'Shared conversation snapshot revoked.',
    };
  }
}

