import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import * as path from 'path';
import type { StorageService } from '@lernivox/storage';
import {
  DocumentChunkDto,
  DocumentDto,
  DocumentIngestionJobPayload,
  QueueName,
  UserDto,
} from '@lernivox/contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import { STORAGE_SERVICE_TOKEN } from '../common/storage/storage.module';
import { CreatePastedTextRequestDto } from './dto/create-pasted-text.dto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt']);

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly maxUploadSizeBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: StorageService,
    @InjectQueue(QueueName.DOCUMENT_INGESTION)
    private readonly ingestionQueue: Queue<DocumentIngestionJobPayload>,
    private readonly configService: ConfigService,
  ) {
    this.maxUploadSizeBytes = this.configService.get<number>(
      'MAX_UPLOAD_SIZE_BYTES',
      26214400, // 25 MB default
    );
  }

  sanitizeDocument(doc: {
    id: string;
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

  async uploadFile(
    user: UserDto,
    file?: Express.Multer.File,
    customTitle?: string,
  ): Promise<DocumentDto> {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('A non-empty file must be provided.');
    }

    if (file.size > this.maxUploadSizeBytes) {
      const mbLimit = (this.maxUploadSizeBytes / (1024 * 1024)).toFixed(0);
      throw new BadRequestException(
        `File exceeds maximum permitted size of ${mbLimit} MB.`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

    if (!isMimeAllowed && !isExtAllowed) {
      throw new BadRequestException(
        `Unsupported file type (${file.mimetype || ext}). Supported formats: PDF, DOCX, TXT.`,
      );
    }

    const docId = crypto.randomUUID();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 80);
    const storageKey = `documents/${user.id}/${docId}_${sanitizedBase}${ext}`;

    // Upload to abstract storage provider
    await this.storageService.upload(file.buffer, {
      path: storageKey,
      contentType: file.mimetype || 'application/octet-stream',
      isPrivate: true,
    });

    const title =
      customTitle?.trim() ||
      path.basename(file.originalname, ext).replace(/[_-]/g, ' ').trim() ||
      'Untitled Study Document';

    // Persist Document entity
    const document = await this.prisma.document.create({
      data: {
        id: docId,
        ownerId: user.id,
        title,
        fileName: file.originalname,
        storagePath: storageKey,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storageProvider: 'LOCAL',
        visibility: 'PRIVATE',
        status: 'UPLOADED',
      },
    });

    // Enqueue BullMQ background ingestion job
    try {
      await this.ingestionQueue.add(
        'process-document',
        {
          documentId: document.id,
          userId: user.id,
          storagePath: storageKey,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Enqueued ingestion job for document ${document.id}`);
    } catch (err) {
      this.logger.error(`Failed to enqueue ingestion job for document ${document.id}`, err);
      // Even if queue dispatch fails temporarily, document is safely recorded as UPLOADED
    }

    return this.sanitizeDocument(document);
  }

  async createFromText(
    user: UserDto,
    dto: CreatePastedTextRequestDto,
  ): Promise<DocumentDto> {
    const trimmedContent = dto.content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Text content cannot be empty.');
    }

    const buffer = Buffer.from(trimmedContent, 'utf-8');
    if (buffer.length > this.maxUploadSizeBytes) {
      throw new BadRequestException('Pasted text content exceeds size limits.');
    }

    const docId = crypto.randomUUID();
    const storageKey = `documents/${user.id}/${docId}_pasted_text.txt`;

    await this.storageService.upload(buffer, {
      path: storageKey,
      contentType: 'text/plain',
      isPrivate: true,
    });

    const document = await this.prisma.document.create({
      data: {
        id: docId,
        ownerId: user.id,
        title: dto.title.trim(),
        fileName: 'pasted_text.txt',
        storagePath: storageKey,
        mimeType: 'text/plain',
        sizeBytes: buffer.length,
        storageProvider: 'LOCAL',
        visibility: 'PRIVATE',
        status: 'UPLOADED',
      },
    });

    try {
      await this.ingestionQueue.add(
        'process-document',
        {
          documentId: document.id,
          userId: user.id,
          storagePath: storageKey,
          originalFileName: 'pasted_text.txt',
          mimeType: 'text/plain',
          fileSizeBytes: buffer.length,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );
    } catch (err) {
      this.logger.error(`Failed to enqueue text ingestion job for document ${document.id}`, err);
    }

    return this.sanitizeDocument(document);
  }

  async getUserDocuments(userId: string): Promise<DocumentDto[]> {
    const documents = await this.prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => this.sanitizeDocument(doc));
  }

  async getDocumentById(userId: string, documentId: string): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this document.',
      );
    }

    return this.sanitizeDocument(document);
  }

  async getDocumentChunks(
    userId: string,
    documentId: string,
  ): Promise<DocumentChunkDto[]> {
    // Ownership check
    await this.getDocumentById(userId, documentId);

    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      include: {
        embeddings: {
          select: { id: true },
          take: 1,
        },
      },
    });

    return chunks.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      pageNumber: c.pageNumber,
      chapter: c.chapter,
      sectionTitle: c.sectionTitle,
      tokenCount: c.tokenCount,
      hasEmbedding: c.embeddings.length > 0,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async deleteDocument(
    userId: string,
    documentId: string,
  ): Promise<{ success: boolean; message: string }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || (document.ownerId && document.ownerId !== userId)) {
      throw new NotFoundException('Document not found or you do not have permission.');
    }

    // Delete stored binary file
    try {
      if (document.storagePath) {
        await this.storageService.delete(document.storagePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete storage file ${document.storagePath}: ${err}`);
    }

    // Delete from database (cascade deletes chunks and embeddings)
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      message: 'Document deleted successfully.',
    };
  }
}
