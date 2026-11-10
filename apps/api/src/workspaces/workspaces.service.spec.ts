import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: any;

  const mockOwnerId = 'user-owner-1';
  const mockMemberId = 'user-member-2';
  const mockStrangerId = 'user-stranger-3';

  const mockDocument = {
    id: 'doc-1',
    workspaceId: 'ws-1',
    ownerId: mockOwnerId,
    title: 'Operating Systems Concepts',
    fileName: 'os_concepts.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5000000,
    storageProvider: 'LOCAL',
    visibility: 'PRIVATE',
    status: 'READY',
    errorCode: null,
    errorMessage: null,
    pageCount: 350,
    totalTokens: 90000,
    processingStartedAt: new Date(),
    processingCompletedAt: new Date(),
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    updatedAt: new Date('2026-11-01T10:00:00.000Z'),
  };

  const mockPersonalWorkspace = {
    id: 'ws-1',
    name: 'Operating Systems Concepts',
    type: 'PERSONAL',
    ownerId: mockOwnerId,
    owner: { id: mockOwnerId, name: 'Owner User', email: 'owner@test.com' },
    document: mockDocument,
    members: [
      {
        id: 'member-1',
        workspaceId: 'ws-1',
        userId: mockOwnerId,
        role: 'OWNER',
        joinedAt: new Date('2026-11-01T10:00:00.000Z'),
        user: { id: mockOwnerId, name: 'Owner User', email: 'owner@test.com' },
      },
    ],
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    updatedAt: new Date('2026-11-01T10:00:00.000Z'),
  };

  const mockGroupWorkspace = {
    id: 'ws-2',
    name: 'Distributed Systems',
    type: 'GROUP',
    ownerId: mockOwnerId,
    owner: { id: mockOwnerId, name: 'Owner User', email: 'owner@test.com' },
    document: {
      ...mockDocument,
      id: 'doc-2',
      workspaceId: 'ws-2',
      title: 'Distributed Systems',
    },
    members: [
      {
        id: 'member-1',
        workspaceId: 'ws-2',
        userId: mockOwnerId,
        role: 'OWNER',
        joinedAt: new Date('2026-11-01T10:00:00.000Z'),
        user: { id: mockOwnerId, name: 'Owner User', email: 'owner@test.com' },
      },
      {
        id: 'member-2',
        workspaceId: 'ws-2',
        userId: mockMemberId,
        role: 'MEMBER',
        joinedAt: new Date('2026-11-01T12:00:00.000Z'),
        user: { id: mockMemberId, name: 'Collab Member', email: 'member@test.com' },
      },
    ],
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    updatedAt: new Date('2026-11-01T12:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      workspace: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      document: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      workspaceMember: {
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      workspaceInvitation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      workspaceDiscussionMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      workspaceDiscussionReadCursor: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      sharedConversationSnapshot: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      documentReadingProgress: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      conversation: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      quizAttempt: {
        findMany: jest.fn(),
      },
      quiz: {
        count: jest.fn(),
      },
      flashcardDeck: {
        findMany: jest.fn(),
      },
      documentChunk: {
        findMany: jest.fn(),
      },
      $transaction: (jest.fn() as any).mockImplementation((cb: (tx: any) => any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  describe('listUserWorkspaces', () => {
    it('should separate owned workspaces into myBooks and member workspaces into sharedWithMe', async () => {
      prisma.workspace.findMany.mockResolvedValue([
        mockPersonalWorkspace,
        mockGroupWorkspace,
      ]);
      prisma.documentReadingProgress.findMany.mockResolvedValue([
        {
          id: 'prog-1',
          userId: mockOwnerId,
          documentId: 'doc-1',
          currentPage: 14,
          totalPages: 350,
          scrollProgress: 0.2,
          zoomLevel: 1.0,
          lastReadAt: new Date(),
        },
      ]);

      const result = await service.listUserWorkspaces(mockOwnerId);

      expect(result.myBooks).toHaveLength(2);
      expect(result.sharedWithMe).toHaveLength(0);
      expect(result.myBooks[0]?.myReadingProgress?.currentPage).toBe(14);
    });

    it('should place workspaces where user is member (not owner) into sharedWithMe', async () => {
      prisma.workspace.findMany.mockResolvedValue([mockGroupWorkspace]);
      prisma.documentReadingProgress.findMany.mockResolvedValue([]);

      const result = await service.listUserWorkspaces(mockMemberId);

      expect(result.myBooks).toHaveLength(0);
      expect(result.sharedWithMe).toHaveLength(1);
      expect(result.sharedWithMe[0]?.id).toBe('ws-2');
      expect(result.sharedWithMe[0]?.isOwner).toBe(false);
    });
  });

  describe('getWorkspaceById and Access Authorization', () => {
    it('should allow owner to access workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);
      prisma.documentReadingProgress.findUnique.mockResolvedValue(null);

      const result = await service.getWorkspaceById(mockOwnerId, 'ws-1');

      expect(result.id).toBe('ws-1');
      expect(result.myRole).toBe('OWNER');
    });

    it('should allow active member to access group workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.documentReadingProgress.findUnique.mockResolvedValue(null);

      const result = await service.getWorkspaceById(mockMemberId, 'ws-2');

      expect(result.id).toBe('ws-2');
      expect(result.myRole).toBe('MEMBER');
    });

    it('should deny unauthorized user with ForbiddenException', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);

      await expect(
        service.getWorkspaceById(mockStrangerId, 'ws-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkspaceById(mockOwnerId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('One-Way Transition Invariant (Personal -> Group)', () => {
    it('should convert PERSONAL workspace to GROUP when requested by owner', async () => {
      prisma.workspace.findUnique
        .mockResolvedValueOnce(mockPersonalWorkspace)
        .mockResolvedValueOnce({
          ...mockPersonalWorkspace,
          type: 'GROUP',
        });
      prisma.workspace.update.mockResolvedValue({
        ...mockPersonalWorkspace,
        type: 'GROUP',
      });
      prisma.documentReadingProgress.findUnique.mockResolvedValue(null);

      const response = await service.convertToGroupWorkspace(mockOwnerId, 'ws-1');

      expect(response.success).toBe(true);
      expect(prisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ws-1' },
          data: expect.objectContaining({ type: 'GROUP' }),
        }),
      );
      expect(response.workspace.type).toBe('GROUP');
    });

    it('should reject conversion if requested by non-owner member', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);

      await expect(
        service.convertToGroupWorkspace(mockMemberId, 'ws-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should safely return existing workspace if already GROUP', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.documentReadingProgress.findUnique.mockResolvedValue(null);

      const response = await service.convertToGroupWorkspace(mockOwnerId, 'ws-2');

      expect(response.success).toBe(true);
      expect(response.message).toContain('already a group workspace');
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it('invariant: does not provide any method or mechanism to convert GROUP back to PERSONAL', () => {
      // Check that service does NOT expose any method to revert to personal
      expect((service as any).convertToPersonalWorkspace).toBeUndefined();
      expect((service as any).revertToPersonalWorkspace).toBeUndefined();
    });
  });

  describe('verifyDocumentAccess', () => {
    it('should grant access to document owner', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...mockDocument,
        workspace: mockPersonalWorkspace,
      });

      const access = await service.verifyDocumentAccess(mockOwnerId, 'doc-1');
      expect(access.hasAccess).toBe(true);
      expect(access.isOwner).toBe(true);
    });

    it('should grant access to authorized group member', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...mockDocument,
        workspace: mockGroupWorkspace,
      });

      const access = await service.verifyDocumentAccess(mockMemberId, 'doc-1');
      expect(access.hasAccess).toBe(true);
      expect(access.isOwner).toBe(false);
    });

    it('should deny unauthorized user access with ForbiddenException', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...mockDocument,
        workspace: mockPersonalWorkspace,
      });

      await expect(
        service.verifyDocumentAccess(mockStrangerId, 'doc-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Workspace Members Management', () => {
    it('should allow members to list workspace members', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      const result = await service.getWorkspaceMembers(mockMemberId, 'ws-2');
      expect(result.total).toBe(2);
      expect(result.members[0]?.role).toBe('OWNER');
      expect(result.members[1]?.role).toBe('MEMBER');
    });

    it('should deny non-members from listing workspace members', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.getWorkspaceMembers(mockStrangerId, 'ws-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to remove non-owner member', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceMember.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.removeMember(mockOwnerId, 'ws-2', mockMemberId);
      expect(res.success).toBe(true);
      expect(prisma.workspaceMember.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-2', userId: mockMemberId },
      });
    });

    it('should prevent removing the workspace owner', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.removeMember(mockOwnerId, 'ws-2', mockOwnerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent non-owner member from removing other members', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.removeMember(mockMemberId, 'ws-2', mockOwnerId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow non-owner member to leave workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceMember.delete.mockResolvedValue({ id: 'member-2' });

      const res = await service.leaveWorkspace(mockMemberId, 'ws-2');
      expect(res.success).toBe(true);
    });

    it('should prevent workspace owner from leaving workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.leaveWorkspace(mockOwnerId, 'ws-2'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Workspace Invitations', () => {
    it('should allow owner to create an invitation link with 7-day expiry', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceInvitation.create.mockImplementation((args: any) => ({
        id: 'inv-1',
        ...args.data,
        createdAt: new Date(),
        acceptedAt: null,
        revokedAt: null,
        createdBy: { name: 'Owner User' },
      }));

      const res = await service.createInvitation(mockOwnerId, 'ws-2', {});
      expect(res.id).toBe('inv-1');
      expect(res.inviteToken).toBeDefined();
      expect(typeof res.inviteToken).toBe('string');
      expect(prisma.workspaceInvitation.create).toHaveBeenCalled();
    });

    it('should reject invitation creation on PERSONAL workspaces', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);

      await expect(
        service.createInvitation(mockOwnerId, 'ws-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invitation creation by non-owner members', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.createInvitation(mockMemberId, 'ws-2', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to list active invitations', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          workspaceId: 'ws-2',
          email: null,
          role: 'MEMBER',
          expiresAt: new Date(Date.now() + 86400000),
          acceptedAt: null,
          revokedAt: null,
          createdAt: new Date(),
          createdBy: { name: 'Owner User' },
        },
      ]);

      const list = await service.listInvitations(mockOwnerId, 'ws-2');
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe('inv-1');
    });

    it('should allow owner to revoke pending invitation', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceInvitation.findFirst.mockResolvedValue({
        id: 'inv-1',
        workspaceId: 'ws-2',
        revokedAt: null,
      });
      prisma.workspaceInvitation.update.mockResolvedValue({ id: 'inv-1' });

      const res = await service.revokeInvitation(mockOwnerId, 'ws-2', 'inv-1');
      expect(res.success).toBe(true);
      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('should resolve public invitation details accurately for valid token', async () => {
      prisma.workspaceInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        workspaceId: 'ws-2',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        revokedAt: null,
        workspace: {
          id: 'ws-2',
          name: 'Distributed Systems',
          owner: { name: 'Owner User' },
        },
        createdBy: { name: 'Owner User' },
      });

      const details = await service.getPublicInvitationDetails('some-raw-token');
      expect(details.isValid).toBe(true);
      expect(details.status).toBe('VALID');
      expect(details.workspaceTitle).toBe('Distributed Systems');
    });

    it('should report EXPIRED status for expired invitations', async () => {
      prisma.workspaceInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        workspaceId: 'ws-2',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() - 100000),
        acceptedAt: null,
        revokedAt: null,
        workspace: {
          id: 'ws-2',
          name: 'Distributed Systems',
          owner: { name: 'Owner User' },
        },
        createdBy: { name: 'Owner User' },
      });

      const details = await service.getPublicInvitationDetails('some-raw-token');
      expect(details.isValid).toBe(false);
      expect(details.status).toBe('EXPIRED');
    });

    it('should allow user to accept invitation and join workspace as MEMBER', async () => {
      prisma.workspaceInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        workspaceId: 'ws-2',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        revokedAt: null,
        workspace: {
          id: 'ws-2',
          name: 'Distributed Systems',
          members: [{ userId: mockOwnerId }],
        },
      });
      prisma.workspaceMember.create.mockResolvedValue({ id: 'member-3' });
      prisma.workspaceInvitation.update.mockResolvedValue({ id: 'inv-1' });

      const res = await service.acceptInvitation(mockStrangerId, 'raw-token');
      expect(res.success).toBe(true);
      expect(res.role).toBe('MEMBER');
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-2',
          userId: mockStrangerId,
          role: 'MEMBER',
        }),
      });
    });

    it('should allow user to accept pending invitation by ID', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockStrangerId,
        email: 'stranger@test.com',
      });
      prisma.workspaceInvitation.findUnique.mockResolvedValue({
        id: 'inv-pending-1',
        workspaceId: 'ws-2',
        email: 'stranger@test.com',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        declinedAt: null,
        revokedAt: null,
        workspace: {
          id: 'ws-2',
          name: 'Distributed Systems',
        },
      });
      prisma.workspaceMember.findUnique.mockResolvedValue(null);
      prisma.workspaceMember.create.mockResolvedValue({ id: 'member-new' });
      prisma.workspaceInvitation.update.mockResolvedValue({ id: 'inv-pending-1' });

      const res = await service.acceptPendingInvitation(mockStrangerId, 'inv-pending-1');
      expect(res.success).toBe(true);
      expect(res.workspaceId).toBe('ws-2');
      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-pending-1' },
        data: expect.objectContaining({
          acceptedById: mockStrangerId,
        }),
      });
    });

    it('should allow user to decline pending invitation by ID', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockStrangerId,
        email: 'stranger@test.com',
      });
      prisma.workspaceInvitation.findUnique.mockResolvedValue({
        id: 'inv-pending-2',
        workspaceId: 'ws-2',
        email: 'stranger@test.com',
        role: 'MEMBER',
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: null,
        declinedAt: null,
        revokedAt: null,
      });
      prisma.workspaceInvitation.update.mockResolvedValue({ id: 'inv-pending-2' });

      const res = await service.declinePendingInvitation(mockStrangerId, 'inv-pending-2');
      expect(res.success).toBe(true);
      expect(res.message).toContain('declined');
      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-pending-2' },
        data: expect.objectContaining({
          declinedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('Group Discussions (People <-> People)', () => {
    it('should allow member to post discussion message anchored to page', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.user.findUnique.mockResolvedValue({
        id: mockMemberId,
        name: 'Collab Member',
        email: 'member@test.com',
      });
      prisma.workspaceDiscussionMessage.create.mockResolvedValue({
        id: 'msg-1',
        workspaceId: 'ws-2',
        userId: mockMemberId,
        content: 'Check page 42 regarding Paxos consensus',
        pageNumber: 42,
        chapter: 'Consensus',
        createdAt: new Date(),
        user: { id: mockMemberId, name: 'Collab Member', email: 'member@test.com' },
      });

      const msg = await service.createDiscussionMessage(mockMemberId, 'ws-2', {
        content: 'Check page 42 regarding Paxos consensus',
        pageNumber: 42,
        chapter: 'Consensus',
      });

      expect(msg.id).toBe('msg-1');
      expect(msg.pageNumber).toBe(42);
      expect(msg.userInitials).toBe('CM');
    });

    it('should reject discussion message on PERSONAL workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);

      await expect(
        service.createDiscussionMessage(mockOwnerId, 'ws-1', { content: 'Hello' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deny stranger from reading group discussion', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);

      await expect(
        service.getDiscussionMessages(mockStrangerId, 'ws-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return unread discussion count for member based on read cursor', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.workspaceDiscussionReadCursor.findUnique.mockResolvedValue({
        workspaceId: 'ws-2',
        userId: mockMemberId,
        lastReadAt: new Date('2026-11-01T12:00:00.000Z'),
      });
      prisma.workspaceDiscussionMessage.count.mockResolvedValue(3);

      const res = await service.getUnreadDiscussionCount(mockMemberId, 'ws-2');
      expect(res.workspaceId).toBe('ws-2');
      expect(res.unreadCount).toBe(3);
      expect(res.lastReadAt).toBe(new Date('2026-11-01T12:00:00.000Z').toISOString());
    });

    it('should return unreadCount 0 for PERSONAL workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockPersonalWorkspace);

      const res = await service.getUnreadDiscussionCount(mockOwnerId, 'ws-1');
      expect(res.unreadCount).toBe(0);
    });

    it('should mark discussion as read and update cursor', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      const now = new Date();
      prisma.workspaceDiscussionMessage.findFirst.mockResolvedValue({
        id: 'msg-latest',
        createdAt: now,
      });
      prisma.workspaceDiscussionReadCursor.upsert.mockResolvedValue({
        workspaceId: 'ws-2',
        userId: mockMemberId,
        lastReadMessageId: 'msg-latest',
        lastReadAt: now,
      });
      prisma.workspaceDiscussionMessage.count.mockResolvedValue(0);

      const res = await service.markDiscussionAsRead(mockMemberId, 'ws-2');
      expect(res.success).toBe(true);
      expect(res.unreadCount).toBe(0);
      expect(res.lastReadAt).toBe(now.toISOString());
    });
  });

  describe('Shared AI Conversation Snapshots', () => {
    it('should create an immutable snapshot of conversation for group workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        userId: mockMemberId,
        title: 'Tutor Session on Raft',
        messages: [
          { id: 'm-1', sender: 'USER', content: 'What is Raft?', citations: [], createdAt: new Date() },
          { id: 'm-2', sender: 'ASSISTANT', content: 'Raft is a consensus algorithm...', citations: [], createdAt: new Date() },
        ],
      });
      prisma.user.findUnique.mockResolvedValue({
        id: mockMemberId,
        name: 'Collab Member',
      });
      prisma.sharedConversationSnapshot.create.mockResolvedValue({
        id: 'snap-1',
        workspaceId: 'ws-2',
        conversationId: 'conv-1',
        sharedById: mockMemberId,
        title: 'Raft Overview',
        snapshotData: {
          title: 'Raft Overview',
          messages: [],
          sharedAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        sharedBy: { name: 'Collab Member' },
      });

      const snap = await service.createSharedConversation(mockMemberId, 'ws-2', {
        conversationId: 'conv-1',
        title: 'Raft Overview',
      });

      expect(snap.id).toBe('snap-1');
      expect(snap.sharedByName).toBe('Collab Member');
    });

    it('should prevent sharing another user private conversation', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-owner',
        userId: mockOwnerId, // belongs to owner, stranger tries to share
        title: 'Owner Private Chat',
        messages: [],
      });

      await expect(
        service.createSharedConversation(mockStrangerId, 'ws-2', {
          conversationId: 'conv-owner',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow group members to list shared conversation snapshots', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.sharedConversationSnapshot.findMany.mockResolvedValue([
        {
          id: 'snap-1',
          workspaceId: 'ws-2',
          conversationId: 'conv-1',
          sharedById: mockMemberId,
          title: 'Raft Overview',
          snapshotData: { title: 'Raft Overview', messages: [] },
          createdAt: new Date(),
          sharedBy: { name: 'Collab Member' },
        },
      ]);

      const res = await service.listSharedConversations(mockOwnerId, 'ws-2');
      expect(res.total).toBe(1);
      expect(res.shares[0]?.title).toBe('Raft Overview');
    });

    it('should allow author or workspace owner to revoke a shared snapshot', async () => {
      prisma.workspace.findUnique.mockResolvedValue(mockGroupWorkspace);
      prisma.sharedConversationSnapshot.findUnique.mockResolvedValue({
        id: 'snap-1',
        workspaceId: 'ws-2',
        sharedById: mockMemberId,
      });
      prisma.sharedConversationSnapshot.update.mockResolvedValue({ id: 'snap-1' });

      const res = await service.revokeSharedConversation(mockMemberId, 'ws-2', 'snap-1');
      expect(res.success).toBe(true);
      expect(prisma.sharedConversationSnapshot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'snap-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('Individual Workspace Learning Progress', () => {
    it('should aggregate individual student reading, quizzes, and flashcard progress with zero fabricated metrics', async () => {
      prisma.workspace.findFirst.mockResolvedValue({
        id: 'ws-1',
        name: 'Distributed Systems',
        ownerId: mockOwnerId,
        document: {
          id: 'doc-1',
          title: 'Distributed Systems Principles',
          pageCount: 100,
          sections: [
            { id: 'sec-1', title: 'Chapter 1: Architectures', chapterNumber: 1, pageNumber: 5 },
            { id: 'sec-2', title: 'Chapter 2: Processes', chapterNumber: 2, pageNumber: 35 },
          ],
        },
      });

      prisma.documentReadingProgress.findUnique.mockResolvedValue({
        userId: mockOwnerId,
        documentId: 'doc-1',
        currentPage: 50,
        totalPages: 100,
        lastReadAt: new Date(),
      });

      prisma.quizAttempt.findMany.mockResolvedValue([
        {
          id: 'att-1',
          score: 80,
          totalQuestions: 5,
          completedAt: new Date(),
          quiz: { id: 'quiz-1', title: 'Architectures Quiz' },
          answers: [
            {
              id: 'ans-1',
              isCorrect: true,
              question: { id: 'q-1', prompt: 'P1', chapter: 'Chapter 1: Architectures', pageNumber: 10 },
            },
            {
              id: 'ans-2',
              isCorrect: false,
              question: { id: 'q-2', prompt: 'P2', chapter: 'Chapter 1: Architectures', pageNumber: 12 },
            },
          ],
        },
      ]);

      prisma.quiz.count.mockResolvedValue(1);

      prisma.flashcardDeck.findMany.mockResolvedValue([
        {
          id: 'deck-1',
          cards: [
            {
              id: 'c-1',
              chapter: 'Chapter 1: Architectures',
              reviews: [
                {
                  reviewCount: 3,
                  repetition: 3,
                  intervalDays: 15,
                  lastRating: 4,
                  nextReviewAt: new Date(Date.now() + 864000000),
                },
              ],
            },
          ],
        },
      ]);

      const progress = await service.getWorkspaceProgress(mockOwnerId, 'ws-1');

      expect(progress.workspaceId).toBe('ws-1');
      expect(progress.reading.percentage).toBe(50);
      expect(progress.assessment.totalAttempts).toBe(1);
      expect(progress.assessment.averageScore).toBe(80);
      expect(progress.assessment.totalFailedQuestions).toBe(1);
      expect(progress.flashcards.cardsMastered).toBe(1);
      expect(progress.flashcards.cardsReviewed).toBe(1);
      expect(progress.topics).toHaveLength(2);
      expect(progress.topics[0]?.title).toBe('Chapter 1: Architectures');
    });
  });
});

