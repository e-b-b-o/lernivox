import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { UserDto } from '@lernivox/contracts';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockPrisma: any;
  let mockStorage: any;
  let mockQueue: any;
  let mockConfig: any;

  const mockUser: UserDto = {
    id: 'user-1',
    email: 'student@example.com',
    name: 'Ada Lovelace',
    role: 'USER',
    planTier: 'FREE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockPrisma = {
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      documentChunk: {
        findMany: jest.fn(),
      },
      documentSection: {
        findMany: jest.fn(),
      },
      documentReadingProgress: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      documentBookmark: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      workspace: {
        create: (jest.fn() as any).mockResolvedValue({ id: 'ws-1', name: 'Test' }),
        delete: (jest.fn() as any).mockResolvedValue({ id: 'ws-1' }),
      },
    };

    const mockWorkspacesService: any = {
      verifyDocumentAccess: (jest.fn() as any).mockImplementation(async (userId: string, docId: string) => {
        const doc = await mockPrisma.document.findUnique({ where: { id: docId } });
        if (!doc) throw new NotFoundException('Document not found');
        const isOwner = doc.ownerId === userId;
        const isMember = doc.workspace?.members?.some((m: any) => m.userId === userId) ?? false;
        if (!isOwner && !isMember) {
          throw new ForbiddenException('Forbidden');
        }
        return { hasAccess: true, isOwner, document: doc, workspace: doc.workspace };
      }),
    };

    mockStorage = {
      upload: (jest.fn() as any).mockImplementation(async (data: any, options: any) => ({
        path: options.path,
        originalName: 'file.pdf',
        mimeType: options.contentType,
        sizeBytes: 1024,
        uploadedAt: new Date(),
        isPrivate: true,
      })),
      download: jest.fn(),
      delete: (jest.fn() as any).mockResolvedValue(true),
    };

    mockQueue = {
      add: (jest.fn() as any).mockResolvedValue({ id: 'job-123' }),
    };

    mockConfig = {
      get: (jest.fn() as any).mockImplementation((key: any, defaultVal: any) => {
        if (key === 'MAX_UPLOAD_SIZE_BYTES') return 25 * 1024 * 1024;
        return defaultVal;
      }),
    };

    service = new DocumentsService(mockPrisma, mockWorkspacesService, mockStorage, mockQueue, mockConfig);
  });

  describe('uploadFile', () => {
    it('successfully uploads and queues a valid PDF document', async () => {
      const mockFile = {
        originalname: 'calculus_textbook.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        buffer: Buffer.from('%PDF-1.4 test content'),
      } as Express.Multer.File;

      mockPrisma.document.create.mockResolvedValue({
        id: 'doc-uuid-1',
        title: 'calculus_textbook',
        fileName: 'calculus_textbook.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 5000,
        status: 'UPLOADED',
        storageProvider: 'LOCAL',
        storagePath: 'documents/user-1/doc-uuid-1_calculus_textbook.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.uploadFile(mockUser, mockFile);

      expect(result.id).toBe('doc-uuid-1');
      expect(result.status).toBe('UPLOADED');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-document',
        expect.objectContaining({
          documentId: 'doc-uuid-1',
          mimeType: 'application/pdf',
          userId: 'user-1',
        }),
        expect.any(Object),
      );
    });

    it('rejects unsupported file mime types', async () => {
      const mockFile = {
        originalname: 'malicious.exe',
        mimetype: 'application/x-msdownload',
        size: 1000,
        buffer: Buffer.from('mz'),
      } as Express.Multer.File;

      await expect(service.uploadFile(mockUser, mockFile)).rejects.toThrow(BadRequestException);
    });

    it('rejects empty files', async () => {
      const mockFile = {
        originalname: 'empty.pdf',
        mimetype: 'application/pdf',
        size: 0,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      await expect(service.uploadFile(mockUser, mockFile)).rejects.toThrow(BadRequestException);
    });

    it('rejects oversized files beyond MAX_UPLOAD_SIZE_BYTES', async () => {
      const mockFile = {
        originalname: 'huge.pdf',
        mimetype: 'application/pdf',
        size: 30 * 1024 * 1024,
        buffer: Buffer.alloc(10),
      } as Express.Multer.File;

      await expect(service.uploadFile(mockUser, mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createFromText', () => {
    it('creates and queues pasted text material', async () => {
      mockPrisma.document.create.mockResolvedValue({
        id: 'doc-uuid-2',
        title: 'Linear Algebra Notes',
        fileName: 'pasted_text.txt',
        mimeType: 'text/plain',
        sizeBytes: 150,
        status: 'UPLOADED',
        storageProvider: 'LOCAL',
        storagePath: 'documents/user-1/doc-uuid-2_pasted_text.txt',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createFromText(mockUser, {
        title: 'Linear Algebra Notes',
        content: 'Eigenvectors and eigenvalues represent invariant directions under linear transformations.',
      });

      expect(result.id).toBe('doc-uuid-2');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('rejects empty or whitespace-only pasted text', async () => {
      await expect(
        service.createFromText(mockUser, {
          title: 'Empty Note',
          content: '   \n\t  ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserDocuments', () => {
    it('lists only documents belonging to the authenticated user', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Physics Notes',
          fileName: 'physics.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          status: 'READY',
          pageCount: 12,
          totalTokens: 3400,
          errorCode: null,
          errorMessage: null,
          createdAt: new Date('2026-10-28T12:00:00Z'),
          updatedAt: new Date('2026-10-28T12:05:00Z'),
        },
      ]);

      const list = await service.getUserDocuments('user-1');
      expect(list).toHaveLength(1);
      const doc = list[0];
      expect(doc?.id).toBe('doc-1');
      expect(doc?.status).toBe('READY');
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ ownerId: 'user-1' }]),
          }),
        }),
      );
    });
  });

  describe('getDocumentById', () => {
    it('returns document when user is owner', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Chemistry',
        fileName: 'chem.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1000,
        status: 'READY',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await service.getDocumentById('user-1', 'doc-1');
      expect(doc.id).toBe('doc-1');
    });

    it('throws ForbiddenException when document belongs to another user', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'different-user',
      });

      await expect(service.getDocumentById('user-1', 'doc-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.getDocumentById('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDocument', () => {
    it('deletes storage object and document record on authorization', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        storagePath: 'documents/user-1/doc-1_text.pdf',
      });

      const result = await service.deleteDocument('user-1', 'doc-1');
      expect(result.success).toBe(true);
      expect(mockStorage.delete).toHaveBeenCalledWith('documents/user-1/doc-1_text.pdf');
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });
  });

  describe('getDocumentFileStream', () => {
    it('returns full stream when no range is requested', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Biology',
        fileName: 'bio.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10000,
        storagePath: 'documents/user-1/doc-1.pdf',
      });
      mockStorage.download.mockResolvedValue('readable-stream' as any);

      const result = await service.getDocumentFileStream('user-1', 'doc-1');

      expect(result.isRange).toBe(false);
      expect(result.totalSize).toBe(10000);
      expect(result.mimeType).toBe('application/pdf');
      expect(mockStorage.download).toHaveBeenCalledWith('documents/user-1/doc-1.pdf');
    });

    it('returns byte-range slice when range header is passed', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Biology',
        fileName: 'bio.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10000,
        storagePath: 'documents/user-1/doc-1.pdf',
      });
      mockStorage.download.mockResolvedValue('partial-stream' as any);

      const result = await service.getDocumentFileStream('user-1', 'doc-1', 'bytes=0-1023');

      expect(result.isRange).toBe(true);
      expect(result.start).toBe(0);
      expect(result.end).toBe(1023);
      expect(result.chunkSize).toBe(1024);
      expect(mockStorage.download).toHaveBeenCalledWith('documents/user-1/doc-1.pdf', {
        start: 0,
        end: 1023,
      });
    });

    it('throws ForbiddenException when another user requests the file', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-other',
        sizeBytes: 10000,
      });

      await expect(service.getDocumentFileStream('user-1', 'doc-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when range header is out of bounds', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        sizeBytes: 1000,
        storagePath: 'documents/user-1/doc-1.pdf',
      });

      await expect(
        service.getDocumentFileStream('user-1', 'doc-1', 'bytes=1500-2000'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when document does not exist', async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.getDocumentFileStream('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDocumentOutline', () => {
    it('returns outline from stored DocumentSection records if available', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Calculus',
        pageCount: 300,
      });
      mockPrisma.documentSection.findMany.mockResolvedValue([
        {
          id: 'sec-1',
          title: 'Chapter 1: Limits',
          chapterNumber: 1,
          sectionNumber: null,
          pageNumber: 5,
          parentSectionId: null,
        },
      ]);

      const outline = await service.getDocumentOutline('user-1', 'doc-1');
      expect(outline.items).toHaveLength(1);
      expect(outline.items[0]?.title).toBe('Chapter 1: Limits');
      expect(outline.items[0]?.pageNumber).toBe(5);
    });

    it('falls back to deterministic outline extraction from early chunks', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'New Testament',
        pageCount: 461,
      });
      mockPrisma.documentSection.findMany.mockResolvedValue([]);
      mockPrisma.documentChunk.findMany.mockResolvedValue([
        {
          chunkIndex: 3,
          pageNumber: 1,
          content: 'Contents\n1. \tIntroduction: Why Study \t1\n2. \tCanon \t15',
        },
      ]);

      const outline = await service.getDocumentOutline('user-1', 'doc-1');
      expect(outline.items.length).toBeGreaterThanOrEqual(2);
      expect(outline.items[0]?.title).toContain('1. Introduction: Why Study');
    });

    it('returns empty items array when no sections or chapter headings match, without AI spend', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Plain Document',
        pageCount: 10,
      });
      mockPrisma.documentSection.findMany.mockResolvedValue([]);
      mockPrisma.documentChunk.findMany.mockResolvedValue([
        {
          chunkIndex: 0,
          pageNumber: 1,
          content: 'Just some regular text without any chapter or TOC lines.',
        },
      ]);

      const outline = await service.getDocumentOutline('user-1', 'doc-1');
      expect(outline.items).toEqual([]);
      expect(outline.totalPages).toBe(10);
    });
  });

  describe('ReadingProgress', () => {
    it('persists and returns reading progress via updateReadingProgress', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
        title: 'Textbook',
        pageCount: 100,
      });
      mockPrisma.documentReadingProgress.upsert.mockResolvedValue({
        id: 'prog-1',
        userId: 'user-1',
        documentId: 'doc-1',
        currentPage: 42,
        totalPages: 100,
        scrollProgress: 0.5,
        zoomLevel: 1.2,
        lastReadAt: new Date('2026-11-01T15:00:00Z'),
      });

      const result = await service.updateReadingProgress('user-1', 'doc-1', {
        currentPage: 42,
        scrollProgress: 0.5,
        zoomLevel: 1.2,
      });

      expect(result.currentPage).toBe(42);
      expect(result.zoomLevel).toBe(1.2);
      expect(mockPrisma.documentReadingProgress.upsert).toHaveBeenCalled();
    });

    it('retrieves saved progress via getReadingProgress', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
      });
      mockPrisma.documentReadingProgress.findUnique.mockResolvedValue({
        id: 'prog-1',
        userId: 'user-1',
        documentId: 'doc-1',
        currentPage: 25,
        totalPages: 100,
        scrollProgress: 0.1,
        zoomLevel: 1.0,
        lastReadAt: new Date('2026-11-01T15:00:00Z'),
      });

      const result = await service.getReadingProgress('user-1', 'doc-1');
      expect(result?.currentPage).toBe(25);
    });
  });

  describe('Bookmarks', () => {
    it('creates a new reading bookmark', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
      });
      mockPrisma.documentBookmark.create.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        documentId: 'doc-1',
        pageNumber: 88,
        title: 'Key Theorem',
        snippet: 'Important proof snippet',
        createdAt: new Date(),
      });

      const bm = await service.createBookmark('user-1', 'doc-1', {
        pageNumber: 88,
        title: 'Key Theorem',
        snippet: 'Important proof snippet',
      });

      expect(bm.id).toBe('bm-1');
      expect(bm.pageNumber).toBe(88);
      expect(mockPrisma.documentBookmark.create).toHaveBeenCalled();
    });

    it('lists bookmarks and deletes bookmark with permission check', async () => {
      mockPrisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        ownerId: 'user-1',
      });
      mockPrisma.documentBookmark.findMany.mockResolvedValue([
        {
          id: 'bm-1',
          userId: 'user-1',
          documentId: 'doc-1',
          pageNumber: 10,
          title: 'Intro',
          snippet: null,
          createdAt: new Date(),
        },
      ]);
      mockPrisma.documentBookmark.findUnique.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        documentId: 'doc-1',
      });
      mockPrisma.documentBookmark.delete.mockResolvedValue({});

      const list = await service.getBookmarks('user-1', 'doc-1');
      expect(list).toHaveLength(1);

      const del = await service.deleteBookmark('user-1', 'doc-1', 'bm-1');
      expect(del.success).toBe(true);
      expect(mockPrisma.documentBookmark.delete).toHaveBeenCalledWith({ where: { id: 'bm-1' } });
    });
  });
});

