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
}

export function buildRedisConnectionOptions(configService: ConfigService): RedisConnectionConfig {
  const redisUrl = configService.get<string>('REDIS_URL');
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
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    } catch {
      // Fallback to discrete parameters if URL parsing fails
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
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

