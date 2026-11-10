import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { WorkerWakeService } from './worker-wake.service';

describe('WorkerWakeService', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createService(baseUrl?: string, secret?: string): WorkerWakeService {
    const configMap: Record<string, any> = {
      WORKER_BASE_URL: baseUrl,
      WORKER_WAKE_SECRET: secret,
    };

    const configService = {
      get: jest.fn((key: string, defaultVal?: any) => configMap[key] ?? defaultVal),
    } as unknown as ConfigService;

    return new WorkerWakeService(configService);
  }

  it('no-ops safely when WORKER_BASE_URL is not configured', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService(undefined, 'secret');

    service.wake('test-reason');
    service.wakeThrottled('test-throttle');
    const result = await service.executeWakeWithRetries('test');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(service.getWorkerBaseUrl()).toBeUndefined();
  });

  it('sends authenticated POST to /internal/wake on successful wake', async () => {
    const mockFetch = (jest.fn() as any).mockResolvedValue({
      status: 200,
      statusText: 'OK',
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'test-secret-xyz');

    const result = await service.executeWakeWithRetries('document-upload', 1);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://worker.onrender.com/internal/wake',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-worker-wake-secret': 'test-secret-xyz',
          'User-Agent': 'Lernivox-API/1.0',
        }),
      }),
    );
  });

  it('coalesces multiple simultaneous wake calls into a single in-flight operation', async () => {
    let resolveFetch: (val: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const mockFetch = (jest.fn() as any).mockImplementation(() => fetchPromise);
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'test-secret');

    // Trigger three rapid wakes
    service.wake('job-1');
    service.wake('job-2');
    service.wake('job-3');

    // Only 1 fetch call should be initiated while in-flight
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Resolve in-flight fetch
    resolveFetch!({ status: 200, statusText: 'OK' });
    await new Promise((r) => setTimeout(r, 10));

    expect(service.getInFlightPromise()).toBeNull();
  });

  it('aborts retries immediately if worker returns 401 Unauthorized', async () => {
    const mockFetch = (jest.fn() as any).mockResolvedValue({
      status: 401,
      statusText: 'Unauthorized',
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'wrong-secret');

    const result = await service.executeWakeWithRetries('test-401', 3);

    expect(result).toBe(false);
    // Should NOT retry on 401
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on initial failure and succeeds if second attempt returns 200', async () => {
    let attemptCount = 0;
    const mockFetch = (jest.fn() as any).mockImplementation(async () => {
      attemptCount += 1;
      if (attemptCount === 1) {
        throw new Error('Connection refused (worker sleeping)');
      }
      return { status: 200, statusText: 'OK' };
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'secret');

    const result = await service.executeWakeWithRetries('cold-start-test', 2, 0);

    expect(result).toBe(true);
    expect(attemptCount).toBe(2);
    expect(service.getConsecutiveFailures()).toBe(0);
  });

  it('throttles repetitive status poll wake requests within minIntervalMs', () => {
    const mockFetch = (jest.fn() as any).mockResolvedValue({ status: 200 });
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'secret');

    service.wakeThrottled('status-poll-1', 10000);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call within 10s is throttled
    service.wakeThrottled('status-poll-2', 10000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('guarantees wake() is non-blocking and executes without throwing', () => {
    const mockFetch = (jest.fn() as any).mockResolvedValue({ status: 200, statusText: 'OK' });
    global.fetch = mockFetch as unknown as typeof fetch;

    const service = createService('https://worker.onrender.com', 'secret');

    expect(() => {
      service.wake('non-blocking-test');
    }).not.toThrow();
  });
});
