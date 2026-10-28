import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Creates or retrieves a singleton PrismaClient instance using the PrismaPg driver adapter.
 */
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  const connectionString =
    databaseUrl ||
    process.env.DATABASE_URL ||
    'postgresql://lernivox:lernivox_dev_password@localhost:5433/lernivox?schema=public';

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
