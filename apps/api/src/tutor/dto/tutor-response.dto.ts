import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageCitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiPropertyOptional()
  chunkId?: string | null;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  quoteSnippet!: string;

  @ApiPropertyOptional()
  pageNumber?: number | null;

  @ApiPropertyOptional()
  chapter?: string | null;

  @ApiPropertyOptional()
  relevanceScore?: number | null;
}

export class ConversationMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT', 'SYSTEM'] })
  sender!: 'USER' | 'ASSISTANT' | 'SYSTEM';

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  tokenCount?: number | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ type: [MessageCitationResponseDto] })
  citations!: MessageCitationResponseDto[];

  @ApiProperty()
  createdAt!: string;
}

export class ConversationSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  documentId?: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  messageCount!: number;

  @ApiPropertyOptional()
  lastMessagePreview?: string;
}

export class ConversationDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  documentId?: string | null;

  @ApiPropertyOptional()
  documentTitle?: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [ConversationMessageResponseDto] })
  messages!: ConversationMessageResponseDto[];
}

export class TutorChunkDetailResponseDto {
  @ApiProperty()
  chunkId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  documentTitle!: string;

  @ApiProperty()
  chunkIndex!: number;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  pageNumber?: number | null;

  @ApiPropertyOptional()
  chapter?: string | null;

  @ApiPropertyOptional()
  sectionTitle?: string | null;
}
