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
  private rateLimitedUntil = 0;
  private workerConfirmedActiveAt = 0;

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
   * Skips redundant calls if the worker was confirmed active in the last 3 minutes.
   */
  public wake(reason: string = 'job-enqueued'): void {
    if (!this.workerBaseUrl) {
      return;
    }

    const now = Date.now();
    // If worker was confirmed active in the last 3 minutes, jobs in Redis are already being consumed
    if (now - this.workerConfirmedActiveAt < 180000) {
      this.logger.debug(
        `Worker confirmed active ${Math.round((now - this.workerConfirmedActiveAt) / 1000)}s ago. Skipping redundant wake call (${reason}); worker is consuming Redis queue.`,
      );
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
   * Ensures sleeping workers are nudged without hammering the endpoint on every status poll.
   * Suppressed if worker was confirmed active in the last 2 minutes or is in cool-down.
   */
  public wakeThrottled(reason: string = 'status-poll', minIntervalMs: number = 60000): void {
    if (!this.workerBaseUrl) {
      return;
    }

    const now = Date.now();

    // If worker was confirmed active in the last 2 minutes, jobs in Redis are already being consumed
    if (now - this.workerConfirmedActiveAt < 120000) {
      return;
    }

    // If currently rate limited by upstream proxy, do not hammer with throttled wakes
    if (now < this.rateLimitedUntil) {
      return;
    }

    if (now - this.lastWakeAttemptTime < minIntervalMs) {
      return;
    }

    this.lastWakeAttemptTime = now;
    this.wake(reason);
  }

  /**
   * Parses standard HTTP Retry-After header into integer seconds.
   * Handles integer seconds (e.g. "30" or "30s") and RFC 7231 / RFC 9110 HTTP-Date strings.
   * Bounded between 5s and 120s to ensure timely recovery without hammering upstream proxies.
   */
  public parseRetryAfter(header: string | null): number {
    if (!header) return 30;
    const trimmed = header.trim();
    // Integer seconds format, optionally with 's' suffix (e.g. "30" or "30s")
    const matchSeconds = trimmed.match(/^(\d+)\s*s?$/i);
    if (matchSeconds && matchSeconds[1]) {
      const sec = parseInt(matchSeconds[1], 10);
      if (!isNaN(sec) && sec > 0) {
        return Math.min(Math.max(sec, 5), 120);
      }
    }
    // HTTP-Date format (RFC 7231 / RFC 9110)
    const parsedDate = Date.parse(trimmed);
    if (!isNaN(parsedDate)) {
      const diffSec = Math.ceil((parsedDate - Date.now()) / 1000);
      return Math.min(Math.max(diffSec, 5), 120);
    }
    return 30;
  }

  /**
   * Internal wake executor with exponential backoff and jitter, budget up to ~60s.
   * Features rate-limit detection, dual-path health probing, and sanitized logging.
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
    const attemptTimeouts = [15000, 20000, 25000];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const now = Date.now();

      // If we are currently rate-limited on the wake URL, probe /healthz directly instead of hammering
      if (now < this.rateLimitedUntil) {
        const isLive = await this.probeWorkerHealth();
        if (isLive) {
          return true;
        }
      }

      const timeoutMs = attemptTimeouts[attempt - 1] || 20000;
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

        // 200 (Awake/Ready) or 202 (Accepted/Waking)
        if (response.status === 200 || response.status === 202) {
          this.consecutiveFailures = 0;
          this.workerConfirmedActiveAt = Date.now();
          this.rateLimitedUntil = 0;
          this.logger.log(
            `Worker successfully acknowledged wake signal (status ${response.status}) in ${elapsedMs}ms (attempt: ${attempt}/${maxAttempts}).`,
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

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('retry-after');
          const serverHeader = response.headers.get('server') || 'unknown';
          const rayId =
            response.headers.get('cf-ray') ||
            response.headers.get('x-render-request-id') ||
            response.headers.get('rndr-id') ||
            'none';

          let bodySnippet = '';
          try {
            const rawBody = await response.text();
            bodySnippet = rawBody.slice(0, 150).replace(/[\r\n]+/g, ' ').trim();
          } catch {
            // ignore
          }

          const coolDownSec = this.parseRetryAfter(retryAfterHeader);
          // Add bounded jitter (500ms - 2000ms) on top of coolDownSec so we never retry before Retry-After expires
          const jitterMs = initialDelayMs === 0 ? 0 : Math.floor(Math.random() * 1500) + 500;
          const waitDelayMs = coolDownSec * 1000 + jitterMs;
          this.rateLimitedUntil = Date.now() + waitDelayMs;

          this.logger.warn(
            `Worker wake rate-limited (HTTP 429, server: ${serverHeader}, reqId: ${rayId}, retryAfter: ${coolDownSec}s, body: "${bodySnippet}"). Checking worker health probe...`,
          );

          // Dual-Path fallback: check if worker is already alive and listening to Redis
          const isLive = await this.probeWorkerHealth();
          if (isLive) {
            return true;
          }

          // If rate-limited, wait the full cool-down time before retrying POST, or terminate if attempts exhausted
          if (attempt < maxAttempts) {
            this.logger.log(
              `Waiting ${waitDelayMs}ms before next worker wake retry (respecting Retry-After: ${coolDownSec}s)...`,
            );
            await new Promise((resolve) => setTimeout(resolve, waitDelayMs));
            continue;
          }
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

        // On timeout, probe /healthz in case the worker booted just as the request expired
        if (isTimeout) {
          const isLive = await this.probeWorkerHealth();
          if (isLive) {
            return true;
          }
        }
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

  /**
   * Probes GET /healthz on the worker service.
   * If /healthz returns 200 OK, the worker container is confirmed active and running.
   * Uses a 15-second timeout budget to accommodate Render Free container cold-starts.
   */
  public async probeWorkerHealth(): Promise<boolean> {
    if (!this.workerBaseUrl) {
      return false;
    }

    try {
      const healthUrl = `${this.workerBaseUrl}/healthz`;
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Lernivox-API-HealthProbe/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15s budget for Render Free container cold-start
      });

      if (res.status === 200) {
        const data =
          typeof res.json === 'function' ? ((await res.json().catch(() => ({}))) as any) : {};
        this.workerConfirmedActiveAt = Date.now();
        this.consecutiveFailures = 0;
        this.logger.log(
          `Worker verified ACTIVE via /healthz probe (uptime: ${Math.round(data?.uptime ?? 0)}s). Worker is connected to Redis and consuming queue.`,
        );
        return true;
      }
    } catch {
      // Worker is sleeping or not yet reachable
    }

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

  public getRateLimitedUntil(): number {
    return this.rateLimitedUntil;
  }

  public getWorkerConfirmedActiveAt(): number {
    return this.workerConfirmedActiveAt;
  }
}
