import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('LernivoxWorker');
  logger.log('Starting Lernivox background worker...');

  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  logger.log('Lernivox background worker is running. Waiting for jobs...');
}

void bootstrap();
