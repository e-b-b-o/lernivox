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
  name: string;
}

export interface UpdateProfileRequestDto {
  name: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponseDto {
  success: boolean;
  message: string;
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

export type DifficultyPreference = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ExplanationLengthPreference = 'CONCISE' | 'BALANCED' | 'DETAILED';
export type TeachingStylePreference = 'SOCRATIC' | 'DIRECT' | 'ANALOGICAL';
export type ThemePreferenceType = 'SYSTEM' | 'LIGHT' | 'DARK';

export interface UserPreferencesDto {
  teachingStyle: TeachingStylePreference;
  explanationLength: ExplanationLengthPreference;
  difficulty: DifficultyPreference;
  dailyStudyTargetMinutes: number;
  studyReminders: boolean;
  reviewReminders: boolean;
  theme: ThemePreferenceType;
  updatedAt: string;
}

export interface UpdateUserPreferencesRequestDto {
  teachingStyle?: TeachingStylePreference;
  explanationLength?: ExplanationLengthPreference;
  difficulty?: DifficultyPreference;
  dailyStudyTargetMinutes?: number;
  studyReminders?: boolean;
  reviewReminders?: boolean;
  theme?: ThemePreferenceType;
}
