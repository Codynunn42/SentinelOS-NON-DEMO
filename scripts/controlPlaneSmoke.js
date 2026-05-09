const assert = require('assert');
const { server } = require('../apps/api/server');
const { executeIntent } = require('../apps/sentinel/src/controlPlane');

const TEST_KEY = 'control-plane-smoke-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'control-plane-smoke-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'control-plane-smoke@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'operator';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const port = await listen();
  const endpoint = `http://127.0.0.1:${port}/v1/command`;

  try {
    const result = await executeIntent({
      intent: 'deal.execute',
      entity: 'deal',
      action: 'execute',
      context: { dealId: 'demo-123' },
      actor: { role: 'operator', userId: 'control-plane-smoke@nunncloud.local' },
      tenantId: 'ownerfi',
      metadata: { sessionId: 'control-plane-smoke' }
    }, {
      endpoint,
      apiKey: TEST_KEY
    });

    assert.strictEqual(result.envelope.command, 'deal.execute');
    assert.strictEqual(result.envelope.tenant, 'ownerfi');
    assert.strictEqual(result.envelope.metadata.tenantId, 'ownerfi');
    assert.ok([200, 400, 403].includes(result.statusCode));
    assert.ok(result.result.status);

    console.log(JSON.stringify({
      status: 'control-plane-smoke-complete',
      command: result.envelope.command,
      tenant: result.envelope.tenant,
      route: '/v1/command',
      responseStatus: result.statusCode,
      responseState: result.result.status
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
