const assert = require('assert');
const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const TEST_TENANT = 'http-integration-tenant';
const TEST_COMMAND = 'integration.http.execute';
const TEST_SCOPE = 'integration:http:execute';
const TEST_API_KEY = 'synthetic-http-integration-api-key';
const TEST_LIMITED_API_KEY = 'synthetic-http-integration-limited-api-key';
const TEST_ACTOR = 'synthetic-http-integration-operator';
const TEST_KEY_ID = 'synthetic-http-integration-key-id';

if (process.argv.includes('--serve')) {
  serve().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function run() {
  const databaseUrl = process.env.SENTINEL_TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SENTINEL_TEST_DATABASE_URL_REQUIRED: provide a dedicated disposable PostgreSQL test database; production URLs are prohibited'
    );
  }

  const adminPool = new Pool({ connectionString: databaseUrl });
  const schema = `command_http_it_${process.pid}_${crypto.randomBytes(5).toString('hex')}`;
  const schemaScopedUrl = new URL(databaseUrl);
  schemaScopedUrl.searchParams.set('options', `-c search_path=${schema}`);
  const scopedPool = new Pool({ connectionString: schemaScopedUrl.toString() });
  let schemaCreated = false;
  let worker;

  try {
    const databaseIdentity = await adminPool.query(
      "SELECT current_database() AS name, current_setting('server_version') AS version"
    );
    const databaseName = databaseIdentity.rows[0].name;
    if (!/^(sentinel[-_])?(test|it|integration)([-_].*)?$/i.test(databaseName)) {
      throw new Error('POSTGRES_TEST_DATABASE_NAME_REQUIRED');
    }
    assert.match(schema, /^command_http_it_[a-zA-Z0-9_]+$/);
    console.log(
      `Disposable PostgreSQL HTTP test target: database=${databaseName}, server=${databaseIdentity.rows[0].version}`
    );

    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    const setupClient = await adminPool.connect();
    try {
      await setupClient.query(`SET search_path TO "${schema}"`);
      await setupClient.query(fs.readFileSync(
        path.join(__dirname, '../apps/sentinel/src/db/schema.sql'),
        'utf8'
      ));
      await setupClient.query(fs.readFileSync(
        path.join(
          __dirname,
          '../apps/sentinel/src/db/migrations/20261024_signed_receipts_and_execution_journal.sql'
        ),
        'utf8'
      ));
      await setupClient.query(`
        CREATE TABLE http_test_effects (
          effect_id TEXT NOT NULL,
          idempotency_key TEXT NOT NULL
        );
        CREATE TABLE http_test_control (
          fail_receipt_persistence BOOLEAN NOT NULL DEFAULT FALSE
        );
        INSERT INTO http_test_control (fail_receipt_persistence) VALUES (FALSE);
        CREATE FUNCTION reject_test_receipt_insert() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
          IF (SELECT fail_receipt_persistence FROM http_test_control LIMIT 1) THEN
            RAISE EXCEPTION 'HTTP_INTEGRATION_RECEIPT_PERSISTENCE_FAILURE';
          END IF;
          RETURN NEW;
        END;
        $$;
        CREATE TRIGGER reject_test_receipt_insert
        BEFORE INSERT ON signed_receipts
        FOR EACH ROW EXECUTE FUNCTION reject_test_receipt_insert();
      `);
    } finally {
      setupClient.release();
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1'
    });
    worker = await startWorker({
      ...process.env,
      DATABASE_URL: schemaScopedUrl.toString(),
      SENTINEL_API_KEYS: JSON.stringify([{
        keyId: TEST_KEY_ID,
        secret: TEST_API_KEY,
        tenant: TEST_TENANT,
        actor: TEST_ACTOR,
        role: 'operator',
        scopes: [TEST_SCOPE],
        status: 'active'
      }, {
        keyId: 'synthetic-http-integration-limited-key-id',
        secret: TEST_LIMITED_API_KEY,
        tenant: TEST_TENANT,
        actor: TEST_ACTOR,
        role: 'operator',
        scopes: ['receipt:read'],
        status: 'active'
      }]),
      SENTINEL_HMAC_SECRET: 'synthetic-http-integration-passport-secret',
      SENTINEL_SIGNING_KEY: 'synthetic-http-integration-decision-secret',
      TEST_PRIVATE_KEY: Buffer.from(JSON.stringify(privateKey.export({ format: 'jwk' })))
        .toString('base64url'),
      TEST_PUBLIC_KEY: Buffer.from(JSON.stringify(publicKey.export({ format: 'jwk' })))
        .toString('base64url')
    });

    await assertAuthorizationBeforeHandler(worker, scopedPool);
    await assertSuccessfulDurableReceipt(worker, scopedPool, publicKey);
    await assertConcurrentDuplicateAndConflict(worker, scopedPool);
    await assertSigningFailureCannotReplay(worker, scopedPool);
    await assertPersistenceFailureCannotReplay(worker, scopedPool);
    console.log(
      'Authenticated HTTP execution, signed PostgreSQL receipt, duplicate/conflict, failure, and pre-handler authorization checks passed'
    );
  } finally {
    if (worker) {
      await stopWorker(worker);
    }
    await scopedPool.end();
    if (schemaCreated) {
      await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
    }
    await adminPool.end();
  }
}

