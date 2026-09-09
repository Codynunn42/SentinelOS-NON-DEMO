const assert = require('assert');
const http = require('http');
const { server } = require('../apps/api/server');

const API_KEY = 'json-body-validation-secret';
const previousKeys = process.env.SENTINEL_API_KEYS;

process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_platform_admin_json_body_validation',
    secret: API_KEY,
    tenant: 'platform',
    actor: 'json-body-validation@sentinel.test',
    role: 'admin',
    scopes: ['platform:admin'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
]);

function request(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/command',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-api-key': API_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
    });

    req.on('error', reject);
    req.end(body);
  });
}

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function main() {
  const port = await listen();

  try {
    for (const body of ['null', '[]', '"not-an-object"']) {
      const response = await request(port, body);
      assert.strictEqual(response.statusCode, 400, `Expected a 400 response for ${body}`);
      assert.strictEqual(response.body.error, 'Invalid JSON body');
    }

    const oversizedResponse = await request(port, JSON.stringify({ payload: 'x'.repeat(1024 * 1024) }));
    assert.strictEqual(oversizedResponse.statusCode, 400);
    assert.strictEqual(oversizedResponse.body.error, 'Invalid JSON body');

    console.log('JSON body validation check passed');
  } finally {
    await new Promise((resolve) => server.close(resolve));

    if (previousKeys === undefined) {
      delete process.env.SENTINEL_API_KEYS;
    } else {
      process.env.SENTINEL_API_KEYS = previousKeys;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
