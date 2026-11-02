import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AcceptInvitationResponseDto,
  DiscussionMessageDto,
  DiscussionMessagesListResponseDto,
  SharedConversationSnapshotDto,
  SharedConversationsListResponseDto,
  UserDto,
  WorkspaceInvitationDto,
  WorkspaceMembersResponseDto,
} from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import {
  ConvertWorkspaceResponseDtoClass,
  ResolveWorkspaceResponseDto,
  WorkspaceResponseDto,
  WorkspacesListResponseDtoClass,
} from './dto/workspace-response.dto';
import {
  CreateDiscussionMessageRequestDto,
  CreateInvitationRequestDto,
  CreateSharedConversationRequestDto,
  DiscussionMessageResponseDto,
  DiscussionMessagesListResultDto,
  WorkspaceInvitationResponseDto,
} from './dto/collaboration.dto';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({
    summary: 'List learning workspaces grouped into My Books and Shared with Me',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspaces list with individual student reading progress.',
    type: WorkspacesListResponseDtoClass,
  })
  async listWorkspaces(
    @CurrentUser() user: UserDto,
  ): Promise<WorkspacesListResponseDtoClass> {
    return this.workspacesService.listUserWorkspaces(user.id);
  }

  @Get('by-document/:documentId')
  @ApiOperation({
    summary: 'Resolve a document UUID to its canonical persistent workspace',
  })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Resolved workspace ID and details.',
    type: ResolveWorkspaceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner or member)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getByDocumentId(
    @CurrentUser() user: UserDto,
    @Param('documentId') documentId: string,
  ): Promise<ResolveWorkspaceResponseDto> {
    return this.workspacesService.getWorkspaceByDocumentId(user.id, documentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Workspace details with attached document and reading progress.',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner or member)' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspace(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<WorkspaceResponseDto> {
    return this.workspacesService.getWorkspaceById(user.id, id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get individual workspace learning progress metrics and topic understanding matrix' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async getWorkspaceProgress(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.workspacesService.getWorkspaceProgress(user.id, id);
  }

  @Post(':id/convert-to-group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Irreversible transition: Convert a PERSONAL workspace to a collaborative GROUP workspace',
  })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Workspace successfully converted to GROUP.',
    type: ConvertWorkspaceResponseDtoClass,
  })
  @ApiResponse({ status: 403, description: 'Forbidden (not workspace owner)' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async convertToGroup(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<ConvertWorkspaceResponseDtoClass> {
    return this.workspacesService.convertToGroupWorkspace(user.id, id);
  }

  // =========================================================================
  // MEMBERSHIP ENDPOINTS
  // =========================================================================

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members of a group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async getMembers(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<WorkspaceMembersResponseDto> {
    return this.workspacesService.getWorkspaceMembers(user.id, id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the workspace (owner only)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  async removeMember(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspacesService.removeMember(user.id, id, memberUserId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a group workspace (members only)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async leaveWorkspace(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspacesService.leaveWorkspace(user.id, id);
  }

  // =========================================================================
  // INVITATIONS ENDPOINTS
  // =========================================================================

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Create a secure invitation link for a group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({
    status: 201,
    description: 'Invitation created with secure single-use/expiring link.',
    type: WorkspaceInvitationResponseDto,
  })
  async createInvitation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: CreateInvitationRequestDto,
  ): Promise<WorkspaceInvitationDto> {
    return this.workspacesService.createInvitation(user.id, id, dto);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List active invitations for a workspace (owner only)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async listInvitations(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<WorkspaceInvitationDto[]> {
    return this.workspacesService.listInvitations(user.id, id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke an invitation link (owner only)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID' })
  async revokeInvitation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspacesService.revokeInvitation(user.id, id, invitationId);
  }

  // =========================================================================
  // GROUP DISCUSSIONS (People <-> People)
  // =========================================================================

  @Get(':id/discussions')
  @ApiOperation({ summary: 'List group discussion messages in a group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'before', required: false, description: 'ISO timestamp cursor' })
  @ApiResponse({
    status: 200,
    description: 'Discussion messages history.',
    type: DiscussionMessagesListResultDto,
  })
  async getDiscussions(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ): Promise<DiscussionMessagesListResponseDto> {
    return this.workspacesService.getDiscussionMessages(
      user.id,
      id,
      limit ? Number(limit) : 50,
      before,
    );
  }

  @Post(':id/discussions')
  @ApiOperation({ summary: 'Post a discussion message in a group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({
    status: 201,
    description: 'Message posted to group discussion.',
    type: DiscussionMessageResponseDto,
  })
  async postDiscussion(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: CreateDiscussionMessageRequestDto,
  ): Promise<DiscussionMessageDto> {
    return this.workspacesService.createDiscussionMessage(user.id, id, dto);
  }

  // =========================================================================
  // SHARED CONVERSATIONS (AI Snapshots to Group)
  // =========================================================================

  @Post(':id/shared-conversations')
  @ApiOperation({ summary: 'Share a private AI conversation with the group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async shareConversation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() dto: CreateSharedConversationRequestDto,
  ): Promise<SharedConversationSnapshotDto> {
    return this.workspacesService.createSharedConversation(user.id, id, dto);
  }

  @Get(':id/shared-conversations')
  @ApiOperation({ summary: 'List shared conversation snapshots in a group workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  async listSharedConversations(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<SharedConversationsListResponseDto> {
    return this.workspacesService.listSharedConversations(user.id, id);
  }

  @Delete(':id/shared-conversations/:shareId')
  @ApiOperation({ summary: 'Revoke a shared conversation snapshot' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'shareId', description: 'Shared snapshot UUID' })
  async revokeSharedConversation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('shareId') shareId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspacesService.revokeSharedConversation(user.id, id, shareId);
  }
}
