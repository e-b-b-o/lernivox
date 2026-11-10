import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WorkerStatusDetails {
  ready: boolean;
  uptime: number;
  lastWakeAt: string | null;
  wakeCount: number;
  redisHost: string;
  redisPort: number;
}

@Injectable()
export class WorkerHealthService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(WorkerHealthService.name);
  private ready = false;
  private lastWakeAt: string | null = null;
  private wakeCount = 0;

  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap() {
    this.ready = true;
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = Number(this.configService.get<string | number>('REDIS_PORT', 6379));

    this.logger.log('Lernivox background worker initialized successfully');
    this.logger.log(`Queue listener configured for Redis at ${redisHost}:${redisPort}`);
  }

  onApplicationShutdown(signal?: string) {
    this.ready = false;
    this.logger.log(`Worker health service shutting down (signal: ${signal || 'none'})`);
  }

  isReady(): boolean {
    return this.ready;
  }

  setReady(ready: boolean): void {
    this.ready = ready;
  }

  recordWake(): void {
    this.wakeCount += 1;
    this.lastWakeAt = new Date().toISOString();
  }

  getStatus(): WorkerStatusDetails {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = Number(this.configService.get<string | number>('REDIS_PORT', 6379));

    return {
      ready: this.ready,
      uptime: process.uptime(),
      lastWakeAt: this.lastWakeAt,
      wakeCount: this.wakeCount,
      redisHost,
      redisPort,
    };
  }
}
