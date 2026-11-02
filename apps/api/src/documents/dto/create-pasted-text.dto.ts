import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { CreatePastedTextDto } from '@lernivox/contracts';

export class CreatePastedTextRequestDto implements CreatePastedTextDto {
  @ApiProperty({
    example: 'Chapter 4: Cell Biology Notes',
    description: 'Title of the pasted text document',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title!: string;

  @ApiProperty({
    example: 'Mitochondria are membrane-bound cell organelles that generate most of the chemical energy...',
    description: 'Raw text content of the study material (up to 500,000 characters)',
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  @MaxLength(500000, { message: 'Content cannot exceed 500,000 characters' })
  content!: string;

  @ApiPropertyOptional({ enum: ['PERSONAL', 'GROUP'], example: 'PERSONAL' })
  workspaceType?: 'PERSONAL' | 'GROUP';
}
