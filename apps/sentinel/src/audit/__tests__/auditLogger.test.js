const assert = require('assert');
const crypto = require('crypto');
const { auditLogger, createAuditLogger } = require('../auditLogger');

describe('audit persistence reconciliation', () => {
  it('keeps failures in the hash chain and persists them in order during reconciliation', async () => {
    let failNextWrite = true;
    let failReconciliationMarker = true;
    const persistedEvents = [];
    const logger = createAuditLogger({
      persistQuery: async (_sql, parameters) => {
        const persistedResult = JSON.parse(parameters[3]);
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error('synthetic persistence failure');
        }
        if (parameters[1] === 'system.audit.persist_reconciled' && failReconciliationMarker) {
          failReconciliationMarker = false;
          throw new Error('synthetic reconciliation marker failure');
        }
        persistedEvents.push(persistedResult.eventId);
      },
      databaseStatus: () => 'synthetic-test-database'
    });

    const original = await logger.log({
      tenant: 'synthetic-tenant',
      command: 'synthetic.command',
      payload: { value: 1 },
      result: { ok: true }
    });
    const entries = logger.getAll();
    assert.equal(entries.length, 2);
    assert.equal(entries[1].command, 'system.audit.persist_failed');
    assert.equal(entries[1].payload.originalEventId, original.eventId);
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 2 });
    assert.deepEqual(logger.getPersistenceStatus().status, 'pending_reconciliation');
    assert.equal(logger.getPersistenceStatus().pendingCount, 2);

    const reconciliation = await logger.reconcilePending();
    assert.deepEqual(reconciliation, {
      status: 'pending',
      pendingCount: 1,
      failedEventId: entries[2].eventId,
      error: 'synthetic reconciliation marker failure'
    });
    assert.equal(logger.getPersistenceStatus().status, 'pending_reconciliation');
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 3 });

    const markerRecovery = await logger.reconcilePending();
    assert.deepEqual(markerRecovery, {
      status: 'reconciled',
      pendingCount: 0,
      reconciledCount: 1
    });
    assert.deepEqual(persistedEvents, [
      entries[0].eventId,
      entries[1].eventId,
      entries[2].eventId,
      entries[3].eventId
    ]);
    assert.equal(entries[2].command, 'system.audit.persist_reconciled');
    assert.equal(entries[3].command, 'system.audit.persist_reconciled');
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 4 });
    assert.equal(logger.getPersistenceStatus().status, 'clear');

    const subsequent = await logger.log({
      tenant: 'synthetic-tenant',
      command: 'synthetic.subsequent',
      payload: {},
      result: { ok: true }
    });
    assert.deepEqual(persistedEvents, [
      entries[0].eventId,
      entries[1].eventId,
      entries[2].eventId,
      entries[3].eventId,
      subsequent.eventId
    ]);
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 5 });
  });

  it('does not persist later entries ahead of unresolved audit entries', async () => {
    const persistedEvents = [];
    let failNextWrite = true;
    const logger = createAuditLogger({
      persistQuery: async (_sql, parameters) => {
        const persistedResult = JSON.parse(parameters[3]);
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error('database unavailable');
        }
        persistedEvents.push(persistedResult.eventId);
      },
      databaseStatus: () => 'synthetic-test-database'
    });

    await logger.log({ command: 'synthetic.first', payload: {}, result: {} });
    const second = await logger.log({
      command: 'synthetic.second',
      payload: {},
      result: {}
    });

    const entries = logger.getAll();
    assert.deepEqual(entries.map((entry) => entry.command), [
      'synthetic.first',
      'system.audit.persist_failed',
      'system.audit.persist_reconciled',
      'synthetic.second'
    ]);
    assert.deepEqual(persistedEvents, entries.map((entry) => entry.eventId));
    assert.equal(logger.getPersistenceStatus().status, 'clear');
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 4 });
    assert.equal(second.eventId, entries[3].eventId);
  });
});

describe('receipt lookup compatibility', () => {
  it('labels legacy receipts unsigned in both the receipt and embedded audit result', async () => {
    const receiptId = `rcpt-legacy-${crypto.randomUUID()}`;
    const legacyReceipt = {
      receiptId,
      tenantId: 'legacy-test-tenant',
      verified: true
    };
    await auditLogger.log({
      tenant: 'legacy-test-tenant',
      command: 'legacy.receipt.test',
      payload: {},
      result: { receipt: legacyReceipt }
    });

    const match = await auditLogger.getByReceiptId(receiptId, 'legacy-test-tenant');
    assert.ok(match);
    assert.strictEqual(match.receipt.verification_status, 'unsigned_legacy');
    assert.strictEqual(match.receipt.verified, false);
    assert.strictEqual(match.entry.result.receipt.verification_status, 'unsigned_legacy');
    assert.strictEqual(match.entry.result.receipt.verified, false);
    assert.strictEqual(legacyReceipt.verified, true);
  });
});
