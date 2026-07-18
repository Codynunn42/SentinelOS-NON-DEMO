#!/usr/bin/env node

const assert = require('assert');
const http = require('http');
const fs = require('node:fs/promises');
const path = require('node:path');

const gateId = 'REC-001';
const gateName = 'Recovery and Resilience';
const reviewer = process.env.GATE_REVIEWER || 'unassigned';
const reportPath = process.env.REC001_REPORT_PATH || '';

const previousApiKeys = process.env.SENTINEL_API_KEYS;
const previousLegacyKey = process.env.SENTINEL_API_KEY;
const previousHmac = process.env.SENTINEL_HMAC_SECRET;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'recovery-resilience-passport-secret';
process.env.SENTINEL_API_KEYS = JSON.stringify([
    {
        keyId: 'key_ownerfi_recovery_test',
        secret: 'ownerfi-recovery-test-secret',
        tenant: 'ownerfi',
        actor: 'recovery-test-ownerfi@sentinel.local',
        role: 'approver',
        scopes: ['application:submit', 'audit:read', 'receipt:read'],
        status: 'active',
        expiresAt: '2099-01-01T00:00:00.000Z',
    },
]);

const { server } = require('../apps/api/server');

function restoreEnv() {
    if (previousApiKeys === undefined) {
        delete process.env.SENTINEL_API_KEYS;
    } else {
        process.env.SENTINEL_API_KEYS = previousApiKeys;
    }

    if (previousLegacyKey === undefined) {
        delete process.env.SENTINEL_API_KEY;
    } else {
        process.env.SENTINEL_API_KEY = previousLegacyKey;
    }

    if (previousHmac === undefined) {
        delete process.env.SENTINEL_HMAC_SECRET;
    } else {
        process.env.SENTINEL_HMAC_SECRET = previousHmac;
    }
}

function listen() {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            resolve(address.port);
        });
    });
}

function close() {
    return new Promise((resolve) => {
        server.close(() => resolve());
    });
}

function requestRaw(port, method, path, headers = {}, body = '') {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: {
                    ...(body ? { 'content-length': Buffer.byteLength(body) } : {}),
                    ...headers,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    let parsed;
                    try {
                        parsed = data ? JSON.parse(data) : {};
                    } catch {
                        parsed = { raw: data };
                    }
                    resolve({ statusCode: res.statusCode, body: parsed });
                });
            },
        );

        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

function requestJson(port, method, path, headers = {}, body = null) {
    const payload = body ? JSON.stringify(body) : '';
    return requestRaw(port, method, path, {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...headers,
    }, payload);
}

async function writeReportIfRequested(report) {
    if (!reportPath) {
        return;
    }

    const targetPath = path.isAbsolute(reportPath)
        ? reportPath
        : path.join(process.cwd(), reportPath);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Report written: ${targetPath}`);
}

async function assertHealth(port) {
    const health = await requestJson(port, 'GET', '/health');
    assert.strictEqual(health.statusCode, 200, 'Health endpoint should be available');
    assert.strictEqual(health.body.status, 'ok', 'Health payload should report ok');
}

async function assertValidCommand(port) {
    const response = await requestJson(
        port,
        'POST',
        '/v1/command',
        { authorization: 'Bearer ownerfi-recovery-test-secret' },
        {
            tenant: 'ownerfi',
            command: 'application.submit',
            payload: {
                name: 'Recovery Resilience Test',
                vehicle: '2024 Recovery Fleet Unit',
                amount: 15000,
                creditScore: 705,
            },
        },
    );

    assert.strictEqual(response.statusCode, 200, 'Valid command should execute after recovery');
    assert.strictEqual(response.body.status, 'executed', 'Valid command should remain governed and executed');
    assert.ok(response.body.receipt, 'Executed command should include receipt');
}

async function main() {
    const observations = [];
    const startedAt = new Date().toISOString();
    let port = await listen();

    try {
        await assertHealth(port);
        observations.push('initial_health_ok');

        const invalidJson = await requestRaw(
            port,
            'POST',
            '/v1/command',
            {
                authorization: 'Bearer ownerfi-recovery-test-secret',
                'content-type': 'application/json',
            },
            '{"tenant":"ownerfi",',
        );

        assert.strictEqual(invalidJson.statusCode, 400, 'Invalid JSON should return 400');
        assert.strictEqual(invalidJson.body.error, 'Invalid JSON body');
        observations.push('invalid_json_blocked');

        await assertHealth(port);
        observations.push('post_invalid_json_health_ok');

        const crossTenant = await requestJson(
            port,
            'POST',
            '/v1/command',
            { authorization: 'Bearer ownerfi-recovery-test-secret' },
            {
                tenant: 'nunncloud',
                command: 'application.submit',
                payload: {
                    name: 'Recovery Cross Tenant Test',
                    vehicle: '2024 Recovery Boundary Unit',
                    amount: 12000,
                    creditScore: 690,
                },
            },
        );

        assert.strictEqual(crossTenant.statusCode, 403, 'Cross-tenant command should be denied');
        assert.strictEqual(crossTenant.body.status, 'blocked');
        assert.strictEqual(crossTenant.body.error, 'TENANT_MISMATCH');
        observations.push('cross_tenant_blocked');

        await assertValidCommand(port);
        observations.push('post_failure_valid_command_ok');

        await close();
        observations.push('first_server_close_ok');

        port = await listen();
        observations.push('server_restart_ok');

        await assertHealth(port);
        observations.push('post_restart_health_ok');

        await assertValidCommand(port);
        observations.push('post_restart_valid_command_ok');

        const report = {
            gateId,
            gateName,
            objective: 'Validate graceful recovery from malformed requests, policy-blocked requests, and clean process restart while governed execution remains available.',
            method: 'Exercise invalid JSON, cross-tenant denial, post-failure valid execution, server close/restart, and post-restart valid execution against the local API server.',
            expectedResult: {
                invalidJson: '400 and server remains healthy',
                crossTenantCommand: '403 TENANT_MISMATCH',
                postFailureValidCommand: '200 executed with receipt',
                restart: 'server returns to healthy state and valid command still executes',
            },
            observedResult: {
                status: 'passed',
                observations,
            },
            evidence: {
                script: 'scripts/check-recovery-resilience.js',
                scope: 'single-process local API resilience slice',
            },
            pass: true,
            reviewer,
            timestamp: new Date().toISOString(),
            startedAt,
            notes: [
                'REC-001 validates graceful recovery and restart behavior, not durable evidence persistence across process restarts.',
            ],
        };

        await writeReportIfRequested(report);
        console.log(JSON.stringify(report, null, 2));
    } finally {
        await close().catch(() => { });
        restoreEnv();
    }
}

main().catch(async (error) => {
    await close().catch(() => { });
    restoreEnv();
    console.error(error);
    process.exitCode = 1;
});
