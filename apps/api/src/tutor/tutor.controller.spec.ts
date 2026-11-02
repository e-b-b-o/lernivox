import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { UserDto } from '@lernivox/contracts';
import { TutorController } from './tutor.controller';

describe('TutorController', () => {
  let controller: TutorController;
  let mockTutorService: any;

  const mockUser: UserDto = {
    id: 'user-123',
    email: 'student@lernivox.test',
    name: 'Student User',
    role: 'USER',
    planTier: 'FREE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockTutorService = {
      createConversation: jest.fn(),
      listConversations: jest.fn(),
      getConversation: jest.fn(),
      renameConversation: jest.fn(),
      deleteConversation: jest.fn(),
      sendMessage: jest.fn(),
      getChunkDetail: jest.fn(),
    };

    controller = new TutorController(mockTutorService);
  });

  it('should delegate createConversation to TutorService', async () => {
    mockTutorService.createConversation.mockResolvedValue({ id: 'conv-1' });

    const result = await controller.createConversation(mockUser, {
      documentId: 'doc-1',
      title: 'Session 1',
    });

    expect(result).toEqual({ id: 'conv-1' });
    expect(mockTutorService.createConversation).toHaveBeenCalledWith('user-123', {
      documentId: 'doc-1',
      title: 'Session 1',
    });
  });

  it('should delegate listConversations with documentId filter', async () => {
    mockTutorService.listConversations.mockResolvedValue([]);

    await controller.listConversations(mockUser, 'doc-1');
    expect(mockTutorService.listConversations).toHaveBeenCalledWith('user-123', 'doc-1');
  });

  it('should delegate sendMessage to TutorService', async () => {
    mockTutorService.sendMessage.mockResolvedValue({ id: 'msg-1', sender: 'ASSISTANT' });

    const result = await controller.sendMessage(mockUser, 'conv-1', {
      message: 'Explain Chapter 2',
    });

    expect(result).toEqual({ id: 'msg-1', sender: 'ASSISTANT' });
    expect(mockTutorService.sendMessage).toHaveBeenCalledWith('user-123', 'conv-1', {
      message: 'Explain Chapter 2',
    });
  });

  it('should delegate getChunkDetail to TutorService', async () => {
    mockTutorService.getChunkDetail.mockResolvedValue({ chunkId: 'c-1' });

    const result = await controller.getChunkDetail(mockUser, 'c-1');
    expect(result).toEqual({ chunkId: 'c-1' });
    expect(mockTutorService.getChunkDetail).toHaveBeenCalledWith('user-123', 'c-1');
  });
});
