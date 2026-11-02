import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
  CreateFlashcardDeckDto as ICreateDeck,
  GenerateFlashcardsRequestDto,
  ReviewFlashcardDto as IReview,
  FlashcardRating,
} from '@lernivox/contracts';

export class CardItemInput {
  @ApiProperty({ example: 'What is a system call?' })
  @IsString()
  @IsNotEmpty()
  front!: string;

  @ApiProperty({ example: 'A mechanism used by programs to request a service from the operating system kernel.' })
  @IsString()
  @IsNotEmpty()
  back!: string;

  @ApiPropertyOptional({ example: 'Kernel request mechanism' })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  pageNumber?: number;

  @ApiPropertyOptional({ example: 'Chapter 2' })
  @IsOptional()
  @IsString()
  chapter?: string;

  @ApiPropertyOptional({ example: 'chunk-uuid-789' })
  @IsOptional()
  @IsString()
  sourceChunkId?: string;
}

export class CreateFlashcardDeckDto implements ICreateDeck {
  @ApiProperty({ example: 'ws-uuid-123' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ example: 'doc-uuid-456' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiProperty({ example: 'Operating Systems — Key Terms' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ example: 'Essential terminology for midterm review' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Book range selection configuration' })
  @IsOptional()
  sourceRange?: any;

  @ApiPropertyOptional({ type: [CardItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardItemInput)
  cards?: CardItemInput[];
}

export class GenerateFlashcardsDto implements GenerateFlashcardsRequestDto {
  @ApiProperty({ example: 'ws-uuid-123' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ example: 'doc-uuid-456' })
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional({ example: 'Chapter 2 Flashcards' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Book range selection configuration' })
  @IsOptional()
  rangeScope?: any;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(25)
  cardCount?: number;
}

export class ReviewFlashcardDto implements IReview {
  @ApiProperty({
    example: 3,
    description: '1: Again (failed), 2: Hard (struggled), 3: Good (recalled), 4: Easy (effortless)',
    enum: [1, 2, 3, 4],
  })
  @IsInt()
  @IsIn([1, 2, 3, 4])
  rating!: FlashcardRating;
}
