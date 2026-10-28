/**
 * PostgreSQL Receipt Ledger Backend
 * 
 * Append-only, immutable store for command receipts.
 * Supports concurrent queries, compliance audits, signature verification.
 */

import { Pool, PoolClient } from 'pg';
import { createHash, randomUUID } from 'crypto';

export interface ReceiptEntry {
    id: string;
    signatureVersion: number;
    command: string;
    tenant: string;
    executor: string;
    timestamp: string;
    status: 'issued' | 'executed' | 'blocked' | 'rejected';
    payload: Record<string, unknown>;
    authorityCheckResult: Record<string, unknown>;
    riskGateOutcome: Record<string, unknown>;
    signature: string;
    reasons?: string[];
    principalContext?: {
        id: string;
        displayName?: string;
        email?: string;
        groups?: string[];
        roles?: string[];
    };
    delegatedBy?: string;
    delegationExpiresAt?: string;
}

const LEGACY_SIGNATURE_VERSION = 1;
const CURRENT_SIGNATURE_VERSION = 2;

export class PostgresReceiptLedger {
    private pool: Pool;

    constructor(connectionString: string = process.env.DATABASE_URL || '') {
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable not set');
        }

        this.pool = new Pool({
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    /**
     * Initialize database schema (must be called once)
     */
    async initialize(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS receipts (
          id UUID PRIMARY KEY,
          command VARCHAR(255) NOT NULL,
          tenant VARCHAR(255) NOT NULL,
          executor VARCHAR(255) NOT NULL,
          "timestamp" TIMESTAMP NOT NULL,
          timestamp_text TEXT,
          status VARCHAR(50) NOT NULL CHECK (status IN ('issued', 'executed', 'blocked', 'rejected')),
          payload JSONB NOT NULL,
          authority_check_result JSONB NOT NULL,
          risk_gate_outcome JSONB NOT NULL,
          signature VARCHAR(64) NOT NULL,
          signature_version SMALLINT NOT NULL DEFAULT 1 CHECK (signature_version IN (1, 2)),
          reasons TEXT[] DEFAULT '{}',
          principal_context JSONB,
          delegated_by VARCHAR(255),
          delegation_expires_at TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE receipts ADD COLUMN IF NOT EXISTS signature_version SMALLINT NOT NULL DEFAULT 1;
        ALTER TABLE receipts ADD COLUMN IF NOT EXISTS timestamp_text TEXT;
        ALTER TABLE receipts ADD COLUMN IF NOT EXISTS principal_context JSONB;
        ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegated_by VARCHAR(255);
        ALTER TABLE receipts ADD COLUMN IF NOT EXISTS delegation_expires_at TEXT;
        ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_signature_version_check;
        ALTER TABLE receipts ADD CONSTRAINT receipts_signature_version_check
          CHECK (signature_version IN (1, 2));

        CREATE INDEX IF NOT EXISTS idx_receipts_command ON receipts(command);
        CREATE INDEX IF NOT EXISTS idx_receipts_executor ON receipts(executor);
        CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts("timestamp" DESC);
        CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
        CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant);
      `);

            console.log('Receipt Ledger schema initialized');
        } finally {
            client.release();
        }
    }

    /**
     * Record a receipt to the persistent ledger
     */
    async record(entry: Omit<ReceiptEntry, 'id' | 'signature' | 'signatureVersion'>): Promise<ReceiptEntry> {
        const id = randomUUID();
        const receipt: Omit<ReceiptEntry, 'signature'> = {
            ...entry,
            reasons: entry.reasons || [],
            id,
            signatureVersion: CURRENT_SIGNATURE_VERSION,
        };
        const signedReceipt: ReceiptEntry = {
            ...receipt,
            signature: this.sign(this.signaturePayload(receipt), CURRENT_SIGNATURE_VERSION),
        };

        const client = await this.pool.connect();
        try {
            await client.query(
                `INSERT INTO receipts 
         (id, command, tenant, executor, "timestamp", timestamp_text, status, payload, authority_check_result, risk_gate_outcome, signature, signature_version, reasons, principal_context, delegated_by, delegation_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [
                    signedReceipt.id,
                    signedReceipt.command,
                    signedReceipt.tenant,
                    signedReceipt.executor,
                    signedReceipt.timestamp,
                    signedReceipt.timestamp,
                    signedReceipt.status,
                    JSON.stringify(signedReceipt.payload),
                    JSON.stringify(signedReceipt.authorityCheckResult),
                    JSON.stringify(signedReceipt.riskGateOutcome),
                    signedReceipt.signature,
                    signedReceipt.signatureVersion,
                    signedReceipt.reasons,
                    signedReceipt.principalContext ? JSON.stringify(signedReceipt.principalContext) : null,
                    signedReceipt.delegatedBy ?? null,
                    signedReceipt.delegationExpiresAt ?? null,
                ],
            );
        } finally {
            client.release();
        }

        return signedReceipt;
    }

    /**
     * Retrieve all receipts for a command
     */
    async queryByCommand(command: string, skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM receipts WHERE command = $1 ORDER BY "timestamp" DESC OFFSET $2 LIMIT $3',
                [command, skip, limit],
            );
            return result.rows.map((row) => this.mapRow(row));
        } finally {
            client.release();
        }
    }

    /**
     * Retrieve receipt by ID
     */
    async getById(id: string): Promise<ReceiptEntry | undefined> {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT * FROM receipts WHERE id = $1', [id]);
            return result.rows[0] ? this.mapRow(result.rows[0]) : undefined;
        } finally {
            client.release();
        }
    }

    /**
     * List all receipts (paginated, ordered by timestamp DESC)
     */
    async list(skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM receipts ORDER BY "timestamp" DESC OFFSET $1 LIMIT $2',
                [skip, limit],
            );
            return result.rows.map((row) => this.mapRow(row));
        } finally {
            client.release();
        }
    }

    /**
     * Verify receipt signature
     */
    verify(receipt: ReceiptEntry): boolean {
        if (receipt.signatureVersion === LEGACY_SIGNATURE_VERSION) {
            if (receipt.principalContext !== undefined || receipt.delegatedBy !== undefined ||
                receipt.delegationExpiresAt !== undefined || !this.legacyJsonbIsStable(receipt)) {
                return false;
            }
            return receipt.signature === this.sign(this.legacySignaturePayload(receipt));
        }
        if (receipt.signatureVersion !== CURRENT_SIGNATURE_VERSION) {
            return false;
        }
        return receipt.signature === this.sign(this.signaturePayload(receipt), CURRENT_SIGNATURE_VERSION);
    }

    /**
     * Export all receipts for audit/compliance (paginated to prevent memory exhaustion)
     */
    async exportAll(batchSize: number = 1000): Promise<AsyncIterable<ReceiptEntry>> {
        const ledger = this;
        return {
            async *[Symbol.asyncIterator]() {
                let offset = 0;
                let hasMore = true;

                while (hasMore) {
                    const batch = await ledger.list(offset, batchSize);
                    if (batch.length === 0) {
                        hasMore = false;
                    } else {
                        for (const receipt of batch) {
                            yield receipt;
                        }
                        offset += batch.length;
                    }
                }
            },
        };
    }

    /**
     * Count total receipts
     */
    async count(): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT COUNT(*) as total FROM receipts');
            return parseInt(result.rows[0].total, 10);
        } finally {
            client.release();
        }
    }

    /**
     * Count receipts by status
     */
    async countByStatus(status: string): Promise<number> {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT COUNT(*) as total FROM receipts WHERE status = $1', [status]);
            return parseInt(result.rows[0].total, 10);
        } finally {
            client.release();
        }
    }

    /**
     * Close connection pool
     */
    async close(): Promise<void> {
        await this.pool.end();
    }

    /**
     * Produces an unkeyed SHA-256 integrity digest; it does not authenticate a signer.
     */
    private sign(payload: Record<string, unknown>, version: number = LEGACY_SIGNATURE_VERSION): string {
        const data = version === CURRENT_SIGNATURE_VERSION
            ? JSON.stringify(this.canonicalize(payload))
            : JSON.stringify(payload);
        return createHash('sha256').update(data).digest('hex');
    }

    private legacySignaturePayload(receipt: ReceiptEntry): Record<string, unknown> {
        return {
            command: receipt.command,
            tenant: receipt.tenant,
            executor: receipt.executor,
            timestamp: receipt.timestamp,
            status: receipt.status,
            payload: receipt.payload,
            authorityCheckResult: receipt.authorityCheckResult,
            riskGateOutcome: receipt.riskGateOutcome,
            reasons: receipt.reasons || [],
            id: receipt.id,
        };
    }

    private signaturePayload(receipt: Omit<ReceiptEntry, 'signature'> | ReceiptEntry): Record<string, unknown> {
        return {
            signatureVersion: CURRENT_SIGNATURE_VERSION,
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
    }

    private canonicalize(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => this.canonicalize(item));
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value as Record<string, unknown>)
                    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
                    .map(([key, item]) => [key, this.canonicalize(item)]),
            );
        }
        return value;
    }

    private legacyJsonbIsStable(receipt: ReceiptEntry): boolean {
        return [
            receipt.payload,
            receipt.authorityCheckResult,
            receipt.riskGateOutcome,
        ].every((value) => this.hasNoNonemptyObjects(value));
    }

    private hasNoNonemptyObjects(value: unknown): boolean {
        if (Array.isArray(value)) {
            return value.every((item) => this.hasNoNonemptyObjects(item));
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value);
            return entries.length === 0 && entries.every(([, item]) => this.hasNoNonemptyObjects(item));
        }
        return true;
    }

    /**
     * Internal: map database row to ReceiptEntry
     */
    private mapRow(row: any): ReceiptEntry {
        const timestamp = row.timestamp instanceof Date
            ? row.timestamp
            : new Date(row.timestamp);

        return {
            id: row.id,
            signatureVersion: Number(row.signature_version ?? LEGACY_SIGNATURE_VERSION),
            command: row.command,
            tenant: row.tenant,
            executor: row.executor,
            timestamp: Number(row.signature_version ?? LEGACY_SIGNATURE_VERSION) === CURRENT_SIGNATURE_VERSION
                ? row.timestamp_text ?? ''
                : timestamp.toISOString(),
            status: row.status,
            payload: row.payload,
            authorityCheckResult: row.authority_check_result,
            riskGateOutcome: row.risk_gate_outcome,
            signature: row.signature,
            reasons: row.reasons || [],
            ...(row.principal_context ? { principalContext: row.principal_context } : {}),
            ...(row.delegated_by != null ? { delegatedBy: row.delegated_by } : {}),
            ...(row.delegation_expires_at != null
                ? { delegationExpiresAt: row.delegation_expires_at }
                : {}),
        };
    }
}
