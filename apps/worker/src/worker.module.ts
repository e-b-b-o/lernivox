import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@lernivox/contracts';
import { DocumentIngestionProcessor } from './processors/document-ingestion.processor';
import { WorkerHealthService } from './health/worker-health.service';
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
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QueueName.DOCUMENT_INGESTION,
    }),
    PrismaModule,
    StorageModule,
  ],
  providers: [DocumentIngestionProcessor, WorkerHealthService],
})
export class WorkerModule {}
