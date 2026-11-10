import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@lernivox/contracts';
import { DocumentIngestionProcessor } from './processors/document-ingestion.processor';
import { AiOrchestrationProcessor } from './processors/ai-orchestration.processor';
import { QuizGenerationProcessor } from './processors/quiz-generation.processor';
import { FlashcardGenerationProcessor } from './processors/flashcard-generation.processor';
import { WorkerHealthService } from './health/worker-health.service';
import { WorkerHttpService } from './server/worker-http.service';
import { buildRedisConnectionOptions } from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: buildRedisConnectionOptions(configService),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QueueName.DOCUMENT_INGESTION,
    }),
    BullModule.registerQueue({
      name: QueueName.AI_ORCHESTRATION,
    }),
    PrismaModule,
    StorageModule,
  ],
  providers: [
    DocumentIngestionProcessor,
    AiOrchestrationProcessor,
    QuizGenerationProcessor,
    FlashcardGenerationProcessor,
    WorkerHealthService,
    WorkerHttpService,
  ],
  exports: [WorkerHealthService, WorkerHttpService],
})
export class WorkerModule {}
