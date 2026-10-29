/**
 * Authentication and User Contracts for Lernivox
 */

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  planTier: 'FREE' | 'PRO';
  createdAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LogoutResponseDto {
  success: boolean;
  message: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
}
