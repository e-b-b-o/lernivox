import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConvertWorkspaceResponseDto,
  DocumentDto,
  DocumentReadingProgressDto,
  WorkspaceDto,
  WorkspaceListItemDto,
  WorkspaceMemberDto,
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
}
