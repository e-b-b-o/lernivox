import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerWakeService {
  private readonly logger = new Logger(WorkerWakeService.name);
  private readonly workerBaseUrl?: string;
  private readonly workerWakeSecret?: string;
  private inFlightWakePromise: Promise<boolean> | null = null;
  private lastWakeAttemptTime = 0;
  private consecutiveFailures = 0;

  constructor(private readonly configService: ConfigService) {
    const rawUrl = this.configService.get<string>('WORKER_BASE_URL');
    this.workerBaseUrl = rawUrl ? rawUrl.trim().replace(/\/+$/, '') : undefined;
    this.workerWakeSecret = this.configService.get<string>('WORKER_WAKE_SECRET');

    if (this.workerBaseUrl) {
      this.logger.log(`Worker wake client configured for target: ${this.workerBaseUrl}`);
    } else {
      this.logger.log(
        'Worker wake client inactive (WORKER_BASE_URL not configured). Running in standalone/local queue mode.',
      );
    }
  }

  /**
   * Fire-and-forget, non-blocking wake trigger.
   * Never blocks user request flow; coalesces simultaneous in-flight wake attempts.
   */
  public wake(reason: string = 'job-enqueued'): void {
    if (!this.workerBaseUrl) {
      return;
    }

    if (this.inFlightWakePromise) {
      this.logger.debug(
        `Coalescing wake request (${reason}) with existing in-flight worker wake operation.`,
      );
      return;
    }

    this.inFlightWakePromise = this.executeWakeWithRetries(reason)
      .catch((err) => {
        this.logger.warn(`Unexpected top-level error during worker wake: ${err.message}`);
        return false;
      })
      .finally(() => {
        this.inFlightWakePromise = null;
      });
  }

  /**
   * Throttled wake trigger, typically called on active document status polling.
   * Ensures sleeping workers are nudged without hammering the endpoint on every 2-second poll.
   */
  public wakeThrottled(reason: string = 'status-poll', minIntervalMs: number = 30000): void {
    if (!this.workerBaseUrl) {
      return;
    }

    const now = Date.now();
    if (now - this.lastWakeAttemptTime < minIntervalMs) {
      return;
    }

    this.lastWakeAttemptTime = now;
    this.wake(reason);
  }

  /**
   * Internal wake executor with exponential backoff and jitter, budget up to 90 seconds.
   */
  public async executeWakeWithRetries(
    reason: string,
    maxAttempts: number = 3,
    initialDelayMs: number = 3000,
  ): Promise<boolean> {
    if (!this.workerBaseUrl) {
      return false;
    }

    const wakeUrl = `${this.workerBaseUrl}/internal/wake`;
    const attemptTimeouts = [20000, 30000, 35000]; // Total budget ~85-90s with backoff

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const timeoutMs = attemptTimeouts[attempt - 1] || 30000;
      const startTime = Date.now();

      try {
        this.logger.log(
          `Issuing wake signal to worker (reason: ${reason}, attempt: ${attempt}/${maxAttempts}, target: ${wakeUrl})...`,
        );

        const response = await fetch(wakeUrl, {
          method: 'POST',
          headers: {
            'x-worker-wake-secret': this.workerWakeSecret || '',
            'User-Agent': 'Lernivox-API/1.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        const elapsedMs = Date.now() - startTime;

        if (response.status === 200) {
          this.consecutiveFailures = 0;
          this.logger.log(
            `Worker successfully acknowledged wake signal in ${elapsedMs}ms (attempt: ${attempt}/${maxAttempts}).`,
          );
          return true;
        }

        if (response.status === 401) {
          this.logger.warn(
            'Worker wake authentication failed (HTTP 401). Verify WORKER_WAKE_SECRET matches between API and Worker.',
          );
          // Do not retry on credential mismatches
          return false;
        }

        this.logger.warn(
          `Worker wake returned non-200 status: ${response.status} ${response.statusText} (${elapsedMs}ms).`,
        );
      } catch (error: any) {
        const elapsedMs = Date.now() - startTime;
        const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
        this.logger.warn(
          `Worker wake attempt ${attempt}/${maxAttempts} failed in ${elapsedMs}ms: ${
            isTimeout ? 'Request timed out waiting for worker cold-start' : error.message
          }`,
        );
      }

      // If attempts remain, wait with exponential backoff + jitter
      if (attempt < maxAttempts) {
        const baseDelay = attempt === 1 ? initialDelayMs : initialDelayMs * 2;
        const jitter = initialDelayMs === 0 ? 0 : Math.floor(Math.random() * 1500);
        const delay = baseDelay + jitter;
        if (delay > 0) {
          this.logger.log(`Waiting ${delay}ms before next worker wake retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.consecutiveFailures += 1;
    this.logger.warn(
      `Could not confirm worker wake after ${maxAttempts} attempts (${reason}). Queued jobs remain safe in Redis.`,
    );
    return false;
  }

  public getWorkerBaseUrl(): string | undefined {
    return this.workerBaseUrl;
  }

  public getInFlightPromise(): Promise<boolean> | null {
    return this.inFlightWakePromise;
  }

  public getLastWakeAttemptTime(): number {
    return this.lastWakeAttemptTime;
  }

  public getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }
}
