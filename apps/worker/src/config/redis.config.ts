import { ConfigService } from '@nestjs/config';

export interface RedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: { rejectUnauthorized: boolean };
  lazyConnect?: boolean;
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  connectTimeout?: number;
  family?: number;
  keepAlive?: number;
  retryStrategy?: (times: number) => number | void;
}

export function buildRedisConnectionOptions(configService: ConfigService): RedisConnectionConfig {
  const commonOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 30000,
    family: 4,
    keepAlive: 30000,
    retryStrategy: (times: number) => Math.min(times * 1000, 5000),
  };

  const redisUrl = configService.get<string>('REDIS_URL')?.trim();
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      const isTls = parsed.protocol === 'rediss:';
      return {
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : isTls ? 6380 : 6379,
        ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
        ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
        ...commonOptions,
      };
    } catch {
      // Fallback if URL parsing fails
    }
  }

  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = Number(configService.get<string | number>('REDIS_PORT', 6379));
  const password = configService.get<string>('REDIS_PASSWORD');
  const username = configService.get<string>('REDIS_USERNAME');
  const useTls = configService.get<string>('REDIS_TLS') === 'true';

  return {
    host,
    port,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    ...commonOptions,
  };
}

