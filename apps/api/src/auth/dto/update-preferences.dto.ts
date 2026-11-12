import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type {
  DifficultyPreference,
  ExplanationLengthPreference,
  TeachingStylePreference,
  ThemePreferenceType,
  UpdateUserPreferencesRequestDto,
} from '@lernivox/contracts';

export class UpdatePreferencesDto implements UpdateUserPreferencesRequestDto {
  @ApiPropertyOptional({
    enum: ['SOCRATIC', 'DIRECT', 'ANALOGICAL'],
    description: 'Preferred AI tutor teaching style',
  })
  @IsOptional()
  @IsIn(['SOCRATIC', 'DIRECT', 'ANALOGICAL'], {
    message: 'Teaching style must be SOCRATIC, DIRECT, or ANALOGICAL',
  })
  teachingStyle?: TeachingStylePreference;

  @ApiPropertyOptional({
    enum: ['CONCISE', 'BALANCED', 'DETAILED'],
    description: 'Preferred AI explanation depth',
  })
  @IsOptional()
  @IsIn(['CONCISE', 'BALANCED', 'DETAILED'], {
    message: 'Explanation length must be CONCISE, BALANCED, or DETAILED',
  })
  explanationLength?: ExplanationLengthPreference;

  @ApiPropertyOptional({
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    description: 'Preferred assessment difficulty level',
  })
  @IsOptional()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
    message: 'Difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED',
  })
  difficulty?: DifficultyPreference;

  @ApiPropertyOptional({
    example: 30,
    description: 'Daily study target in minutes (5 to 480)',
  })
  @IsOptional()
  @IsInt({ message: 'Daily study target must be a whole number of minutes' })
  @Min(5, { message: 'Daily study target must be at least 5 minutes' })
  @Max(480, { message: 'Daily study target cannot exceed 480 minutes' })
  dailyStudyTargetMinutes?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable daily study prompt highlights',
  })
  @IsOptional()
  @IsBoolean({ message: 'studyReminders must be a boolean' })
  studyReminders?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Enable spaced repetition review alerts',
  })
  @IsOptional()
  @IsBoolean({ message: 'reviewReminders must be a boolean' })
  reviewReminders?: boolean;

  @ApiPropertyOptional({
    enum: ['SYSTEM', 'LIGHT', 'DARK'],
    description: 'Interface theme preference',
  })
  @IsOptional()
  @IsIn(['SYSTEM', 'LIGHT', 'DARK'], {
    message: 'Theme must be SYSTEM, LIGHT, or DARK',
  })
  theme?: ThemePreferenceType;
}

