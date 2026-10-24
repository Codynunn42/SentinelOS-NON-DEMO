const crypto = require('crypto');
const { canonicalize } = require('../receipts/signedReceipt');
const { withTransaction } = require('./client');

const JOURNAL_STATES = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED_BEFORE_MUTATION: 'failed_before_mutation',
  RECONCILIATION_NEEDED: 'reconciliation_needed'
});

function hashIdempotencyKey(key) {
  if (typeof key !== 'string' || key.trim().length < 8 || key.length > 200) {
    throw new TypeError('IDEMPOTENCY_KEY_INVALID');
  }
  return crypto.createHash('sha256')
    .update(`SentinelOS command idempotency v1\0${key.trim()}`, 'utf8')
    .digest('hex');
}

function hashCommand({ tenant, command, payload }) {
  return crypto.createHash('sha256')
    .update(canonicalize({ tenant, command, payload }), 'utf8')
    .digest('hex');
}

function parseResult(value) {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}

async function claimExecution(input, transaction = withTransaction) {
  const { tenant, command, payload, idempotencyKey, actor, apiKeyId } = input;
  if (typeof tenant !== 'string' || !tenant || typeof command !== 'string' || !command) {
    throw new TypeError('EXECUTION_JOURNAL_IDENTITY_REQUIRED');
  }
  const idempotencyKeyHash = hashIdempotencyKey(idempotencyKey);
  const payloadHash = hashCommand({ tenant, command, payload });
  const journalId = crypto.randomUUID();

  return transaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO command_execution_journal
         (id, tenant_id, idempotency_key_hash, command, payload_hash, actor, api_key_id, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       ON CONFLICT (tenant_id, idempotency_key_hash) DO NOTHING
       RETURNING id, state, payload_hash, result_json, failure_code, handler_started`,
      [journalId, tenant, idempotencyKeyHash, command, payloadHash, actor || null, apiKeyId || null]
    );

    if (inserted.rows[0]) {
      return {
        kind: 'claimed',
        journalId: inserted.rows[0].id,
        payloadHash
      };
    }

    const existingResult = await client.query(
      `SELECT id, command, state, payload_hash, result_json, failure_code, handler_started
       FROM command_execution_journal
       WHERE tenant_id = $1 AND idempotency_key_hash = $2
       FOR UPDATE`,
      [tenant, idempotencyKeyHash]
    );
    const existing = existingResult.rows[0];
    if (!existing) {
      throw new Error('EXECUTION_JOURNAL_CONFLICT_ROW_MISSING');
    }
    if (existing.command !== command || existing.payload_hash !== payloadHash) {
      return { kind: 'conflict' };
    }
    if (existing.state === JOURNAL_STATES.FAILED_BEFORE_MUTATION) {
      const retry = await client.query(
        `UPDATE command_execution_journal
         SET state = 'pending', handler_started = FALSE, failure_code = NULL, updated_at = NOW()
         WHERE id = $1 AND state = 'failed_before_mutation'
         RETURNING id`,
        [existing.id]
      );
      if (!retry.rows[0]) {
        throw new Error('EXECUTION_JOURNAL_PRE_MUTATION_RETRY_FAILED');
      }
      return {
        kind: 'claimed',
        journalId: existing.id,
        payloadHash
      };
    }
    if (existing.state === JOURNAL_STATES.COMPLETED) {
      const receiptResult = await client.query(
        `SELECT signed_receipt
         FROM signed_receipts
         WHERE journal_id = $1 AND tenant_id = $2
         LIMIT 1`,
        [existing.id, tenant]
      );
      return {
        kind: 'completed',
        result: parseResult(existing.result_json),
        signedReceipt: receiptResult.rows[0]
          ? parseResult(receiptResult.rows[0].signed_receipt)
          : null
      };
    }
    return {
      kind: 'unresolved',
      state: existing.state,
      failureCode: existing.failure_code || null,
      handlerStarted: Boolean(existing.handler_started)
    };
  });
}

async function markHandlerStarted(journalId, transaction = withTransaction) {
  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE command_execution_journal
       SET handler_started = TRUE, updated_at = NOW()
       WHERE id = $1 AND state = 'pending' AND handler_started = FALSE
       RETURNING id`,
      [journalId]
    );
    if (!result.rows[0]) {
      throw new Error('EXECUTION_JOURNAL_NOT_PENDING');
    }
  });
}

async function markFailedBeforeMutation(journalId, failureCode, transaction = withTransaction) {
  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE command_execution_journal
       SET state = 'failed_before_mutation', failure_code = $2, updated_at = NOW()
       WHERE id = $1 AND state = 'pending' AND handler_started = FALSE
       RETURNING id`,
      [journalId, failureCode]
    );
    if (!result.rows[0]) {
      throw new Error('EXECUTION_JOURNAL_CANNOT_MARK_PRE_MUTATION_FAILURE');
    }
  });
}

async function markReconciliationNeeded(journalId, failureCode, transaction = withTransaction) {
  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE command_execution_journal
       SET state = 'reconciliation_needed', failure_code = $2, updated_at = NOW()
       WHERE id = $1 AND state = 'pending'
       RETURNING id`,
      [journalId, failureCode]
    );
    if (!result.rows[0]) {
      throw new Error('EXECUTION_JOURNAL_CANNOT_MARK_RECONCILIATION');
    }
  });
}

async function completeExecution(journalId, tenant, signedReceipt, result, transaction = withTransaction) {
  if (
    !signedReceipt ||
    signedReceipt.verification_status !== 'verified' ||
    signedReceipt.tenantId !== tenant ||
    !signedReceipt.signature ||
    signedReceipt.signature.algorithm !== 'ES256' ||
    !signedReceipt.signature.keyId
  ) {
    throw new Error('SIGNED_RECEIPT_REQUIRED_FOR_COMPLETION');
  }

  return transaction(async (client) => {
    const pending = await client.query(
      `SELECT id FROM command_execution_journal
       WHERE id = $1 AND tenant_id = $2 AND state = 'pending' AND handler_started = TRUE
       FOR UPDATE`,
      [journalId, tenant]
    );
    if (!pending.rows[0]) {
      throw new Error('EXECUTION_JOURNAL_NOT_COMPLETABLE');
    }

    await client.query(
      `INSERT INTO signed_receipts
         (receipt_id, tenant_id, journal_id, signed_receipt, signature_algorithm, key_id, signature)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
      [
        signedReceipt.receiptId,
        tenant,
        journalId,
        JSON.stringify(signedReceipt),
        signedReceipt.signature.algorithm,
        signedReceipt.signature.keyId,
        signedReceipt.signature.value
      ]
    );

    const completed = await client.query(
      `UPDATE command_execution_journal
       SET state = 'completed', result_json = $2::jsonb, completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND state = 'pending'
       RETURNING id`,
      [journalId, JSON.stringify(result)]
    );
    if (!completed.rows[0]) {
      throw new Error('EXECUTION_JOURNAL_COMPLETION_RACE');
    }
  });
}

module.exports = {
  JOURNAL_STATES,
  claimExecution,
  completeExecution,
  hashCommand,
  hashIdempotencyKey,
  markFailedBeforeMutation,
  markHandlerStarted,
  markReconciliationNeeded
};
