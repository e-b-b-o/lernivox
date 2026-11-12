import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { WorkerHttpService } from './server/worker-http.service';

async function bootstrap() {
  const logger = new Logger('LernivoxWorker');
  logger.log('Starting Lernivox background worker with HTTP control server...');

  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  // Ensure WorkerHttpService starts listening on its resolved HTTP control port
  const httpService = app.get(WorkerHttpService);
  await httpService.startServer();
  const port = httpService.getListeningPort();

  logger.log('Lernivox background worker is running.');
  logger.log(`Render Free Web Service HTTP control interface listening on 0.0.0.0:${port}`);
  logger.log('Endpoints: GET /healthz, GET /readyz, POST /internal/wake');
  logger.log('Waiting for BullMQ jobs...');
}

void bootstrap();
