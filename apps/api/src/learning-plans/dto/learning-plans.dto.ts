import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CreatePlanPreviewDto,
  AcceptPlanDto,
  UpdateSessionDto,
  AdaptPlanDto,
  UpdatePlanLifecycleDto,
  PlanPreferencesDto,
  StudySessionPreviewDto,
  PlanLifecycleStatus,
  SessionStatus,
  QuizRangeScopeDto,
} from '@lernivox/contracts';

export class CreatePlanPreviewRequestDto implements CreatePlanPreviewDto {
  @ApiProperty({ description: 'Primary learning goal or target', example: 'Prepare for Midterm Exam' })
  @IsString()
  @IsNotEmpty()
  goal!: string;

  @ApiProperty({ description: 'Planned study days per week (1-7)', example: 3 })
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek!: number;

  @ApiProperty({ description: 'Target minutes per session (15-120)', example: 30 })
  @IsInt()
  @Min(15)
  @Max(120)
  minutesPerSession!: number;

  @ApiPropertyOptional({ description: 'Target outcome description', example: 'Achieve 85%+ score on algorithms quizzes' })
  @IsOptional()
  @IsString()
  targetOutcome?: string;

  @ApiPropertyOptional({ description: 'Target exam or deadline date (ISO string)', example: '2026-12-15' })
  @IsOptional()
  @IsString()
  targetExamDate?: string;

  @ApiPropertyOptional({ description: 'Optional book range scope for bounding study plan' })
  @IsOptional()
  @IsObject()
  rangeScope?: QuizRangeScopeDto;
}

export class AcceptPlanRequestDto implements AcceptPlanDto {
  @ApiProperty({ description: 'Custom title for the study plan', example: 'Introduction to Algorithms — Midterm Prep' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Primary learning goal', example: 'Prepare for Midterm Exam' })
  @IsString()
  @IsNotEmpty()
  goal!: string;

  @ApiProperty({ description: 'Study preferences' })
  @IsDefined()
  @IsObject()
  preferences!: PlanPreferencesDto;

  @ApiProperty({ description: 'List of accepted preview sessions' })
  @IsDefined()
  @IsArray()
  sessions!: StudySessionPreviewDto[];

  @ApiPropertyOptional({ description: 'Target exam date' })
  @IsOptional()
  @IsString()
  targetExamDate?: string;
}

export class UpdateSessionRequestDto implements UpdateSessionDto {
  @ApiPropertyOptional({ description: 'Updated session status', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] })
  @IsOptional()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'])
  status?: SessionStatus;

  @ApiPropertyOptional({ description: 'Activity ID to toggle completion' })
  @IsOptional()
  @IsString()
  activityId?: string;

  @ApiPropertyOptional({ description: 'Whether the activity was completed' })
  @IsOptional()
  @IsBoolean()
  activityCompleted?: boolean;
}

export class AdaptPlanRequestDto implements AdaptPlanDto {
  @ApiPropertyOptional({ description: 'Trigger type', enum: ['AUTO', 'MANUAL'] })
  @IsOptional()
  @IsEnum(['AUTO', 'MANUAL'])
  trigger?: 'AUTO' | 'MANUAL';

  @ApiPropertyOptional({ description: 'Specific focus topics to prioritize' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusTopics?: string[];
}

export class UpdatePlanLifecycleRequestDto implements UpdatePlanLifecycleDto {
  @ApiProperty({ description: 'Updated lifecycle status', enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] })
  @IsEnum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
  status!: PlanLifecycleStatus;
}

