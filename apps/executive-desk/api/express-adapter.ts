/**
 * Express Adapter for Executive Desk API
 * Mounts all routes, handles middleware, and error handling
 */

import express, {
    Express,
    Request,
    Response,
    NextFunction,
    Router,
} from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { receiptQueriesService } from './receipt-queries';
import { delegationQueriesService } from './delegation-queries';
import { getRiskApiService } from './risk-api';
import {
    getCloseoutState,
    getMobRuns,
    recordMobRun,
    saveCloseoutState,
    validateCloseoutUpdate,
} from './closeout-state';
import { handleCommand, ProxyCommandRequest } from '../proxy/command-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Type extensions for request context
declare global {
    namespace Express {
        interface Request {
            principalId?: string;
            requestId?: string;
        }
    }
}

// Rate limiting state (simple in-memory; use redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function authEnabled(): boolean {
    return String(process.env.AUTH_ENABLED || 'false').toLowerCase() === 'true';
}

function getExpectedProxyToken(): string {
    const token = process.env.AUTH_BEARER_TOKEN || process.env.JWT_SECRET;
    return String(token || '').trim();
}

/**
 * Rate limiting middleware
 */
function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const principalId = req.principalId || req.ip || 'unknown';
    const now = Date.now();

    let entry = rateLimitMap.get(principalId);

    if (!entry || now >= entry.resetAt) {
        // Create new window
        entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        rateLimitMap.set(principalId, entry);
    }

    entry.count += 1;

    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        res.status(429).json({
            error: 'Too Many Requests',
            details: `Rate limit exceeded: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`,
            code: 'RATE_LIMIT_EXCEEDED',
        });
        return;
    }

    res.set('X-RateLimit-Remaining', String(RATE_LIMIT_MAX_REQUESTS - entry.count));
    res.set('X-RateLimit-Reset', String(entry.resetAt));

    next();
}

/**
 * Principal authentication middleware
 */
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Get principal from header or bearer token
    const principalId =
        req.headers['x-principal-id'] ||
        (req.headers.authorization
            ? req.headers.authorization.replace('Bearer ', '')
            : undefined);

    if (!principalId || typeof principalId !== 'string') {
        res.status(401).json({
            error: 'Unauthorized',
            details: 'X-Principal-Id header is required',
            code: 'MISSING_PRINCIPAL',
        });
        return;
    }

    req.principalId = principalId;
    next();
}

/**
 * Proxy auth middleware
 *
 * If AUTH_ENABLED=true, requires Authorization: Bearer <token>
 * where token matches AUTH_BEARER_TOKEN (or JWT_SECRET fallback).
 */
function proxyAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!authEnabled()) {
        next();
        return;
    }

    const expectedToken = getExpectedProxyToken();
    if (!expectedToken) {
        res.status(500).json({
            error: 'Internal Server Error',
            details: 'AUTH_ENABLED=true but no AUTH_BEARER_TOKEN/JWT_SECRET configured',
            code: 'AUTH_MISCONFIGURED',
        });
        return;
    }

    const authHeader = String(req.headers.authorization || '');
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();

    if (!token || token !== expectedToken) {
        res.status(401).json({
            error: 'Unauthorized',
            details: 'Valid bearer token is required for /proxy/command',
            code: 'MISSING_OR_INVALID_BEARER',
        });
        return;
    }

    next();
}

/**
 * Request ID middleware
 */
function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    req.requestId = req.headers['x-request-id'] as string;
    if (!req.requestId) {
        req.requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    res.set('X-Request-Id', req.requestId);
    next();
}

/**
 * Error handling middleware
 */
function errorMiddleware(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    const message = err instanceof Error ? err.message : String(err);
    const statusCode =
        err instanceof Error && 'statusCode' in err
            ? (err as Record<string, unknown>).statusCode
            : 500;

    res.status(statusCode as number || 500).json({
        error: 'Internal Server Error',
        details: message,
        code: 'INTERNAL_ERROR',
    });
}

/**
 * Mount all API routes
 */
