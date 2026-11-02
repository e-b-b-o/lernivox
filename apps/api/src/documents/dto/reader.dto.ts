import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReadingProgressRequestDto {
  @ApiProperty({ description: 'Current active page number (1-based)', example: 14 })
  @IsInt()
  @Min(1)
  currentPage!: number;

  @ApiPropertyOptional({ description: 'Total pages in document', example: 461 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @ApiPropertyOptional({ description: 'Normalized vertical scroll position (0 to 1)', example: 0.45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scrollProgress?: number;

  @ApiPropertyOptional({ description: 'Viewer zoom multiplier', example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3.0)
  zoomLevel?: number;
}

export class CreateBookmarkRequestDto {
  @ApiProperty({ description: 'Page number for the bookmark', example: 91 })
  @IsInt()
  @Min(1)
  pageNumber!: number;

  @ApiPropertyOptional({ description: 'Optional user label for the bookmark', example: 'Gospel of Mark overview' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Text excerpt at bookmark position', example: 'The Gospel of Mark is characterized by...' })
  @IsOptional()
  @IsString()
  snippet?: string;
}
