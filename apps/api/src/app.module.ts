import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { WorkerWakeModule } from './common/worker-wake/worker-wake.module';
import { validate } from './config/env.validation';
import { buildRedisConnectionOptions } from './config/redis.config';
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
        connection: buildRedisConnectionOptions(configService),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    WorkerWakeModule,
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
