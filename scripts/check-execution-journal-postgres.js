const assert = require('assert');
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (process.argv.includes('--reader')) {
  runReader().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  runIntegration().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function runReader() {
  const { DATABASE_URL, TEST_SCHEMA, TEST_RECEIPT_ID, TEST_PUBLIC_KEY } = process.env;
  if (!DATABASE_URL || !TEST_SCHEMA || !TEST_RECEIPT_ID || !TEST_PUBLIC_KEY) {
    throw new Error('POSTGRES_RECEIPT_READER_CONFIGURATION_REQUIRED');
  }

  const { verifySignedReceipt } = require('../apps/sentinel/src/receipts/signedReceipt');
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${TEST_SCHEMA}"`);
      const result = await client.query(
        `SELECT s.receipt_id, s.tenant_id, s.signed_receipt, s.signature_algorithm,
                s.key_id, s.signature, j.state, j.result_json
         FROM signed_receipts s
         JOIN command_execution_journal j ON j.id = s.journal_id
         WHERE s.receipt_id = $1`,
        [TEST_RECEIPT_ID]
      );
      assert.strictEqual(result.rows.length, 1, 'receipt must survive process replacement');

      const row = result.rows[0];
      const receipt = row.signed_receipt;
      assert.strictEqual(row.state, 'completed');
      assert.deepStrictEqual(row.result_json, {
        success: true,
        statusCode: 201,
        data: { result: { ticketId: 'synthetic-ticket-001' } }
      });
      assert.strictEqual(receipt.receiptId, row.receipt_id);
      assert.strictEqual(receipt.tenantId, row.tenant_id);
      assert.strictEqual(receipt.signature.algorithm, row.signature_algorithm);
      assert.strictEqual(receipt.signature.keyId, row.key_id);
      assert.strictEqual(receipt.signature.value, row.signature);
      assert.deepStrictEqual(receipt.authority, {
        tenant: 'pg-integration-tenant',
        actor: 'synthetic-integration-operator',
        apiKeyId: 'synthetic-integration-key-id',
        effectiveRole: 'operator',
        effectiveScopes: ['receipt:read', 'support:write'],
        decision: {
          decisionId: 'pg-integration-decision',
          result: 'allow',
          state: 'allowed',
          riskLevel: 'low',
          requiredScope: 'support:write',
          approvalId: null,
          policyVersion: 'integration-policy-v1',
          decidedAt: '2026-10-24T19:00:00.000Z'
        }
      });

      const publicKey = crypto.createPublicKey({
        key: JSON.parse(Buffer.from(TEST_PUBLIC_KEY, 'base64url').toString('utf8')),
        format: 'jwk'
      });
      const verification = await verifySignedReceipt(receipt, async (keyId) => {
        assert.strictEqual(keyId, receipt.signature.keyId);
        return publicKey;
      });
      assert.deepStrictEqual(verification, { ok: true, status: 'verified', verified: true });
      console.log('PostgreSQL replacement-process read and signature verification passed');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

async function runIntegration() {
  const databaseUrl = process.env.SENTINEL_TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SENTINEL_TEST_DATABASE_URL_REQUIRED: provide a dedicated disposable PostgreSQL test database; production URLs are prohibited'
    );
  }

  const { signReceipt } = require('../apps/sentinel/src/receipts/signedReceipt');
  const {
    claimExecution,
    completeExecution,
    markHandlerStarted,
    markReconciliationNeeded
  } = require('../apps/sentinel/src/db/executionJournal');

  const adminPool = new Pool({ connectionString: databaseUrl });
  const schema = `receipt_it_${process.pid}_${crypto.randomBytes(5).toString('hex')}`;
  assert.match(schema, /^receipt_it_[a-zA-Z0-9_]+$/);
  let schemaCreated = false;

  const transaction = async (callback) => {
    const client = await adminPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL search_path TO "${schema}"`);
      const value = await callback(client);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };

  const authority = {
    tenant: 'pg-integration-tenant',
    actor: 'synthetic-integration-operator',
    apiKeyId: 'synthetic-integration-key-id',
    effectiveRole: 'operator',
    effectiveScopes: ['support:write', 'receipt:read'],
    decision: {
      decisionId: 'pg-integration-decision',
      result: 'allow',
      state: 'allowed',
      riskLevel: 'low',
      requiredScope: 'support:write',
      approvalId: null,
      policyVersion: 'integration-policy-v1',
      decidedAt: '2026-10-24T19:00:00.000Z'
    }
  };
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });
  const signer = {
    keyId: 'https://integration-test.vault.azure.net/keys/receipt/ephemeral-version',
    async sign(data) {
      return crypto.sign('sha256', data, {
        key: privateKey,
        dsaEncoding: 'ieee-p1363'
      });
    }
  };

  try {
    const databaseIdentity = await adminPool.query(
      'SELECT current_database() AS name, current_setting(\'server_version\') AS version'
    );
    const databaseName = databaseIdentity.rows[0].name;
    if (!/^(sentinel[-_])?(test|it|integration)([-_].*)?$/i.test(databaseName)) {
      throw new Error('POSTGRES_TEST_DATABASE_NAME_REQUIRED');
    }
    console.log(
      `Disposable PostgreSQL test target: database=${databaseName}, server=${databaseIdentity.rows[0].version}`
    );
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    const setupClient = await adminPool.connect();
    try {
      await setupClient.query(`SET search_path TO "${schema}"`);
      const schemaSql = fs.readFileSync(
        path.join(__dirname, '../apps/sentinel/src/db/schema.sql'),
        'utf8'
      );
      await setupClient.query(schemaSql);
      const migrationSql = fs.readFileSync(
        path.join(
          __dirname,
          '../apps/sentinel/src/db/migrations/20261024_signed_receipts_and_execution_journal.sql'
        ),
        'utf8'
      );
      await setupClient.query(migrationSql);
      await setupClient.query(`
        CREATE TABLE synthetic_handler_effects (
          effect_id TEXT PRIMARY KEY,
          idempotency_key TEXT NOT NULL
        )
      `);
    } finally {
      setupClient.release();
    }

    const input = {
      tenant: authority.tenant,
      command: 'support.ticket.create',
      payload: { subject: 'synthetic PostgreSQL integration test' },
      idempotencyKey: 'pg-integration-concurrent-request-001',
      actor: authority.actor,
      apiKeyId: authority.apiKeyId
    };
    const concurrentClaims = await Promise.all([
      claimExecution(input, transaction),
      claimExecution(input, transaction)
    ]);
    assert.strictEqual(
      concurrentClaims.filter((claim) => claim.kind === 'claimed').length,
      1,
      'only one concurrent duplicate may claim execution'
    );
    assert.strictEqual(
      concurrentClaims.filter((claim) => claim.kind === 'unresolved').length,
      1,
      'the duplicate request must observe the pending journal'
    );
    let handlerStarts = 0;
    await Promise.all(concurrentClaims.map(async (item) => {
      if (item.kind === 'claimed') {
        handlerStarts += 1;
        await markHandlerStarted(item.journalId, transaction);
      }
    }));
    assert.strictEqual(handlerStarts, 1, 'only the unique claim may start the handler');

    const conflict = await claimExecution({
      ...input,
      payload: { subject: 'different payload using the same key' }
    }, transaction);
    assert.strictEqual(conflict.kind, 'conflict');
    const commandConflict = await claimExecution({
      ...input,
      command: 'support.ticket.close'
    }, transaction);
    assert.strictEqual(commandConflict.kind, 'conflict');
    const otherTenantClaim = await claimExecution({
      ...input,
      tenant: 'other-synthetic-tenant'
    }, transaction);
    assert.strictEqual(otherTenantClaim.kind, 'claimed', 'idempotency keys are tenant scoped');

    const claim = concurrentClaims.find((item) => item.kind === 'claimed');
    const receipt = await signReceipt({
      receiptId: `rcpt_${crypto.randomUUID()}`,
      auditId: `audit_${crypto.randomUUID()}`,
      tenantId: authority.tenant,
      command: input.command,
      status: 'executed',
      entity: { type: 'support_ticket', id: 'synthetic-ticket-001' },
      outcome: { status: 'created', ticketId: 'synthetic-ticket-001' },
      timestamp: new Date().toISOString()
    }, authority, signer);
    const result = {
      success: true,
      statusCode: 201,
      data: { result: { ticketId: 'synthetic-ticket-001' } }
    };
    await completeExecution(claim.journalId, authority.tenant, receipt, result, transaction);

    const replay = await claimExecution(input, transaction);
    assert.strictEqual(replay.kind, 'completed');
    assert.strictEqual(replay.signedReceipt.receiptId, receipt.receiptId);
    assert.deepStrictEqual(replay.result, result);

    const childEnvironment = {
      ...process.env,
      DATABASE_URL: databaseUrl,
      TEST_SCHEMA: schema,
      TEST_RECEIPT_ID: receipt.receiptId,
      TEST_PUBLIC_KEY: Buffer.from(JSON.stringify(publicKey.export({ format: 'jwk' })))
        .toString('base64url')
    };
    const reader = spawnSync(process.execPath, [__filename, '--reader'], {
      env: childEnvironment,
      encoding: 'utf8'
    });
    if (reader.status !== 0) {
      throw new Error(`POSTGRES_REPLACEMENT_PROCESS_FAILED: ${reader.stderr || reader.stdout}`);
    }
    process.stdout.write(reader.stdout);

    const signingFailureInput = {
      ...input,
      idempotencyKey: 'pg-integration-signing-failure-001'
    };
    const signingFailureClaim = await claimExecution(signingFailureInput, transaction);
    await markHandlerStarted(signingFailureClaim.journalId, transaction);
    const signingEffectId = `effect_${crypto.randomUUID()}`;
    await recordSyntheticEffect(signingEffectId, signingFailureInput.idempotencyKey);
    await assert.rejects(
      signReceipt({
        receiptId: 'receipt-signing-failure',
        tenantId: authority.tenant
      }, authority, {
        keyId: signer.keyId,
        async sign() {
          throw new Error('forced signing failure after handler start');
        }
      }),
      /forced signing failure/
    );
    await markReconciliationNeeded(
      signingFailureClaim.journalId,
      'SIGNING_FAILED_AFTER_HANDLER',
      transaction
    );
    const signingRetry = await claimExecution(signingFailureInput, transaction);
    assert.strictEqual(signingRetry.kind, 'unresolved');
    assert.strictEqual(signingRetry.state, 'reconciliation_needed');
    assert.strictEqual(signingRetry.handlerStarted, true);
    assert.strictEqual(
      await countSyntheticEffects(signingEffectId),
      1,
      'signing failure must not cause the already-applied synthetic effect to run again'
    );

    const persistenceFailureInput = {
      ...input,
      idempotencyKey: 'pg-integration-persistence-failure-001'
    };
    const persistenceFailureClaim = await claimExecution(persistenceFailureInput, transaction);
    await markHandlerStarted(persistenceFailureClaim.journalId, transaction);
    const persistenceEffectId = `effect_${crypto.randomUUID()}`;
    await recordSyntheticEffect(persistenceEffectId, persistenceFailureInput.idempotencyKey);
    const failureClient = await adminPool.connect();
    try {
      await failureClient.query(`SET search_path TO "${schema}"`);
      await failureClient.query(`
        CREATE FUNCTION reject_receipt_insert() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'forced signed receipt persistence failure';
        END;
        $$;
        CREATE TRIGGER reject_signed_receipt_insert
        BEFORE INSERT ON signed_receipts
        FOR EACH ROW EXECUTE FUNCTION reject_receipt_insert();
      `);
    } finally {
      failureClient.release();
    }
    const failedReceipt = await signReceipt({
      receiptId: `rcpt_${crypto.randomUUID()}`,
      tenantId: authority.tenant,
      command: persistenceFailureInput.command,
      status: 'executed',
      outcome: { status: 'handler_already_acted' },
      timestamp: new Date().toISOString()
    }, authority, signer);
    await assert.rejects(
      completeExecution(
        persistenceFailureClaim.journalId,
        authority.tenant,
        failedReceipt,
        result,
        transaction
      ),
      /forced signed receipt persistence failure/
    );
    const persistedAfterFailure = await transaction(async (client) => {
      const journal = await client.query(
        `SELECT state, handler_started FROM command_execution_journal WHERE id = $1`,
        [persistenceFailureClaim.journalId]
      );
      const storedReceipt = await client.query(
        `SELECT receipt_id FROM signed_receipts WHERE journal_id = $1`,
        [persistenceFailureClaim.journalId]
      );
      return { journal: journal.rows[0], receipts: storedReceipt.rows };
    });
    assert.strictEqual(persistedAfterFailure.journal.state, 'pending');
    assert.strictEqual(persistedAfterFailure.journal.handler_started, true);
    assert.strictEqual(persistedAfterFailure.receipts.length, 0);
    await markReconciliationNeeded(
      persistenceFailureClaim.journalId,
      'RECEIPT_PERSISTENCE_FAILED_AFTER_HANDLER',
      transaction
    );
    const persistenceRetry = await claimExecution(persistenceFailureInput, transaction);
    assert.strictEqual(persistenceRetry.kind, 'unresolved');
    assert.strictEqual(persistenceRetry.state, 'reconciliation_needed');
    assert.strictEqual(
      await countSyntheticEffects(persistenceEffectId),
      1,
      'receipt persistence failure must not cause the already-applied synthetic effect to run again'
    );

    const cleanupClient = await adminPool.connect();
    try {
      await cleanupClient.query(`SET search_path TO "${schema}"`);
      await cleanupClient.query('DROP TRIGGER reject_signed_receipt_insert ON signed_receipts');
      await cleanupClient.query('DROP FUNCTION reject_receipt_insert()');
    } finally {
      cleanupClient.release();
    }

    console.log('PostgreSQL journal concurrency, signed persistence, failure, and retry checks passed');

    async function recordSyntheticEffect(effectId, idempotencyKey) {
      await transaction((client) => client.query(
        'INSERT INTO synthetic_handler_effects (effect_id, idempotency_key) VALUES ($1, $2)',
        [effectId, idempotencyKey]
      ));
    }

    async function countSyntheticEffects(effectId) {
      return transaction(async (client) => {
        const result = await client.query(
          'SELECT COUNT(*)::int AS count FROM synthetic_handler_effects WHERE effect_id = $1',
          [effectId]
        );
        return result.rows[0].count;
      });
    }
  } finally {
    if (schemaCreated) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
    await adminPool.end();
  }
}
