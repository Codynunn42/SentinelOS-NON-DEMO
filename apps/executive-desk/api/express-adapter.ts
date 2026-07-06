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

    app.post('/proxy/command', rateLimitMiddleware, async (
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
