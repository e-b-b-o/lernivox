import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { runDatabaseMigrations } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Migration Runner', () => {
  test('should successfully export runDatabaseMigrations function', () => {
    assert.strictEqual(typeof runDatabaseMigrations, 'function');
  });

  test('should verify schema.prisma and migration files exist on disk', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    assert.strictEqual(fs.existsSync(schemaPath), true, 'schema.prisma should exist');

    const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
    assert.strictEqual(fs.existsSync(migrationsDir), true, 'migrations directory should exist');

    const migrationDirs = fs.readdirSync(migrationsDir).filter((d) => !d.startsWith('.'));
    assert.ok(migrationDirs.length >= 13, `expected at least 13 migration dirs, found ${migrationDirs.length}`);
    assert.ok(migrationDirs.includes('0_init'), 'expected 0_init migration directory');
  });

  test('should fail fast with descriptive error if connection fails or invalid url provided', async () => {
    const logs: string[] = [];
    const errors: string[] = [];
    const customLogger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => errors.push(msg),
    };

    const originalUrl = process.env.DATABASE_URL;
    try {
      // Use non-routable port to verify fast failure
      process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@127.0.0.1:54999/invalid_db';
      await assert.rejects(
        async () => {
          await runDatabaseMigrations(customLogger);
        },
        /FATAL: Database migration failed with exit code/
      );
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }
  });
});
