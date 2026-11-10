import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface MigrationLogger {
  log: (message: string) => void;
  warn?: (message: string) => void;
  error: (message: string) => void;
}

const defaultLogger: MigrationLogger = {
  log: (msg: string) => console.log(`[Database Migration] ${msg}`),
  warn: (msg: string) => console.warn(`[Database Migration WARN] ${msg}`),
  error: (msg: string) => console.error(`[Database Migration ERROR] ${msg}`),
};

/**
 * Executes Prisma production migrations ('prisma migrate deploy') safely.
 * Works across monorepo layouts, standalone scripts, and containerized deployments.
 */
export async function runDatabaseMigrations(logger: MigrationLogger = defaultLogger): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://lernivox:lernivox_dev_password@localhost:5433/lernivox?schema=public';

  if (!process.env.DATABASE_URL) {
    logger.warn?.(
      'DATABASE_URL is not explicitly set in process.env. Using default local development connection string.',
    );
  }

  logger.log('Locating Prisma schema and migration assets...');

  // 1. Resolve schema.prisma
  const candidateSchemaPaths = [
    path.resolve(__dirname, '../prisma/schema.prisma'), // from dist/
    path.resolve(__dirname, '../../prisma/schema.prisma'), // fallback
    path.resolve(process.cwd(), 'packages/database/prisma/schema.prisma'),
    path.resolve(process.cwd(), 'prisma/schema.prisma'),
    path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma'),
  ];

  let schemaPath: string | null = null;
  for (const candidate of candidateSchemaPaths) {
    if (fs.existsSync(candidate)) {
      schemaPath = candidate;
      break;
    }
  }

  if (!schemaPath) {
    const errorMsg = 'FATAL: Could not locate schema.prisma file for database migrations.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const databaseDir = path.dirname(path.dirname(schemaPath));
  logger.log(`Prisma schema located at: ${schemaPath}`);
  logger.log(`Database package root: ${databaseDir}`);

  // 2. Resolve Prisma CLI entry point
  let prismaEntry: string | null = null;
  try {
    const prismaPkgPath = require.resolve('prisma/package.json', {
      paths: [databaseDir, process.cwd(), __dirname],
    });
    const prismaPkg = JSON.parse(fs.readFileSync(prismaPkgPath, 'utf-8'));
    prismaEntry = path.resolve(path.dirname(prismaPkgPath), prismaPkg.bin.prisma);
  } catch (err) {
    logger.warn?.(`Could not resolve prisma/package.json via require.resolve: ${(err as Error).message}`);
  }

  const candidateBinaries = [
    prismaEntry,
    path.resolve(databaseDir, 'node_modules/.bin/prisma'),
    path.resolve(process.cwd(), 'node_modules/.bin/prisma'),
    path.resolve(databaseDir, '../../node_modules/.bin/prisma'),
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

  const cliPath = candidateBinaries[0];
  if (!cliPath) {
    const errorMsg = 'FATAL: Could not find Prisma CLI executable in node_modules to run migrations.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const isJs = cliPath.endsWith('.js');
  const command = isJs ? process.execPath : cliPath;
  const args = isJs
    ? [cliPath, 'migrate', 'deploy', '--schema', schemaPath]
    : ['migrate', 'deploy', '--schema', schemaPath];

  logger.log(`Running: prisma migrate deploy --schema="${schemaPath}"`);

  const result = spawnSync(command, args, {
    cwd: databaseDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    timeout: 120000, // 2-minute timeout for cloud database connections
  });

  if (result.stdout && result.stdout.trim().length > 0) {
    logger.log(`\n${result.stdout.trim()}`);
  }

  if (result.stderr && result.stderr.trim().length > 0) {
    if (result.status !== 0) {
      logger.error(`\n${result.stderr.trim()}`);
    } else {
      logger.log(`\n${result.stderr.trim()}`);
    }
  }

  if (result.error) {
    const errorMsg = `FATAL: Failed to execute Prisma migration process: ${result.error.message}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (result.status !== 0) {
    const errorMsg = `FATAL: Database migration failed with exit code ${result.status}. Halting startup.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.log('Database migrations successfully applied or verified up to date.');
}

// Allow direct execution via: node dist/migrate.js
if (process.argv[1] && (process.argv[1].endsWith('migrate.js') || process.argv[1].endsWith('migrate.ts'))) {
  runDatabaseMigrations()
    .then(() => {
      console.log('✅ Database migration process completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Database migration process failed:', err);
      process.exit(1);
    });
}
