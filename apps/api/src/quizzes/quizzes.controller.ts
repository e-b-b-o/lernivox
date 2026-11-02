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
  QuizAttemptResultDto,
  QuizDetailDto,
  QuizSummaryDto,
  StartQuizAttemptResponseDto,
  UserDto,
} from '@lernivox/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, SubmitQuizAttemptDto } from './dto/quizzes.dto';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate/:documentId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate a chapter-grounded quiz from a document' })
  @ApiParam({ name: 'documentId', description: 'ID of the target textbook document' })
  @ApiResponse({ status: 202, description: 'Quiz generation enqueued successfully' })
  async generateQuiz(
    @CurrentUser() user: UserDto,
    @Param('documentId') documentId: string,
    @Body() dto: CreateQuizDto,
  ): Promise<QuizSummaryDto> {
    return this.quizzesService.generateQuiz(user.id, documentId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all quizzes created by the authenticated student' })
  @ApiResponse({ status: 200, description: 'List of quizzes' })
  async getUserQuizzes(@CurrentUser() user: UserDto): Promise<QuizSummaryDto[]> {
    return this.quizzesService.getUserQuizzes(user.id);
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: 'List all quizzes associated with a specific document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  async getDocumentQuizzes(
    @CurrentUser() user: UserDto,
    @Param('documentId') documentId: string,
  ): Promise<QuizSummaryDto[]> {
    return this.quizzesService.getDocumentQuizzes(user.id, documentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details and sanitized questions for taking' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async getQuizById(
    @CurrentUser() user: UserDto,
    @Param('id') quizId: string,
  ): Promise<QuizDetailDto> {
    return this.quizzesService.getQuizById(user.id, quizId);
  }

  @Post(':id/attempts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async startAttempt(
    @CurrentUser() user: UserDto,
    @Param('id') quizId: string,
  ): Promise<StartQuizAttemptResponseDto> {
    return this.quizzesService.startAttempt(user.id, quizId);
  }

  @Post('attempts/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answers for evaluation and score calculation' })
  @ApiParam({ name: 'attemptId', description: 'Quiz Attempt ID' })
  async submitAttempt(
    @CurrentUser() user: UserDto,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizAttemptDto,
  ): Promise<QuizAttemptResultDto> {
    return this.quizzesService.submitAttempt(user.id, attemptId, dto);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get detailed attempt results and textbook review' })
  @ApiParam({ name: 'attemptId', description: 'Quiz Attempt ID' })
  async getAttemptResult(
    @CurrentUser() user: UserDto,
    @Param('attemptId') attemptId: string,
  ): Promise<QuizAttemptResultDto> {
    return this.quizzesService.getAttemptResult(user.id, attemptId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a quiz and its questions' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  async deleteQuiz(
    @CurrentUser() user: UserDto,
    @Param('id') quizId: string,
  ): Promise<{ success: boolean }> {
    return this.quizzesService.deleteQuiz(user.id, quizId);
  }
}
