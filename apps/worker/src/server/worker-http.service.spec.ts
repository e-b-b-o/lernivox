import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import { WorkerHttpService } from './worker-http.service';
import { WorkerHealthService } from '../health/worker-health.service';

describe('WorkerHttpService', () => {
  let service: WorkerHttpService;
  let configService: ConfigService;
  let healthService: WorkerHealthService;
  let testPort: number;

  beforeEach(() => {
    testPort = 40000 + Math.floor(Math.random() * 5000);
    const configMap: Record<string, any> = {
      PORT: testPort,
      WORKER_WAKE_SECRET: 'test-secure-wake-secret-12345',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
    };

    configService = {
      get: jest.fn((key: string, defaultVal?: any) => configMap[key] ?? defaultVal),
    } as unknown as ConfigService;

    healthService = new WorkerHealthService(configService);
    healthService.onApplicationBootstrap();

    service = new WorkerHttpService(configService, healthService);
  });

  afterEach(async () => {
    await service.stopServer();
  });

  function makeRequest(
    method: string,
    path: string,
    headers: Record<string, string> = {},
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            let parsedBody: any;
            try {
              parsedBody = JSON.parse(data);
            } catch {
              parsedBody = data;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsedBody,
            });
          });
        },
      );

      req.on('error', reject);
      req.end();
    });
  }

  it('GET /healthz returns 200 OK with worker status', async () => {
    await service.startServer();

    const response = await makeRequest('GET', '/healthz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('worker');
    expect(typeof response.body.uptime).toBe('number');
  });

  it('GET /readyz returns 200 when healthService is ready', async () => {
    await service.startServer();
    healthService.setReady(true);

    const response = await makeRequest('GET', '/readyz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.details.ready).toBe(true);
  });

  it('GET /readyz returns 503 when healthService is not ready', async () => {
    await service.startServer();
    healthService.setReady(false);

    const response = await makeRequest('GET', '/readyz');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not_ready');
    expect(response.body.details.ready).toBe(false);
  });

  it('POST /internal/wake returns 200 when valid x-worker-wake-secret is provided', async () => {
    await service.startServer();

    const response = await makeRequest('POST', '/internal/wake', {
      'x-worker-wake-secret': 'test-secure-wake-secret-12345',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('awake');
    expect(response.body.service).toBe('worker');
    expect(healthService.getStatus().wakeCount).toBe(1);
  });

  it('POST /internal/wake returns 200 when valid Authorization: Bearer token is provided', async () => {
    await service.startServer();

    const response = await makeRequest('POST', '/internal/wake', {
      authorization: 'Bearer test-secure-wake-secret-12345',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('awake');
    expect(healthService.getStatus().wakeCount).toBe(1);
  });

  it('POST /internal/wake returns 401 when invalid secret is provided', async () => {
    await service.startServer();

    const response = await makeRequest('POST', '/internal/wake', {
      'x-worker-wake-secret': 'wrong-secret-value',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
    expect(healthService.getStatus().wakeCount).toBe(0);
  });

  it('POST /internal/wake returns 401 when wake secret header is missing', async () => {
    await service.startServer();

    const response = await makeRequest('POST', '/internal/wake');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
    expect(healthService.getStatus().wakeCount).toBe(0);
  });

  it('POST /internal/wake returns 401 if WORKER_WAKE_SECRET is not configured', async () => {
    (configService.get as any).mockImplementation((key: string, defaultVal?: any) => {
      if (key === 'WORKER_WAKE_SECRET') return undefined;
      if (key === 'PORT') return testPort;
      return defaultVal;
    });

    await service.startServer();

    const response = await makeRequest('POST', '/internal/wake', {
      'x-worker-wake-secret': 'any-secret',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('GET /internal/wake returns 405 Method Not Allowed', async () => {
    await service.startServer();

    const response = await makeRequest('GET', '/internal/wake', {
      'x-worker-wake-secret': 'test-secure-wake-secret-12345',
    });

    expect(response.status).toBe(405);
    expect(response.body.error).toBe('Method Not Allowed');
  });

  it('GET /unmapped-path returns 404 Not Found', async () => {
    await service.startServer();

    const response = await makeRequest('GET', '/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });
});
