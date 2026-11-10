import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UserDto } from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import {
  AcceptInvitationResponseResultDto,
  PublicInvitationDetailsResponseDto,
} from './dto/collaboration.dto';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Resolve public invitation details by secure token' })
  @ApiParam({ name: 'token', description: 'Raw invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Invitation status and workspace summary.',
    type: PublicInvitationDetailsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getInvitation(
    @Param('token') token: string,
  ): Promise<PublicInvitationDetailsResponseDto> {
    return this.workspacesService.getPublicInvitationDetails(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation and join the group workspace' })
  @ApiParam({ name: 'token', description: 'Raw invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the workspace.',
    type: AcceptInvitationResponseResultDto,
  })
  @ApiResponse({ status: 400, description: 'Expired, revoked, or already used' })
  @ApiResponse({ status: 401, description: 'Unauthorized (login required)' })
  async acceptInvitation(
    @CurrentUser() user: UserDto,
    @Param('token') token: string,
  ): Promise<AcceptInvitationResponseResultDto> {
    return this.workspacesService.acceptInvitation(user.id, token);
  }

  @Post('pending/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a pending workspace invitation from dashboard' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully accepted invitation and joined workspace.',
    type: AcceptInvitationResponseResultDto,
  })
  @ApiResponse({ status: 400, description: 'Expired, revoked, or already used' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (invitation sent to different email)' })
  async acceptPendingInvitation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<AcceptInvitationResponseResultDto> {
    return this.workspacesService.acceptPendingInvitation(user.id, id);
  }

  @Post('pending/:id/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a pending workspace invitation from dashboard' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully declined invitation.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (invitation sent to different email)' })
  async declinePendingInvitation(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.workspacesService.declinePendingInvitation(user.id, id);
  }
}