async function assertAuthorizationBeforeHandler(worker, pool) {
  const invalidKey = await sendCommand(
    worker.port,
    requestBody('unauthorized-request-001', 'unauthorized-effect-001'),
    'invalid-synthetic-api-key'
  );
  assert.strictEqual(invalidKey.status, 401);
  assert.strictEqual(invalidKey.body.error, 'Unauthorized');
  assert.strictEqual(await countEffects(pool, 'unauthorized-request-001'), 0);

  const insufficientScope = await sendCommand(
    worker.port,
    requestBody('insufficient-scope-request-001', 'insufficient-scope-effect-001'),
    TEST_LIMITED_API_KEY
  );
  assert.strictEqual(insufficientScope.status, 403);
  assert.strictEqual(insufficientScope.body.error, 'SCOPE_REQUIRED');
  assert.strictEqual(await countEffects(pool, 'insufficient-scope-request-001'), 0);
}

async function assertSuccessfulDurableReceipt(worker, pool, publicKey) {
  const idempotencyKey = 'http-success-request-001';
  const response = await sendCommand(
    worker.port,
    requestBody(idempotencyKey, 'http-success-effect-001')
  );
  assert.strictEqual(response.status, 201, JSON.stringify(response.body));
  assert.strictEqual(response.body.status, 'executed');
  const receipt = response.body.receipt;
  assert(receipt && receipt.receiptId);
  assert.strictEqual(receipt.signature.algorithm, 'ES256');
  assert.strictEqual(receipt.verification_status, 'verified');

  const stored = await pool.query(
    `SELECT r.signed_receipt, j.state, j.result_json, j.handler_started
     FROM signed_receipts r
     JOIN command_execution_journal j ON j.id = r.journal_id
     WHERE r.receipt_id = $1 AND r.tenant_id = $2`,
    [receipt.receiptId, TEST_TENANT]
  );
  assert.strictEqual(stored.rows.length, 1);
  assert.strictEqual(stored.rows[0].state, 'completed');
  assert.strictEqual(stored.rows[0].handler_started, true);
  assert.strictEqual(
    stored.rows[0].result_json.data.receipt.receiptId,
    receipt.receiptId
  );
  assert.deepStrictEqual(stored.rows[0].signed_receipt.authority, {
    tenant: TEST_TENANT,
    actor: TEST_ACTOR,
    apiKeyId: TEST_KEY_ID,
    effectiveRole: 'operator',
    effectiveScopes: [TEST_SCOPE],
    decision: stored.rows[0].signed_receipt.authority.decision
  });
  assert.strictEqual(stored.rows[0].signed_receipt.authority.decision.result, 'allow');

  const { verifySignedReceipt } = require('../apps/sentinel/src/receipts/signedReceipt');
  const verification = await verifySignedReceipt(stored.rows[0].signed_receipt, async (keyId) => {
    assert.strictEqual(keyId, receipt.signature.keyId);
    return publicKey;
  });
  assert.deepStrictEqual(verification, { ok: true, status: 'verified', verified: true });
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);
}

