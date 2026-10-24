const assert = require('assert');
const http = require('http');

const PORT = 3199;
const API_KEY = 'idempotency-secret';
const previousDatabaseUrl = process.env.DATABASE_URL;
const previousKeys = process.env.SENTINEL_API_KEYS;
const previousKey = process.env.SENTINEL_API_KEY;
const previousHmac = process.env.SENTINEL_HMAC_SECRET;

process.env.DATABASE_URL = '';
process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'idempotency-passport-secret';
process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_ownerfi_approver_idempotency',
    secret: API_KEY,
    tenant: 'ownerfi',
    actor: 'idempotency-check@ownerfi.test',
    role: 'approver',
    scopes: ['application:submit', 'receipt:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
]);

const { server } = require('../apps/api/server');

function request(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-api-key': API_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function listen() {
  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', resolve);
  });
}

function close() {
  return new Promise((resolve) => {
    server.close(resolve);
  });
}

(async () => {
  await listen();

  const payload = {
    commandId: 'idem-local-check-001',
    tenant: 'ownerfi',
    command: 'application.submit',
    payload: {
      name: 'Idempotency Check',
      vehicle: '2022 Honda CR-V',
      amount: 22000,
      creditScore: 710
    }
  };

  const missingKey = await request('/v1/command', {
    ...payload,
    commandId: undefined
  });
  assert.strictEqual(missingKey.statusCode, 400);
  assert.strictEqual(missingKey.body.error, 'IDEMPOTENCY_KEY_REQUIRED');

  const first = await request('/v1/command', payload);
  assert.strictEqual(first.statusCode, 503);
  assert.strictEqual(first.body.error, 'EXECUTION_JOURNAL_UNAVAILABLE');

  const second = await request('/v1/command', payload);
  assert.strictEqual(second.statusCode, 503);
  assert.strictEqual(second.body.error, 'EXECUTION_JOURNAL_UNAVAILABLE');

  const conflict = await request('/v1/command', {
    ...payload,
    payload: {
      ...payload.payload,
      amount: 23000
    }
  });
  assert.strictEqual(conflict.statusCode, 503);
  assert.strictEqual(conflict.body.error, 'EXECUTION_JOURNAL_UNAVAILABLE');

  await close();

  if (previousKeys === undefined) {
    delete process.env.SENTINEL_API_KEYS;
  } else {
    process.env.SENTINEL_API_KEYS = previousKeys;
  }

  if (previousKey === undefined) {
    delete process.env.SENTINEL_API_KEY;
  } else {
    process.env.SENTINEL_API_KEY = previousKey;
  }

  if (previousHmac === undefined) {
    delete process.env.SENTINEL_HMAC_SECRET;
  } else {
    process.env.SENTINEL_HMAC_SECRET = previousHmac;
  }

  if (previousDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previousDatabaseUrl;
  }

  console.log('Idempotency fail-closed check passed');
})().catch(async (error) => {
  await close().catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
