import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@lernivox/contracts';

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
  private lastErrorLogAt = 0;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @InjectQueue(QueueName.DOCUMENT_INGESTION) private readonly ingestionQueue?: Queue,
  ) {}

  async onApplicationBootstrap() {
    const status = this.getStatus();
    this.logger.log(`Queue listener configured for Redis at ${status.redisHost}:${status.redisPort}`);

    if (!this.ingestionQueue) {
      // Standalone/unit test fallback
      this.ready = true;
      this.logger.log('Lernivox background worker initialized successfully');
      return;
    }

    try {
      const backend = this.ingestionQueue.getBackend();
      const connection = backend.connection;
      const client = await connection.client;
      this.ready = connection.status === 'ready' || client.status === 'ready';

      client.on('ready', () => {
        if (!this.ready) {
          this.ready = true;
          this.logger.log(`Redis connection established (${status.redisHost}:${status.redisPort}). Worker is ready.`);
        }
      });

      client.on('close', () => {
        if (this.ready) {
          this.ready = false;
          this.logger.warn(`Redis connection closed (${status.redisHost}:${status.redisPort}). Readiness set to false.`);
        }
      });

      client.on('error', (err: Error) => {
        this.ready = false;
        const now = Date.now();
        if (now - this.lastErrorLogAt > 15000) {
          this.lastErrorLogAt = now;
          this.logger.warn(
            `Redis connection unavailable (${status.redisHost}:${status.redisPort}): ${err.message}`,
          );
        }
      });

      this.ingestionQueue
        .waitUntilReady()
        .then(() => {
          if (!this.ready) {
            this.ready = true;
            this.logger.log(`Redis connection established (${status.redisHost}:${status.redisPort}). Worker is ready.`);
          }
        })
        .catch((err: Error) => {
          this.ready = false;
          const now = Date.now();
          if (now - this.lastErrorLogAt > 15000) {
            this.lastErrorLogAt = now;
            this.logger.warn(
              `Initial Redis connection pending (${status.redisHost}:${status.redisPort}): ${err.message}`,
            );
          }
        });

      this.logger.log('Lernivox background worker initialized');
    } catch (err: unknown) {
      this.ready = false;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Worker initialized with Redis connection unavailable: ${msg}`);
    }
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
    let redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    let redisPort = Number(this.configService.get<string | number>('REDIS_PORT', 6379));

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        const parsed = new URL(redisUrl);
        redisHost = parsed.hostname;
        redisPort = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'rediss:' ? 6380 : 6379;
      } catch {
        // fallback to discrete host/port
      }
    }

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
