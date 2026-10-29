import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UserDto } from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { CreatePastedTextRequestDto } from './dto/create-pasted-text.dto';
import {
  DocumentChunkResponseDto,
  DocumentResponseDto,
  DocumentUploadSuccessResponseDto,
} from './dto/document-response.dto';

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
  ): Promise<DocumentUploadSuccessResponseDto> {
    const document = await this.documentsService.uploadFile(user, file, title);
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
}
