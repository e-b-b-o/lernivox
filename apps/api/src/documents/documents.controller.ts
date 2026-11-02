import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  DocumentBookmarkDto,
  DocumentOutlineDto,
  DocumentReaderContentDto,
  DocumentReadingProgressDto,
  UserDto,
} from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { CreatePastedTextRequestDto } from './dto/create-pasted-text.dto';
import {
  DocumentChunkResponseDto,
  DocumentResponseDto,
  DocumentUploadSuccessResponseDto,
} from './dto/document-response.dto';
import {
  CreateBookmarkRequestDto,
  UpdateReadingProgressRequestDto,
} from './dto/reader.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload textbook or course material for asynchronous ingestion' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, DOCX, TXT up to 25MB)',
        },
        title: {
          type: 'string',
          description: 'Optional custom title for the study document',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and enqueued for ingestion.',
    type: DocumentUploadSuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Unsupported format or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upload(
    @CurrentUser() user: UserDto,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('workspaceType') workspaceType?: 'PERSONAL' | 'GROUP',
  ): Promise<DocumentUploadSuccessResponseDto> {
    const document = await this.documentsService.uploadFile(user, file, title, workspaceType);
    return {
      document,
      message: 'Document uploaded successfully and queued for background ingestion.',
    };
  }

  @Post('text')
  @ApiOperation({ summary: 'Submit pasted study text for asynchronous ingestion' })
  @ApiResponse({
    status: 201,
    description: 'Text notes ingested and enqueued for chunking and embedding.',
    type: DocumentUploadSuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createFromText(
    @CurrentUser() user: UserDto,
    @Body() dto: CreatePastedTextRequestDto,
  ): Promise<DocumentUploadSuccessResponseDto> {
    const document = await this.documentsService.createFromText(user, dto);
    return {
      document,
      message: 'Notes saved successfully and queued for background ingestion.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all documents belonging to current authenticated student' })
  @ApiResponse({
    status: 200,
    description: 'List of documents with active processing statuses.',
    type: [DocumentResponseDto],
  })
  async listDocuments(@CurrentUser() user: UserDto): Promise<DocumentResponseDto[]> {
    return this.documentsService.getUserDocuments(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and processing status by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document metadata and ingestion status.',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getDocumentById(user.id, id);
  }

  @Get(':id/chunks')
  @ApiOperation({ summary: 'Get extracted and indexed chunks for an ingested document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of text chunks with page numbers and embedding flags.',
    type: [DocumentChunkResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getChunks(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<DocumentChunkResponseDto[]> {
    return this.documentsService.getDocumentChunks(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete document, associated storage files, and vector chunks' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.documentsService.deleteDocument(user.id, id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Stream authenticated document file with byte-range HTTP 206 support' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Complete file binary stream' })
  @ApiResponse({ status: 206, description: 'Partial content byte-range stream' })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getFile(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Headers('range') rangeHeader: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const fileResult = await this.documentsService.getDocumentFileStream(
      user.id,
      id,
      rangeHeader,
    );

    res.setHeader('Content-Type', fileResult.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileResult.fileName)}"`,
    );

    if (fileResult.isRange && fileResult.start !== undefined && fileResult.end !== undefined) {
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.setHeader(
        'Content-Range',
        `bytes ${fileResult.start}-${fileResult.end}/${fileResult.totalSize}`,
      );
      res.setHeader('Content-Length', fileResult.chunkSize ?? fileResult.end - fileResult.start + 1);
    } else {
      res.status(HttpStatus.OK);
      res.setHeader('Content-Length', fileResult.totalSize);
    }

    fileResult.stream.pipe(res);
  }

  @Get(':id/outline')
  @ApiOperation({ summary: 'Get deterministic table of contents and chapter outline' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Outline hierarchy with starting page numbers' })
  async getOutline(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<DocumentOutlineDto> {
    return this.documentsService.getDocumentOutline(user.id, id);
  }

  @Get(':id/reader-content')
  @ApiOperation({ summary: 'Get paginated reader text and chunks for serif reading canvas' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Optional starting page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page limit (default: 50)' })
  @ApiResponse({ status: 200, description: 'Reader content structure with page numbers' })
  async getReaderContent(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<DocumentReaderContentDto> {
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.documentsService.getReaderContent(user.id, id, page, limit);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get current student reading progress for this document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Reading progress or null if unread' })
  async getProgress(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<DocumentReadingProgressDto | null> {
    return this.documentsService.getReadingProgress(user.id, id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Persist debounced reading position and zoom level' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Updated reading progress' })
  async updateProgress(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: UpdateReadingProgressRequestDto,
  ): Promise<DocumentReadingProgressDto> {
    return this.documentsService.updateReadingProgress(user.id, id, dto);
  }

  @Get(':id/bookmarks')
  @ApiOperation({ summary: 'List saved bookmarks for this document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'List of saved bookmarks' })
  async getBookmarks(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<DocumentBookmarkDto[]> {
    return this.documentsService.getBookmarks(user.id, id);
  }

  @Post(':id/bookmarks')
  @ApiOperation({ summary: 'Save a new reading bookmark' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 201, description: 'Created bookmark' })
  async createBookmark(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: CreateBookmarkRequestDto,
  ): Promise<DocumentBookmarkDto> {
    return this.documentsService.createBookmark(user.id, id, dto);
  }

  @Delete(':id/bookmarks/:bookmarkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved reading bookmark' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiParam({ name: 'bookmarkId', description: 'Bookmark UUID' })
  @ApiResponse({ status: 200, description: 'Bookmark removed successfully' })
  async deleteBookmark(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('bookmarkId') bookmarkId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.documentsService.deleteBookmark(user.id, id, bookmarkId);
  }
}

