import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { UpdateProfileRequestDto } from '@lernivox/contracts';

export class UpdateProfileDto implements UpdateProfileRequestDto {
  @ApiProperty({
    example: 'Alex Johnson',
    description: 'Updated full name of the user',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;
}

