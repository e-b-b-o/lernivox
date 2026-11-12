import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockAiProvider } from '@lernivox/ai-core';
import { TutorService } from './tutor.service';

describe('TutorService', () => {
  let service: TutorService;
  let mockPrisma: any;
  let mockRetrievalService: any;
  let mockAiProvider: any;
  let mockWorkspacesService: any;

  const userId = 'user-123';
  const documentId = 'doc-456';
  const conversationId = 'conv-789';

  beforeEach(() => {
    mockPrisma = {
      document: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      conversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      conversationMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      documentChunk: {
        findUnique: jest.fn(),
      },
    };

    mockRetrievalService = {
      retrieveRelevantChunks: (jest.fn() as any).mockResolvedValue([
        {
          sourceId: 'S1',
          chunkId: 'chunk-1',
          documentId,
          documentTitle: 'New Testament History & Literature',
          content: 'The Hellenistic period began in 332 BCE under Alexander the Great.',
          pageNumber: 42,
          chapter: 'Chapter 2',
          sectionTitle: 'Hellenism',
          similarity: 0.88,
        },
      ]),
    };

    mockAiProvider = new MockAiProvider(768);

    mockWorkspacesService = {
      verifyDocumentAccess: (jest.fn() as any).mockResolvedValue({
        hasAccess: true,
        isOwner: true,
        document: {
          id: documentId,
          ownerId: userId,
          status: 'READY',
          title: 'New Testament History & Literature',
          workspaceId: 'ws-123',
        },
      }),
    };

    service = new TutorService(mockPrisma, mockRetrievalService, mockWorkspacesService, mockAiProvider);
  });

  describe('createConversation', () => {
    it('should create conversation when document is READY and accessible', async () => {
      mockPrisma.conversation.create.mockResolvedValue({
        id: conversationId,
        userId,
        documentId,
        workspaceId: 'ws-123',
        title: 'Study: Hellenism',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createConversation(userId, {
        documentId,
        title: 'Study: Hellenism',
      });

      expect(result.id).toBe(conversationId);
      expect(result.documentId).toBe(documentId);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId,
          documentId,
          workspaceId: 'ws-123',
          title: 'Study: Hellenism',
        },
      });
    });

    it('should throw NotFoundException if document does not exist or user does not own it', async () => {
      mockWorkspacesService.verifyDocumentAccess.mockRejectedValue(new NotFoundException('Document not found'));

      await expect(
        service.createConversation(userId, { documentId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if document is not in READY status', async () => {
      mockWorkspacesService.verifyDocumentAccess.mockResolvedValue({
        hasAccess: true,
        isOwner: true,
        document: {
          id: documentId,
          ownerId: userId,
          status: 'PROCESSING',
          title: 'New Testament History & Literature',
          workspaceId: 'ws-123',
        },
      });

      await expect(
        service.createConversation(userId, { documentId }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listConversations', () => {
    it('should list conversations with message counts and previews', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([
        {
          id: conversationId,
          userId,
          documentId,
          title: 'Hellenistic Era',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { messages: 3 },
          messages: [{ content: 'Latest response' }],
        },
      ]);

      const list = await service.listConversations(userId, documentId);
      expect(list.length).toBe(1);
      expect(list[0]!.id).toBe(conversationId);
      expect(list[0]!.messageCount).toBe(3);
      expect(list[0]!.lastMessagePreview).toBe('Latest response');
    });
  });

  describe('sendMessage (RAG Grounded Response)', () => {
    it('should submit student question, retrieve chunks, generate grounded answer, and persist with citations', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        documentId,
        title: 'New Study Session',
        document: {
          id: documentId,
          title: 'New Testament History & Literature',
          status: 'READY',
        },
      });

      mockPrisma.conversationMessage.create
        .mockResolvedValueOnce({
          id: 'user-msg-1',
          conversationId,
          sender: 'USER',
          content: 'When did Hellenism begin?',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'assistant-msg-1',
          conversationId,
          sender: 'ASSISTANT',
          content: 'According to the source, the Hellenistic period began in 332 BCE [S1].',
          tokenCount: 15,
          metadata: {},
          citations: [
            {
              id: 'cit-1',
              chunkId: 'chunk-1',
              documentId,
              quoteSnippet: 'The Hellenistic period began in 332 BCE',
              pageNumber: 42,
              chapter: 'Chapter 2',
              relevanceScore: 0.88,
            },
          ],
          createdAt: new Date(),
        });

      mockPrisma.conversationMessage.findMany.mockResolvedValue([]);
      mockPrisma.conversation.update.mockResolvedValue({});

      // Mock AI completion to return grounded content citing [S1]
      jest.spyOn(mockAiProvider, 'generateCompletion').mockResolvedValue({
        content: 'According to the source, the Hellenistic period began in 332 BCE [S1].',
        model: 'mock-model',
        completionTokens: 15,
        promptTokens: 30,
        finishReason: 'STOP',
      });

      const response = await service.sendMessage(userId, conversationId, {
        message: 'When did Hellenism begin?',
      });

      expect(response.sender).toBe('ASSISTANT');
      expect(response.citations.length).toBe(1);
      expect(response.citations[0]!.chunkId).toBe('chunk-1');
      expect(response.citations[0]!.pageNumber).toBe(42);
      expect(mockRetrievalService.retrieveRelevantChunks).toHaveBeenCalledWith(
        documentId,
        'New Testament History & Literature',
        'When did Hellenism begin?',
        6,
        0.1,
      );
    });

    it('should throw NotFoundException if conversation belongs to another user', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId: 'other-user',
      });

      await expect(
        service.sendMessage(userId, conversationId, { message: 'Question' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChunkDetail', () => {
    it('should return excerpt when document is owned by requesting student', async () => {
      mockPrisma.documentChunk.findUnique.mockResolvedValue({
        id: 'chunk-1',
        documentId,
        chunkIndex: 0,
        content: 'Historical text excerpt',
        pageNumber: 15,
        chapter: 'Chapter 1',
        sectionTitle: 'Intro',
        document: {
          id: documentId,
          title: 'New Testament History & Literature',
          ownerId: userId,
        },
      });

      const chunk = await service.getChunkDetail(userId, 'chunk-1');
      expect(chunk.chunkId).toBe('chunk-1');
      expect(chunk.pageNumber).toBe(15);
      expect(chunk.documentTitle).toBe('New Testament History & Literature');
    });

    it('should allow excerpt access for authorized group workspace members', async () => {
      mockPrisma.documentChunk.findUnique.mockResolvedValue({
        id: 'chunk-1',
        documentId,
        chunkIndex: 0,
        content: 'Shared chapter excerpt',
        pageNumber: 22,
        chapter: 'Chapter 2',
        sectionTitle: 'Group Notes',
        document: {
          id: documentId,
          title: 'New Testament History & Literature',
          ownerId: 'owner-user',
        },
      });
      mockWorkspacesService.verifyDocumentAccess.mockResolvedValueOnce({
        hasAccess: true,
        isOwner: false,
      });

      const chunk = await service.getChunkDetail(userId, 'chunk-1');
      expect(chunk.chunkId).toBe('chunk-1');
      expect(chunk.pageNumber).toBe(22);
      expect(mockWorkspacesService.verifyDocumentAccess).toHaveBeenCalledWith(userId, documentId);
    });

    it('should throw ForbiddenException if chunk belongs to an inaccessible document', async () => {
      mockPrisma.documentChunk.findUnique.mockResolvedValue({
        id: 'chunk-1',
        documentId,
        document: {
          id: documentId,
          ownerId: 'different-user',
        },
      });
      mockWorkspacesService.verifyDocumentAccess.mockRejectedValueOnce(
        new ForbiddenException('You do not have permission to access this learning workspace or document.'),
      );

      await expect(service.getChunkDetail(userId, 'chunk-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
