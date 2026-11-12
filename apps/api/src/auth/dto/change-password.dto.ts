import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { ChangePasswordRequestDto } from '@lernivox/contracts';

export class ChangePasswordDto implements ChangePasswordRequestDto {
  @ApiProperty({
    example: 'OldPass123!',
    description: 'Current account password',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @ApiProperty({
    example: 'NewSecurePass456!',
    description: 'New account password (minimum 8 characters)',
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(72, { message: 'New password must not exceed 72 characters' })
  newPassword!: string;
}

