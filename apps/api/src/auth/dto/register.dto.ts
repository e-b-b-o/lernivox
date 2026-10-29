import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { RegisterRequestDto } from '@lernivox/contracts';

export class RegisterDto implements RegisterRequestDto {
  @ApiProperty({
    example: 'student@university.edu',
    description: 'Valid, normalized email address',
  })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Account password (minimum 8 characters)',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  password!: string;

  @ApiPropertyOptional({
    example: 'Alex Johnson',
    description: 'Display name of the user',
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;
}