async function assertConcurrentDuplicateAndConflict(worker, pool) {
  const idempotencyKey = 'http-concurrent-request-001';
  const body = requestBody(idempotencyKey, 'http-concurrent-effect-001');
  const [first, second] = await Promise.all([
    sendCommand(worker.port, body),
    sendCommand(worker.port, body)
  ]);
  for (const response of [first, second]) {
    assert([201, 409].includes(response.status), JSON.stringify(response.body));
    if (response.status === 409) {
      assert.strictEqual(response.body.error, 'EXECUTION_OUTCOME_UNRESOLVED');
    }
  }
  assert([first.status, second.status].includes(201));
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);
  await assertJournalState(pool, idempotencyKey, 'completed');

  const successfulResponse = [first, second].find((response) => response.status === 201);
  const replay = await sendCommand(worker.port, body);
  assert.strictEqual(replay.status, 201, JSON.stringify(replay.body));
  assert.strictEqual(replay.body.receipt.receiptId, successfulResponse.body.receipt.receiptId);
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);

  const conflict = await sendCommand(
    worker.port,
    requestBody(idempotencyKey, 'http-conflicting-effect-001')
  );
  assert.strictEqual(conflict.status, 409);
  assert.strictEqual(conflict.body.error, 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT');
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);

  const stored = await pool.query(
    `SELECT state FROM command_execution_journal
     WHERE tenant_id = $1 AND command = $2`,
    [TEST_TENANT, TEST_COMMAND]
  );
  assert(stored.rows.some((row) => row.state === 'completed'));
}

async function assertSigningFailureCannotReplay(worker, pool) {
  const idempotencyKey = 'http-sign-failure-request-001';
  const body = requestBody(idempotencyKey, 'http-sign-failure-effect-001', {
    failSigning: true
  });
  const failed = await sendCommand(worker.port, body);
  assert.strictEqual(failed.status, 503, JSON.stringify(failed.body));
  assert.strictEqual(failed.body.error, 'SIGNED_RECEIPT_COMPLETION_FAILED');
  assert.notStrictEqual(failed.body.status, 'executed');
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);

  const retry = await sendCommand(worker.port, body);
  assert.strictEqual(retry.status, 409);
  assert.strictEqual(retry.body.error, 'EXECUTION_OUTCOME_UNRESOLVED');
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);
  await assertJournalState(pool, idempotencyKey, 'reconciliation_needed');
}

async function assertPersistenceFailureCannotReplay(worker, pool) {
  const idempotencyKey = 'http-persist-failure-request-001';
  const body = requestBody(idempotencyKey, 'http-persist-failure-effect-001');
  await pool.query(
    'UPDATE http_test_control SET fail_receipt_persistence = TRUE'
  );
  let failed;
  try {
    failed = await sendCommand(worker.port, body);
  } finally {
    await pool.query(
      'UPDATE http_test_control SET fail_receipt_persistence = FALSE'
    );
  }
  assert.strictEqual(failed.status, 503, JSON.stringify(failed.body));
  assert.strictEqual(failed.body.error, 'SIGNED_RECEIPT_COMPLETION_FAILED');
  assert.notStrictEqual(failed.body.status, 'executed');
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);

  const retry = await sendCommand(worker.port, body);
  assert.strictEqual(retry.status, 409);
  assert.strictEqual(retry.body.error, 'EXECUTION_OUTCOME_UNRESOLVED');
  assert.strictEqual(await countEffects(pool, idempotencyKey), 1);
  await assertJournalState(pool, idempotencyKey, 'reconciliation_needed');
}

async function assertJournalState(pool, idempotencyKey, state) {
  const result = await pool.query(
    `SELECT j.state, j.handler_started
     FROM command_execution_journal j
     WHERE j.tenant_id = $1 AND j.idempotency_key_hash = $2`,
    [
      TEST_TENANT,
      crypto.createHash('sha256')
        .update(`SentinelOS command idempotency v1\0${idempotencyKey.trim()}`, 'utf8')
        .digest('hex')
    ]
  );
  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.rows[0].state, state);
  assert.strictEqual(result.rows[0].handler_started, true);
}

