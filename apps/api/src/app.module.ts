import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { validate } from './config/env.validation';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';
import { TutorModule } from './tutor/tutor.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { LearningPlansModule } from './learning-plans/learning-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute default across endpoints
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    DocumentsModule,
    WorkspacesModule,
    TutorModule,
    QuizzesModule,
    FlashcardsModule,
    LearningPlansModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
