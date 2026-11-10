import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { runDatabaseMigrations } from '@lernivox/database';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('LernivoxApi');

  // Automatic production migration execution
  // Ensures all pending Prisma migrations are deployed before NestJS initializes and binds ports.
  if (process.env.NODE_ENV !== 'test' && process.env.SKIP_DB_MIGRATIONS !== 'true') {
    logger.log('Initiating database migration check before server bootstrap...');
    try {
      await runDatabaseMigrations({
        log: (msg) => logger.log(`[Migration] ${msg}`),
        warn: (msg) => logger.warn(`[Migration] ${msg}`),
        error: (msg) => logger.error(`[Migration] ${msg}`),
      });
      logger.log('Database migration step completed successfully.');
    } catch (migrationErr) {
      logger.error('FATAL: Database migration failed during API startup. Halting bootstrap.', migrationErr);
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);

  // Cookie Parser Middleware
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const configuredCors = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // Security HTTP Headers Middleware (ASVS 5.0 / OWASP compliant)
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    next();
  });

  // Versioned API prefix
  app.setGlobalPrefix('api/v1');

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - Explicit origin control; never reflect wildcard when credentials are true
  let corsOrigin: boolean | string | string[] = configuredCors
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (configuredCors === '*') {
    if (nodeEnv === 'production') {
      corsOrigin = false;
      logger.warn('CORS_ORIGIN is wildcard in production. Disabled wildcard reflection for credential security.');
    } else {
      corsOrigin = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    }
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: [
      'Content-Range',
      'Accept-Ranges',
      'Content-Length',
      'Content-Disposition',
    ],
  });

  // OpenAPI / Swagger Documentation - Conditionally enabled in non-production or when explicit
  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER', nodeEnv === 'production' ? 'false' : 'true') === 'true';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Lernivox API')
      .setDescription('Lernivox AI-Powered Study Platform REST API')
      .setVersion('1.0')
      .addTag('Health', 'System readiness and diagnostic endpoints')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Lernivox API is running on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
