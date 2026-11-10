import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuthResponseDto, LogoutResponseDto, UserDto } from '@lernivox/contracts';

export class UserResponseDto implements UserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'you@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Alex Johnson', nullable: true })
  name!: string | null;

  @ApiProperty({ enum: ['USER', 'ADMIN'], example: 'USER' })
  role!: 'USER' | 'ADMIN';

  @ApiProperty({ enum: ['FREE', 'PRO'], example: 'FREE' })
  planTier!: 'FREE' | 'PRO';

  @ApiProperty({ example: '2026-10-29T00:00:00.000Z' })
  createdAt!: string;
}

export class AuthResponseSuccessDto implements AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT access token (15m)',
  })
  accessToken!: string;
}

export class LogoutSuccessDto implements LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}
