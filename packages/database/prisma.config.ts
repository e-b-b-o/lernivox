import { defineConfig } from 'prisma/config';
import * as path from 'path';

// Load .env from root if available (Node 20+ built-in)
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    const envPath = path.resolve(__dirname, '../../.env');
    (process as any).loadEnvFile(envPath);
  }
} catch {
  // In production environments (e.g. Render), environment variables are provided directly
}

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://lernivox:lernivox_dev_password@localhost:5433/lernivox?schema=public',
  },
});

