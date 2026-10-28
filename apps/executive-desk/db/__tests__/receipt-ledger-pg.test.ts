import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'mocha';
import { Pool } from 'pg';
import { PostgresReceiptLedger, ReceiptEntry } from '../../services/receipt-ledger-pg';

function canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
                .map(([key, item]) => [key, canonicalize(item)]),
        );
    }
    return value;
}

function v2Digest(receipt: Omit<ReceiptEntry, 'signature'>): string {
    const payload = {
        signatureVersion: 2,
        command: receipt.command,
        tenant: receipt.tenant,
        executor: receipt.executor,
        timestamp: receipt.timestamp,
        status: receipt.status,
        payload: receipt.payload,
        authorityCheckResult: receipt.authorityCheckResult,
        riskGateOutcome: receipt.riskGateOutcome,
        reasons: receipt.reasons ?? [],
        principalContext: receipt.principalContext ?? null,
        delegatedBy: receipt.delegatedBy ?? null,
        delegationExpiresAt: receipt.delegationExpiresAt ?? null,
        id: receipt.id,
    };
    return createHash('sha256')
        .update(JSON.stringify(canonicalize(payload)))
        .digest('hex');
}

const baseReceipt: ReceiptEntry = {
    id: '00000000-0000-4000-8000-000000000001',
    signatureVersion: 1,
    command: 'legacy-test',
    tenant: 'tenant',
    executor: 'operator',
    timestamp: '2026-01-01T00:00:00.000Z',
    status: 'executed',
    payload: {},
    authorityCheckResult: {},
    riskGateOutcome: {},
    reasons: [],
    signature: '629afdc6afa97b949712969f21b63c3fabf67bd84a8d9d70181ccb59e7259c60',
};

describe('PostgresReceiptLedger signatures', () => {
    it('verifies the legacy serializer digest vector only when its JSONB values are reconstructible', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        try {
            assert.equal(ledger.verify(baseReceipt), true);
            assert.equal(ledger.verify({ ...baseReceipt, payload: { nested: { value: 1 } } }), false);
            assert.equal(ledger.verify({
                ...baseReceipt,
                principalContext: { id: 'operator' },
            }), false);
        } finally {
            await ledger.close();
        }
    });

    it('verifies version 2 and rejects authority tampering and unknown versions', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        const receiptWithoutSignature: Omit<ReceiptEntry, 'signature'> = {
            ...baseReceipt,
            signatureVersion: 2,
            principalContext: { id: 'operator', roles: ['reviewer'] },
            delegatedBy: 'admin',
            delegationExpiresAt: '2026-02-01T00:00:00+00:00',
        };
        const receipt: ReceiptEntry = {
            ...receiptWithoutSignature,
            signature: v2Digest(receiptWithoutSignature),
        };

        try {
            assert.equal(ledger.verify(receipt), true);
            assert.equal(ledger.verify({
                ...receipt,
                principalContext: { id: 'attacker', roles: ['reviewer'] },
            }), false);
            assert.equal(ledger.verify({ ...receipt, delegatedBy: 'attacker' }), false);
            assert.equal(ledger.verify({
                ...receipt,
                delegationExpiresAt: '2027-02-01T00:00:00+00:00',
            }), false);
            const { delegatedBy, ...withoutDelegation } = receipt;
            assert.equal(ledger.verify(withoutDelegation), false);
            assert.equal(ledger.verify({ ...receipt, signatureVersion: 3 }), false);
        } finally {
            await ledger.close();
        }
    });
});

const testDatabaseUrl = process.env.RECEIPT_LEDGER_TEST_DATABASE_URL;
const postgresDescribe = testDatabaseUrl ? describe : describe.skip;

