import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendTutorMessageRequestDto {
  @ApiProperty({ description: 'Student question or inquiry' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @ApiPropertyOptional({ description: 'Allow expanding explanation with general knowledge if textbook is insufficient' })
  @IsOptional()
  @IsBoolean()
  allowGeneralKnowledge?: boolean;
}
