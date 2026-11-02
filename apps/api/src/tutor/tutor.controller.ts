import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import type { UserDto } from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationRequestDto } from './dto/create-conversation.dto';
import { RenameConversationRequestDto } from './dto/rename-conversation.dto';
import { SendTutorMessageRequestDto } from './dto/send-message.dto';
import {
  ConversationDetailResponseDto,
  ConversationMessageResponseDto,
  ConversationSummaryResponseDto,
  TutorChunkDetailResponseDto,
} from './dto/tutor-response.dto';
import { TutorService } from './tutor.service';

@ApiTags('Tutor')
@Controller('tutor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new study conversation for an accessible document' })
  @ApiResponse({ status: 201, type: ConversationSummaryResponseDto })
  async createConversation(
    @CurrentUser() user: UserDto,
    @Body() dto: CreateConversationRequestDto,
  ): Promise<ConversationSummaryResponseDto> {
    return this.tutorService.createConversation(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all study conversations for the authenticated student' })
  @ApiQuery({ name: 'documentId', required: false, description: 'Filter by document ID' })
  @ApiResponse({ status: 200, type: [ConversationSummaryResponseDto] })
  async listConversations(
    @CurrentUser() user: UserDto,
    @Query('documentId') documentId?: string,
  ): Promise<ConversationSummaryResponseDto[]> {
    return this.tutorService.listConversations(user.id, documentId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Retrieve full message history and citations for a study conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, type: ConversationDetailResponseDto })
  async getConversation(
    @CurrentUser() user: UserDto,
    @Param('id') conversationId: string,
  ): Promise<ConversationDetailResponseDto> {
    return this.tutorService.getConversation(user.id, conversationId);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Rename a study conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, type: ConversationSummaryResponseDto })
  async renameConversation(
    @CurrentUser() user: UserDto,
    @Param('id') conversationId: string,
    @Body() dto: RenameConversationRequestDto,
  ): Promise<ConversationSummaryResponseDto> {
    return this.tutorService.renameConversation(user.id, conversationId, dto.title);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a study conversation and its history' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, schema: { properties: { success: { type: 'boolean' } } } })
  async deleteConversation(
    @CurrentUser() user: UserDto,
    @Param('id') conversationId: string,
  ): Promise<{ success: boolean }> {
    return this.tutorService.deleteConversation(user.id, conversationId);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a student question to the grounded AI tutor and receive citations',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, type: ConversationMessageResponseDto })
  async sendMessage(
    @CurrentUser() user: UserDto,
    @Param('id') conversationId: string,
    @Body() dto: SendTutorMessageRequestDto,
  ): Promise<ConversationMessageResponseDto> {
    return this.tutorService.sendMessage(user.id, conversationId, dto);
  }

  @Get('chunks/:chunkId')
  @ApiOperation({
    summary: 'Retrieve verified chunk passage details for citation inspection',
  })
  @ApiParam({ name: 'chunkId', description: 'Document chunk ID' })
  @ApiResponse({ status: 200, type: TutorChunkDetailResponseDto })
  async getChunkDetail(
    @CurrentUser() user: UserDto,
    @Param('chunkId') chunkId: string,
  ): Promise<TutorChunkDetailResponseDto> {
    return this.tutorService.getChunkDetail(user.id, chunkId);
  }
}
