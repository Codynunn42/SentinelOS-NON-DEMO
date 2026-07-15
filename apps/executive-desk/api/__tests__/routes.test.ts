/**
 * API Routes Test Suite
 * Test all endpoints with various filters and error cases
 */

import assert from 'assert';
import express, { Express } from 'express';
import request from 'supertest';
import { mountApiRoutes } from '../express-adapter';

describe('Executive Desk API Routes', () => {
    let app: Express;

    before(() => {
        app = express();
        mountApiRoutes(app);
    });

    describe('Authentication', () => {
        it('should reject requests without principal', async () => {
            const res = await request(app).get('/api/executive/receipts');

            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.body.code, 'MISSING_PRINCIPAL');
        });

        it('should accept requests with principal header', async () => {
            const res = await request(app)
                .get('/api/executive/receipts')
                .set('X-Principal-Id', 'user@example.com');

            // Should succeed (or return empty list) — not 401
            assert(res.status !== 401, `Got 401 but expected success: ${res.body.error}`);
        });

        it('should accept requests with bearer token', async () => {
            const res = await request(app)
                .get('/api/executive/receipts')
                .set('Authorization', 'Bearer user@example.com');

            assert(res.status !== 401, `Got 401 but expected success: ${res.body.error}`);
        });
    });

    describe('Health Check', () => {
        it('should return health status without auth', async () => {
            const res = await request(app).get('/health');

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, 'ok');
            assert(res.body.timestamp);
        });
    });

    describe('Frontend Surface', () => {
        it('should serve the Executive Desk cockpit', async () => {
            const res = await request(app).get('/executive');

            assert.strictEqual(res.status, 200);
            assert(res.text.includes('Executive Desk'));
            assert(res.text.includes('/executive/app.js'));
        });

        it('should serve frontend JavaScript', async () => {
            const res = await request(app).get('/executive/app.js');

            assert.strictEqual(res.status, 200);
            assert(res.text.includes('/api/executive/risk/status'));
            assert(res.text.includes('X-Principal-Id'));
        });

        it('should serve frontend CSS', async () => {
            const res = await request(app).get('/executive/styles.css');

            assert.strictEqual(res.status, 200);
            assert(res.text.includes('.panel-grid'));
            assert(res.text.includes('grid-template-columns'));
        });
    });

    describe('Proxy Command E2E Surface', () => {
        it('should require bearer token for proxy when auth is enabled', async () => {
            const prevAuthEnabled = process.env.AUTH_ENABLED;
            const prevToken = process.env.AUTH_BEARER_TOKEN;

            process.env.AUTH_ENABLED = 'true';
            process.env.AUTH_BEARER_TOKEN = 'proxy-test-token';

            try {
                const res = await request(app)
                    .post('/proxy/command')
                    .send({
                        tenant: 'nunncloud',
                        command: 'repo.control.workflow.diagnose',
                        payload: {
                            principalId: 'user@example.com',
                            repository: 'Codynunn42/SentinelOS-NON-DEMO',
                            workflowName: 'Sentinel Actions Diagnostic',
                        },
                    });

                assert.strictEqual(res.status, 401);
                assert.strictEqual(res.body.code, 'MISSING_OR_INVALID_BEARER');
            } finally {
                process.env.AUTH_ENABLED = prevAuthEnabled;
                process.env.AUTH_BEARER_TOKEN = prevToken;
            }
        });

        it('should accept proxy bearer token when auth is enabled', async () => {
            const prevAuthEnabled = process.env.AUTH_ENABLED;
            const prevToken = process.env.AUTH_BEARER_TOKEN;

            process.env.AUTH_ENABLED = 'true';
            process.env.AUTH_BEARER_TOKEN = 'proxy-test-token';

            try {
                const res = await request(app)
                    .post('/proxy/command')
                    .set('Authorization', 'Bearer proxy-test-token')
                    .send({
                        tenant: 'nunncloud',
                        command: 'repo.control.workflow.diagnose',
                        payload: {
                            principalId: 'user@example.com',
                            repository: 'Codynunn42/SentinelOS-NON-DEMO',
                            workflowName: 'Sentinel Actions Diagnostic',
                        },
                    });

                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.status, 'executed');
            } finally {
                process.env.AUTH_ENABLED = prevAuthEnabled;
                process.env.AUTH_BEARER_TOKEN = prevToken;
            }
        });

        it('should execute the governed read-only diagnosis path', async () => {
            const res = await request(app)
                .post('/proxy/command')
                .send({
                    tenant: 'nunncloud',
                    command: 'repo.control.workflow.diagnose',
                    payload: {
                        principalId: 'user@example.com',
                        repository: 'Codynunn42/SentinelOS-NON-DEMO',
                        workflowName: 'Sentinel Actions Diagnostic',
                        runId: 'gate-8-test',
                    },
                });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, 'executed');
            assert.strictEqual(res.body.command, 'repo.control.workflow.diagnose');
            assert.strictEqual(res.body.executionMode, 'read_only_diagnosis');
            assert.strictEqual(res.body.authorityCheckResult.allowed, true);
            assert.strictEqual(res.body.riskGateOutcome.decision, 'pass');
            assert.strictEqual(res.body.receipt.status, 'executed');
            assert.strictEqual(res.body.auditReference, res.body.receipt.id);
            assert.strictEqual(res.body.diagnosis.state, 'diagnosed');
        });

        it('should block unsupported commands before execution', async () => {
            const res = await request(app)
                .post('/proxy/command')
                .send({
                    tenant: 'nunncloud',
                    command: 'exec.deploy.toggle',
                    payload: {
                        principalId: 'user@example.com',
                        resource: 'prod/deployment/feature-x',
                    },
                });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, 'blocked');
            assert.strictEqual(res.body.bypassPrevented, true);
            assert.strictEqual(res.body.authorityCheckResult.allowed, false);
            assert.strictEqual(res.body.riskGateOutcome.decision, 'block');
            assert.strictEqual(res.body.receipt.status, 'rejected');
        });
    });

    describe('Receipt Endpoints', () => {
        const principal = 'user@example.com';

        it('should list receipts', async () => {
            const res = await request(app)
                .get('/api/executive/receipts')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(typeof res.body.data, 'object');
            assert.strictEqual(typeof res.body.total, 'number');
            assert.strictEqual(typeof res.body.skip, 'number');
            assert.strictEqual(typeof res.body.limit, 'number');
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/executive/receipts?skip=10&limit=20')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.skip, 10);
            assert.strictEqual(res.body.limit, 20);
        });

        it('should filter by status', async () => {
            const res = await request(app)
                .get('/api/executive/receipts?status=executed')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            // All returned receipts should have status 'executed' (if any)
            res.body.data.forEach((receipt: any) => {
                assert.strictEqual(receipt.status, 'executed');
            });
        });

        it('should filter by command', async () => {
            const res = await request(app)
                .get('/api/executive/receipts?command=repo.control.workflow.diagnose')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
        });

        it('should handle invalid skip/limit', async () => {
            const res = await request(app)
                .get('/api/executive/receipts?skip=-1')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 400);
        });

        it('should get receipt by ID', async () => {
            // First list to get an ID
            const listRes = await request(app)
                .get('/api/executive/receipts')
                .set('X-Principal-Id', principal);

            if (listRes.body.data.length > 0) {
                const receiptId = listRes.body.data[0].id;

                const res = await request(app)
                    .get(`/api/executive/receipts/${receiptId}`)
                    .set('X-Principal-Id', principal);

                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.data.id, receiptId);
            }
        });

        it('should return 404 for non-existent receipt', async () => {
            const res = await request(app)
                .get('/api/executive/receipts/nonexistent-id')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 404);
            assert.strictEqual(res.body.code, 'RECEIPT_NOT_FOUND');
        });

        it('should export receipts as JSON', async () => {
            const res = await request(app)
                .get('/api/executive/receipts/export?format=json')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('application/json'), true);
        });

        it('should export receipts as JSONL', async () => {
            const res = await request(app)
                .get('/api/executive/receipts/export?format=jsonl')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('application/x-ndjson'), true);
        });

        it('should export receipts as CSV', async () => {
            const res = await request(app)
                .get('/api/executive/receipts/export?format=csv')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('text/csv'), true);
            assert(res.text.includes('ID,Command,Tenant'));
        });

        it('should get receipt statistics', async () => {
            const res = await request(app)
                .get('/api/executive/receipts/stats?window=24h')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(typeof res.body.executedCount, 'number');
            assert.strictEqual(typeof res.body.blockedCount, 'number');
            assert.strictEqual(typeof res.body.avgRiskScore, 'number');
            assert(Array.isArray(res.body.topCommands));
            assert(Array.isArray(res.body.topExecutors));
        });
    });

    describe('Delegation Endpoints', () => {
        const principal = 'user@example.com';

        it('should list delegations', async () => {
            const res = await request(app)
                .get('/api/executive/delegations')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(typeof res.body.data, 'object');
            assert.strictEqual(typeof res.body.total, 'number');
        });

        it('should filter delegations by grantedTo', async () => {
            const res = await request(app)
                .get('/api/executive/delegations?grantedTo=user@example.com')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            // All results should have grantedTo='user@example.com' (if any)
            res.body.data.forEach((del: any) => {
                assert.strictEqual(del.grantedTo, 'user@example.com');
            });
        });

        it('should filter by command', async () => {
            const res = await request(app)
                .get('/api/executive/delegations?command=repo.control.workflow.diagnose')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
        });

        it('should get delegation by ID', async () => {
            // First list to get an ID
            const listRes = await request(app)
                .get('/api/executive/delegations')
                .set('X-Principal-Id', principal);

            if (listRes.body.data.length > 0) {
                const delId = listRes.body.data[0].id;

                const res = await request(app)
                    .get(`/api/executive/delegations/${delId}`)
                    .set('X-Principal-Id', principal);

                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.data.id, delId);
            }
        });

        it('should return 404 for non-existent delegation', async () => {
            const res = await request(app)
                .get('/api/executive/delegations/nonexistent-id')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 404);
            assert.strictEqual(res.body.code, 'DELEGATION_NOT_FOUND');
        });
    });

    describe('Risk Assessment Endpoints', () => {
        const principal = 'user@example.com';

        it('should get risk status', async () => {
            const res = await request(app)
                .get('/api/executive/risk/status')
                .set('X-Principal-Id', principal);

            assert(res.status === 200 || res.status === 503); // May fail if health unavailable
            assert.strictEqual(typeof res.body.overallScore, 'number');
            assert(['pass', 'warn', 'block'].includes(res.body.decision));
        });

        it('should get risk factors history', async () => {
            const res = await request(app)
                .get('/api/executive/risk/factors?window=24h')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert(Array.isArray(res.body.timeseries));
            assert(res.body.summary);
            assert.strictEqual(typeof res.body.summary.infraHealth, 'number');
        });

        it('should support different windows', async () => {
            const windows = ['1h', '6h', '24h', '7d', '30d'];

            for (const window of windows) {
                const res = await request(app)
                    .get(`/api/executive/risk/factors?window=${window}`)
                    .set('X-Principal-Id', principal);

                assert.strictEqual(res.status, 200);
            }
        });
    });

    describe('Closeout State Endpoints', () => {
        const principal = 'user@example.com';

        it('should get default closeout state', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/state')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.principalId, principal);
            assert.strictEqual(res.body.data.cadence.weeklyDay, 'sunday');
            assert.strictEqual(typeof res.body.data.gbpAttached, 'boolean');
        });

        it('should update closeout state', async () => {
            const res = await request(app)
                .put('/api/executive/closeout/state')
                .set('X-Principal-Id', principal)
                .send({
                    cadence: {
                        mode: 'weekly',
                        weeklyDay: 'sunday',
                    },
                    gbpAttached: true,
                    gbpReference: 'GBP-2026-07',
                    mobTemplateRequired: true,
                });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.cadence.mode, 'weekly');
            assert.strictEqual(res.body.data.cadence.weeklyDay, 'sunday');
            assert.strictEqual(res.body.data.gbpAttached, true);
            assert.strictEqual(res.body.data.gbpReference, 'GBP-2026-07');
        });

        it('should reject invalid closeout update payload', async () => {
            const res = await request(app)
                .put('/api/executive/closeout/state')
                .set('X-Principal-Id', principal)
                .send({
                    cadence: {
                        mode: 'weekly',
                        weeklyDay: 'funday',
                    },
                });

            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.code, 'INVALID_CLOSEOUT_PAYLOAD');
        });


        describe('Sentinel AI Remote Connector', () => {
            const principal = 'user@example.com';

            it('should report hosted Sentinel AI posture when no remote is configured', async () => {
                const prevBaseUrl = process.env.SENTINEL_AI_BASE_URL;
                const prevBearer = process.env.SENTINEL_AI_BEARER_TOKEN;

                delete process.env.SENTINEL_AI_BASE_URL;
                delete process.env.SENTINEL_AI_BEARER_TOKEN;

                try {
                    const res = await request(app)
                        .get('/api/executive/sentinel-ai/status')
                        .set('X-Principal-Id', principal);

                    assert.strictEqual(res.status, 200);
                    assert.strictEqual(res.body.data.remote.configured, false);
                    assert(Array.isArray(res.body.data.hardeningPaths));
                    assert(res.body.data.hardeningPaths.some((item: string) => item.includes('SENTINEL_AI_BASE_URL')));
                    assert(res.body.data.efficiencyPlan);
                    assert(Array.isArray(res.body.data.efficiencyPlan.costReduction));
                    assert(Array.isArray(res.body.data.efficiencyPlan.latencyReduction));
                    assert(Array.isArray(res.body.data.efficiencyPlan.computeOptimization));
                    assert(Array.isArray(res.body.data.efficiencyPlan.greenMode));
                    assert(Array.isArray(res.body.data.readyToGo));
                    assert(Array.isArray(res.body.data.focusAreas));
                    assert(Array.isArray(res.body.data.recommendedCourse));
                    assert(res.body.data.recommendedCourse.length > 0);
                } finally {
                    if (prevBaseUrl !== undefined) {
                        process.env.SENTINEL_AI_BASE_URL = prevBaseUrl;
                    } else {
                        delete process.env.SENTINEL_AI_BASE_URL;
                    }

                    if (prevBearer !== undefined) {
                        process.env.SENTINEL_AI_BEARER_TOKEN = prevBearer;
                    } else {
                        delete process.env.SENTINEL_AI_BEARER_TOKEN;
                    }
                }
            });

            it('should produce a course-setting scan payload', async () => {
                const res = await request(app)
                    .post('/api/executive/sentinel-ai/scan')
                    .set('X-Principal-Id', principal)
                    .send({ focus: 'hardening' });

                assert.strictEqual(res.status, 200);
                assert.strictEqual(typeof res.body.data.generatedAt, 'string');
                assert(Array.isArray(res.body.data.localSignals));
                assert(res.body.data.efficiencyPlan);
                assert(Array.isArray(res.body.data.readyToGo));
                assert(Array.isArray(res.body.data.focusAreas));
                assert(Array.isArray(res.body.data.recommendedCourse));
                assert(
                    res.body.data.recommendedCourse.some((item: string) =>
                        item.includes('No remote Sentinel AI endpoint') || item.includes('hosted service through Executive Desk'),
                    ),
                );
                assert(
                    res.body.data.readyToGo.some((item: string) =>
                        item.includes('Gate 6 to Gate 8') || item.includes('Government outreach binder'),
                    ),
                );
                assert(
                    res.body.data.focusAreas.some((item: string) =>
                        item.includes('government relationship building') || item.includes('pilot material'),
                    ),
                );
                assert(
                    res.body.data.recommendedCourse.some((item: string) =>
                        item.includes('operating cost') || item.includes('green energy module'),
                    ),
                );
                assert(
                    res.body.data.efficiencyPlan.costReduction.some((item: string) =>
                        item.includes('operating spend') || item.includes('idle services'),
                    ),
                );
                assert(
                    res.body.data.efficiencyPlan.greenMode.some((item: string) =>
                        item.includes('green energy module') || item.includes('carbon-aware'),
                    ),
                );
            });
        });
        it('should record MOB template run', async () => {
            const res = await request(app)
                .post('/api/executive/closeout/mob-runs')
                .set('X-Principal-Id', principal)
                .send({ status: 'completed' });

            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.data.status, 'completed');
            assert.strictEqual(res.body.data.principalId, principal);
        });

        it('should list MOB template runs', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/mob-runs?limit=5')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert(Array.isArray(res.body.data));
            assert.strictEqual(typeof res.body.total, 'number');
            assert.strictEqual(typeof res.body.summary.total, 'number');
            assert.strictEqual(typeof res.body.summary.successRate, 'number');
            assert(Array.isArray(res.body.timeseries));
        });

        it('should filter MOB template runs by status', async () => {
            await request(app)
                .post('/api/executive/closeout/mob-runs')
                .set('X-Principal-Id', principal)
                .send({ status: 'failed' });

            const res = await request(app)
                .get('/api/executive/closeout/mob-runs?status=failed&windowDays=30')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            res.body.data.forEach((row: any) => {
                assert.strictEqual(row.status, 'failed');
            });
        });

        it('should export MOB runs as CSV', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/mob-runs/export?format=csv&windowDays=30')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('text/csv'), true);
            assert(res.text.includes('ID,PrincipalId,Executor,Status,Timestamp,Notes'));
        });

        it('should export MOB runs as JSON', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/mob-runs/export?format=json')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('application/json'), true);
            assert(Array.isArray(res.body));
        });

        it('should reject invalid MOB export format', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/mob-runs/export?format=xml')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.code, 'INVALID_EXPORT_FORMAT');
        });

        it('should export closeout bundle as JSON', async () => {
            const res = await request(app)
                .get('/api/executive/closeout/export-bundle?windowDays=30&status=all')
                .set('X-Principal-Id', principal);

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.headers['content-type'].includes('application/json'), true);
            assert.strictEqual(res.body.principalId, principal);
            assert(res.body.exportedAt);
            assert(res.body.closeoutState);
            assert(Array.isArray(res.body.mobRuns.data));
            assert(res.body.mobRuns.summary);
            assert(Array.isArray(res.body.mobRuns.timeseries));
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown endpoint', async () => {
            const res = await request(app)
                .get('/api/executive/unknown')
                .set('X-Principal-Id', 'user@example.com');

            assert.strictEqual(res.status, 404);
            assert.strictEqual(res.body.code, 'NOT_FOUND');
        });

        it('should include request ID in response', async () => {
            const res = await request(app)
                .get('/api/executive/receipts')
                .set('X-Principal-Id', 'user@example.com');

            assert(res.headers['x-request-id']);
        });

        it('should include rate limit headers', async () => {
            const res = await request(app)
                .get('/api/executive/receipts')
                .set('X-Principal-Id', 'user@example.com');

            assert(res.headers['x-ratelimit-remaining']);
            assert(res.headers['x-ratelimit-reset']);
        });
    });
});
