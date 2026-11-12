import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type WorkerWakeState =
  | 'idle'
  | 'waking'
  | 'ready'
  | 'rate_limited'
  | 'auth_error'
  | 'unavailable';

export interface WorkerWakeTelemetry {
  state: WorkerWakeState;
  isWaking: boolean;
  lastErrorCategory: string | null;
  lastWakeAttemptTime: number;
  workerConfirmedActiveAt: number;
  consecutiveFailures: number;
  rateLimitedUntil: number;
}

export interface ExecuteWakeOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  attemptTimeoutMs?: number;
  maxWakeWindowMs?: number;
  readinessPollIntervalMs?: number;
}

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
  private wakeState: WorkerWakeState = 'idle';
  private lastErrorCategory: string | null = null;

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
   * Skips redundant calls only if /readyz or HTTP 200 confirmed Redis readiness within 3 minutes.
   */
  public wake(reason: string = 'job-enqueued'): void {
    if (!this.workerBaseUrl) {
      return;
    }

    const now = Date.now();
    // Only skip if the worker was genuinely verified ready (connected to Redis & consuming) recently
    if (this.workerConfirmedActiveAt > 0 && now - this.workerConfirmedActiveAt < 180000) {
      this.logger.debug(
        `Worker verified ready ${Math.round((now - this.workerConfirmedActiveAt) / 1000)}s ago. Skipping redundant wake (${reason}).`,
      );
      return;
    }

    if (this.inFlightWakePromise) {
      this.logger.debug(
        `Coalescing wake request (${reason}) with existing in-flight worker wake operation.`,
      );
      return;
    }

    this.wakeState = 'waking';
    this.inFlightWakePromise = this.executeWakeWithRetries(reason)
      .catch((err) => {
        this.wakeState = 'unavailable';
        this.lastErrorCategory = 'UNEXPECTED_ERROR';
        this.logger.warn(`Unexpected top-level error during worker wake: ${err?.message || 'unknown'}`);
        return false;
      })
      .finally(() => {
        this.inFlightWakePromise = null;
      });
  }

  /**
   * Throttled wake trigger called on active document status polling.
   * Ensures sleeping/initializing workers are nudged without hammering Render/Cloudflare proxies.
   */
  public wakeThrottled(reason: string = 'status-poll', minIntervalMs: number = 30000): void {
    if (!this.workerBaseUrl) {
      return;
    }

    const now = Date.now();

    if (this.workerConfirmedActiveAt > 0 && now - this.workerConfirmedActiveAt < 120000) {
      return;
    }

    if (now < this.rateLimitedUntil) {
      return;
    }

    if (this.inFlightWakePromise) {
      return;
    }

    if (now - this.lastWakeAttemptTime < minIntervalMs) {
      return;
    }

    this.lastWakeAttemptTime = now;
    this.wake(reason);
  }

  /**
   * Parses standard HTTP Retry-After header into bounded integer seconds (5s - 120s).
   */
  public parseRetryAfter(header: string | null): number {
    if (!header) return 30;
    const trimmed = header.trim();
    const matchSeconds = trimmed.match(/^(\d+)\s*s?$/i);
    if (matchSeconds && matchSeconds[1]) {
      const sec = parseInt(matchSeconds[1], 10);
      if (!isNaN(sec) && sec > 0) {
        return Math.min(Math.max(sec, 5), 120);
      }
    }
    const parsedDate = Date.parse(trimmed);
    if (!isNaN(parsedDate)) {
      const diffSec = Math.ceil((parsedDate - Date.now()) / 1000);
      return Math.min(Math.max(diffSec, 5), 120);
    }
    return 30;
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Internal wake executor designed for Render Free cold starts (~60-95s):
   * - Sends POST /internal/wake with generous attempt timeouts so container spin-ups aren't prematurely aborted.
   * - HTTP 200 -> Worker confirmed ready & consuming Redis queue.
   * - HTTP 202 -> Worker HTTP server booted while Redis/BullMQ is still initializing -> polls GET /readyz
   *   within the bounded wake window until /readyz returns 200 before confirming readiness.
   */
  public async executeWakeWithRetries(
    reason: string,
    maxAttempts: number = 3,
    initialDelayMs: number = 3000,
    options?: ExecuteWakeOptions,
  ): Promise<boolean> {
    if (!this.workerBaseUrl) {
      return false;
    }

    const effectiveMaxAttempts = options?.maxAttempts ?? maxAttempts;
    const effectiveInitialDelayMs = options?.initialDelayMs ?? initialDelayMs;
    const maxWakeWindowMs = options?.maxWakeWindowMs ?? 95000;
    const attemptTimeoutMs = options?.attemptTimeoutMs ?? 45000;
    const readinessPollIntervalMs = options?.readinessPollIntervalMs ?? 4000;

    const wakeUrl = `${this.workerBaseUrl}/internal/wake`;
    const wakeStartTime = Date.now();
    this.wakeState = 'waking';

    for (let attempt = 1; attempt <= effectiveMaxAttempts; attempt++) {
      const elapsedTotalMs = Date.now() - wakeStartTime;
      if (attempt > 1 && elapsedTotalMs >= maxWakeWindowMs) {
        break;
      }

      const now = Date.now();

      // While rate-limited by Render/Cloudflare proxy, probe lightweight /readyz instead of POST /internal/wake
      if (now < this.rateLimitedUntil) {
        this.wakeState = 'rate_limited';
        const isLive = await this.probeWorkerHealth();
        if (isLive) {
          return true;
        }
        const remainingCoolDown = this.rateLimitedUntil - now;
        if (remainingCoolDown > 0 && attempt < effectiveMaxAttempts) {
          const pollDelay = Math.min(remainingCoolDown, 10000);
          this.logger.log(
            `Worker wake rate-limited; waiting ${pollDelay}ms before probing /readyz...`,
          );
          await this.sleep(pollDelay);
          const retryLive = await this.probeWorkerHealth();
          if (retryLive) {
            return true;
          }
        }
        if (Date.now() < this.rateLimitedUntil) {
          continue;
        }
      }

      const remainingWindowMs = Math.max(5000, maxWakeWindowMs - (Date.now() - wakeStartTime));
      const effectiveTimeoutMs = Math.min(attemptTimeoutMs, remainingWindowMs);
      const attemptStart = Date.now();

      try {
        this.logger.log(
          `Issuing wake signal to worker (reason: ${reason}, attempt: ${attempt}/${effectiveMaxAttempts}, timeout: ${effectiveTimeoutMs}ms, target: ${wakeUrl})...`,
        );

        const response = await fetch(wakeUrl, {
          method: 'POST',
          headers: {
            'x-worker-wake-secret': this.workerWakeSecret || '',
            'User-Agent': 'Lernivox-API/1.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(effectiveTimeoutMs),
        });

        const attemptElapsedMs = Date.now() - attemptStart;

        // 200: Worker already awake AND healthService.isReady() is true
        if (response.status === 200) {
          this.markWorkerReady();
          this.logger.log(
            `Worker confirmed READY via /internal/wake (status 200) in ${attemptElapsedMs}ms (attempt: ${attempt}/${effectiveMaxAttempts}).`,
          );
          return true;
        }

        // 202: Worker container HTTP started, Redis/BullMQ connection is still initializing.
        // Do NOT mark ready until GET /readyz confirms status 200.
        if (response.status === 202) {
          this.logger.log(
            `Worker HTTP server awake (status 202 initializing) in ${attemptElapsedMs}ms. Waiting for /readyz Redis confirmation...`,
          );
          const becameReady = await this.waitForReadiness(
            wakeStartTime + maxWakeWindowMs,
            readinessPollIntervalMs,
          );
          if (becameReady) {
            return true;
          }
          this.lastErrorCategory = 'WORKER_INITIALIZING_TIMEOUT';
          this.logger.warn(
            'Worker HTTP responded (202) but /readyz did not reach ready=true within wake window.',
          );
          return false;
        }

        if (response.status === 401) {
          this.wakeState = 'auth_error';
          this.lastErrorCategory = 'UNAUTHORIZED_SECRET';
          this.consecutiveFailures += 1;
          this.logger.warn(
            'Worker wake authentication failed (HTTP 401). Verify WORKER_WAKE_SECRET matches between API and Worker.',
          );
          return false;
        }

        if (response.status === 429) {
          this.wakeState = 'rate_limited';
          this.lastErrorCategory = 'RATE_LIMITED';
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
            // ignore body read errors
          }

          const coolDownSec = this.parseRetryAfter(retryAfterHeader);
          const jitterMs = effectiveInitialDelayMs === 0 ? 0 : Math.floor(Math.random() * 1500) + 500;
          const waitDelayMs = coolDownSec * 1000 + jitterMs;
          this.rateLimitedUntil = Date.now() + waitDelayMs;

          this.logger.warn(
            `Worker wake rate-limited (HTTP 429, server: ${serverHeader}, reqId: ${rayId}, retryAfter: ${coolDownSec}s, body: "${bodySnippet}"). Probing /readyz...`,
          );

          const isLive = await this.probeWorkerHealth();
          if (isLive) {
            return true;
          }

          if (attempt < effectiveMaxAttempts && Date.now() - wakeStartTime + waitDelayMs < maxWakeWindowMs) {
            this.logger.log(
              `Waiting ${waitDelayMs}ms before next wake retry (Retry-After: ${coolDownSec}s)...`,
            );
            await this.sleep(waitDelayMs);
            continue;
          }
        } else {
          this.lastErrorCategory = `HTTP_ERROR_${response.status}`;
          this.logger.warn(
            `Worker wake returned status ${response.status} ${response.statusText || ''} (${attemptElapsedMs}ms).`,
          );
        }
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        const attemptElapsedMs = Date.now() - attemptStart;
        const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
        this.lastErrorCategory = isTimeout ? 'COLD_START_TIMEOUT' : 'NETWORK_ERROR';

        this.logger.warn(
          `Worker wake attempt ${attempt}/${effectiveMaxAttempts} failed (${this.lastErrorCategory}) in ${attemptElapsedMs}ms: ${
            isTimeout ? 'Timed out waiting for Render worker cold start' : err?.message || 'Unknown error'
          }`,
        );

        // Probe /readyz in case container completed boot right around timeout boundary
        if (isTimeout) {
          const isLive = await this.probeWorkerHealth();
          if (isLive) {
            return true;
          }
        }
      }

      if (attempt < effectiveMaxAttempts) {
        const baseDelay = attempt === 1 ? effectiveInitialDelayMs : effectiveInitialDelayMs * 2;
        const jitter = effectiveInitialDelayMs === 0 ? 0 : Math.floor(Math.random() * 1500);
        const delay = baseDelay + jitter;
        const remaining = maxWakeWindowMs - (Date.now() - wakeStartTime);
        if (delay > 0 && remaining > 2000) {
          const boundedDelay = Math.min(delay, remaining - 1000);
          this.logger.log(`Waiting ${boundedDelay}ms before next worker wake retry...`);
          await this.sleep(boundedDelay);
        }
      }
    }

    this.consecutiveFailures += 1;
    if (this.wakeState !== 'rate_limited' && this.wakeState !== 'auth_error') {
      this.wakeState = 'unavailable';
    }
    this.logger.warn(
      `Could not confirm worker /readyz readiness after ${effectiveMaxAttempts} attempts (${reason}, category: ${this.lastErrorCategory ?? 'UNKNOWN'}). Queued jobs remain persisted in Redis.`,
    );
    return false;
  }

  /**
   * Polls GET /readyz after an HTTP 202 response until Redis/BullMQ is ready or deadline expires.
   */
  private async waitForReadiness(deadlineMs: number, pollIntervalMs: number): Promise<boolean> {
    const maxPolls = 15;
    for (let i = 0; i < maxPolls; i++) {
      if (await this.probeWorkerHealth()) {
        return true;
      }
      const remaining = deadlineMs - Date.now();
      if (remaining <= 500) {
        break;
      }
      await this.sleep(Math.min(pollIntervalMs, remaining));
    }
    return false;
  }

  private markWorkerReady(): void {
    this.consecutiveFailures = 0;
    this.rateLimitedUntil = 0;
    this.workerConfirmedActiveAt = Date.now();
    this.wakeState = 'ready';
    this.lastErrorCategory = null;
  }

  /**
   * Probes GET /readyz on the worker service to verify BOTH HTTP reachability AND Redis queue readiness.
   * Only marks workerConfirmedActiveAt when /readyz confirms HTTP 200 ready=true.
   */
  public async probeWorkerHealth(): Promise<boolean> {
    if (!this.workerBaseUrl) {
      return false;
    }

    try {
      const readyUrl = `${this.workerBaseUrl}/readyz`;
      const res = await fetch(readyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Lernivox-API-ReadinessProbe/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      const data =
        typeof res.json === 'function'
          ? ((await res.json().catch(() => ({}))) as {
              status?: string;
              uptime?: number;
              details?: { ready?: boolean };
            })
          : {};

      if (res.status === 200 && (data?.status === 'ready' || data?.details?.ready !== false)) {
        this.markWorkerReady();
        this.logger.log(
          `Worker verified READY via /readyz probe (uptime: ${Math.round(data?.uptime ?? 0)}s). Connected to Redis and consuming queue.`,
        );
        return true;
      }

      if (res.status === 503) {
        this.wakeState = 'waking';
        this.lastErrorCategory = 'REDIS_NOT_READY';
        this.logger.debug(
          `Worker HTTP is up but /readyz returned 503 (${data?.status ?? 'not_ready'}). Waiting for Redis connection...`,
        );
        return false;
      }
    } catch {
      // Worker is still booting or unreachable
    }

    return false;
  }

  public isWaking(): boolean {
    return this.inFlightWakePromise !== null || this.wakeState === 'waking';
  }

  public getWakeTelemetry(): WorkerWakeTelemetry {
    return {
      state: this.wakeState,
      isWaking: this.isWaking(),
      lastErrorCategory: this.lastErrorCategory,
      lastWakeAttemptTime: this.lastWakeAttemptTime,
      workerConfirmedActiveAt: this.workerConfirmedActiveAt,
      consecutiveFailures: this.consecutiveFailures,
      rateLimitedUntil: this.rateLimitedUntil,
    };
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
