#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const strictSec = String(process.env.GATE_SEC_001_STRICT || 'false').toLowerCase() === 'true';

const gates = [
    {
        id: 'SEC-001',
        name: 'Hosted Authentication Enforcement',
        objective: 'Reject missing/invalid credentials and allow valid credentials.',
        method: strictSec ? 'pnpm run check:sec-001:strict' : 'pnpm run check:sec-001',
        expectedResult: strictSec
            ? 'No key: 401/403, Invalid key: 401/403, Valid key: 200'
            : 'Baseline matrix captured and report artifact emitted',
        script: strictSec ? 'check:sec-001:strict' : 'check:sec-001',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'GOV-001',
        name: 'Governance Path Execution',
        objective: 'Verify policy and risk governance execute in the end-to-end control flow.',
        method: 'pnpm run check:executive-desk:e2e',
        expectedResult: 'Governed command path executes with authority/risk checks and mutating command blocks.',
        script: 'check:executive-desk:e2e',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'EVD-001',
        name: 'Evidence and Receipt Coverage',
        objective: 'Verify receipt generation and lookup for governed requests.',
        method: 'pnpm run check:receipts',
        expectedResult: 'Executed command produces auditable receipt retrievable by receipt ID.',
        script: 'check:receipts',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'TEN-001',
        name: 'Tenant Isolation',
        objective: 'Prove no cross-tenant data or action leakage under concurrent execution.',
        method: 'pnpm run check:ten-001',
        expectedResult: 'Cross-tenant access attempts are denied and fully audited.',
        script: 'check:ten-001',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'PER-001',
        name: 'Performance SLO',
        objective: 'Verify latency and throughput remain within approved SLO ranges.',
        method: 'pnpm run check:per-001',
        expectedResult: 'SLO thresholds hold and governance invariants remain 100 percent.',
        script: 'check:per-001',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'REC-001',
        name: 'Recovery and Resilience',
        objective: 'Validate graceful recovery from transient failures and restart scenarios.',
        method: 'pnpm run check:rec-001',
        expectedResult: 'System recovers from malformed input and policy blocks, restarts cleanly, and governed execution remains available.',
        script: 'check:rec-001',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'DRF-001',
        name: 'Governance Drift Control',
        objective: 'Validate drift governance core baselines, threshold controls, and policy ledger integrity.',
        method: 'pnpm run check:governance-drift-core',
        expectedResult: 'Drift monitor emits expected postures and ledger hash chain remains valid under config updates and acknowledgements.',
        script: 'check:governance-drift-core',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
    {
        id: 'XE-001',
        name: 'XE Governed Execution',
        objective: 'Validate target packet, recorded intent, and governed XE execute envelope/audit flow.',
        method: 'pnpm run check:xe-execute',
        expectedResult: 'XE execute returns EXECUTED with governed scan/fix/set stage results and auditable execution reference.',
        script: 'check:xe-execute',
        reviewer: process.env.GATE_REVIEWER || 'unassigned',
        implemented: true,
    },
];

function runScript(script) {
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const res = spawnSync('pnpm', ['run', script], { stdio: 'inherit', shell: true });

    return {
        status: res.status === 0 ? 'passed' : 'failed',
        exitCode: typeof res.status === 'number' ? res.status : 1,
        durationMs: Date.now() - t0,
        startedAt,
        finishedAt: new Date().toISOString(),
    };
}

function evaluateGate(gate) {
    if (!gate.implemented || !gate.script) {
        return {
            gateId: gate.id,
            gateName: gate.name,
            objective: gate.objective,
            method: gate.method,
            expectedResult: gate.expectedResult,
            observedResult: 'not_implemented',
            evidence: { script: null },
            pass: false,
            reviewer: gate.reviewer,
            timestamp: new Date().toISOString(),
            notes: ['Gate not yet implemented in automation.'],
        };
    }

    const exec = runScript(gate.script);

    let pass = exec.status === 'passed';
    const notes = [];

    if (gate.id === 'SEC-001') {
        const secReportPath = join(process.cwd(), 'docs', 'executive-desk', 'evidence', 'sec-001-auth-enforcement.json');
        try {
            const secReport = JSON.parse(readFileSync(secReportPath, 'utf8'));
            if (typeof secReport.pass === 'boolean') {
                pass = secReport.pass;
            }
            notes.push(`SEC-001 evaluated from artifact pass=${String(secReport.pass)}.`);
        } catch {
            pass = false;
            notes.push('SEC-001 artifact was missing or invalid; forcing gate failure.');
        }
    }

    return {
        gateId: gate.id,
        gateName: gate.name,
        objective: gate.objective,
        method: gate.method,
        expectedResult: gate.expectedResult,
        observedResult: `${exec.status} (exitCode=${exec.exitCode}, durationMs=${exec.durationMs})`,
        evidence: { script: gate.script, execution: exec },
        pass,
        reviewer: gate.reviewer,
        timestamp: new Date().toISOString(),
        notes,
    };
}

const startedAt = new Date().toISOString();
const reports = gates.map(evaluateGate);
const completedImplemented = reports.filter((r) => r.evidence.script !== null);
const passedImplemented = completedImplemented.filter((r) => r.pass).length;
const notImplemented = reports.filter((r) => r.evidence.script === null).length;

const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    strictSec001: strictSec,
    totals: {
        allGates: reports.length,
        implemented: completedImplemented.length,
        passedImplemented,
        failedImplemented: completedImplemented.length - passedImplemented,
        notImplemented,
    },
    reports,
};

const outDir = join(process.cwd(), 'docs', 'executive-desk', 'evidence');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'gate-certification-report.json');
writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`Gate certification report written: ${outPath}`);
console.log(`Implemented gates passed: ${passedImplemented}/${completedImplemented.length}`);

const failedImplemented = reports.some((r) => r.evidence.script !== null && !r.pass);
process.exit(failedImplemented ? 1 : 0);
