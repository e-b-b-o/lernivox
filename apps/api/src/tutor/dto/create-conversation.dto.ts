import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationRequestDto {
  @ApiProperty({ description: 'The unique ID of the document to study' })
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @ApiPropertyOptional({ description: 'Optional conversation title' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}
