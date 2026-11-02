import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameConversationRequestDto {
  @ApiProperty({ description: 'New title for the study conversation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;
}
