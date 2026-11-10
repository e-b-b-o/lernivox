import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'lernivox-dev-jwt-secret-minimum-32-chars-long';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsNumber()
  @IsOptional()
  REFRESH_TOKEN_EXPIRES_IN_DAYS: number = 7;

  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL: string = 'http://localhost:4000/api/v1/auth/google/callback';

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  STORAGE_DRIVER: string = 'local';

  @IsString()
  @IsOptional()
  STORAGE_BASE_DIR?: string;

  @IsNumber()
  @IsOptional()
  MAX_UPLOAD_SIZE_BYTES: number = 1048576; // 1 MiB (1,048,576 bytes)
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  if (validatedConfig.NODE_ENV === Environment.Production) {
    if (
      !validatedConfig.JWT_SECRET ||
      validatedConfig.JWT_SECRET === 'lernivox-dev-jwt-secret-minimum-32-chars-long' ||
      validatedConfig.JWT_SECRET.length < 32
    ) {
      throw new Error(
        'Production security violation: JWT_SECRET must be set to a secure, unpredictable random string at least 32 characters long in production.',
      );
    }
  }

  return validatedConfig;
}
