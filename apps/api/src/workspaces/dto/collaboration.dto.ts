import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  AcceptInvitationResponseDto,
  CreateDiscussionMessageDto,
  CreateInvitationDto,
  CreateSharedConversationDto,
  DiscussionMessageDto,
  DiscussionMessagesListResponseDto,
  PublicInvitationDetailsDto,
  SharedConversationSnapshotDto,
  SharedConversationsListResponseDto,
  WorkspaceInvitationDto,
  WorkspaceRole,
  InvitationStatus,
} from '@lernivox/contracts';

export class CreateInvitationRequestDto implements CreateInvitationDto {
  @ApiPropertyOptional({ example: 'student@university.edu', description: 'Optional email of the invitee' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @ApiPropertyOptional({ enum: ['MEMBER', 'OWNER'], default: 'MEMBER' })
  @IsOptional()
  @IsIn(['MEMBER', 'OWNER'])
  role?: WorkspaceRole;
}

export class CreateDiscussionMessageRequestDto implements CreateDiscussionMessageDto {
  @ApiProperty({ example: 'Does anyone understand the proof in Lemma 2.3?' })
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty.' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters.' })
  content!: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @ApiPropertyOptional({ example: 'Chapter 2: Divide and Conquer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  chapter?: string;
}

export class CreateSharedConversationRequestDto implements CreateSharedConversationDto {
  @ApiProperty({ example: 'conv-uuid-1', description: 'ID of the private conversation to snapshot' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiPropertyOptional({ example: 'Explaining P vs NP Reduction' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class WorkspaceInvitationResponseDto implements WorkspaceInvitationDto {
  @ApiProperty({ example: 'inv-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiPropertyOptional({ example: 'student@university.edu', nullable: true })
  email?: string | null;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'], example: 'MEMBER' })
  role!: WorkspaceRole;

  @ApiProperty({ example: '2026-11-09T12:00:00.000Z' })
  expiresAt!: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  acceptedAt?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  revokedAt?: string | null;

  @ApiPropertyOptional({ example: 'b94e82...', description: 'Raw token returned only upon creation' })
  inviteToken?: string;

  @ApiPropertyOptional({ example: '/invite/b94e82...', description: 'Usable acceptance link' })
  inviteUrl?: string;

  @ApiPropertyOptional({ example: 'Alex Mercer', nullable: true })
  createdByName?: string | null;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  createdAt!: string;
}

export class PublicInvitationDetailsResponseDto implements PublicInvitationDetailsDto {
  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiProperty({ example: 'Introduction to Algorithms' })
  workspaceTitle!: string;

  @ApiProperty({ example: 'Alex Mercer' })
  inviterName!: string;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'], example: 'MEMBER' })
  role!: WorkspaceRole;

  @ApiProperty({ example: true })
  isValid!: boolean;

  @ApiProperty({ enum: ['VALID', 'EXPIRED', 'REVOKED', 'ACCEPTED'], example: 'VALID' })
  status!: InvitationStatus;
}

export class AcceptInvitationResponseResultDto implements AcceptInvitationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiProperty({ example: 'Introduction to Algorithms' })
  workspaceTitle!: string;

  @ApiProperty({ enum: ['OWNER', 'MEMBER'], example: 'MEMBER' })
  role!: WorkspaceRole;
}

export class DiscussionMessageResponseDto implements DiscussionMessageDto {
  @ApiProperty({ example: 'disc-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'workspace-uuid-1' })
  workspaceId!: string;

  @ApiProperty({ example: 'user-uuid-1' })
  userId!: string;

  @ApiProperty({ example: 'Alex Mercer' })
  userName!: string;

  @ApiProperty({ example: 'AM' })
  userInitials!: string;

  @ApiProperty({ example: 'Can someone clarify Lemma 2.3 on page 42?' })
  content!: string;

  @ApiPropertyOptional({ example: 42, nullable: true })
  pageNumber?: number | null;

  @ApiPropertyOptional({ example: 'Chapter 2', nullable: true })
  chapter?: string | null;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  createdAt!: string;
}

export class DiscussionMessagesListResultDto implements DiscussionMessagesListResponseDto {
  @ApiProperty({ type: [DiscussionMessageResponseDto] })
  messages!: DiscussionMessageResponseDto[];

  @ApiProperty({ example: 12 })
  total!: number;
}
