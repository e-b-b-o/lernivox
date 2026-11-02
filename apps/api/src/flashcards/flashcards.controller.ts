import {
  Body,
  Controller,
  Delete,
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
import type {
  FlashcardDeckDetailDto,
  FlashcardDeckSummaryDto,
  FlashcardReviewResultDto,
  UserDto,
} from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlashcardsService } from './flashcards.service';
import {
  CreateFlashcardDeckDto,
  GenerateFlashcardsDto,
  ReviewFlashcardDto,
} from './dto/flashcards.dto';

@ApiTags('Flashcards')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post('workspaces/:workspaceId/flashcards/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate flashcards from workspace book or selected range' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async generateDeck(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: GenerateFlashcardsDto,
  ): Promise<FlashcardDeckSummaryDto> {
    return this.flashcardsService.generateDeck(user.id, workspaceId, dto);
  }

  @Post('workspaces/:workspaceId/flashcards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom flashcard deck in a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async createManualDeck(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFlashcardDeckDto,
  ): Promise<FlashcardDeckDetailDto> {
    return this.flashcardsService.createManualDeck(user.id, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/flashcards')
  @ApiOperation({ summary: 'List all flashcard decks in a workspace with student due counts' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getWorkspaceDecks(
    @CurrentUser() user: UserDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<FlashcardDeckSummaryDto[]> {
    return this.flashcardsService.getWorkspaceDecks(user.id, workspaceId);
  }

  @Get('flashcards/decks/:deckId')
  @ApiOperation({ summary: 'Get flashcard deck details with personal review scheduling' })
  @ApiParam({ name: 'deckId', description: 'Flashcard Deck ID' })
  async getDeckById(
    @CurrentUser() user: UserDto,
    @Param('deckId') deckId: string,
  ): Promise<FlashcardDeckDetailDto> {
    return this.flashcardsService.getDeckById(user.id, deckId);
  }

  @Post('flashcards/items/:cardId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an SM-2 recall rating for a flashcard' })
  @ApiParam({ name: 'cardId', description: 'Flashcard Item ID' })
  async reviewCard(
    @CurrentUser() user: UserDto,
    @Param('cardId') cardId: string,
    @Body() dto: ReviewFlashcardDto,
  ): Promise<FlashcardReviewResultDto> {
    return this.flashcardsService.reviewCard(user.id, cardId, dto.rating);
  }

  @Delete('flashcards/decks/:deckId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a flashcard deck (creator or owner only)' })
  @ApiParam({ name: 'deckId', description: 'Flashcard Deck ID' })
  async deleteDeck(
    @CurrentUser() user: UserDto,
    @Param('deckId') deckId: string,
  ): Promise<{ success: boolean }> {
    return this.flashcardsService.deleteDeck(user.id, deckId);
  }
}
