import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'mocha';
import { Pool } from 'pg';
import { PostgresReceiptLedger, ReceiptEntry } from '../../services/receipt-ledger-pg';

function legacyDigest(receipt: Omit<ReceiptEntry, 'signature'>): string {
    const payload = {
        command: receipt.command,
        tenant: receipt.tenant,
        executor: receipt.executor,
        timestamp: receipt.timestamp,
        status: receipt.status,
        payload: receipt.payload,
        authorityCheckResult: receipt.authorityCheckResult,
        riskGateOutcome: receipt.riskGateOutcome,
        reasons: receipt.reasons ?? [],
        id: receipt.id,
    };
    return createHash('sha256')
        .update(JSON.stringify(payload))
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
    it('verifies the recovered v1 serializer for nested JSON values', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        const receiptWithoutSignature: Omit<ReceiptEntry, 'signature'> = {
            ...baseReceipt,
            payload: { nested: { value: 1 }, list: [null, { item: true }] },
            authorityCheckResult: { allowed: true, checks: ['scope'] },
            riskGateOutcome: { level: 'low', factors: { stale: false } },
        };
        try {
            assert.equal(ledger.verify(baseReceipt), true);
            assert.equal(ledger.verify({
                ...baseReceipt,
                payload: receiptWithoutSignature.payload,
                authorityCheckResult: receiptWithoutSignature.authorityCheckResult,
                riskGateOutcome: receiptWithoutSignature.riskGateOutcome,
                signature: legacyDigest(receiptWithoutSignature),
            }), true);
            assert.equal(ledger.verify({
                ...baseReceipt,
                payload: receiptWithoutSignature.payload,
                authorityCheckResult: receiptWithoutSignature.authorityCheckResult,
                riskGateOutcome: receiptWithoutSignature.riskGateOutcome,
                signature: legacyDigest(receiptWithoutSignature).replace(/^./, '0'),
            }), false);
            assert.equal(ledger.verify({
                ...baseReceipt,
                payload: receiptWithoutSignature.payload,
                authorityCheckResult: receiptWithoutSignature.authorityCheckResult,
                riskGateOutcome: receiptWithoutSignature.riskGateOutcome,
                signaturePayloadText: JSON.stringify({
                    ...receiptWithoutSignature,
                    command: 'different-command',
                }),
                signature: legacyDigest(receiptWithoutSignature),
            }), false);
            assert.equal(ledger.verify({
                ...baseReceipt,
                principalContext: { id: 'operator' },
            }), false);
        } finally {
            await ledger.close();
        }
    });

    it('treats version 2 as non-authoritative pending PR 51', async () => {
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
            signature: legacyDigest(receiptWithoutSignature),
        };

        try {
            assert.equal(ledger.verify(receipt), false);
            assert.equal(ledger.verify({ ...receipt, signatureVersion: 3 }), false);
        } finally {
            await ledger.close();
        }
    });

    it('rejects authority-context record activation before PR 51', async () => {
        const ledger = new PostgresReceiptLedger('postgres://localhost/unused_test');
        try {
            await assert.rejects(ledger.record({
                command: 'blocked-before-pr51',
                tenant: baseReceipt.tenant,
                executor: baseReceipt.executor,
                timestamp: baseReceipt.timestamp,
                status: baseReceipt.status,
                payload: baseReceipt.payload,
                authorityCheckResult: baseReceipt.authorityCheckResult,
                riskGateOutcome: baseReceipt.riskGateOutcome,
                principalContext: { id: 'operator' },
            }), /SIGNED_RECEIPT_ACTIVATION_REQUIRES_PR51/);
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
                signature_payload_text: null,
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

    it('persists and maps v1 signed bytes with the exact timestamp text', async () => {
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
            });
            const loaded = await ledger.getById(recorded.id);

            assert.ok(loaded);
            assert.equal(loaded.signatureVersion, 1);
            assert.equal(typeof loaded.signaturePayloadText, 'string');
            assert.equal(loaded.principalContext, undefined);
            assert.equal(loaded.delegatedBy, undefined);
            assert.equal(loaded.delegationExpiresAt, undefined);
            assert.equal(loaded.timestamp, recorded.timestamp);
            assert.deepEqual(loaded.payload, recorded.payload);
            assert.equal(ledger.verify(loaded), true);
            assert.equal(ledger.verify({ ...loaded, delegatedBy: 'attacker' }), false);
        } finally {
            await ledger.close();
        }
    });

    it('preserves authority metadata as non-authoritative prerequisite storage only', async () => {
        const ledger = new PostgresReceiptLedger(testDatabaseUrl);
        try {
            await ledger.initialize();
            const recorded = await ledger.record({
                command: 'legacy-round-trip',
                tenant: baseReceipt.tenant,
                executor: baseReceipt.executor,
                timestamp: baseReceipt.timestamp,
                status: baseReceipt.status,
                payload: baseReceipt.payload,
                authorityCheckResult: baseReceipt.authorityCheckResult,
                riskGateOutcome: baseReceipt.riskGateOutcome,
            });
            const loaded = await ledger.getById(recorded.id);
            assert.ok(loaded);
            assert.equal(loaded.signatureVersion, 1);
            assert.equal(ledger.verify(loaded), true);
        } finally {
            await ledger.close();
        }
    });

    it('exports every versioned signed-receipt field for compliance verification', async () => {
        const pool = new Pool({ connectionString: testDatabaseUrl });
        const ledger = new PostgresReceiptLedger(testDatabaseUrl);
        try {
            await ledger.initialize();
            const recorded = await ledger.record({
                command: `export-round-trip-${Date.now()}`,
                tenant: 'test-tenant',
                executor: 'test-operator',
                timestamp: '2026-01-01T00:00:00.123+00:00',
                status: 'executed',
                payload: { values: [1, { key: 'value' }] },
                authorityCheckResult: { allowed: true },
                riskGateOutcome: { level: 'low' },
                reasons: ['compliance export'],
            });
            const migration = await readFile(
                'apps/executive-desk/db/migrations/001-receipt-ledger.sql', 'utf8',
            );
            await pool.query(migration);

            const view = await pool.query(
                'SELECT * FROM receipts_audit_export WHERE id = $1',
                [recorded.id],
            );
            assert.equal(view.rows.length, 1);
            assert.equal(view.rows[0].signature_version, 1);
            assert.equal(view.rows[0].timestamp_text, recorded.timestamp);
            assert.equal(view.rows[0].signature_payload_text, recorded.signaturePayloadText);
            assert.deepEqual(view.rows[0].payload, recorded.payload);
            assert.deepEqual(view.rows[0].authority_check_result, recorded.authorityCheckResult);
            assert.deepEqual(view.rows[0].risk_gate_outcome, recorded.riskGateOutcome);

            const exported = await pool.query(
                'SELECT * FROM export_receipts_since($1::timestamp) WHERE id = $2',
                ['2026-01-01T00:00:00.000', recorded.id],
            );
            assert.equal(exported.rows.length, 1);
            assert.equal(exported.rows[0].signature, recorded.signature);
            assert.equal(exported.rows[0].signature_version, 1);
            assert.equal(exported.rows[0].signature_payload_text, recorded.signaturePayloadText);
            assert.deepEqual(exported.rows[0].reasons, recorded.reasons);
        } finally {
            await ledger.close();
            await pool.end();
        }
    });
});
