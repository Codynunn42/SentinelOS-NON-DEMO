const assert = require('assert');

const TEST_KEY = 'proof-ui-flow-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'proof-ui-flow-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'proof-ui-flow@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'approver';

const { server } = require('../apps/api/server');

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function execute(base, intent, context, role = 'operator') {
  const response = await fetch(`${base}/api/control/execute`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': TEST_KEY
    },
    body: JSON.stringify({
      intent,
      entity: 'deal',
      action: intent.split('.')[1],
      context,
      actor: { role, userId: `${role}@ownerfi.local` },
      tenantId: 'ownerfi',
      metadata: { sessionId: 'proof-ui-flow' }
    })
  });

  return {
    statusCode: response.status,
    body: await response.json()
  };
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;

  try {
    const submit = await execute(base, 'deal.submit', {
      name: 'Jordan Lee',
      vehicle: '2022 Ford F-150',
      amount: 42000,
      creditScore: 612
    });
    assert.strictEqual(submit.statusCode, 200);
    assert.strictEqual(submit.body.result.status, 'submitted');
    assert.strictEqual(submit.body.result.reason, 'submitted');
    assert.ok(Array.isArray(submit.body.result.alerts));
    assert.strictEqual(typeof submit.body.result.decisionScore, 'number');

    const applicationId = submit.body.result.applicationId;
    assert.ok(applicationId);

    const blocked = await execute(base, 'deal.execute', { applicationId });
    assert.strictEqual(blocked.statusCode, 200);
    assert.strictEqual(blocked.body.result.status, 'blocked');
    assert.strictEqual(blocked.body.result.reason, 'approval_required');
    assert.ok(blocked.body.result.alerts.includes('approval_required'));

    const approve = await execute(base, 'deal.approve', { applicationId }, 'approver');
    assert.strictEqual(approve.statusCode, 200);
    assert.strictEqual(approve.body.result.status, 'approved');

    const executed = await execute(base, 'deal.execute', { applicationId }, 'approver');
    assert.strictEqual(executed.statusCode, 200);
    assert.strictEqual(executed.body.result.status, 'executed');
    assert.ok(Array.isArray(executed.body.result.alerts));
    assert.ok(executed.body.result.dealId);

    const authority = await fetch(`${base}/api/authority/status`);
    const authorityBody = await authority.json();
    assert.strictEqual(authority.status, 200);
    assert.strictEqual(authorityBody.authority, 'ENFORCED');
    assert.strictEqual(authorityBody.lastAllowed.command, 'deal.execute');
    assert.strictEqual(authorityBody.nextAction, null);

    console.log(JSON.stringify({
      status: 'proof-ui-flow-check-passed',
      applicationId,
      dealId: executed.body.result.dealId,
      blockedStatus: blocked.body.result.status,
      executedStatus: executed.body.result.status
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
