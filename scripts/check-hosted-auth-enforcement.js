#!/usr/bin/env node

/*
 * Hosted auth triad validator for Sentinel execute endpoint.
 *
 * Cases:
 * 1) No credentials
 * 2) Invalid credentials
 * 3) Valid credentials (if SENTINEL_AI_API_KEY is set)
 *
 * Optional strict mode:
 * REQUIRE_AUTH_ENFORCEMENT=true
 * In strict mode, script exits non-zero unless:
 * - no creds => 401/403
 * - invalid creds => 401/403
 * - valid creds => 200 (only checked when key exists)
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const defaultBaseUrl = 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io';
const baseUrl = (process.env.SENTINEL_BASE_URL || defaultBaseUrl).replace(/\/$/, '');
const apiKey = process.env.SENTINEL_AI_API_KEY || '';
const apiKeyHeader = process.env.SENTINEL_AI_API_KEY_HEADER || 'x-api-key';
const requireEnforcement = String(process.env.REQUIRE_AUTH_ENFORCEMENT || 'false').toLowerCase() === 'true';
const reviewer = process.env.GATE_REVIEWER || 'unassigned';
const reportPath = process.env.SEC001_REPORT_PATH || '';
const gateId = 'SEC-001';
const gateName = 'Hosted Authentication Enforcement';

const endpoint = `${baseUrl}/api/control/execute`;

function makePayload(sessionId) {
    return {
        intent: 'deal.execute',
        entity: 'deal',
        action: 'execute',
        context: { applicationId: 'auth-enforcement-test' },
        actor: { role: 'operator', userId: 'deal.operator@ownerfi.local' },
        tenantId: 'ownerfi',
        metadata: { sessionId, source: 'executive-desk' },
    };
}

async function callExecute(label, keyMode) {
    const headers = { 'content-type': 'application/json' };

    if (keyMode === 'invalid') {
        headers[apiKeyHeader] = 'definitely-invalid-key';
    }

    if (keyMode === 'valid' && apiKey) {
        headers[apiKeyHeader] = apiKey;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(makePayload(`auth-check-${label.toLowerCase().replace(/\s+/g, '-')}`)),
    });

    const text = await response.text();
    let body;

    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = { raw: text };
    }

    return {
        label,
        httpCode: response.status,
        hasApiKeyHeader: keyMode !== 'none',
        responseSummary: {
            status: body?.status || body?.result?.status || null,
            reason: body?.reason || body?.result?.reason || body?.error || null,
            decisionScore: body?.decisionScore || body?.result?.decisionScore || null,
        },
    };
}

function isAuthRejected(code) {
    return code === 401 || code === 403;
}

function printResult(result) {
    const summary = result.responseSummary;
    console.log(`${result.label}: HTTP ${result.httpCode} | status=${summary.status || 'n/a'} | reason=${summary.reason || 'n/a'} | score=${summary.decisionScore ?? 'n/a'}`);
}

function buildGateReport(results, matrix, pass, notes) {
    return {
        gateId,
        gateName,
        objective: 'Verify hosted execute endpoint enforces authentication and only accepts valid credentials.',
        method: 'Three-case probe against hosted /api/control/execute: no credentials, invalid credentials, and valid credentials when provided.',
        expectedResult: {
            noCredentials: '401 or 403',
            invalidCredentials: '401 or 403',
            validCredentials: '200',
        },
        observedResult: {
            noCredentials: matrix.noCredentials,
            invalidCredentials: matrix.invalidCredentials,
            validCredentials: matrix.validCredentials,
            details: results,
        },
        evidence: {
            endpoint,
            apiKeyHeader,
            apiKeyLoaded: Boolean(apiKey),
            strictMode: requireEnforcement,
            observedMatrix: matrix,
        },
        pass,
        reviewer,
        timestamp: new Date().toISOString(),
        notes,
    };
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

async function main() {
    console.log('Hosted Sentinel Auth Enforcement Check');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`API key header: ${apiKeyHeader}`);
    console.log(`API key loaded: ${apiKey ? 'yes' : 'no'}`);
    console.log(`Strict enforcement mode: ${requireEnforcement ? 'on' : 'off'}`);
    console.log('');

    const results = [];
    results.push(await callExecute('No Credentials', 'none'));
    results.push(await callExecute('Invalid Credentials', 'invalid'));

    if (apiKey) {
        results.push(await callExecute('Valid Credentials', 'valid'));
    }

    for (const result of results) {
        printResult(result);
    }

    const matrix = {
        noCredentials: results.find((r) => r.label === 'No Credentials')?.httpCode ?? null,
        invalidCredentials: results.find((r) => r.label === 'Invalid Credentials')?.httpCode ?? null,
        validCredentials: results.find((r) => r.label === 'Valid Credentials')?.httpCode ?? null,
    };

    console.log('');
    console.log('Observed Matrix:', JSON.stringify(matrix));

    const enforcementOk =
        isAuthRejected(matrix.noCredentials) &&
        isAuthRejected(matrix.invalidCredentials) &&
        (matrix.validCredentials === null || matrix.validCredentials === 200);

    const pass = enforcementOk;
    const notes = [];

    if (!apiKey) {
        notes.push('Valid credential case was skipped because SENTINEL_AI_API_KEY was not set.');
    }

    if (!isAuthRejected(matrix.noCredentials) || !isAuthRejected(matrix.invalidCredentials)) {
        notes.push('Authentication enforcement was not observed for at least one unauthenticated or invalid-credential case.');
    }

    const report = buildGateReport(results, matrix, pass, notes);
    await writeReportIfRequested(report);

    if (!requireEnforcement) {
        return;
    }

    if (!enforcementOk) {
        console.error('Auth enforcement check FAILED in strict mode.');
        process.exit(1);
    }

    console.log('Auth enforcement check PASSED in strict mode.');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Auth check failed: ${message}`);
    process.exit(1);
});
