const assert = require('assert');
const fs = require('fs');

const DEFAULT_BASE = 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io';

const base = process.env.SENTINEL_LIVE_BASE || DEFAULT_BASE;
const key =
  process.env.SENTINEL_LIVE_API_KEY ||
  (process.env.SENTINEL_LIVE_API_KEY_FILE
    ? fs.readFileSync(process.env.SENTINEL_LIVE_API_KEY_FILE, 'utf8').trim()
    : '');

if (!key) {
  throw new Error('Set SENTINEL_LIVE_API_KEY or SENTINEL_LIVE_API_KEY_FILE.');
}

const runId = `ownerfi_live_${Date.now()}`;
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${key}`
};

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${key}`,
      ...(options.body ? headers : {}),
      ...(options.headers || {})
    }
  });

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  return { status: response.status, body };
}

async function main() {
  const init = await request('/v1/workflow/init', {
    method: 'POST',
    body: JSON.stringify({
      runId,
      tasks: [
        { type: 'application.submit' },
        { type: 'deal.execute', amount: 15000 }
      ]
    })
  });
  assert.strictEqual(init.status, 202);
  assert.strictEqual(init.body.runId, runId);
  assert.strictEqual(init.body.requiresApproval.length, 1);
  assert.strictEqual(init.body.blockedActions.length, 1);
  assert(init.body.telemetry);

  const blocked = await request('/v1/workflow/execute', {
    method: 'POST',
    body: JSON.stringify({
      runId,
      step: 'deal.execute'
    })
  });
  assert.strictEqual(blocked.status, 423);
  assert.strictEqual(blocked.body.status, 'BLOCKED');
  assert.strictEqual(blocked.body.requiredRole, 'approver');

  const resolved = await request('/v1/approvals/resolve', {
    method: 'POST',
    body: JSON.stringify({
      runId,
      step: 'deal.execute',
      approved: true,
      reason: 'Live deployment validation approval'
    })
  });
  assert.strictEqual(resolved.status, 200);
  assert.strictEqual(resolved.body.approval.status, 'approved');

  const executed = await request('/v1/workflow/execute', {
    method: 'POST',
    body: JSON.stringify({
      runId,
      step: 'deal.execute'
    })
  });
  assert.strictEqual(executed.status, 200);
  assert.strictEqual(executed.body.status, 'SUCCESS');

  const audit = await request(`/v1/audit/${runId}?tenant=ownerfi`);
  assert.strictEqual(audit.status, 200);
  assert.strictEqual(audit.body.runId, runId);
  assert(Array.isArray(audit.body.executionHistory));
  assert(Array.isArray(audit.body.approvals));
  assert(audit.body.telemetry);

  const telemetry = await request('/v1/telemetry/harmonize', {
    method: 'POST',
    body: JSON.stringify({
      telemetryState: 'LIMITED',
      tenant: 'ownerfi',
      activities: [
        { type: 'workflow.metrics' },
        { type: 'deal.execution' },
        { type: 'external.export' }
      ]
    })
  });
  assert.strictEqual(telemetry.status, 200);
  assert.strictEqual(telemetry.body.summary.safe, 1);
  assert.strictEqual(telemetry.body.summary.requiresApproval, 1);
  assert.strictEqual(telemetry.body.summary.blocked, 1);

  console.log(
    JSON.stringify(
      {
        status: 'passed',
        base,
        runId,
        workflowInit: init.status,
        blockedExecution: blocked.status,
        approval: resolved.body.approval.status,
        approvedExecution: executed.status,
        audit: audit.status,
        telemetry: telemetry.body.summary
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
