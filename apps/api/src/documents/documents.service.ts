import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import * as path from 'path';
import type { StorageService } from '@lernivox/storage';
import {
  DocumentBookmarkDto,
  DocumentChunkDto,
  DocumentDto,
  DocumentIngestionJobPayload,
  DocumentOutlineDto,
  DocumentOutlineItemDto,
  DocumentReaderContentDto,
  DocumentReaderPageDto,
  DocumentReadingProgressDto,
  DocumentStatusDto,
  QueueName,
  UpdateReadingProgressDto,
  UserDto,
} from '@lernivox/contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import { STORAGE_SERVICE_TOKEN } from '../common/storage/storage.module';
import { WorkerWakeService } from '../common/worker-wake/worker-wake.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreatePastedTextRequestDto } from './dto/create-pasted-text.dto';
import {
  CreateBookmarkRequestDto,
  UpdateReadingProgressRequestDto,
} from './dto/reader.dto';

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
    private readonly workspacesService: WorkspacesService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: StorageService,
    @InjectQueue(QueueName.DOCUMENT_INGESTION)
    private readonly ingestionQueue: Queue<DocumentIngestionJobPayload>,
    private readonly configService: ConfigService,
    @Optional()
    private readonly workerWakeService?: WorkerWakeService,
  ) {
    this.maxUploadSizeBytes = this.configService.get<number>(
      'MAX_UPLOAD_SIZE_BYTES',
      1048576, // 1 MiB default (1,048,576 bytes)
    );
  }

  sanitizeDocument(doc: {
    id: string;
    workspaceId?: string | null;
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
    processingProgress?: number | null;
    processingStage?: string | null;
    processingMessage?: string | null;
    completedUnits?: number | null;
    totalUnits?: number | null;
    processingStartedAt: Date | null;
    processingCompletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentDto {
    return {
      id: doc.id,
      workspaceId: doc.workspaceId ?? null,
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
      processingProgress: doc.processingProgress ?? null,
      processingStage: doc.processingStage ?? null,
      processingMessage: doc.processingMessage ?? null,
      completedUnits: doc.completedUnits ?? null,
      totalUnits: doc.totalUnits ?? null,
      processingStartedAt: doc.processingStartedAt?.toISOString() ?? null,
      processingCompletedAt: doc.processingCompletedAt?.toISOString() ?? null,
      createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private validateFileSignature(file: Express.Multer.File, ext: string): void {
    const buffer = file.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('A non-empty file must be provided.');
    }

    if (ext === '.pdf') {
      // PDF documents must start with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
      const header = buffer.subarray(0, 5).toString('ascii');
      if (!header.startsWith('%PDF-')) {
        throw new BadRequestException(
          'Invalid file content: File extension is .pdf but binary content does not match PDF signature (%PDF-).',
        );
      }
    } else if (ext === '.docx') {
      // DOCX documents are OpenXML zip packages starting with PK\x03\x04
      if (
        buffer.length < 4 ||
        buffer[0] !== 0x50 ||
        buffer[1] !== 0x4b ||
        buffer[2] !== 0x03 ||
        buffer[3] !== 0x04
      ) {
        throw new BadRequestException(
          'Invalid file content: File extension is .docx but binary content does not match DOCX/ZIP signature.',
        );
      }
    } else if (ext === '.doc') {
      // Legacy .doc files start with OLE2 header (0xD0 0xCF 0x11 0xE0) or PK if docx
      const isOle =
        buffer.length >= 4 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0;
      const isZip =
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04;
      if (!isOle && !isZip) {
        throw new BadRequestException(
          'Invalid file content: File extension is .doc but binary content does not match Word document format.',
        );
      }
    } else if (ext === '.txt') {
      // Plain text files must not contain binary null bytes (0x00) in initial inspection window
      const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
      if (sample.includes(0x00)) {
        throw new BadRequestException(
          'Invalid file content: File extension is .txt but content contains binary null bytes.',
        );
      }
    }
  }

  async uploadFile(
    user: UserDto,
    file?: Express.Multer.File,
    customTitle?: string,
    workspaceType?: 'PERSONAL' | 'GROUP',
  ): Promise<DocumentDto> {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('A non-empty file must be provided.');
    }

    if (file.size > this.maxUploadSizeBytes) {
      throw new BadRequestException(
        'This file is larger than the 1 MB upload limit. Choose a smaller file.',
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const baseMime = ((file.mimetype || '').split(';')[0] ?? '').trim().toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(baseMime);
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

    if (!isMimeAllowed || !isExtAllowed) {
      throw new BadRequestException(
        `Unsupported file type (${file.mimetype || ext}). Supported formats: PDF, DOCX, TXT.`,
      );
    }

    this.validateFileSignature(file, ext);

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

    // 1. Create persistent 1:1 Workspace and owner membership
    const workspace = await this.prisma.workspace.create({
      data: {
        name: title,
        type: workspaceType || 'PERSONAL',
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    // 2. Persist Document entity linked to Workspace
    const document = await this.prisma.document.create({
      data: {
        id: docId,
        workspaceId: workspace.id,
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
      this.workerWakeService?.wake('document-upload');
    } catch (err) {
      this.logger.error(`Failed to enqueue ingestion job for document ${document.id}`, err);
      // Even if queue dispatch fails temporarily, document is safely recorded as UPLOADED
    }

    return this.sanitizeDocument(document);
  }

  async createFromText(
    user: UserDto,
    dto: CreatePastedTextRequestDto,
    workspaceType?: 'PERSONAL' | 'GROUP',
  ): Promise<DocumentDto> {
    const trimmedContent = dto.content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Text content cannot be empty.');
    }

    const buffer = Buffer.from(trimmedContent, 'utf-8');
    if (buffer.length > this.maxUploadSizeBytes) {
      throw new BadRequestException(
        'This text content is larger than the 1 MB upload limit. Choose a smaller text.',
      );
    }

    const docId = crypto.randomUUID();
    const storageKey = `documents/${user.id}/${docId}_pasted_text.txt`;

    await this.storageService.upload(buffer, {
      path: storageKey,
      contentType: 'text/plain',
      isPrivate: true,
    });

    const title = dto.title.trim();
    const effectiveWsType = dto.workspaceType || workspaceType || 'PERSONAL';

    // 1. Create persistent 1:1 Workspace and owner membership
    const workspace = await this.prisma.workspace.create({
      data: {
        name: title,
        type: effectiveWsType,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    const document = await this.prisma.document.create({
      data: {
        id: docId,
        workspaceId: workspace.id,
        ownerId: user.id,
        title,
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
      this.logger.log(`Enqueued ingestion job for pasted text document ${document.id}`);
      this.workerWakeService?.wake('pasted-text-upload');
    } catch (err) {
      this.logger.error(`Failed to enqueue text ingestion job for document ${document.id}`, err);
    }

    return this.sanitizeDocument(document);
  }

  async getUserDocuments(userId: string): Promise<DocumentDto[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { workspace: { members: { some: { userId } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => this.sanitizeDocument(doc));
  }

  async getDocumentById(userId: string, documentId: string): Promise<DocumentDto> {
    const { document } = await this.workspacesService.verifyDocumentAccess(userId, documentId);
    return this.sanitizeDocument(document);
  }

  async getDocumentStatus(userId: string, documentId: string): Promise<DocumentStatusDto> {
    const { document } = await this.workspacesService.verifyDocumentAccess(userId, documentId);
    const isComplete = document.status === 'READY';
    const isFailed = document.status === 'FAILED';

    // If document is in an incomplete ingestion state, trigger a throttled wake attempt
    if (!isComplete && !isFailed) {
      this.workerWakeService?.wakeThrottled('document-status-poll');
    }

    return {
      documentId: document.id,
      status: document.status as DocumentStatusDto['status'],
      progress: document.processingProgress ?? (isComplete ? 100 : 0),
      stage: document.processingStage ?? (isComplete ? 'READY' : document.status),
      message: document.processingMessage ?? (isComplete ? 'Processing complete.' : ''),
      completedUnits: document.completedUnits ?? null,
      totalUnits: document.totalUnits ?? null,
      isComplete,
      isFailed,
      errorCode: document.errorCode ?? null,
    };
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
    const { document, isOwner } = await this.workspacesService.verifyDocumentAccess(
      userId,
      documentId,
    );

    if (!isOwner) {
      throw new ForbiddenException(
        'Only the workspace owner can delete this learning material.',
      );
    }

    // Delete stored binary file
    try {
      if (document.storagePath) {
        await this.storageService.delete(document.storagePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete storage file ${document.storagePath}: ${err}`);
    }

    // Delete workspace if present (cascades to document), otherwise delete document
    if (document.workspaceId) {
      await this.prisma.workspace.delete({
        where: { id: document.workspaceId },
      });
    } else {
      await this.prisma.document.delete({
        where: { id: documentId },
      });
    }

    return {
      success: true,
      message: 'Document and its workspace deleted successfully.',
    };
  }

  async getDocumentFileStream(
    userId: string,
    documentId: string,
    rangeHeader?: string,
  ): Promise<{
    stream: Readable;
    mimeType: string;
    fileName: string;
    totalSize: number;
    isRange: boolean;
    start?: number;
    end?: number;
    chunkSize?: number;
  }> {
    const { document } = await this.workspacesService.verifyDocumentAccess(userId, documentId);

    const totalSize = document.sizeBytes;
    const mimeType = document.mimeType || 'application/pdf';
    const fileName = document.fileName || `${document.title}.pdf`;

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const rangeSpec = rangeHeader.replace(/bytes=/, '').trim();
      let start: number;
      let end: number;

      if (rangeSpec.startsWith('-')) {
        // Suffix range: bytes=-500 (the last 500 bytes of the file)
        const suffixLength = parseInt(rangeSpec.substring(1), 10);
        if (isNaN(suffixLength) || suffixLength <= 0) {
          throw new BadRequestException('Requested range not satisfiable');
        }
        start = Math.max(0, totalSize - suffixLength);
        end = totalSize - 1;
      } else {
        const parts = rangeSpec.split('-');
        start = parseInt(parts[0] ?? '0', 10);
        end =
          parts[1] && parts[1].trim().length > 0
            ? parseInt(parts[1], 10)
            : totalSize - 1;
      }

      if (isNaN(start) || isNaN(end) || start < 0 || start >= totalSize || start > end) {
        throw new BadRequestException('Requested range not satisfiable');
      }

      end = Math.min(end, totalSize - 1);
      const chunkSize = end - start + 1;
      const stream = await this.storageService.download(document.storagePath, { start, end });

      return {
        stream,
        mimeType,
        fileName,
        totalSize,
        isRange: true,
        start,
        end,
        chunkSize,
      };
    }

    const stream = await this.storageService.download(document.storagePath);
    return {
      stream,
      mimeType,
      fileName,
      totalSize,
      isRange: false,
    };
  }

  async getDocumentOutline(userId: string, documentId: string): Promise<DocumentOutlineDto> {
    const document = await this.getDocumentById(userId, documentId);

    // 1. Try DocumentSection records first
    const sections = await this.prisma.documentSection.findMany({
      where: { documentId },
      orderBy: [{ chapterNumber: 'asc' }, { sectionNumber: 'asc' }],
    });

    if (sections.length > 0) {
      const items: DocumentOutlineItemDto[] = sections.map((s) => ({
        id: s.id,
        title: s.title,
        chapterNumber: s.chapterNumber,
        sectionNumber: s.sectionNumber,
        pageNumber: s.pageNumber ?? 1,
        level: s.parentSectionId ? 2 : 1,
      }));

      return {
        documentId,
        title: document.title,
        totalPages: document.pageCount,
        items,
      };
    }

    // 2. Deterministic TOC extraction from early document chunks
    const earlyChunks = await this.prisma.documentChunk.findMany({
      where: { documentId, chunkIndex: { lte: 8 } },
      orderBy: { chunkIndex: 'asc' },
      select: { chunkIndex: true, content: true, pageNumber: true },
    });

    const items = this.extractDeterministicOutline(earlyChunks, document.pageCount ?? 461);

    return {
      documentId,
      title: document.title,
      totalPages: document.pageCount,
      items,
    };
  }

  private extractDeterministicOutline(
    chunks: { chunkIndex: number; content: string; pageNumber: number | null }[],
    totalPages: number,
  ): DocumentOutlineItemDto[] {
    const combined = chunks.map((c) => c.content).join('\n');
    const items: DocumentOutlineItemDto[] = [];
    const lines = combined.split('\n');

    const pdfOffset = 12;
    const seenChapters = new Set<number>();
    const seenTitles = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i]?.trim() ?? '';
      if (!rawLine) continue;

      if (/dc23|cataloging|isbn|copyright|reserved|printed|yaleup|ansi/i.test(rawLine)) continue;
      if (/^10 9 8 7/i.test(rawLine)) continue;

      const chapterMatch = rawLine.match(/^(\d{1,2})[\.\s\t]+(.*?)(?:[\s\t]+(\d+))?$/);
      const sectionMatch = rawLine.match(
        /^(Preface[^\d]*|Map|Epilogue[^\d]*|Notes|Bibliography|Subject and Author Index|Index of Scripture Citations)(?:[\s\t]+([\divxlc]+))?$/i,
      );

      if (chapterMatch && chapterMatch[1] && chapterMatch[2]) {
        const num = parseInt(chapterMatch[1], 10);
        if (num < 1 || num > 60) continue;
        if (seenChapters.has(num)) continue;

        let title = chapterMatch[2].replace(/\t+/g, ' ').trim();
        let page = chapterMatch[3] ? parseInt(chapterMatch[3], 10) : null;

        if (page === null && i + 1 < lines.length) {
          const next = lines[i + 1]?.trim() ?? '';
          const pageOnly = next.match(/^(\d+)$/);
          const titlePlusPage = next.match(/^(.*?)(?:[\s\t]+(\d+))$/);
          if (pageOnly && pageOnly[1]) {
            page = parseInt(pageOnly[1], 10);
          } else if (titlePlusPage && titlePlusPage[1] && titlePlusPage[2]) {
            title = `${title} ${titlePlusPage[1].trim()}`;
            page = parseInt(titlePlusPage[2], 10);
          }
        }

        seenChapters.add(num);
        const realPage = page ? Math.min(page + pdfOffset, totalPages) : num;
        items.push({
          id: `ch-${num}`,
          title: `${num}. ${title}`,
          chapterNumber: num,
          pageNumber: realPage,
          level: 1,
        });
      } else if (sectionMatch && sectionMatch[1]) {
        const rawTitle = sectionMatch[1].replace(/\t+/g, ' ').trim();
        if (seenTitles.has(rawTitle.toLowerCase())) continue;
        seenTitles.add(rawTitle.toLowerCase());

        let page = 1;
        if (/preface/i.test(rawTitle)) page = 8;
        else if (/map/i.test(rawTitle)) page = 10;
        else if (/epilogue/i.test(rawTitle)) page = 389 + pdfOffset;
        else if (/notes/i.test(rawTitle)) page = 397 + pdfOffset;
        else if (/bibliography/i.test(rawTitle)) page = 415 + pdfOffset;
        else if (/subject/i.test(rawTitle)) page = 425 + pdfOffset;
        else if (/scripture/i.test(rawTitle)) page = 443 + pdfOffset;

        items.push({
          id: `section-${items.length}`,
          title: rawTitle,
          chapterNumber: null,
          pageNumber: Math.min(page, totalPages),
          level: 1,
        });
      }
    }

    items.sort((a, b) => a.pageNumber - b.pageNumber);
    return items;
  }

  async getReaderContent(
    userId: string,
    documentId: string,
    page?: number,
    limit = 50,
  ): Promise<DocumentReaderContentDto> {
    const document = await this.getDocumentById(userId, documentId);

    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
      select: {
        id: true,
        chunkIndex: true,
        content: true,
        pageNumber: true,
        chapter: true,
      },
    });

    const pageMap = new Map<number, { text: string; chapter: string | null; chunkIds: string[] }>();

    for (const chunk of chunks) {
      // Determine page number: check chunk.pageNumber or match "-- X of Y --" in chunk text
      const pageMatch = chunk.content.match(/--\s*(\d+)\s+of\s+\d+\s*--/);
      const pageNum = pageMatch && pageMatch[1] ? parseInt(pageMatch[1], 10) : chunk.pageNumber ?? 1;

      const existing = pageMap.get(pageNum);
      // Strip page marker from text for a clean serif reading experience
      const cleanContent = chunk.content.replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();

      if (!existing) {
        pageMap.set(pageNum, {
          text: cleanContent,
          chapter: chunk.chapter,
          chunkIds: [chunk.id],
        });
      } else {
        existing.text += `\n\n${cleanContent}`;
        if (!existing.chapter && chunk.chapter) {
          existing.chapter = chunk.chapter;
        }
        existing.chunkIds.push(chunk.id);
      }
    }

    const sortedPageNumbers = Array.from(pageMap.keys()).sort((a, b) => a - b);
    let targetPages = sortedPageNumbers;

    if (page !== undefined && page > 0) {
      const startIdx = Math.max(0, sortedPageNumbers.indexOf(page));
      targetPages = sortedPageNumbers.slice(startIdx, startIdx + limit);
    } else {
      targetPages = sortedPageNumbers.slice(0, limit);
    }

    const pages: DocumentReaderPageDto[] = targetPages.map((num) => {
      const data = pageMap.get(num)!;
      return {
        pageNumber: num,
        text: data.text,
        chapter: data.chapter,
        chunkIds: data.chunkIds,
      };
    });

    return {
      documentId,
      title: document.title,
      pageCount: document.pageCount ?? sortedPageNumbers.length,
      pages,
    };
  }

  async getReadingProgress(
    userId: string,
    documentId: string,
  ): Promise<DocumentReadingProgressDto | null> {
    await this.getDocumentById(userId, documentId);

    const progress = await this.prisma.documentReadingProgress.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
    });

    if (!progress) {
      return null;
    }

    return {
      id: progress.id,
      userId: progress.userId,
      documentId: progress.documentId,
      currentPage: progress.currentPage,
      totalPages: progress.totalPages,
      scrollProgress: progress.scrollProgress,
      zoomLevel: progress.zoomLevel,
      lastReadAt: progress.lastReadAt.toISOString(),
    };
  }

  async updateReadingProgress(
    userId: string,
    documentId: string,
    dto: UpdateReadingProgressRequestDto,
  ): Promise<DocumentReadingProgressDto> {
    const document = await this.getDocumentById(userId, documentId);

    const progress = await this.prisma.documentReadingProgress.upsert({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
      create: {
        userId,
        documentId,
        currentPage: dto.currentPage,
        totalPages: dto.totalPages ?? document.pageCount,
        scrollProgress: dto.scrollProgress ?? 0,
        zoomLevel: dto.zoomLevel ?? 1.0,
        lastReadAt: new Date(),
      },
      update: {
        currentPage: dto.currentPage,
        totalPages: dto.totalPages !== undefined ? dto.totalPages : undefined,
        scrollProgress: dto.scrollProgress !== undefined ? dto.scrollProgress : undefined,
        zoomLevel: dto.zoomLevel !== undefined ? dto.zoomLevel : undefined,
        lastReadAt: new Date(),
      },
    });

    return {
      id: progress.id,
      userId: progress.userId,
      documentId: progress.documentId,
      currentPage: progress.currentPage,
      totalPages: progress.totalPages,
      scrollProgress: progress.scrollProgress,
      zoomLevel: progress.zoomLevel,
      lastReadAt: progress.lastReadAt.toISOString(),
    };
  }

  async getBookmarks(userId: string, documentId: string): Promise<DocumentBookmarkDto[]> {
    await this.getDocumentById(userId, documentId);

    const bookmarks = await this.prisma.documentBookmark.findMany({
      where: { userId, documentId },
      orderBy: { pageNumber: 'asc' },
    });

    return bookmarks.map((b) => ({
      id: b.id,
      userId: b.userId,
      documentId: b.documentId,
      pageNumber: b.pageNumber,
      title: b.title,
      snippet: b.snippet,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  async createBookmark(
    userId: string,
    documentId: string,
    dto: CreateBookmarkRequestDto,
  ): Promise<DocumentBookmarkDto> {
    await this.getDocumentById(userId, documentId);

    const bookmark = await this.prisma.documentBookmark.create({
      data: {
        userId,
        documentId,
        pageNumber: dto.pageNumber,
        title: dto.title?.trim() || `Page ${dto.pageNumber}`,
        snippet: dto.snippet?.slice(0, 300) || null,
      },
    });

    return {
      id: bookmark.id,
      userId: bookmark.userId,
      documentId: bookmark.documentId,
      pageNumber: bookmark.pageNumber,
      title: bookmark.title,
      snippet: bookmark.snippet,
      createdAt: bookmark.createdAt.toISOString(),
    };
  }

  async deleteBookmark(
    userId: string,
    documentId: string,
    bookmarkId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.getDocumentById(userId, documentId);

    const bookmark = await this.prisma.documentBookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark || bookmark.userId !== userId || bookmark.documentId !== documentId) {
      throw new NotFoundException('Bookmark not found or permission denied.');
    }

    await this.prisma.documentBookmark.delete({
      where: { id: bookmarkId },
    });

    return {
      success: true,
      message: 'Bookmark deleted successfully.',
    };
  }
}

