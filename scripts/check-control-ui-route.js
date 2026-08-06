const assert = require('assert');

const TEST_KEY = 'control-ui-route-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'control-ui-route-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'control-ui-route@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'operator';

const { server } = require('../apps/api/server');

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;

  try {
    const unauthorized = await fetch(`${base}/api/control/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'deal.execute',
        entity: 'deal',
        action: 'execute',
        context: { dealId: 'demo-123' },
        actor: {
          role: 'operator',
          userId: 'control-ui-route@nunncloud.local'
        },
        tenantId: 'ownerfi',
        metadata: { sessionId: 'control-ui-route-no-key' }
      })
    });
    const unauthorizedBody = await unauthorized.json();

    assert.strictEqual(unauthorized.status, 401);
    assert.strictEqual(unauthorizedBody.status, 'blocked');
    assert.strictEqual(unauthorizedBody.error, 'Unauthorized');

    const invalid = await fetch(`${base}/api/control/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'definitely-invalid-key'
      },
      body: JSON.stringify({
        intent: 'deal.execute',
        entity: 'deal',
        action: 'execute',
        context: { dealId: 'demo-123' },
        actor: {
          role: 'operator',
          userId: 'control-ui-route@nunncloud.local'
        },
        tenantId: 'ownerfi',
        metadata: { sessionId: 'control-ui-route-invalid-key' }
      })
    });
    const invalidBody = await invalid.json();

    assert.strictEqual(invalid.status, 401);
    assert.strictEqual(invalidBody.status, 'blocked');
    assert.strictEqual(invalidBody.error, 'Unauthorized');

    const response = await fetch(`${base}/api/control/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': TEST_KEY
      },
      body: JSON.stringify({
        intent: 'deal.execute',
        entity: 'deal',
        action: 'execute',
        context: { dealId: 'demo-123' },
        actor: {
          role: 'operator',
          userId: 'control-ui-route@nunncloud.local'
        },
        tenantId: 'ownerfi',
        metadata: { sessionId: 'control-ui-route' }
      })
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.envelope.command, 'deal.execute');
    assert.strictEqual(body.envelope.tenant, 'ownerfi');
    assert.strictEqual(body.envelope.metadata.tenantId, 'ownerfi');
    assert.ok(body.result.status);
    assert.ok(['submitted', 'blocked', 'approved', 'executed'].includes(body.result.status));
    assert.strictEqual(typeof body.result.decisionScore, 'number');
    assert.ok(Array.isArray(body.result.alerts));

    console.log(JSON.stringify({
      status: 'control-ui-route-check-passed',
      route: '/api/control/execute',
      command: body.envelope.command,
      sentinelStatus: body.result.status,
      responseStatus: response.status
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