export function mountApiRoutes(app: Express): void {
    const router = Router();

    // Global middleware
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.get('/executive', (_req: Request, res: Response) => {
        res.sendFile(path.join(publicDir, 'index.html'));
    });
    app.use('/executive', express.static(publicDir));

    app.post('/proxy/command', proxyAuthMiddleware, rateLimitMiddleware, async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const response = await handleCommand(req.body as ProxyCommandRequest);
            res.json(response);
        } catch (err) {
            next(err);
        }
    });

    // Protected routes
    const protectedRouter = Router();
    protectedRouter.use(authMiddleware);
    protectedRouter.use(rateLimitMiddleware);

    // Receipt endpoints
    protectedRouter.get('/receipts', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const service = await receiptQueriesService;
            const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

            if (!Number.isFinite(skip) || skip < 0) {
                res.status(400).json({
                    error: 'Bad Request',
                    details: 'skip must be >= 0',
                    code: 'INVALID_PAGINATION',
                });
                return;
            }

            if (!Number.isFinite(limit) || limit <= 0 || limit > 1000) {
                res.status(400).json({
                    error: 'Bad Request',
                    details: 'limit must be between 1 and 1000',
                    code: 'INVALID_PAGINATION',
                });
                return;
            }

            const result = await service.listReceipts({
                skip,
                limit,
                status: req.query.status as any,
                command: req.query.command as string,
                executor: req.query.executor as string,
                tenant: req.query.tenant as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
            });

            res.json(result);
        } catch (err) {
            next(err);
        }
    });

    protectedRouter.get(
        '/receipts/export',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await receiptQueriesService;
                const format = (req.query.format || 'json') as 'json' | 'jsonl' | 'csv';

                // Set response headers for file download
                const filename =
                    format === 'csv'
                        ? 'receipts.csv'
                        : format === 'jsonl'
                            ? 'receipts.jsonl'
                            : 'receipts.json';
                const contentType =
                    format === 'csv'
                        ? 'text/csv'
                        : format === 'jsonl'
                            ? 'application/x-ndjson'
                            : 'application/json';

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', contentType);

                // Stream export
                const exporter = service.exportReceipts({
                    format,
                    startDate: req.query.startDate as string,
                    endDate: req.query.endDate as string,
                    status: req.query.status as any,
                    command: req.query.command as string,
                });

                for await (const chunk of exporter) {
                    res.write(chunk);
                }

                res.end();
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/receipts/stats',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await receiptQueriesService;
                const window = (req.query.window || '24h') as
                    | '1h'
                    | '6h'
                    | '24h'
                    | '7d'
                    | '30d';
                const granularity = (req.query.granularity || 'hour') as
                    | 'minute'
                    | 'hour'
                    | 'day';

                const stats = await service.getStatistics(
                    {
                        status: req.query.status as any,
                        command: req.query.command as string,
                        executor: req.query.executor as string,
                    },
                    window,
                    granularity,
                );

                res.json(stats);
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/receipts/:id',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await receiptQueriesService;
                const receiptId = String(req.params.id);
                const receipt = await service.getReceiptById(receiptId);

                if (!receipt) {
                    res.status(404).json({
                        error: 'Not Found',
                        details: `Receipt ${receiptId} not found`,
                        code: 'RECEIPT_NOT_FOUND',
                    });
                    return;
                }

                res.json({ data: receipt });
            } catch (err) {
                next(err);
            }
        },
    );

    // Delegation endpoints
    protectedRouter.get(
        '/delegations',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await delegationQueriesService;
                const result = await service.listDelegations({
                    grantedBy: req.query.grantedBy as string,
                    grantedTo: req.query.grantedTo as string,
                    command: req.query.command as string,
                    resource: req.query.resource as string,
                    scope: req.query.scope as any,
                    includeRevoked: req.query.includeRevoked === 'true',
                });

                res.json(result);
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/delegations/:id',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await delegationQueriesService;
                const delegationId = String(req.params.id);
                const delegation = await service.getDelegationById(delegationId);

                if (!delegation) {
                    res.status(404).json({
                        error: 'Not Found',
                        details: `Delegation ${delegationId} not found`,
                        code: 'DELEGATION_NOT_FOUND',
                    });
                    return;
                }

                res.json({ data: delegation });
            } catch (err) {
                next(err);
            }
        },
    );

    // Risk assessment endpoints
    protectedRouter.get(
        '/risk/status',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await getRiskApiService();
                const status = await service.getCurrentRiskStatus();
                res.json(status);
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/risk/factors',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const service = await getRiskApiService();
                const window = (req.query.window || '24h') as
                    | '1h'
                    | '6h'
                    | '24h'
                    | '7d'
                    | '30d';
                const granularity = (req.query.granularity || 'hour') as
                    | 'minute'
                    | 'hour'
                    | 'day';

                const history = await service.getRiskFactorsHistory(window, granularity);
                res.json(history);
            } catch (err) {
                next(err);
            }
        },
    );

    // Closeout state endpoints
    protectedRouter.get(
        '/closeout/state',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const data = await getCloseoutState(principalId);
                res.json({ data });
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.put(
        '/closeout/state',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const updates = validateCloseoutUpdate(req.body);
                const data = await saveCloseoutState(principalId, updates, principalId);
                res.json({ data });
            } catch (err) {
                if (err instanceof Error) {
                    res.status(400).json({
                        error: 'Bad Request',
                        details: err.message,
                        code: 'INVALID_CLOSEOUT_PAYLOAD',
                    });
                    return;
                }
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/closeout/mob-runs',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                const status = req.query.status ? String(req.query.status).toLowerCase() : 'all';
                const windowDays = req.query.windowDays
                    ? parseInt(String(req.query.windowDays), 10)
                    : 7;

                const rows = await getMobRuns(principalId, limit);
                const now = Date.now();
                const windowMs = Math.max(1, Math.min(windowDays, 90)) * 24 * 60 * 60 * 1000;
                const cutoff = now - windowMs;

                const windowed = rows.filter(
                    (row) => new Date(row.timestamp).getTime() >= cutoff,
                );
                const filtered =
                    status === 'completed' || status === 'failed'
                        ? windowed.filter((row) => row.status === status)
                        : windowed;

                const completed = filtered.filter((row) => row.status === 'completed').length;
                const failed = filtered.filter((row) => row.status === 'failed').length;
                const total = filtered.length;

                const timeseriesMap = new Map<string, { completed: number; failed: number }>();
                filtered.forEach((row) => {
                    const day = new Date(row.timestamp).toISOString().slice(0, 10);
                    if (!timeseriesMap.has(day)) {
                        timeseriesMap.set(day, { completed: 0, failed: 0 });
                    }
                    const slot = timeseriesMap.get(day)!;
                    if (row.status === 'completed') {
                        slot.completed += 1;
                    } else {
                        slot.failed += 1;
                    }
                });

                const timeseries = Array.from(timeseriesMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, values]) => ({ date, ...values }));

                res.json({
                    data: filtered,
                    total,
                    limit,
                    windowDays,
                    summary: {
                        total,
                        completed,
                        failed,
                        successRate: total > 0 ? completed / total : 0,
                        lastRunAt: filtered[0]?.timestamp || null,
                    },
                    timeseries,
                });
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.post(
        '/closeout/mob-runs',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const status = String(req.body?.status || '').toLowerCase();

                if (!['completed', 'failed'].includes(status)) {
                    res.status(400).json({
                        error: 'Bad Request',
                        details: 'status must be completed or failed',
                        code: 'INVALID_MOB_RUN_STATUS',
                    });
                    return;
                }

                const notes =
                    typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 512) : undefined;
                const data = await recordMobRun(
                    principalId,
                    principalId,
                    status as 'completed' | 'failed',
                    notes,
                );
                res.status(201).json({ data });
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/closeout/mob-runs/export',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
                const status = req.query.status ? String(req.query.status).toLowerCase() : 'all';
                const windowDays = req.query.windowDays
                    ? parseInt(String(req.query.windowDays), 10)
                    : 30;
                const format = req.query.format ? String(req.query.format).toLowerCase() : 'csv';

                if (!['csv', 'json', 'jsonl'].includes(format)) {
                    res.status(400).json({
                        error: 'Bad Request',
                        details: 'format must be csv, json, or jsonl',
                        code: 'INVALID_EXPORT_FORMAT',
                    });
                    return;
                }

                const rows = await getMobRuns(principalId, limit);
                const now = Date.now();
                const windowMs = Math.max(1, Math.min(windowDays, 90)) * 24 * 60 * 60 * 1000;
                const cutoff = now - windowMs;

                const windowed = rows.filter(
                    (row) => new Date(row.timestamp).getTime() >= cutoff,
                );
                const filtered =
                    status === 'completed' || status === 'failed'
                        ? windowed.filter((row) => row.status === status)
                        : windowed;

                const filename =
                    format === 'csv'
                        ? 'mob-runs.csv'
                        : format === 'jsonl'
                            ? 'mob-runs.jsonl'
                            : 'mob-runs.json';
                const contentType =
                    format === 'csv'
                        ? 'text/csv'
                        : format === 'jsonl'
                            ? 'application/x-ndjson'
                            : 'application/json';

                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', contentType);

                if (format === 'json') {
                    res.end(JSON.stringify(filtered, null, 2));
                    return;
                }

                if (format === 'jsonl') {
                    filtered.forEach((row) => res.write(JSON.stringify(row) + '\n'));
                    res.end();
                    return;
                }

                res.write('ID,PrincipalId,Executor,Status,Timestamp,Notes\n');
                filtered.forEach((row) => {
                    const notes = typeof row.notes === 'string' ? row.notes.replace(/"/g, '""') : '';
                    res.write(
                        [
                            row.id,
                            row.principalId,
                            row.executor,
                            row.status,
                            row.timestamp,
                            `"${notes}"`,
                        ].join(',') + '\n',
                    );
                });
                res.end();
            } catch (err) {
                next(err);
            }
        },
    );

    protectedRouter.get(
        '/closeout/export-bundle',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const principalId = String(req.principalId || '');
                const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 200;
                const status = req.query.status ? String(req.query.status).toLowerCase() : 'all';
                const windowDays = req.query.windowDays
                    ? parseInt(String(req.query.windowDays), 10)
                    : 30;

                const closeoutState = await getCloseoutState(principalId);
                const rows = await getMobRuns(principalId, limit);

                const now = Date.now();
                const windowMs = Math.max(1, Math.min(windowDays, 90)) * 24 * 60 * 60 * 1000;
                const cutoff = now - windowMs;

                const windowed = rows.filter(
                    (row) => new Date(row.timestamp).getTime() >= cutoff,
                );
                const filtered =
                    status === 'completed' || status === 'failed'
                        ? windowed.filter((row) => row.status === status)
                        : windowed;

                const completed = filtered.filter((row) => row.status === 'completed').length;
                const failed = filtered.filter((row) => row.status === 'failed').length;
                const total = filtered.length;

                const timeseriesMap = new Map<string, { completed: number; failed: number }>();
                filtered.forEach((row) => {
                    const day = new Date(row.timestamp).toISOString().slice(0, 10);
                    if (!timeseriesMap.has(day)) {
                        timeseriesMap.set(day, { completed: 0, failed: 0 });
                    }
                    const slot = timeseriesMap.get(day)!;
                    if (row.status === 'completed') {
                        slot.completed += 1;
                    } else {
                        slot.failed += 1;
                    }
                });

                const timeseries = Array.from(timeseriesMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, values]) => ({ date, ...values }));

                const payload = {
                    exportedAt: new Date().toISOString(),
                    principalId,
                    filters: {
                        status,
                        windowDays,
                        limit,
                    },
                    closeoutState,
                    mobRuns: {
                        data: filtered,
                        summary: {
                            total,
                            completed,
                            failed,
                            successRate: total > 0 ? completed / total : 0,
                            lastRunAt: filtered[0]?.timestamp || null,
                        },
                        timeseries,
                    },
                };

                res.setHeader(
                    'Content-Disposition',
                    'attachment; filename="executive-closeout-bundle.json"',
                );
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload, null, 2));
            } catch (err) {
                next(err);
            }
        },
    );

    // Mount protected routes under /api/executive
    app.use('/api/executive', protectedRouter);

    // Health check (no auth required)
    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            details: 'Endpoint not found',
            code: 'NOT_FOUND',
        });
    });

    // Error handler (must be last)
    app.use(errorMiddleware);
}

/**
 * Create and configure Express app with all routes
 */
export function createApiApp(): Express {
    const app = express();
    mountApiRoutes(app);
    return app;
}
