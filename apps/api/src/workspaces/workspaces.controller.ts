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
  ConvertWorkspaceResponseDtoClass,
  ResolveWorkspaceResponseDto,
  WorkspaceResponseDto,
  WorkspacesListResponseDtoClass,
} from './dto/workspace-response.dto';

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
}
