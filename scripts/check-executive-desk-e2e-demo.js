#!/usr/bin/env node

const { spawn } = require('node:child_process');

const host = '127.0.0.1';
const port = process.env.EXECUTIVE_DESK_E2E_CHECK_PORT || '3148';
const baseUrl = `http://${host}:${port}`;
const principal = 'user@example.com';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = text;
    }
  }
  return { response, payload, text };
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const { response } = await request('/health');
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await wait(250);
  }

  throw new Error(`Executive Desk server did not become ready: ${lastError?.message || 'timeout'}`);
}

async function runChecks() {
  const reportingTimestamp = new Date().toISOString();
  const commandRequest = {
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    payload: {
      principalId: principal,
      repository: 'Codynunn42/SentinelOS-NON-DEMO',
      workflowName: 'Sentinel Actions Diagnostic',
      runId: 'gate-8-e2e-demo',
      context: {
        gate: 'GATE_8_E2E_DEMO',
        mode: 'read_only_local_demo',
      },
    },
  };

  const command = await request('/proxy/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commandRequest),
  });

  assert(command.response.status === 200, `/proxy/command returned ${command.response.status}: ${command.text}`);

  const result = command.payload;
  assert(result.status === 'executed', 'command did not execute');
  assert(result.command === 'repo.control.workflow.diagnose', 'unexpected command echo');
  assert(result.executionMode === 'read_only_diagnosis', 'unexpected execution mode');
  assert(result.bypassPrevented === false, 'bypassPrevented should be false for passing read-only command');
  assert(result.authorityCheckResult?.allowed === true, 'authority check did not pass');
  assert(result.authorityCheckResult?.principalId === principal, 'authority principal mismatch');
  assert(Array.isArray(result.authorityCheckResult?.requiredApprovers), 'authority requiredApprovers missing');
  assert(result.riskGateOutcome?.decision === 'pass', 'risk gate did not pass');
  assert(result.riskGateOutcome?.score === 0.05, 'risk score mismatch');
  assert(result.trustScore >= 0.95, 'trust score below expected local demo threshold');
  assert(result.receipt?.status === 'executed', 'receipt status mismatch');
  assert(result.receipt?.signature, 'receipt signature missing');
  assert(result.auditReference === result.receipt.id, 'auditReference does not match receipt id');
  assert(result.diagnosis?.state === 'diagnosed', 'diagnosis state missing');
  assert(Array.isArray(result.diagnosis?.findings), 'diagnosis findings missing');
  assert(result.diagnosis.findings.includes('No mutations performed'), 'no-mutation finding missing');

  const receiptLookup = await request(`/api/executive/receipts/${result.auditReference}`, {
    headers: { 'X-Principal-Id': principal },
  });

  assert(
    receiptLookup.response.status === 200,
    `receipt lookup returned ${receiptLookup.response.status}: ${receiptLookup.text}`,
  );
  assert(receiptLookup.payload?.data?.id === result.auditReference, 'receipt lookup id mismatch');
  assert(receiptLookup.payload?.data?.signature === result.receipt.signature, 'receipt signature lookup mismatch');

  const stats = await request('/api/executive/receipts/stats?window=24h', {
    headers: { 'X-Principal-Id': principal },
  });
  assert(stats.response.status === 200, `receipt stats returned ${stats.response.status}: ${stats.text}`);
  assert(typeof stats.payload?.executedCount === 'number', 'receipt stats missing executedCount');

  const blocked = await request('/proxy/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant: 'nunncloud',
      command: 'exec.deploy.toggle',
      payload: {
        principalId: principal,
        resource: 'prod/deployment/feature-x',
      },
    }),
  });

  assert(blocked.response.status === 200, `blocked command returned ${blocked.response.status}: ${blocked.text}`);
  assert(blocked.payload?.status === 'blocked', 'unsupported command was not blocked');
  assert(blocked.payload?.bypassPrevented === true, 'unsupported command did not prevent bypass');
  assert(blocked.payload?.receipt?.status === 'rejected', 'unsupported command receipt was not rejected');

  console.log('Executive Desk Gate 8 E2E demo passed');
  console.log(`Command audit reference: ${result.auditReference}`);
  console.log(`Logged at: ${reportingTimestamp}`);
  console.log(`Verified receipt lookup: ${baseUrl}/api/executive/receipts/${result.auditReference}`);
}

async function main() {
  const child = spawn('pnpm', ['exec', 'tsx', 'apps/executive-desk/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_HOST: host,
      API_PORT: port,
      RECEIPT_LEDGER_BACKEND: 'memory',
      IDENTITY_GRAPH_PROVIDER: 'mock',
      RISK_GATE_PROVIDER: 'mock',
      DELEGATION_RULES_BACKEND: 'memory',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    await runChecks();
  } finally {
    child.kill('SIGTERM');
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
