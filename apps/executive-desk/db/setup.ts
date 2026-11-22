/**
 * Database Setup & Migration Runner
 *
 * Usage:
 * npx ts-node apps/executive-desk/db/setup.ts
 * npx ts-node apps/executive-desk/db/setup.ts rollback [migration-file]
 *
 * This script:
 * 1. Connects to PostgreSQL via DATABASE_URL
 * 2. Runs all migrations in db/migrations/
 * 3. Reports schema status
 *
 * Rollback mode reverses the most recently applied migration (or the named
 * one, only if it is the most recently applied) using the matching file in
 * db/migrations/down/, and removes its schema_migrations record in the same
 * transaction. Migrations are rolled back newest-first, one at a time.
 *
 * Both modes hold a PostgreSQL advisory lock for the whole run, so a forward
 * setup and a rollback (or two setups) can never interleave: the
 * newest-first check and the change it guards are one atomic decision.
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
const CONNECT_ATTEMPTS = 10;
const CONNECT_RETRY_DELAY_MS = 1000;

if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    console.error('Example: postgresql://user:password@localhost:5432/executive_desk');
    process.exit(1);
}

async function connectWithRetry(pool: Pool) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
        try {
            return await pool.connect();
        } catch (error) {
            lastError = error;
            if (attempt < CONNECT_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
            }
        }
    }

    throw lastError;
}

const MIGRATION_LOCK_KEY = 'sentinel-executive-desk-migrations';

async function acquireMigrationLock(client: import('pg').PoolClient): Promise<void> {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [MIGRATION_LOCK_KEY]);
}

async function releaseMigrationLock(client: import('pg').PoolClient): Promise<void> {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [MIGRATION_LOCK_KEY]);
}

async function runMigrations(): Promise<void> {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await connectWithRetry(pool);

    try {
        await acquireMigrationLock(client);
        console.log('🔧 Receipt Ledger Database Setup\n');
        console.log(`📍 Database URL: ${DATABASE_URL.split('@')[1]}\n`);

        // Create migrations tracking table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Migrations table ready\n');

        // Load and run migrations
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();

        console.log(`Found ${migrationFiles.length} migration(s):\n`);

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const alreadyApplied = await client.query(
                'SELECT id FROM schema_migrations WHERE name = $1',
                [file],
            );

            if (alreadyApplied.rows.length > 0) {
                console.log(`  ⊘ ${file} (already applied)`);
                continue;
            }

            // Read and execute migration
            const migrationSQL = fs.readFileSync(filePath, 'utf8');
            await client.query(migrationSQL);

            // Record migration
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            console.log(`  ✓ ${file}`);
        }

        console.log('\n✅ Database setup complete!\n');

        // Report schema status
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📊 Schema Status:\n');
        for (const row of tables.rows) {
            console.log(`  • ${row.table_name}`);
        }

        console.log('\n✨ Ready to use! Set RECEIPT_LEDGER_BACKEND=postgres in your .env\n');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await releaseMigrationLock(client).catch(() => undefined);
        client.release();
        await pool.end();
    }
}

async function rollbackMigration(targetFile?: string): Promise<void> {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await connectWithRetry(pool);

    try {
        await acquireMigrationLock(client);
        console.log('⏪ Receipt Ledger Migration Rollback\n');
        console.log(`📍 Database URL: ${DATABASE_URL.split('@')[1]}\n`);

        const migrationsDir = path.join(__dirname, 'migrations');

        // Use the complete database history, including migrations whose
        // files are absent from this checkout: an applied newer migration
        // must block a rollback even when this checkout cannot see it.
        const applied = await client.query(
            'SELECT name FROM schema_migrations ORDER BY name',
        );
        const appliedFiles = applied.rows.map((row) => row.name as string);

        if (appliedFiles.length === 0) {
            console.log('No applied migrations to roll back.');
            return;
        }

        const latest = appliedFiles[appliedFiles.length - 1];
        const target = targetFile ?? latest;

        if (!appliedFiles.includes(target)) {
            console.error(`❌ Rollback failed: ${target} is not applied.`);
            process.exit(1);
        }

        if (target !== latest) {
            console.error(
                `❌ Rollback failed: ${target} is not the most recently applied migration.`,
            );
            console.error(`   Roll back ${latest} first (newest-first, one at a time).`);
            process.exit(1);
        }

        const downFile = target.replace(/\.sql$/, '.down.sql');
        const downPath = path.join(migrationsDir, 'down', downFile);
        if (!fs.existsSync(downPath)) {
            console.error(`❌ Rollback failed: no down migration found at ${downPath}`);
            process.exit(1);
        }

        const downSQL = fs.readFileSync(downPath, 'utf8');

        // Reverse the migration and its tracking record atomically: if the
        // down migration fails, schema_migrations still shows it as applied.
        await client.query('BEGIN');
        try {
            await client.query(downSQL);
            await client.query('DELETE FROM schema_migrations WHERE name = $1', [target]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        console.log(`  ✓ ${target} rolled back (${downFile})`);
        console.log('\n✅ Rollback complete!\n');
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    } finally {
        await releaseMigrationLock(client).catch(() => undefined);
        client.release();
        await pool.end();
    }
}

const args = process.argv.slice(2);
if (args[0] === 'rollback') {
    rollbackMigration(args[1]);
} else {
    runMigrations();
}
