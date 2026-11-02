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
      },
      documentReadingProgress: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      conversation: {
        updateMany: jest.fn(),
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
});
