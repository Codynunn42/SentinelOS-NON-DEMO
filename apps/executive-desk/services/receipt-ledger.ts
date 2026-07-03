/**
 * Receipt Ledger Factory
 * 
 * Unified interface for receipt storage with pluggable backends:
 * - In-memory (default for testing)
 * - File-based (dev/small deployments)
 * - PostgreSQL (production)
 * 
 * Set RECEIPT_LEDGER_BACKEND env var to switch backends:
 *   - 'memory' (default)
 *   - 'file' (requires RECEIPT_LEDGER_DATA_DIR)
 *   - 'postgres' (requires DATABASE_URL)
 */

import { createHash, randomUUID } from 'crypto';

export interface PrincipalContext {
    id: string;
    displayName?: string;
    email?: string;
    groups?: string[];
    roles?: string[];
}

export interface ReceiptEntry {
    id: string;
    command: string;
    tenant: string;
    executor: string;
    timestamp: string;
    status: 'issued' | 'executed' | 'blocked' | 'rejected';
    payload: Record<string, unknown>;
    authorityCheckResult: unknown;
    riskGateOutcome: unknown;
    signature: string;
    reasons?: string[];

    // NEW: Authority context (from Gate 4 integration)
    principalContext?: PrincipalContext;
    delegatedBy?: string;
    delegationExpiresAt?: string;
}

export interface IReceiptLedger {
    initialize?(): Promise<void>;
    record(entry: Omit<ReceiptEntry, 'id' | 'signature'>): Promise<ReceiptEntry>;
    queryByCommand(command: string, skip?: number, limit?: number): Promise<ReceiptEntry[]>;
    getById(id: string): Promise<ReceiptEntry | undefined>;
    list(skip?: number, limit?: number): Promise<ReceiptEntry[]>;
    verify(receipt: ReceiptEntry): boolean;
    exportAll(): Promise<AsyncIterable<ReceiptEntry>>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
}

// In-memory backend (default for testing)
class InMemoryReceiptLedger implements IReceiptLedger {
    private entries: ReceiptEntry[] = [];
    private indexByCommand: Map<string, ReceiptEntry[]> = new Map();

    async record(entry: Omit<ReceiptEntry, 'id' | 'signature'>): Promise<ReceiptEntry> {
        const id = randomUUID();
        const receipt: ReceiptEntry = {
            ...entry,
            id,
            signature: this.sign({ ...entry, id }),
        };

        this.entries.push(receipt);

        if (!this.indexByCommand.has(entry.command)) {
            this.indexByCommand.set(entry.command, []);
        }
        this.indexByCommand.get(entry.command)!.push(receipt);

        return receipt;
    }

    async queryByCommand(command: string, skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        return (this.indexByCommand.get(command) || [])
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(skip, skip + limit);
    }

    async getById(id: string): Promise<ReceiptEntry | undefined> {
        return this.entries.find((e) => e.id === id);
    }

    async list(skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        return this.entries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(skip, skip + limit);
    }

    verify(receipt: ReceiptEntry): boolean {
        const { signature, ...payload } = receipt;
        const expected = this.sign(payload);
        return signature === expected;
    }

    async exportAll(): Promise<AsyncIterable<ReceiptEntry>> {
        const entries = this.entries;
        return {
            async *[Symbol.asyncIterator]() {
                for (const entry of entries) {
                    yield entry;
                }
            },
        };
    }

    async count(): Promise<number> {
        return this.entries.length;
    }

    async countByStatus(status: string): Promise<number> {
        return this.entries.filter((e) => e.status === status).length;
    }

    private sign(payload: Record<string, unknown>): string {
        const data = JSON.stringify(payload);
        return createHash('sha256').update(data).digest('hex');
    }
}

/**
 * Create receipt ledger from environment or config
 */
export async function createReceiptLedger(): Promise<IReceiptLedger> {
    const backend = process.env.RECEIPT_LEDGER_BACKEND || 'memory';

    let ledger: IReceiptLedger;

    if (backend === 'postgres' || backend === 'postgresql') {
        const { PostgresReceiptLedger } = await import('./receipt-ledger-pg');
        ledger = new PostgresReceiptLedger();
    } else if (backend === 'file') {
        const { FileReceiptLedger } = await import('./receipt-ledger-file');
        const dataDir = process.env.RECEIPT_LEDGER_DATA_DIR || '.data';
        ledger = new FileReceiptLedger(dataDir);
    } else {
        // Default: in-memory
        ledger = new InMemoryReceiptLedger();
    }

    // Initialize if needed
    if (ledger.initialize) {
        await ledger.initialize();
    }

    return ledger;
}

// Singleton instance
let instance: IReceiptLedger | null = null;

/**
 * Get or create the receipt ledger singleton
 */
export async function getReceiptLedger(): Promise<IReceiptLedger> {
    if (!instance) {
        instance = await createReceiptLedger();
    }
    return instance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetReceiptLedger(): void {
    instance = null;
}

// For backwards compatibility with existing code
export { InMemoryReceiptLedger };
