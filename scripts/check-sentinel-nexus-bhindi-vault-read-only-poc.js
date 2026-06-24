const assert = require('assert');
const http = require('http');
const { server } = require('../apps/api/server');
const { listTraces } = require('../apps/sentinel/src/audit/executionTrace');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');

const PORT = 3201;
const API_KEY = 'fixture-retrieval-poc-secret';
const previousKeys = process.env.SENTINEL_API_KEYS;
const previousKey = process.env.SENTINEL_API_KEY;
const previousHmac = process.env.SENTINEL_HMAC_SECRET;
const previousPocEnabled = process.env.SENTINEL_FIXTURE_RETRIEVAL_POC_ENABLED;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'fixture-retrieval-poc-passport-secret';
process.env.SENTINEL_FIXTURE_RETRIEVAL_POC_ENABLED = 'true';
process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_nunncloud_fixture_retrieval_poc',
    secret: API_KEY,
    tenant: 'nunncloud',
    actor: 'fixture-retrieval-poc@nunncloud.test',
    role: 'platform',
    scopes: ['platform:admin', 'audit:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
]);

function request(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/v1/command',
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
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        body: JSON.parse(data)
      }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function listen() {
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
}

function close() {
  return new Promise((resolve) => server.close(resolve));
}

function restoreEnvironment() {
  if (previousKeys === undefined) delete process.env.SENTINEL_API_KEYS;
  else process.env.SENTINEL_API_KEYS = previousKeys;

  if (previousKey === undefined) delete process.env.SENTINEL_API_KEY;
  else process.env.SENTINEL_API_KEY = previousKey;

  if (previousHmac === undefined) delete process.env.SENTINEL_HMAC_SECRET;
  else process.env.SENTINEL_HMAC_SECRET = previousHmac;

  if (previousPocEnabled === undefined) delete process.env.SENTINEL_FIXTURE_RETRIEVAL_POC_ENABLED;
  else process.env.SENTINEL_FIXTURE_RETRIEVAL_POC_ENABLED = previousPocEnabled;
}

(async () => {
  await listen();

  const commandId = 'fixture-retrieval-poc-001';
  const payload = {
    commandId,
    tenant: 'nunncloud',
    command: 'vault.retrieve',
    payload: {
      capsuleId: 'NAV-TASKS',
      resource: 'logs',
      order: 'latest',
      limit: 10,
      mode: 'fixture_only'
    }
  };

  const first = await request(payload);
  assert.strictEqual(first.statusCode, 200);
  assert.strictEqual(first.body.status, 'executed');
  assert.strictEqual(first.body.resultCount, 10);
  assert.strictEqual(first.body.records.length, 10);
  assert.strictEqual(first.body.records[0].id, 'nav-task-log-012');
  assert.deepStrictEqual(first.body.isolation, {
    networkAccess: false,
    externalConnector: false,
    productionVault: false,
    writes: false
  });
  assert.deepStrictEqual(first.body.route, [
    'Sentinel_approval',
    'Nexus_fixture_router',
    'Bhindi_fixture_executor',
    'Vault_fixture_adapter',
    'audit_log_creation'
  ]);

  const replay = await request(payload);
  assert.strictEqual(replay.statusCode, 200);
  assert.strictEqual(replay.body.idempotentReplay, true);
  assert.strictEqual(replay.body.resultCount, 10);

  const conflict = await request({
    ...payload,
    payload: {
      ...payload.payload,
      limit: 9
    }
  });
  assert.strictEqual(conflict.statusCode, 409);
  assert.strictEqual(conflict.body.error, 'IDEMPOTENCY_CONFLICT');

  const denied = await request({
    ...payload,
    commandId: 'fixture-retrieval-poc-denied-001',
    payload: {
      ...payload.payload,
      capsuleId: 'OTHER'
    }
  });
  assert.strictEqual(denied.statusCode, 403);
  assert.strictEqual(denied.body.error, 'FIXTURE_RETRIEVAL_SCOPE_DENIED');

  const retrievalTrace = listTraces({ tenant: 'nunncloud', limit: 20 })
    .find((trace) => trace.command === 'vault.retrieve');
  assert.ok(retrievalTrace);
  assert.ok(retrievalTrace.completedAt);

  const accessAudit = auditLogger.getAll()
    .find((entry) => entry.command === 'vault.retrieve.fixture.access');
  assert.ok(accessAudit);
  assert.strictEqual(accessAudit.result.resultCount, 10);
  assert.strictEqual(accessAudit.result.recordsIncluded, false);
  assert.strictEqual(accessAudit.result.records, undefined);

  await close();
  restoreEnvironment();
  console.log('Fixture-only Sentinel Nexus Bhindi Vault read-only POC check passed');
})().catch(async (error) => {
  await close().catch(() => {});
  restoreEnvironment();
  console.error(error);
  process.exitCode = 1;
});
