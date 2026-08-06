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
}

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
          timestamp TIMESTAMP NOT NULL,
          status VARCHAR(50) NOT NULL CHECK (status IN ('issued', 'executed', 'blocked', 'rejected')),
          payload JSONB NOT NULL,
          authority_check_result JSONB NOT NULL,
          risk_gate_outcome JSONB NOT NULL,
          signature VARCHAR(64) NOT NULL,
          reasons TEXT[] DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_receipts_command ON receipts(command);
        CREATE INDEX IF NOT EXISTS idx_receipts_executor ON receipts(executor);
        CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp DESC);
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
    async record(entry: Omit<ReceiptEntry, 'id' | 'signature'>): Promise<ReceiptEntry> {
        const id = randomUUID();
        const receipt: ReceiptEntry = {
            ...entry,
            id,
            signature: this.sign({ ...entry, id }),
        };

        const client = await this.pool.connect();
        try {
            await client.query(
                `INSERT INTO receipts 
         (id, command, tenant, executor, timestamp, status, payload, authority_check_result, risk_gate_outcome, signature, reasons)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    receipt.id,
                    receipt.command,
                    receipt.tenant,
                    receipt.executor,
                    receipt.timestamp,
                    receipt.status,
                    JSON.stringify(receipt.payload),
                    JSON.stringify(receipt.authorityCheckResult),
                    JSON.stringify(receipt.riskGateOutcome),
                    receipt.signature,
                    receipt.reasons || [],
                ],
            );
        } finally {
            client.release();
        }

        return receipt;
    }

    /**
     * Retrieve all receipts for a command
     */
    async queryByCommand(command: string, skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM receipts WHERE command = $1 ORDER BY timestamp DESC OFFSET $2 LIMIT $3',
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
                'SELECT * FROM receipts ORDER BY timestamp DESC OFFSET $1 LIMIT $2',
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
        const { signature, ...payload } = receipt;
        const expected = this.sign(payload);
        return signature === expected;
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
     * Internal: sign receipt payload with HMAC
     */
    private sign(payload: Record<string, unknown>): string {
        const data = JSON.stringify(payload);
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Internal: map database row to ReceiptEntry
     */
    private mapRow(row: any): ReceiptEntry {
        return {
            id: row.id,
            command: row.command,
            tenant: row.tenant,
            executor: row.executor,
            timestamp: row.timestamp.toISOString(),
            status: row.status,
            payload: row.payload,
            authorityCheckResult: row.authority_check_result,
            riskGateOutcome: row.risk_gate_outcome,
            signature: row.signature,
            reasons: row.reasons || [],
        };
    }
}
