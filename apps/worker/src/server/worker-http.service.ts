import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as crypto from 'crypto';
import { WorkerHealthService } from '../health/worker-health.service';

@Injectable()
export class WorkerHttpService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(WorkerHttpService.name);
  private server: http.Server | null = null;
  private isListening = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: WorkerHealthService,
  ) {}

  async onApplicationBootstrap() {
    await this.startServer();
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Worker HTTP server shutting down (signal: ${signal || 'none'})`);
    await this.stopServer();
  }

  public startServer(): Promise<void> {
    if (this.isListening && this.server) {
      return Promise.resolve();
    }

    const port = Number(this.configService.get<string | number>('PORT', 4001));
    const host = '0.0.0.0';

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        this.logger.error(`Worker HTTP server error: ${err.message}`, err.stack);
        reject(err);
      });

      this.server.listen(port, host, () => {
        this.isListening = true;
        this.logger.log(`Worker HTTP control server listening on http://${host}:${port}`);
        resolve();
      });
    });
  }

  public stopServer(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server || !this.isListening) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          this.logger.warn(`Error closing Worker HTTP server: ${err.message}`);
        } else {
          this.logger.log('Worker HTTP server closed cleanly.');
        }
        this.isListening = false;
        this.server = null;
        resolve();
      });
    });
  }

  public handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const hostHeader = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${hostHeader}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method || 'GET').toUpperCase();

    // 1. Health liveness probe for Render health checker
    if (pathname === '/healthz' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'worker',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    // 2. Readiness probe for deployment and orchestration checks
    if (pathname === '/readyz' && method === 'GET') {
      const isReady = this.healthService.isReady();
      const statusCode = isReady ? 200 : 503;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: isReady ? 'ready' : 'not_ready',
          service: 'worker',
          uptime: process.uptime(),
          details: this.healthService.getStatus(),
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    // 3. Authenticated wake endpoint
    if (pathname === '/internal/wake') {
      if (method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
      }

      if (!this.verifyWakeSecret(req)) {
        this.logger.warn('Unauthorized worker wake attempt rejected.');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      this.healthService.recordWake();
      this.logger.log('Worker wake signal verified and acknowledged successfully.');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'awake',
          service: 'worker',
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    // 4. Default 404 for unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }

  private verifyWakeSecret(req: http.IncomingMessage): boolean {
    const configuredSecret = this.configService.get<string>('WORKER_WAKE_SECRET');
    if (!configuredSecret) {
      this.logger.warn(
        'WORKER_WAKE_SECRET is not configured in worker environment. Rejecting wake request for safety.',
      );
      return false;
    }

    const headerSecret =
      (req.headers['x-worker-wake-secret'] as string) ||
      this.extractBearerToken(req.headers['authorization']);

    if (!headerSecret) {
      return false;
    }

    try {
      const expectedBuffer = Buffer.from(configuredSecret, 'utf-8');
      const actualBuffer = Buffer.from(headerSecret, 'utf-8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  private extractBearerToken(authHeader?: string): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.slice(7).trim();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getServer(): http.Server | null {
    return this.server;
  }
}

