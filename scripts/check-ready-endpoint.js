const assert = require('assert');
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
    const response = await fetch(`${base}/ready`);
    const body = await response.json();

    assert([200, 503].includes(response.status));
    assert.strictEqual(typeof body.ready, 'boolean');
    assert.strictEqual(body.service, 'sentinel-api');
    assert.strictEqual(body.mode, 'non-demo');
    assert(body.checks);
    assert.strictEqual(body.checks.policyPack, 'loaded');
    assert.strictEqual(body.checks.auditStore, 'ok');
    assert.strictEqual(body.checks.signalsStore, 'ok');
    assert(body.version);
    assert(body.commit);
    assert(body.timestamp);

    if (body.database === 'disabled') {
      assert.strictEqual(response.status, 503);
      assert.strictEqual(body.ready, false);
      assert.strictEqual(body.checks.database, 'missing');
    } else {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.ready, true);
      assert.strictEqual(body.checks.database, 'ok');
    }

    console.log('Ready endpoint check passed');
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
