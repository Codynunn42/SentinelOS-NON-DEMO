/**
 * Receipt Queries Service
 * Query, filter, and export receipts from ledger
 */

import { getReceiptLedger, ReceiptEntry } from '../services/receipt-ledger';

export interface ReceiptFilter {
    skip?: number;
    limit?: number;
    status?: 'issued' | 'executed' | 'blocked' | 'rejected';
    command?: string;
    executor?: string;
    tenant?: string;
    startDate?: string; // ISO string
    endDate?: string; // ISO string
}

export interface ReceiptListResult {
    data: ReceiptEntry[];
    total: number;
    skip: number;
    limit: number;
}

export interface ReceiptStats {
    executedCount: number;
    blockedCount: number;
    issuedCount: number;
    rejectedCount: number;
    avgRiskScore: number;
    avgExecutionTime?: number;
    topCommands: Array<{ command: string; count: number; avgRiskScore: number }>;
    topExecutors: Array<{ executor: string; count: number; avgRiskScore: number }>;
    timeseries: Array<{
        timestamp: string;
        executedCount: number;
        blockedCount: number;
        avgRiskScore: number;
    }>;
}

export interface ExportOptions {
    format: 'json' | 'jsonl' | 'csv';
    startDate?: string;
    endDate?: string;
    status?: 'issued' | 'executed' | 'blocked' | 'rejected';
    command?: string;
}

class ReceiptQueriesService {
    /**
     * List receipts with filters and pagination
     */
    async listReceipts(filter: ReceiptFilter): Promise<ReceiptListResult> {
        const ledger = await getReceiptLedger();
        const skip = filter.skip ?? 0;
        const limit = Math.min(filter.limit ?? 100, 1000); // Cap at 1000

        if (skip < 0) {
            throw new Error('skip must be >= 0');
        }
        if (limit <= 0 || limit > 1000) {
            throw new Error('limit must be between 1 and 1000');
        }

        // Get all receipts and apply filters
        const allReceipts = await ledger.list();
        let filtered = allReceipts;

        // Apply status filter
        if (filter.status) {
            filtered = filtered.filter((r) => r.status === filter.status);
        }

        // Apply command filter
        if (filter.command) {
            filtered = filtered.filter((r) => r.command === filter.command);
        }

        // Apply executor filter
        if (filter.executor) {
            filtered = filtered.filter((r) => r.executor === filter.executor);
        }

        // Apply tenant filter
        if (filter.tenant) {
            filtered = filtered.filter((r) => r.tenant === filter.tenant);
        }

        // Apply date range filter
        if (filter.startDate) {
            const startTime = new Date(filter.startDate).getTime();
            filtered = filtered.filter(
                (r) => new Date(r.timestamp).getTime() >= startTime,
            );
        }

        if (filter.endDate) {
            const endTime = new Date(filter.endDate).getTime();
            filtered = filtered.filter(
                (r) => new Date(r.timestamp).getTime() <= endTime,
            );
        }

        // Sort by timestamp descending (most recent first)
        filtered = filtered.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        // Apply pagination
        const total = filtered.length;
        const data = filtered.slice(skip, skip + limit);

        return { data, total, skip, limit };
    }

    /**
     * Get single receipt by ID
     */
    async getReceiptById(id: string): Promise<ReceiptEntry | null> {
        const ledger = await getReceiptLedger();
        return (await ledger.getById(id)) ?? null;
    }

