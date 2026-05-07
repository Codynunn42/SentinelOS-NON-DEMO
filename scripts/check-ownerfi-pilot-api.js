const assert = require('assert');
const { server } = require('../apps/api/server');

const TEST_KEY = 'ownerfi-pilot-test-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'pilot@ownerfi.test';
process.env.SENTINEL_API_KEY_ROLE = 'approver';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${TEST_KEY}`
  };

  try {
    const init = await fetch(`${base}/v1/workflow/init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runId: 'ownerfi_pilot_api_check',
        tasks: [
          { type: 'application.submit' },
          { type: 'deal.execute', amount: 15000 }
        ]
      })
    });
    const initBody = await init.json();
    assert.strictEqual(init.status, 202);
    assert.strictEqual(initBody.runId, 'ownerfi_pilot_api_check');
    assert.strictEqual(initBody.requiresApproval.length, 1);
    assert.strictEqual(initBody.blockedActions.length, 1);
    assert(initBody.telemetry);

    const blocked = await fetch(`${base}/v1/workflow/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runId: 'ownerfi_pilot_api_check',
        step: 'deal.execute'
      })
    });
    const blockedBody = await blocked.json();
    assert.strictEqual(blocked.status, 423);
    assert.strictEqual(blockedBody.status, 'BLOCKED');
    assert.strictEqual(blockedBody.requiredRole, 'approver');

    const resolved = await fetch(`${base}/v1/approvals/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runId: 'ownerfi_pilot_api_check',
        step: 'deal.execute',
        approved: true,
        reason: 'Pilot validation approval'
      })
    });
    const resolvedBody = await resolved.json();
    assert.strictEqual(resolved.status, 200);
    assert.strictEqual(resolvedBody.approval.status, 'approved');

    const executed = await fetch(`${base}/v1/workflow/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runId: 'ownerfi_pilot_api_check',
        step: 'deal.execute'
      })
    });
    const executedBody = await executed.json();
    assert.strictEqual(executed.status, 200);
    assert.strictEqual(executedBody.status, 'SUCCESS');

    const audit = await fetch(`${base}/v1/audit/ownerfi_pilot_api_check?tenant=ownerfi`, {
      headers: {
        authorization: `Bearer ${TEST_KEY}`
      }
    });
    const auditBody = await audit.json();
    assert.strictEqual(audit.status, 200);
    assert.strictEqual(auditBody.runId, 'ownerfi_pilot_api_check');
    assert(Array.isArray(auditBody.executionHistory));
    assert(Array.isArray(auditBody.approvals));
    assert(auditBody.telemetry);

    const telemetry = await fetch(`${base}/v1/telemetry/harmonize`, {
      method: 'POST',
      headers,
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
    const telemetryBody = await telemetry.json();
    assert.strictEqual(telemetry.status, 200);
    assert.strictEqual(telemetryBody.summary.safe, 1);
    assert.strictEqual(telemetryBody.summary.requiresApproval, 1);
    assert.strictEqual(telemetryBody.summary.blocked, 1);

    console.log('OwnerFi pilot API check passed');
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
