import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CreateQuizRequestDto,
  QuestionType,
  QuizDifficulty,
  SubmitAnswerItemDto,
  SubmitQuizAttemptRequestDto,
} from '@lernivox/contracts';

export class CreateQuizDto implements CreateQuizRequestDto {
  @ApiPropertyOptional({
    example: 'Chapter 2: The Hellenistic Context Quiz',
    description: 'Custom quiz title (defaults to document title + chapter)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Chapter 2: The Hellenistic Context',
    description: 'Specific chapter or section heading to target',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceChapter?: string;

  @ApiPropertyOptional({
    example: 'sec-123-abc',
    description: 'Optional document section identifier',
  })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({
    example: 'ws-uuid-123',
    description: 'Workspace ID to attach the quiz to',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Book range selection configuration (from, to, pages, or sections)',
  })
  @IsOptional()
  rangeScope?: any;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of questions to generate (between 3 and 20)',
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  numQuestions?: number;

  @ApiPropertyOptional({
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    example: 'INTERMEDIATE',
    default: 'INTERMEDIATE',
  })
  @IsOptional()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: QuizDifficulty;

  @ApiPropertyOptional({
    type: [String],
    example: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'SHORT_ANSWER'],
  })
  @IsOptional()
  @IsArray()
  questionTypes?: QuestionType[];
}

export class SubmitAnswerItem implements SubmitAnswerItemDto {
  @ApiProperty({ example: 'question-uuid-123' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({ example: 'option-uuid-456' })
  @IsOptional()
  @IsString()
  selectedOptionId?: string | null;

  @ApiPropertyOptional({ example: 'Memory Management Unit' })
  @IsOptional()
  @IsString()
  submittedAnswer?: string | null;
}

export class SubmitQuizAttemptDto implements SubmitQuizAttemptRequestDto {
  @ApiProperty({ type: [SubmitAnswerItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerItem)
  answers!: SubmitAnswerItem[];
}
