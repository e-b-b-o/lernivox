import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { UserDto } from '@lernivox/contracts';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let mockService: any;

  const mockUser: UserDto = {
    id: 'user-1',
    email: 'student@example.com',
    name: 'Ada Lovelace',
    role: 'USER',
    planTier: 'FREE',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockService = {
      uploadFile: jest.fn<any>(),
      createFromText: jest.fn<any>(),
      getUserDocuments: jest.fn<any>(),
      getDocumentById: jest.fn<any>(),
      getDocumentChunks: jest.fn<any>(),
      getDocumentStatus: jest.fn<any>(),
      deleteDocument: jest.fn<any>(),
      retryIngestion: jest.fn<any>(),
    };

    controller = new DocumentsController(mockService as unknown as DocumentsService);
  });

  it('upload delegates to service and returns upload success response', async () => {
    const mockFile = { originalname: 'doc.pdf' } as Express.Multer.File;
    mockService.uploadFile.mockResolvedValue({ id: 'doc-1', status: 'UPLOADED' });

    const result = await controller.upload(mockUser, mockFile, 'My Document');
    expect(result).toEqual({
      document: { id: 'doc-1', status: 'UPLOADED' },
      message: 'Document uploaded successfully and queued for background ingestion.',
    });
    expect(mockService.uploadFile).toHaveBeenCalledWith(mockUser, mockFile, 'My Document', undefined);
  });

  it('createFromText delegates to service and returns upload success response', async () => {
    const dto = { title: 'Notes', content: 'Some notes' };
    mockService.createFromText.mockResolvedValue({ id: 'doc-2', status: 'UPLOADED' });

    const result = await controller.createFromText(mockUser, dto);
    expect(result).toEqual({
      document: { id: 'doc-2', status: 'UPLOADED' },
      message: 'Notes saved successfully and queued for background ingestion.',
    });
    expect(mockService.createFromText).toHaveBeenCalledWith(mockUser, dto);
  });

  it('listDocuments delegates to service with userId', async () => {
    mockService.getUserDocuments.mockResolvedValue([{ id: 'doc-1' }]);

    const result = await controller.listDocuments(mockUser);
    expect(result).toEqual([{ id: 'doc-1' }]);
    expect(mockService.getUserDocuments).toHaveBeenCalledWith('user-1');
  });

  it('getDocument delegates to service with userId and docId', async () => {
    mockService.getDocumentById.mockResolvedValue({ id: 'doc-1', title: 'Chem' });

    const result = await controller.getDocument(mockUser, 'doc-1');
    expect(result).toEqual({ id: 'doc-1', title: 'Chem' });
    expect(mockService.getDocumentById).toHaveBeenCalledWith('user-1', 'doc-1');
  });

  it('getChunks delegates to service', async () => {
    mockService.getDocumentChunks.mockResolvedValue([{ id: 'chunk-1' }]);

    const result = await controller.getChunks(mockUser, 'doc-1');
    expect(result).toEqual([{ id: 'chunk-1' }]);
    expect(mockService.getDocumentChunks).toHaveBeenCalledWith('user-1', 'doc-1');
  });

  it('getStatus delegates to service with userId and docId', async () => {
    mockService.getDocumentStatus.mockResolvedValue({
      documentId: 'doc-1',
      status: 'EMBEDDING',
      progress: 60,
      stage: 'EMBEDDING',
      message: 'Generating embeddings',
      completedUnits: 6,
      totalUnits: 10,
      isComplete: false,
      isFailed: false,
    });

    const result = await controller.getStatus(mockUser, 'doc-1');
    expect(result.progress).toEqual(60);
    expect(result.stage).toEqual('EMBEDDING');
    expect(mockService.getDocumentStatus).toHaveBeenCalledWith('user-1', 'doc-1');
  });

  it('deleteDocument delegates to service', async () => {
    mockService.deleteDocument.mockResolvedValue({ success: true, message: 'Deleted' });

    const result = await controller.deleteDocument(mockUser, 'doc-1');
    expect(result).toEqual({ success: true, message: 'Deleted' });
    expect(mockService.deleteDocument).toHaveBeenCalledWith('user-1', 'doc-1');
  });

  it('retryDocument delegates to service with userId and docId', async () => {
    mockService.retryIngestion.mockResolvedValue({ id: 'doc-1', status: 'UPLOADED' });

    const result = await controller.retryDocument(mockUser, 'doc-1');
    expect(result).toEqual({ id: 'doc-1', status: 'UPLOADED' });
    expect(mockService.retryIngestion).toHaveBeenCalledWith('user-1', 'doc-1');
  });
});
