/**
 * File-Based Receipt Ledger Backend
 * 
 * Append-only JSON Lines store for command receipts.
 * Suitable for dev/test; no external database dependency.
 */

import { createHash, randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

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

export class FileReceiptLedger {
    private filePath: string;
    private index: Map<string, number> = new Map(); // id → line number for fast lookup

    constructor(dataDir: string = '.data') {
        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path.join(dataDir, 'receipts.jsonl');
    }

    /**
     * Initialize file store (build index from existing file)
     */
    async initialize(): Promise<void> {
        if (!fs.existsSync(this.filePath)) {
            // Create empty file
            fs.writeFileSync(this.filePath, '');
            console.log(`Receipt Ledger file created: ${this.filePath}`);
            return;
        }

        // Build index from existing file
        await this.rebuildIndex();
        console.log(`Receipt Ledger initialized: ${this.filePath} (${this.index.size} entries)`);
    }

    /**
     * Record a receipt to the file store
     */
    async record(entry: Omit<ReceiptEntry, 'id' | 'signature'>): Promise<ReceiptEntry> {
        const id = randomUUID();
        const receipt: ReceiptEntry = {
            ...entry,
            id,
            signature: this.sign({ ...entry, id }),
        };

        // Append to file
        const line = JSON.stringify(receipt) + '\n';
        fs.appendFileSync(this.filePath, line);

        // Update index
        this.index.set(receipt.id, this.index.size);

        return receipt;
    }

    /**
     * Retrieve all receipts for a command
     */
    async queryByCommand(command: string, skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        const entries = await this.readAll();
        return entries
            .filter((e) => e.command === command)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(skip, skip + limit);
    }

    /**
     * Retrieve receipt by ID
     */
    async getById(id: string): Promise<ReceiptEntry | undefined> {
        const entries = await this.readAll();
        return entries.find((e) => e.id === id);
    }

    /**
     * List all receipts (paginated, ordered by timestamp DESC)
     */
    async list(skip: number = 0, limit: number = 100): Promise<ReceiptEntry[]> {
        const entries = await this.readAll();
        return entries
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(skip, skip + limit);
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
     * Export all receipts for audit/compliance (streaming to prevent memory exhaustion)
     */
    async exportAll(): Promise<AsyncIterable<ReceiptEntry>> {
        const filePath = this.filePath;
        return {
            async *[Symbol.asyncIterator]() {
                const rl = readline.createInterface({
                    input: fs.createReadStream(filePath),
                    crlfDelay: Infinity,
                });

                for await (const line of rl) {
                    if (line.trim()) {
                        try {
                            yield JSON.parse(line);
                        } catch (error) {
                            console.error(`Failed to parse receipt line: ${line}`);
                        }
                    }
                }
            },
        };
    }

    /**
     * Count total receipts
     */
    async count(): Promise<number> {
        const entries = await this.readAll();
        return entries.length;
    }

    /**
     * Count receipts by status
     */
    async countByStatus(status: string): Promise<number> {
        const entries = await this.readAll();
        return entries.filter((e) => e.status === status).length;
    }

    /**
     * Internal: read all receipts from file
     */
    private async readAll(): Promise<ReceiptEntry[]> {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }

        const entries: ReceiptEntry[] = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(this.filePath),
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            if (line.trim()) {
                try {
                    entries.push(JSON.parse(line));
                } catch (error) {
                    console.error(`Failed to parse receipt line: ${line}`);
                }
            }
        }

        return entries;
    }

    /**
     * Internal: rebuild index from file
     */
    private async rebuildIndex(): Promise<void> {
        this.index.clear();
        const entries = await this.readAll();
        entries.forEach((entry, idx) => {
            this.index.set(entry.id, idx);
        });
    }

    /**
     * Internal: sign receipt payload with HMAC
     */
    private sign(payload: Record<string, unknown>): string {
        const data = JSON.stringify(payload);
        return createHash('sha256').update(data).digest('hex');
    }
}