postgresDescribe('PostgresReceiptLedger isolated persistence round trip', () => {
    before(() => {
        const parsedUrl = new URL(testDatabaseUrl!);
        const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
        assert.match(databaseName, /(?:^|[_-])(test|testing|ci)(?:$|[_-])/i,
            'RECEIPT_LEDGER_TEST_DATABASE_URL must target a database named as test/testing/ci');
        if (process.env.DATABASE_URL && process.env.DATABASE_URL === testDatabaseUrl) {
            assert.fail('The isolated test database URL must not be the application DATABASE_URL');
        }
    });

    it('adds version metadata without rewriting a synthetic legacy row', async () => {
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
                [baseReceipt.id, baseReceipt.signature, JSON.stringify(baseReceipt.payload)],
            );
            const migration = await readFile(
                'apps/executive-desk/db/migrations/003-receipt-signature-v2.sql', 'utf8',
            );
            await client.query(migration);
            await client.query(migration);
            const result = await client.query('SELECT * FROM receipts');
            assert.deepEqual(result.rows, [{
                id: baseReceipt.id,
                signature: baseReceipt.signature,
                payload: baseReceipt.payload,
                signature_version: 1,
                timestamp_text: null,
                principal_context: null,
                delegated_by: null,
                delegation_expires_at: null,
            }]);
            await assert.rejects(client.query(
                'UPDATE receipts SET signature_version = 3',
            ), /receipts_signature_version_check/);
        } finally {
            await client.query('ROLLBACK');
            client.release();
            await pool.end();
        }
    });

    it('persists and maps signature version and authority fields without changing signed bytes', async () => {
        const ledger = new PostgresReceiptLedger(testDatabaseUrl);
        try {
            await ledger.initialize();
            const recorded = await ledger.record({
                command: `round-trip-${Date.now()}`,
                tenant: 'test-tenant',
                executor: 'test-operator',
                timestamp: '2026-01-01T00:00:00.000+00:00',
                status: 'executed',
                payload: { values: [1, { key: 'value' }] },
                authorityCheckResult: { allowed: true },
                riskGateOutcome: { level: 'low' },
                reasons: ['isolated test'],
                principalContext: { id: 'test-operator', roles: ['reviewer'] },
                delegatedBy: 'test-admin',
                delegationExpiresAt: '2026-02-01T00:00:00+00:00',
            });
            const loaded = await ledger.getById(recorded.id);

            assert.ok(loaded);
            assert.equal(loaded.signatureVersion, 2);
            assert.deepEqual(loaded.principalContext, recorded.principalContext);
            assert.equal(loaded.delegatedBy, recorded.delegatedBy);
            assert.equal(loaded.delegationExpiresAt, recorded.delegationExpiresAt);
            assert.equal(loaded.timestamp, recorded.timestamp);
            assert.deepEqual(loaded.payload, recorded.payload);
            assert.equal(ledger.verify(loaded), true);
            assert.equal(ledger.verify({ ...loaded, delegatedBy: 'attacker' }), false);
            assert.equal(ledger.verify({
                ...loaded,
                delegationExpiresAt: '2027-02-01T00:00:00+00:00',
            }), false);
        } finally {
            await ledger.close();
        }
    });

    it('preserves absent and empty delegation fields across reloads', async () => {
        const ledger = new PostgresReceiptLedger(testDatabaseUrl);
        try {
            await ledger.initialize();
            for (const delegation of [{}, { delegatedBy: '', delegationExpiresAt: '' }]) {
                const recorded = await ledger.record({
                    command: 'optional-delegation-round-trip',
                    tenant: baseReceipt.tenant,
                    executor: baseReceipt.executor,
                    timestamp: baseReceipt.timestamp,
                    status: baseReceipt.status,
                    payload: baseReceipt.payload,
                    authorityCheckResult: baseReceipt.authorityCheckResult,
                    riskGateOutcome: baseReceipt.riskGateOutcome,
                    ...delegation,
                });
                const loaded = await ledger.getById(recorded.id);
                assert.ok(loaded);
                assert.equal(loaded.delegatedBy, recorded.delegatedBy);
                assert.equal(loaded.delegationExpiresAt, recorded.delegationExpiresAt);
                assert.equal(ledger.verify(loaded), true);
            }
        } finally {
            await ledger.close();
        }
    });
});
