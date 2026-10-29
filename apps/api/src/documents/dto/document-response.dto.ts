import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  DocumentChunkDto,
  DocumentDto,
  DocumentProcessingStatus,
  DocumentUploadResponseDto,
} from '@lernivox/contracts';

export class DocumentResponseDto implements DocumentDto {
  @ApiProperty({ example: 'b94e337f-5d1b-4158-912a-6ff1495c2ec8' })
  id!: string;

  @ApiProperty({ example: 'user-uuid-123' })
  ownerId!: string;

  @ApiProperty({ example: 'Campbell Biology (12th Edition)' })
  title!: string;

  @ApiPropertyOptional({ example: 'campbell_biology.pdf', nullable: true })
  fileName!: string | null;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 1542000 })
  sizeBytes!: number;

  @ApiProperty({ enum: ['LOCAL', 'CLOUDINARY', 'S3'], example: 'LOCAL' })
  storageProvider!: 'LOCAL' | 'CLOUDINARY' | 'S3';

  @ApiProperty({ enum: ['PRIVATE', 'SHARED', 'COURSE_ONLY'], example: 'PRIVATE' })
  visibility!: 'PRIVATE' | 'SHARED' | 'COURSE_ONLY';

  @ApiProperty({
    enum: [
      'UPLOADED',
      'PROCESSING',
      'EXTRACTING',
      'CHUNKING',
      'EMBEDDING',
      'READY',
      'FAILED',
    ],
    example: 'READY',
  })
  status!: DocumentProcessingStatus;

  @ApiPropertyOptional({ example: null, nullable: true })
  errorCode!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  errorMessage!: string | null;

  @ApiPropertyOptional({ example: 42, nullable: true })
  pageCount!: number | null;

  @ApiPropertyOptional({ example: 12500, nullable: true })
  totalTokens!: number | null;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', nullable: true })
  processingStartedAt!: string | null;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:15.000Z', nullable: true })
  processingCompletedAt!: string | null;

  @ApiProperty({ example: '2026-10-29T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-29T00:00:15.000Z' })
  updatedAt!: string;
}

export class DocumentChunkResponseDto implements DocumentChunkDto {
  @ApiProperty({ example: 'chunk-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'b94e337f-5d1b-4158-912a-6ff1495c2ec8' })
  documentId!: string;

  @ApiProperty({ example: 0 })
  chunkIndex!: number;

  @ApiProperty({ example: 'Chapter 1: The Chemical Context of Life...' })
  content!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  pageNumber!: number | null;

  @ApiPropertyOptional({ example: 'Chapter 1', nullable: true })
  chapter!: string | null;

  @ApiPropertyOptional({ example: 'Chemical Bonding', nullable: true })
  sectionTitle!: string | null;

  @ApiPropertyOptional({ example: 180, nullable: true })
  tokenCount!: number | null;

  @ApiProperty({ example: true })
  hasEmbedding!: boolean;

  @ApiProperty({ example: '2026-10-29T00:00:10.000Z' })
  createdAt!: string;
}

export class DocumentUploadSuccessResponseDto implements DocumentUploadResponseDto {
  @ApiProperty({ type: DocumentResponseDto })
  document!: DocumentResponseDto;

  @ApiProperty({ example: 'Document uploaded successfully and queued for background ingestion.' })
  message!: string;
}
