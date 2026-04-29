const assert = require('assert');
const http = require('http');
const { server } = require('../apps/api/server');

const PORT = 3199;
const API_KEY = 'idempotency-secret';
const previousKeys = process.env.SENTINEL_API_KEYS;
const previousKey = process.env.SENTINEL_API_KEY;

process.env.SENTINEL_API_KEY = '';
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

  const first = await request('/v1/command', payload);
  assert.strictEqual(first.statusCode, 200);
  assert.strictEqual(first.body.status, 'executed');

  const second = await request('/v1/command', payload);
  assert.strictEqual(second.statusCode, 200);
  assert.strictEqual(second.body.status, 'executed');
  assert.strictEqual(second.body.idempotentReplay, true);
  assert.strictEqual(second.body.receipt.receiptId, first.body.receipt.receiptId);

  const conflict = await request('/v1/command', {
    ...payload,
    payload: {
      ...payload.payload,
      amount: 23000
    }
  });
  assert.strictEqual(conflict.statusCode, 409);
  assert.strictEqual(conflict.body.error, 'IDEMPOTENCY_CONFLICT');

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

  console.log('Idempotency check passed');
})().catch(async (error) => {
  await close().catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
