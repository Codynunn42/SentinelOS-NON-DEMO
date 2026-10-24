const assert = require('assert');
const {
  JOURNAL_STATES,
  claimExecution,
  completeExecution,
  hashIdempotencyKey,
  markFailedBeforeMutation,
  markHandlerStarted,
  markReconciliationNeeded
} = require('../executionJournal');

function makeMemoryTransaction() {
  const state = { journal: [], receipts: [] };
  return async (callback) => {
    const snapshot = structuredClone(state);
    const client = {
      async query(sql, values) {
        if (sql.includes('INSERT INTO command_execution_journal')) {
          const [id, tenant, keyHash, command, payloadHash, actor, apiKeyId] = values;
          if (state.journal.some((row) => row.tenant_id === tenant && row.idempotency_key_hash === keyHash)) {
            return { rows: [] };
          }
          const row = {
            id,
            tenant_id: tenant,
            idempotency_key_hash: keyHash,
            command,
            payload_hash: payloadHash,
            actor,
            api_key_id: apiKeyId,
            state: JOURNAL_STATES.PENDING,
            handler_started: false,
            result_json: null,
            failure_code: null
          };
          state.journal.push(row);
          return { rows: [row] };
        }
        if (sql.includes('SELECT id, command, state, payload_hash')) {
          const row = state.journal.find((item) => item.tenant_id === values[0] && item.idempotency_key_hash === values[1]);
          return { rows: row ? [{ ...row }] : [] };
        }
        if (sql.includes('SELECT signed_receipt') && sql.includes('FROM signed_receipts')) {
          const row = state.receipts.find((item) => item.journal_id === values[0] && item.tenant_id === values[1]);
          return { rows: row ? [{ signed_receipt: row.signed_receipt }] : [] };
        }
        if (sql.includes("SET state = 'pending'") && sql.includes("state = 'failed_before_mutation'")) {
          const row = state.journal.find((item) => item.id === values[0] && item.state === JOURNAL_STATES.FAILED_BEFORE_MUTATION);
          if (!row) return { rows: [] };
          row.state = JOURNAL_STATES.PENDING;
          row.handler_started = false;
          row.failure_code = null;
          return { rows: [{ id: row.id }] };
        }
        if (sql.includes('UPDATE command_execution_journal') && sql.includes('handler_started = TRUE')) {
          const row = state.journal.find((item) => item.id === values[0] && item.state === JOURNAL_STATES.PENDING && !item.handler_started);
          if (!row) return { rows: [] };
          row.handler_started = true;
          return { rows: [{ id: row.id }] };
        }
        if (sql.includes("state = 'failed_before_mutation'")) {
          const row = state.journal.find((item) => item.id === values[0] && item.state === JOURNAL_STATES.PENDING && !item.handler_started);
          if (!row) return { rows: [] };
          row.state = JOURNAL_STATES.FAILED_BEFORE_MUTATION;
          row.failure_code = values[1];
          return { rows: [{ id: row.id }] };
        }
        if (sql.includes("state = 'reconciliation_needed'")) {
          const row = state.journal.find((item) => item.id === values[0] && item.state === JOURNAL_STATES.PENDING);
          if (!row) return { rows: [] };
          row.state = JOURNAL_STATES.RECONCILIATION_NEEDED;
          row.failure_code = values[1];
          return { rows: [{ id: row.id }] };
        }
        if (sql.includes('INSERT INTO signed_receipts')) {
          const [receiptId, tenantId, journalId, signedReceipt, algorithm, keyId, signature] = values;
          state.receipts.push({
            receipt_id: receiptId,
            tenant_id: tenantId,
            journal_id: journalId,
            signed_receipt: JSON.parse(signedReceipt),
            signature_algorithm: algorithm,
            key_id: keyId,
            signature
          });
          return { rows: [] };
        }
        if (sql.includes("SELECT id FROM command_execution_journal")) {
          const row = state.journal.find((item) =>
            item.id === values[0] &&
            item.tenant_id === values[1] &&
            item.state === JOURNAL_STATES.PENDING &&
            item.handler_started
          );
          return { rows: row ? [{ id: row.id }] : [] };
        }
        if (sql.includes("state = 'completed'")) {
          const row = state.journal.find((item) => item.id === values[0] && item.state === JOURNAL_STATES.PENDING);
          if (!row) return { rows: [] };
          row.state = JOURNAL_STATES.COMPLETED;
          row.result_json = JSON.parse(values[1]);
          return { rows: [{ id: row.id }] };
        }
        throw new Error(`Unexpected SQL in test double: ${sql}`);
      }
    };

    try {
      return await callback(client);
    } catch (error) {
      state.journal = snapshot.journal;
      state.receipts = snapshot.receipts;
      throw error;
    }
  };
}