    /**
     * Compute statistics from receipts
     */
    async getStatistics(
        filter?: Omit<ReceiptFilter, 'skip' | 'limit'>,
        window?: '1h' | '6h' | '24h' | '7d' | '30d',
        granularity?: 'minute' | 'hour' | 'day',
    ): Promise<ReceiptStats> {
        const ledger = await getReceiptLedger();
        const allReceipts = await ledger.list();

        // Apply filters
        let filtered = allReceipts;

        if (filter?.status) {
            filtered = filtered.filter((r) => r.status === filter.status);
        }

        if (filter?.command) {
            filtered = filtered.filter((r) => r.command === filter.command);
        }

        if (filter?.executor) {
            filtered = filtered.filter((r) => r.executor === filter.executor);
        }

        if (filter?.tenant) {
            filtered = filtered.filter((r) => r.tenant === filter.tenant);
        }

        // Apply window filter
        if (window) {
            const now = new Date();
            const windowMs = this.getWindowMs(window);
            const cutoff = new Date(now.getTime() - windowMs);
            filtered = filtered.filter(
                (r) => new Date(r.timestamp).getTime() >= cutoff.getTime(),
            );
        }

        // Compute counts by status
        const executedCount = filtered.filter((r) => r.status === 'executed').length;
        const blockedCount = filtered.filter((r) => r.status === 'blocked').length;
        const issuedCount = filtered.filter((r) => r.status === 'issued').length;
        const rejectedCount = filtered.filter((r) => r.status === 'rejected').length;

        // Compute average risk score
        const riskScores = filtered
            .map((r) => {
                const outcome = r.riskGateOutcome as Record<string, unknown>;
                return typeof outcome.score === 'number' ? outcome.score : 0;
            });
        const avgRiskScore =
            riskScores.length > 0 ? riskScores.reduce((a, b) => a + b) / riskScores.length : 0;

        // Top commands
        const commandCounts = new Map<string, { count: number; scores: number[] }>();
        filtered.forEach((r) => {
            if (!commandCounts.has(r.command)) {
                commandCounts.set(r.command, { count: 0, scores: [] });
            }
            const entry = commandCounts.get(r.command)!;
            entry.count += 1;
            const score = (r.riskGateOutcome as Record<string, unknown>).score as number;
            entry.scores.push(typeof score === 'number' ? score : 0);
        });

        const topCommands = Array.from(commandCounts.entries())
            .map(([cmd, { count, scores }]) => ({
                command: cmd,
                count,
                avgRiskScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top executors
        const executorCounts = new Map<string, { count: number; scores: number[] }>();
        filtered.forEach((r) => {
            if (!executorCounts.has(r.executor)) {
                executorCounts.set(r.executor, { count: 0, scores: [] });
            }
            const entry = executorCounts.get(r.executor)!;
            entry.count += 1;
            const score = (r.riskGateOutcome as Record<string, unknown>).score as number;
            entry.scores.push(typeof score === 'number' ? score : 0);
        });

        const topExecutors = Array.from(executorCounts.entries())
            .map(([executor, { count, scores }]) => ({
                executor,
                count,
                avgRiskScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Timeseries (group by granularity)
        const timeseriesMap = new Map<
            string,
            { executed: number; blocked: number; scores: number[] }
        >();

        filtered.forEach((r) => {
            const date = new Date(r.timestamp);
            const bucket = this.getTimeBucket(date, granularity || 'hour');

            if (!timeseriesMap.has(bucket)) {
                timeseriesMap.set(bucket, { executed: 0, blocked: 0, scores: [] });
            }

            const entry = timeseriesMap.get(bucket)!;
            if (r.status === 'executed') {
                entry.executed += 1;
            } else if (r.status === 'blocked') {
                entry.blocked += 1;
            }

            const score = (r.riskGateOutcome as Record<string, unknown>).score as number;
            entry.scores.push(typeof score === 'number' ? score : 0);
        });

        const timeseries = Array.from(timeseriesMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([timestamp, data]) => ({
                timestamp,
                executedCount: data.executed,
                blockedCount: data.blocked,
                avgRiskScore:
                    data.scores.length > 0
                        ? data.scores.reduce((a, b) => a + b) / data.scores.length
                        : 0,
            }));

        return {
            executedCount,
            blockedCount,
            issuedCount,
            rejectedCount,
            avgRiskScore,
            topCommands,
            topExecutors,
            timeseries,
        };
    }

    /**
     * Export receipts in various formats
     */
    async* exportReceipts(
        options: ExportOptions,
    ): AsyncGenerator<string, void, unknown> {
        const ledger = await getReceiptLedger();
        const allReceipts = await ledger.list();

        // Apply filters
        let filtered = allReceipts;

        if (options.status) {
            filtered = filtered.filter((r) => r.status === options.status);
        }

        if (options.command) {
            filtered = filtered.filter((r) => r.command === options.command);
        }

        if (options.startDate) {
            const startTime = new Date(options.startDate).getTime();
            filtered = filtered.filter(
                (r) => new Date(r.timestamp).getTime() >= startTime,
            );
        }

        if (options.endDate) {
            const endTime = new Date(options.endDate).getTime();
            filtered = filtered.filter(
                (r) => new Date(r.timestamp).getTime() <= endTime,
            );
        }

        // Sort by timestamp
        filtered = filtered.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        if (options.format === 'jsonl') {
            // JSON Lines format — one receipt per line
            for (const receipt of filtered) {
                yield JSON.stringify(receipt) + '\n';
            }
        } else if (options.format === 'json') {
            // Full JSON array
            yield JSON.stringify(filtered, null, 2);
        } else if (options.format === 'csv') {
            // CSV format with headers
            const headers = [
                'ID',
                'Command',
                'Tenant',
                'Executor',
                'Timestamp',
                'Status',
                'Risk Score',
                'Risk Decision',
            ];
            yield headers.join(',') + '\n';

            for (const receipt of filtered) {
                const outcome = receipt.riskGateOutcome as Record<string, unknown>;
                const row = [
                    this.escapeCsv(receipt.id),
                    this.escapeCsv(receipt.command),
                    this.escapeCsv(receipt.tenant),
                    this.escapeCsv(receipt.executor),
                    this.escapeCsv(receipt.timestamp),
                    this.escapeCsv(receipt.status),
                    outcome.score || 'N/A',
                    this.escapeCsv((outcome.decision as string) || 'N/A'),
                ];
                yield row.join(',') + '\n';
            }
        }
    }

    // Helper: Convert window to milliseconds
    private getWindowMs(
        window: '1h' | '6h' | '24h' | '7d' | '30d',
    ): number {
        const map = {
            '1h': 1 * 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
        };
        return map[window];
    }

    // Helper: Get time bucket for grouping
    private getTimeBucket(date: Date, granularity: 'minute' | 'hour' | 'day'): string {
        const d = new Date(date);

        if (granularity === 'minute') {
            d.setSeconds(0, 0);
        } else if (granularity === 'hour') {
            d.setMinutes(0, 0, 0);
        } else if (granularity === 'day') {
            d.setHours(0, 0, 0, 0);
        }

        return d.toISOString();
    }

    // Helper: Escape CSV special characters
    private escapeCsv(value: string): string {
        if (typeof value !== 'string') {
            value = String(value);
        }
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }
}

export const receiptQueriesService = new ReceiptQueriesService();

export async function getReceiptQueriesService(): Promise<ReceiptQueriesService> {
    return receiptQueriesService;
}
