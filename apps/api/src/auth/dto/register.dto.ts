import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { RegisterRequestDto } from '@lernivox/contracts';

export class RegisterDto implements RegisterRequestDto {
  @ApiProperty({
    example: 'you@example.com',
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

  @ApiProperty({
    example: 'Alex Johnson',
    description: 'Full name of the user',
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Enter your full name to continue.' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;
}