describe('durable command execution journal', () => {
  const baseInput = {
    tenant: 'support',
    command: 'support.ticket.create',
    payload: { subject: 'Synthetic test' },
    idempotencyKey: 'synthetic-test-key-0001',
    actor: 'test-operator',
    apiKeyId: 'test-key-id'
  };

  it('hashes idempotency keys instead of storing their raw values', () => {
    const first = hashIdempotencyKey('synthetic-test-key-0001');
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.notStrictEqual(first, 'synthetic-test-key-0001');
    assert.throws(() => hashIdempotencyKey('short'), /INVALID/);
  });

  it('claims a tenant-scoped key and rejects reuse with a changed payload', async () => {
    const transaction = makeMemoryTransaction();
    const claimed = await claimExecution(baseInput, transaction);
    assert.strictEqual(claimed.kind, 'claimed');

    const unresolved = await claimExecution(baseInput, transaction);
    assert.strictEqual(unresolved.kind, 'unresolved');
    assert.strictEqual(unresolved.state, JOURNAL_STATES.PENDING);
    assert.strictEqual(unresolved.handlerStarted, false);

    const conflict = await claimExecution({
      ...baseInput,
      payload: { subject: 'Different command payload' }
    }, transaction);
    assert.strictEqual(conflict.kind, 'conflict');
  });

  it('allows safe retry after pre-mutation failure and blocks started executions', async () => {
    const transaction = makeMemoryTransaction();
    const claimed = await claimExecution(baseInput, transaction);
    await markFailedBeforeMutation(claimed.journalId, 'SIGNER_UNAVAILABLE', transaction);
    const retry = await claimExecution(baseInput, transaction);
    assert.strictEqual(retry.kind, 'claimed');
    assert.strictEqual(retry.journalId, claimed.journalId);

    const second = await claimExecution({ ...baseInput, idempotencyKey: 'synthetic-test-key-0002' }, transaction);
    await markHandlerStarted(second.journalId, transaction);
    await assert.rejects(
      markFailedBeforeMutation(second.journalId, 'MUTATION_ALREADY_STARTED', transaction),
      /PRE_MUTATION/
    );
    await markReconciliationNeeded(second.journalId, 'SIGNING_FAILED_AFTER_HANDLER', transaction);
    const blockedRetry = await claimExecution({
      ...baseInput,
      idempotencyKey: 'synthetic-test-key-0002'
    }, transaction);
    assert.strictEqual(blockedRetry.kind, 'unresolved');
    assert.strictEqual(blockedRetry.state, JOURNAL_STATES.RECONCILIATION_NEEDED);
  });

  it('atomically stores a signed receipt and completed result for idempotent replay', async () => {
    const transaction = makeMemoryTransaction();
    const claimed = await claimExecution(baseInput, transaction);
    await markHandlerStarted(claimed.journalId, transaction);
    const signedReceipt = {
      receiptId: 'rcpt-journal-001',
      tenantId: baseInput.tenant,
      verification_status: 'verified',
      signature: {
        algorithm: 'ES256',
        keyId: 'https://test.vault.azure.net/keys/receipts/version1',
        value: 'signed-value'
      }
    };
    const result = { success: true, data: { receipt: signedReceipt } };

    await completeExecution(claimed.journalId, baseInput.tenant, signedReceipt, result, transaction);
    const replay = await claimExecution(baseInput, transaction);
    assert.strictEqual(replay.kind, 'completed');
    assert.deepStrictEqual(replay.result, result);
    assert.deepStrictEqual(replay.signedReceipt, signedReceipt);
  });

  it('does not complete without a signed receipt or a started pending journal', async () => {
    const transaction = makeMemoryTransaction();
    const claimed = await claimExecution(baseInput, transaction);
    await assert.rejects(
      completeExecution(claimed.journalId, baseInput.tenant, null, {}, transaction),
      /SIGNED_RECEIPT_REQUIRED/
    );
    const unsigned = {
      receiptId: 'rcpt-unsigned',
      tenantId: baseInput.tenant,
      verification_status: 'unsigned_legacy',
      signature: null
    };
    await assert.rejects(
      completeExecution(claimed.journalId, baseInput.tenant, unsigned, {}, transaction),
      /SIGNED_RECEIPT_REQUIRED/
    );
  });
});
