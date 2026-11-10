import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import type {
  LearningPlanDto,
  StudySessionDto,
  PlanOfferDto,
  LearningPlanPreviewDto,
  UserDto,
} from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningPlansService } from './learning-plans.service';
import {
  CreatePlanPreviewRequestDto,
  AcceptPlanRequestDto,
  UpdateSessionRequestDto,
  AdaptPlanRequestDto,
  UpdatePlanLifecycleRequestDto,
} from './dto/learning-plans.dto';

@ApiTags('Learning Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/learning-plan')
export class LearningPlansController {
  constructor(private readonly learningPlansService: LearningPlansService) {}

  @Get('offer')
  @ApiOperation({ summary: 'Check whether an adaptive study plan should be contextually offered' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Offer status and recommendations' })
  async getPlanOffer(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<PlanOfferDto> {
    return this.learningPlansService.getPlanOffer(user.id, workspaceId);
  }

  @Post('offer/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss the contextual tutor plan offer' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async dismissPlanOffer(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ success: boolean }> {
    return this.learningPlansService.dismissPlanOffer(user.id, workspaceId);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a grounded study plan preview before acceptance' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Grounded plan preview' })
  async generatePreview(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreatePlanPreviewRequestDto,
  ): Promise<LearningPlanPreviewDto> {
    return this.learningPlansService.generatePreview(user.id, workspaceId, dto);
  }

  @Post('')
  @ApiOperation({ summary: 'Accept and activate a grounded study plan' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Created active study plan' })
  async createPlan(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AcceptPlanRequestDto,
  ): Promise<LearningPlanDto> {
    return this.learningPlansService.createPlan(user.id, workspaceId, dto);
  }

  @Get('')
  @ApiOperation({ summary: 'Get active study plan for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Active study plan or null' })
  async getActivePlan(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<LearningPlanDto | null> {
    return this.learningPlansService.getActivePlan(user.id, workspaceId);
  }

  @Get('next-session')
  @ApiOperation({ summary: 'Get the immediate next actionable study session' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Next study session or null' })
  async getNextSession(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<StudySessionDto | null> {
    return this.learningPlansService.getNextSession(user.id, workspaceId);
  }

  @Patch('sessions/:sessionId')
  @ApiOperation({ summary: 'Update session status or toggle activity completion' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'sessionId', description: 'Study Schedule Item ID' })
  @ApiResponse({ status: 200, description: 'Updated study plan' })
  async updateSession(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionRequestDto,
  ): Promise<LearningPlanDto> {
    return this.learningPlansService.updateSession(user.id, workspaceId, sessionId, dto);
  }

  @Post('adapt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adapt upcoming sessions based on performance evidence' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Adapted study plan' })
  async adaptPlan(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AdaptPlanRequestDto,
  ): Promise<LearningPlanDto> {
    return this.learningPlansService.adaptPlan(user.id, workspaceId, dto);
  }

  @Patch('lifecycle')
  @ApiOperation({ summary: 'Pause, resume, or archive the study plan' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Updated study plan' })
  async updateLifecycle(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdatePlanLifecycleRequestDto,
  ): Promise<LearningPlanDto> {
    return this.learningPlansService.updateLifecycle(user.id, workspaceId, dto);
  }
}