async function countEffects(pool, idempotencyKey) {
  const result = await pool.query(
    'SELECT COUNT(*)::integer AS count FROM http_test_effects WHERE idempotency_key = $1',
    [idempotencyKey]
  );
  return result.rows[0].count;
}

function requestBody(idempotencyKey, effectId, extraPayload = {}) {
  return {
    tenant: TEST_TENANT,
    command: TEST_COMMAND,
    payload: { effectId, ...extraPayload },
    metadata: { idempotencyKey }
  };
}

async function sendCommand(port, body, apiKey = TEST_API_KEY) {
  const response = await fetch(`http://127.0.0.1:${port}/v1/command`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

function startWorker(environment) {
  const child = spawn(process.execPath, [__filename, '--serve'], {
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  let stdout = '';
  let stderr = '';
  let pending = '';

  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`HTTP_TEST_SERVER_START_TIMEOUT: ${stderr || stdout}`));
    }, 15000);

    const onData = (chunk) => {
      stdout += chunk;
      pending += chunk;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('{"type":"http-test-server-ready",')) {
          continue;
        }
        const message = JSON.parse(line);
        assert(Number.isInteger(message.port) && message.port > 0);
        clearTimeout(timeout);
        child.stdout.off('data', onData);
        resolve({ child, port: message.port, stdout: () => stdout, stderr: () => stderr });
        return;
      }
    };
    child.stdout.on('data', onData);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(
        `HTTP_TEST_SERVER_EXITED_BEFORE_READY: code=${code} signal=${signal}; ${stderr || stdout}`
      ));
    });
  });
}

async function stopWorker(worker) {
  const { child } = worker;
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  const timedOut = await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(() => resolve(true), 5000))
  ]);
  if (timedOut && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

async function serve() {
  const privateJwk = JSON.parse(
    Buffer.from(process.env.TEST_PRIVATE_KEY, 'base64url').toString('utf8')
  );
  const publicJwk = JSON.parse(
    Buffer.from(process.env.TEST_PUBLIC_KEY, 'base64url').toString('utf8')
  );
  const privateKey = crypto.createPrivateKey({ key: privateJwk, format: 'jwk' });
  const publicKey = crypto.createPublicKey({ key: publicJwk, format: 'jwk' });
  const keyId = 'https://http-integration-test.vault.azure.net/keys/receipt/ephemeral-version';
  let failNextSigning = false;

  const receiptRuntime = require('../apps/sentinel/src/receipts/receiptRuntime');
  receiptRuntime.getReceiptSigner = () => ({
    keyId,
    async ensureReady() {},
    async sign(data) {
      if (failNextSigning) {
        failNextSigning = false;
        throw new Error('HTTP_INTEGRATION_SIGNING_FAILURE');
      }
      return crypto.sign('sha256', data, {
        key: privateKey,
        dsaEncoding: 'ieee-p1363'
      });
    },
    async getPublicKey(requestedKeyId) {
      if (requestedKeyId !== keyId) {
        throw new Error('HTTP_INTEGRATION_KEY_ID_MISMATCH');
      }
      return publicKey;
    }
  });

  const { query } = require('../apps/sentinel/src/db/client');
  const { surfaceRegistry } = require('../apps/sentinel/src/surface/registry');
  const { commandScopes } = require('../apps/sentinel/src/governance/policyEngine');
  commandScopes[TEST_COMMAND] = TEST_SCOPE;
  surfaceRegistry[TEST_TENANT] = {
    name: 'Synthetic HTTP Integration Tenant',
    handlers: {
      [TEST_COMMAND]: async (payload, _context, envelope) => {
        await query(
          `INSERT INTO http_test_effects (effect_id, idempotency_key)
           VALUES ($1, $2)`,
          [payload.effectId, envelope.metadata.idempotencyKey]
        );
        if (payload.failSigning) {
          failNextSigning = true;
        }
        return {
          success: true,
          statusCode: 201,
          data: { result: { effectId: payload.effectId, outcome: 'synthetic-created' } }
        };
      }
    }
  };

  const server = require('../apps/api/server').server;
  server.listen(0, '127.0.0.1', () => {
    process.stdout.write(`${JSON.stringify({
      type: 'http-test-server-ready',
      port: server.address().port
    })}\n`);
  });
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}
