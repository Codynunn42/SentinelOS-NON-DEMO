import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'mocha';
import { Pool } from 'pg';

// Rollback coverage for the receipt-ledger migrations, in the same style as
// receipt-ledger-pg.test.ts: PostgreSQL tests are gated on
// RECEIPT_LEDGER_TEST_DATABASE_URL and run against synthetic temp tables
// inside a transaction that is always rolled back.
const testDatabaseUrl = process.env.RECEIPT_LEDGER_TEST_DATABASE_URL;
const postgresDescribe = testDatabaseUrl ? describe : describe.skip;

const MIGRATION_003 = 'apps/executive-desk/db/migrations/003-receipt-signature-v2.sql';
const MIGRATION_003_DOWN = 'apps/executive-desk/db/migrations/down/003-receipt-signature-v2.down.sql';
const MIGRATION_004 = 'apps/executive-desk/db/migrations/004-receipt-authenticated-hmac-v3.sql';
const MIGRATION_004_DOWN = 'apps/executive-desk/db/migrations/down/004-receipt-authenticated-hmac-v3.down.sql';

const legacyRow = {
    id: '00000000-0000-4000-8000-000000000001',
    signature: '629afdc6afa97b949712969f21b63c3fabf67bd84a8d9d70181ccb59e7259c60',
    payload: { note: 'synthetic legacy receipt' },
};

postgresDescribe('Receipt ledger migration rollback', () => {
    before(() => {
        const databaseName = new URL(testDatabaseUrl!).pathname.replace(/^\//, '');
        assert.match(
            databaseName,
            /(?:^|[_-])(test|testing|ci)(?:$|[_-])/i,
            'RECEIPT_LEDGER_TEST_DATABASE_URL must target a database named as test/testing/ci',
        );
        assert.notEqual(
            process.env.DATABASE_URL,
            testDatabaseUrl,
            'The isolated test database URL must not be the application DATABASE_URL',
        );
    });

    async function withTempReceipts(run: (client: import('pg').PoolClient) => Promise<void>) {
        const pool = new Pool({ connectionString: testDatabaseUrl });
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`
                CREATE TEMP TABLE receipts (
                    id UUID PRIMARY KEY,
                    signature VARCHAR(64) NOT NULL,
                    payload JSONB NOT NULL
                ) ON COMMIT DROP
            `);
            await client.query(
                'INSERT INTO receipts (id, signature, payload) VALUES ($1, $2, $3)',
                [legacyRow.id, legacyRow.signature, JSON.stringify(legacyRow.payload)],
            );
            await run(client);
        } finally {
            await client.query('ROLLBACK');
            client.release();
            await pool.end();
        }
    }

    it('rolls back 003 and restores the pre-003 schema, legacy row intact', async () => {
        await withTempReceipts(async (client) => {
            const up = await readFile(MIGRATION_003, 'utf8');
            const down = await readFile(MIGRATION_003_DOWN, 'utf8');

            await client.query(up);
            await client.query(up);
            await client.query(down);
            await client.query(down); // idempotent: second run is a no-op

            const result = await client.query('SELECT * FROM receipts');
            assert.deepEqual(result.rows, [legacyRow]);
        });
    });

    it('round trip: re-applying 003 after rollback restores version metadata', async () => {
        await withTempReceipts(async (client) => {
            const up = await readFile(MIGRATION_003, 'utf8');
            const down = await readFile(MIGRATION_003_DOWN, 'utf8');

            await client.query(up);
            await client.query(down);
            await client.query(up);

            const result = await client.query('SELECT * FROM receipts');
            assert.deepEqual(result.rows, [{
                ...legacyRow,
                signature_version: 1,
                timestamp_text: null,
                principal_context: null,
                delegated_by: null,
                delegation_expires_at: null,
            }]);
        });
    });

    it('rolls back 004 before 003: constraint narrows, then columns drop', async () => {
        await withTempReceipts(async (client) => {
            const up3 = await readFile(MIGRATION_003, 'utf8');
            const up4 = await readFile(MIGRATION_004, 'utf8');
            const down4 = await readFile(MIGRATION_004_DOWN, 'utf8');
            const down3 = await readFile(MIGRATION_003_DOWN, 'utf8');

            await client.query(up3);
            await client.query(up4);
            await client.query('UPDATE receipts SET signature_version = 3');

            // Reset to a version the narrowed constraint accepts, then narrow.
            await client.query('UPDATE receipts SET signature_version = 2');
            await client.query(down4);
            // Probe inside a savepoint: the rejected update aborts the
            // surrounding transaction unless it is rolled back to here.
            await client.query('SAVEPOINT constraint_probe');
            await assert.rejects(
                client.query('UPDATE receipts SET signature_version = 3'),
                /receipts_signature_version_check/,
            );
            await client.query('ROLLBACK TO SAVEPOINT constraint_probe');

            await client.query(down3);
            const result = await client.query('SELECT * FROM receipts');
            assert.deepEqual(result.rows, [legacyRow]);
        });
    });

    it('down 004 refuses while version 3 receipts exist', async () => {
        await withTempReceipts(async (client) => {
            const up3 = await readFile(MIGRATION_003, 'utf8');
            const up4 = await readFile(MIGRATION_004, 'utf8');
            const down4 = await readFile(MIGRATION_004_DOWN, 'utf8');

            await client.query(up3);
            await client.query(up4);
            await client.query('UPDATE receipts SET signature_version = 3');

            await assert.rejects(client.query(down4), /receipts_signature_version_check/);
        });
    });
});
