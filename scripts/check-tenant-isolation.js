#!/usr/bin/env node

const assert = require('assert');
const http = require('http');

const previousApiKeys = process.env.SENTINEL_API_KEYS;
const previousLegacyKey = process.env.SENTINEL_API_KEY;
const previousHmac = process.env.SENTINEL_HMAC_SECRET;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'tenant-isolation-passport-secret';
process.env.SENTINEL_API_KEYS = JSON.stringify([
    {
        keyId: 'key_ownerfi_tenant_test',
        secret: 'ownerfi-tenant-test-secret',
        tenant: 'ownerfi',
        actor: 'tenant-test-ownerfi@sentinel.local',
        role: 'approver',
        scopes: ['audit:read', 'receipt:read', 'application:submit'],
        status: 'active',
        expiresAt: '2099-01-01T00:00:00.000Z',
    },
    {
        keyId: 'key_platform_tenant_test',
        secret: 'platform-tenant-test-secret',
        tenant: 'platform',
        actor: 'tenant-test-platform@sentinel.local',
        role: 'platform',
        scopes: ['platform:admin', 'audit:read', 'receipt:read', 'application:submit', 'tenant:admin'],
        status: 'active',
        expiresAt: '2099-01-01T00:00:00.000Z',
    },
]);

const { server } = require('../apps/api/server');

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

function requestJson(port, method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';

        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: {
                    ...(body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
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

        if (payload) {
            req.write(payload);
        }

        req.end();
    });
}

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

async function main() {
    const port = await listen();

    try {
        const ownerHeaders = { authorization: 'Bearer ownerfi-tenant-test-secret' };
        const platformHeaders = { authorization: 'Bearer platform-tenant-test-secret' };

        const ownerTenantMetrics = await requestJson(port, 'GET', '/v1/metrics?tenant=ownerfi', ownerHeaders);
        assert.strictEqual(ownerTenantMetrics.statusCode, 200, 'Owner tenant should read own metrics');

        const crossTenantMetrics = await requestJson(port, 'GET', '/v1/metrics?tenant=nunncloud', ownerHeaders);
        assert.strictEqual(crossTenantMetrics.statusCode, 403, 'Owner tenant should be blocked on cross-tenant metrics');
        assert.strictEqual(crossTenantMetrics.body.status, 'blocked');
        assert.strictEqual(
            crossTenantMetrics.body.error,
            'TENANT_MISMATCH',
            `Expected TENANT_MISMATCH, got ${crossTenantMetrics.body.error}`,
        );

        const crossTenantCommand = await requestJson(
            port,
            'POST',
            '/v1/command',
            ownerHeaders,
            {
                tenant: 'nunncloud',
                command: 'application.submit',
                payload: {
                    name: 'Tenant Isolation Test',
                    amount: 12000,
                    creditScore: 700,
                },
            },
        );

        assert.strictEqual(crossTenantCommand.statusCode, 403, 'Owner tenant should be blocked on cross-tenant command execution');
        assert.strictEqual(crossTenantCommand.body.status, 'blocked');
        assert.strictEqual(
            crossTenantCommand.body.error,
            'TENANT_MISMATCH',
            `Expected TENANT_MISMATCH, got ${crossTenantCommand.body.error}`,
        );

        const platformCrossTenantMetrics = await requestJson(
            port,
            'GET',
            '/v1/metrics?tenant=nunncloud',
            platformHeaders,
        );

        assert.strictEqual(platformCrossTenantMetrics.statusCode, 200, 'Platform principal should be allowed cross-tenant metrics');

        console.log('TEN-001 tenant isolation check passed');
    } finally {
        await close();
        restoreEnv();
    }
}

main().catch(async (error) => {
    await close().catch(() => { });
    restoreEnv();
    console.error(error);
    process.exitCode = 1;
});
