import { strict as assert } from 'node:assert';
import { createHash, createHmac } from 'node:crypto';
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
const signingKey = 'synthetic-executive-desk-receipt-hmac-key-v1';

describe('PostgresReceiptLedger signatures', () => {
    it('labels legacy digest receipts unsigned, including a recomputed tampered digest', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        try {
            assert.deepEqual(ledger.verifyDetailed(baseReceipt), {
                verified: false,
                status: 'unsigned_legacy',
            });

            const forgedPayload = {
                ...baseReceipt,
                signatureVersion: 2,
                payload: { nested: { value: 'tampered' } },
            };
            const forgedReceipt = {
                ...forgedPayload,
                signature: v2Digest(forgedPayload),
            };
            assert.deepEqual(ledger.verifyDetailed(forgedReceipt), {
                verified: false,
                status: 'unsigned_legacy',
            });
        } finally {
            await ledger.close();
        }
    });

    it('authenticates version 3 with HMAC and rejects tampering or an unavailable/wrong key', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test', signingKey);
        const receiptWithoutSignature: Omit<ReceiptEntry, 'signature'> = {
            ...baseReceipt,
            signatureVersion: 3,
            principalContext: { id: 'operator', roles: ['reviewer'] },
            delegatedBy: 'admin',
            delegationExpiresAt: '2026-02-01T00:00:00+00:00',
        };
        const receipt: ReceiptEntry = {
            ...receiptWithoutSignature,
            signature: v3Signature(receiptWithoutSignature, signingKey),
        };

        try {
            assert.deepEqual(ledger.verifyDetailed(receipt), {
                verified: true,
                status: 'verified',
            });
            assert.deepEqual(ledger.verifyDetailed({
                ...receipt,
                principalContext: { id: 'attacker', roles: ['reviewer'] },
            }), {
                verified: false,
                status: 'signature_mismatch',
            });
            assert.equal(ledger.verify({ ...receipt, delegatedBy: 'attacker' }), false);
            assert.equal(ledger.verify({
                ...receipt,
                delegationExpiresAt: '2027-02-01T00:00:00+00:00',
            }), false);
            const { delegatedBy, ...withoutDelegation } = receipt;
            assert.equal(ledger.verify(withoutDelegation), false);
            assert.equal(ledger.verify({ ...receipt, signatureVersion: 4 }), false);

            const missingKeyLedger = new PostgresReceiptLedger('postgres://localhost/unused_test');
            try {
                assert.deepEqual(missingKeyLedger.verifyDetailed(receipt), {
                    verified: false,
                    status: 'key_unavailable',
                });
            } finally {
                await missingKeyLedger.close();
            }

            const wrongKeyLedger = new PostgresReceiptLedger(
                'postgres://localhost/unused_test',
                'different-synthetic-executive-desk-key',
            );
            try {
                assert.deepEqual(wrongKeyLedger.verifyDetailed(receipt), {
                    verified: false,
                    status: 'signature_mismatch',
                });
            } finally {
                await wrongKeyLedger.close();
            }
        } finally {
            await ledger.close();
        }
    });

    it('requires a sufficiently strong configured key before signing', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        try {
            assert.throws(() => new PostgresReceiptLedger(
                'postgres://localhost/unused_test',
                'too-short',
            ), /at least 32 bytes/);
            assert.deepEqual(ledger.verifyDetailed({
                ...baseReceipt,
                signatureVersion: 3,
                signature: 'a'.repeat(64),
            }), {
                verified: false,
                status: 'key_unavailable',
            });
            await assert.rejects(
                ledger.record(baseReceipt),
                /EXECUTIVE_DESK_RECEIPT_HMAC_KEY_REQUIRED_FOR_SIGNING/,
            );
        } finally {
            await ledger.close();
        }
    });
});

function v3Signature(receipt: Omit<ReceiptEntry, 'signature'>, key: string): string {
    const payload = {
        signatureVersion: 3,
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
    return createHmac('sha256', key)
        .update(JSON.stringify(canonicalize(payload)))
        .digest('hex');
}

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
            const authenticatedMigration = await readFile(
                'apps/executive-desk/db/migrations/004-receipt-authenticated-hmac-v3.sql', 'utf8',
            );
            await client.query(authenticatedMigration);
            await client.query(authenticatedMigration);
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
            await client.query('UPDATE receipts SET signature_version = 3');
            await assert.rejects(client.query(
                'UPDATE receipts SET signature_version = 4',
            ), /receipts_signature_version_check/);
        } finally {
            await client.query('ROLLBACK');
            client.release();
            await pool.end();
        }
    });

    it('persists and maps signature version and authority fields without changing signed bytes', async () => {
        const ledger = new PostgresReceiptLedger(testDatabaseUrl, signingKey);
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
            assert.equal(loaded.signatureVersion, 3);
            assert.deepEqual(loaded.principalContext, recorded.principalContext);
            assert.equal(loaded.delegatedBy, recorded.delegatedBy);
            assert.equal(loaded.delegationExpiresAt, recorded.delegationExpiresAt);
            assert.equal(loaded.timestamp, recorded.timestamp);
            assert.deepEqual(loaded.payload, recorded.payload);
            assert.equal(ledger.verify(loaded), true);
            assert.equal(loaded.verificationStatus, 'verified');
            assert.equal(loaded.verified, true);
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
        const ledger = new PostgresReceiptLedger(testDatabaseUrl, signingKey);
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

    it('exports a stable snapshot without skipping or duplicating rows inserted between batches', async () => {
        const ledger = new PostgresReceiptLedger(testDatabaseUrl, signingKey);
        const exportCommand = `stable-export-${Date.now()}`;
        const seedIds = new Set<string>();
        try {
            await ledger.initialize();
            for (let index = 0; index < 3; index += 1) {
                const recorded = await ledger.record({
                    command: exportCommand,
                    tenant: 'test-tenant',
                    executor: 'test-operator',
                    timestamp: '2026-01-01T00:00:00.123456Z',
                    status: 'executed',
                    payload: { index },
                    authorityCheckResult: { allowed: true },
                    riskGateOutcome: { level: 'low' },
                });
                seedIds.add(recorded.id);
            }

            const iterator = (await ledger.exportAll(2))[Symbol.asyncIterator]();
            const first = await iterator.next();
            assert.equal(first.done, false);

            const insertedDuringExport = await ledger.record({
                command: exportCommand,
                tenant: 'test-tenant',
                executor: 'test-operator',
                timestamp: '2027-01-01T00:00:00.000Z',
                status: 'executed',
                payload: { insertedDuringExport: true },
                authorityCheckResult: { allowed: true },
                riskGateOutcome: { level: 'low' },
            });

            const exported = [first.value!];
            while (true) {
                const next = await iterator.next();
                if (next.done) break;
                exported.push(next.value);
            }

            const exportedSeedIds = exported
                .filter((receipt) => seedIds.has(receipt.id))
                .map((receipt) => receipt.id);
            assert.deepEqual(new Set(exportedSeedIds), seedIds);
            assert.equal(exportedSeedIds.length, seedIds.size);
            assert.equal(exported.some((receipt) => receipt.id === insertedDuringExport.id), false);
        } finally {
            await ledger.close();
        }
    });
});
