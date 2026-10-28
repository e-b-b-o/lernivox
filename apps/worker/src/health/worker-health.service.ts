import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerHealthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WorkerHealthService.name);

  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    this.logger.log('Lernivox background worker initialized successfully');
    this.logger.log(`Queue listener configured for Redis at ${redisHost}:${redisPort}`);
  }

  isReady(): boolean {
    return true;
  }
}
