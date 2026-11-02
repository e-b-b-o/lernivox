import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  WorkspaceDto,
  WorkspaceListItemDto,
  WorkspaceMemberDto,
  WorkspaceRole,
  WorkspaceType,
  WorkspacesListResponseDto,
  ConvertWorkspaceResponseDto,
  DocumentReadingProgressDto,
} from '@lernivox/contracts';
import { DocumentResponseDto } from '../../documents/dto/document-response.dto';

export class WorkspaceMemberResponseDto implements WorkspaceMemberDto {
  @ApiProperty({ example: 'member-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiProperty({ example: 'user-uuid-1' })
  userId!: string;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'], example: 'OWNER' })
  role!: WorkspaceRole;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  joinedAt!: string;

  @ApiPropertyOptional({ example: 'Alex Mercer', nullable: true })
  userName?: string | null;

  @ApiPropertyOptional({ example: 'alex@example.com', nullable: true })
  userEmail?: string | null;
}

export class ReadingProgressSummaryDto implements DocumentReadingProgressDto {
  @ApiProperty({ example: 'prog-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'user-uuid-1' })
  userId!: string;

  @ApiProperty({ example: 'doc-uuid-1' })
  documentId!: string;

  @ApiProperty({ example: 4 })
  currentPage!: number;

  @ApiPropertyOptional({ example: 461, nullable: true })
  totalPages!: number | null;

  @ApiPropertyOptional({ example: 0.15, nullable: true })
  scrollProgress!: number | null;

  @ApiPropertyOptional({ example: 1.0, nullable: true })
  zoomLevel!: number | null;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  lastReadAt!: string;
}

export class WorkspaceResponseDto implements WorkspaceDto {
  @ApiProperty({ example: 'workspace-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'Introduction to Algorithms' })
  name!: string;

  @ApiProperty({ enum: ['PERSONAL', 'GROUP'], example: 'PERSONAL' })
  type!: WorkspaceType;

  @ApiProperty({ example: 'user-uuid-1' })
  ownerId!: string;

  @ApiProperty({ example: 'doc-uuid-1' })
  documentId!: string;

  @ApiProperty({ type: () => DocumentResponseDto })
  document!: DocumentResponseDto;

  @ApiProperty({ type: () => [WorkspaceMemberResponseDto] })
  members!: WorkspaceMemberResponseDto[];

  @ApiProperty({ enum: ['OWNER', 'MEMBER'], example: 'OWNER' })
  myRole!: WorkspaceRole;

  @ApiPropertyOptional({ type: () => ReadingProgressSummaryDto, nullable: true })
  myReadingProgress?: ReadingProgressSummaryDto | null;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  updatedAt!: string;
}

export class WorkspaceListItemResponseDto implements WorkspaceListItemDto {
  @ApiProperty({ example: 'workspace-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'Introduction to Algorithms' })
  name!: string;

  @ApiProperty({ enum: ['PERSONAL', 'GROUP'], example: 'PERSONAL' })
  type!: WorkspaceType;

  @ApiProperty({ example: 'user-uuid-1' })
  ownerId!: string;

  @ApiProperty({ example: true })
  isOwner!: boolean;

  @ApiProperty({ type: () => DocumentResponseDto })
  document!: DocumentResponseDto;

  @ApiPropertyOptional({ type: () => ReadingProgressSummaryDto, nullable: true })
  myReadingProgress?: ReadingProgressSummaryDto | null;

  @ApiProperty({ example: 1 })
  memberCount!: number;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  updatedAt!: string;
}

export class WorkspacesListResponseDtoClass implements WorkspacesListResponseDto {
  @ApiProperty({ type: () => [WorkspaceListItemResponseDto] })
  myBooks!: WorkspaceListItemResponseDto[];

  @ApiProperty({ type: () => [WorkspaceListItemResponseDto] })
  sharedWithMe!: WorkspaceListItemResponseDto[];
}

export class ConvertWorkspaceResponseDtoClass implements ConvertWorkspaceResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: () => WorkspaceResponseDto })
  workspace!: WorkspaceResponseDto;

  @ApiProperty({ example: 'Workspace converted to a group workspace.' })
  message!: string;
}

export class ResolveWorkspaceResponseDto {
  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiProperty({ type: () => WorkspaceResponseDto })
  workspace!: WorkspaceResponseDto;
}
