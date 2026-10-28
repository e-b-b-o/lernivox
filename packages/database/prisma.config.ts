import { defineConfig } from 'prisma/config';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from root if available
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://lernivox:lernivox_dev_password@localhost:5433/lernivox?schema=public',
  },
});
