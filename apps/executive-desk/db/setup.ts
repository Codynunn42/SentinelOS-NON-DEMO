/**
 * Database Setup & Migration Runner
 * 
 * Usage:
 * npx ts-node apps/executive-desk/db/setup.ts
 * 
 * This script:
 * 1. Connects to PostgreSQL via DATABASE_URL
 * 2. Runs all migrations in db/migrations/
 * 3. Reports schema status
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    console.error('Example: postgresql://user:password@localhost:5432/executive_desk');
    process.exit(1);
}

async function runMigrations(): Promise<void> {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const client = await pool.connect();

    try {
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
        client.release();
        await pool.end();
    }
}

runMigrations();
