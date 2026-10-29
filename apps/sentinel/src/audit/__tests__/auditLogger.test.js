const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { Pool } = require('pg');
const { auditLogger, createAuditLogger } = require('../auditLogger');
const { readFileSync } = require('fs');

const createdLoggers = [];
const itWithPostgres =
  process.env.AUDIT_OUTBOX_TEST_DATABASE_URL || process.env.RECEIPT_LEDGER_TEST_DATABASE_URL
    ? it
    : it.skip;

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function createTestLogger(options = {}) {
  const spoolDirectory =
    options.spoolDirectory || path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
  const logger = createAuditLogger({
    spoolDirectory,
    loadAnchor: async () => null,
    ...options
  });
  createdLoggers.push({ logger, spoolDirectory });
  return logger;
}

afterEach(async () => {
  const entries = createdLoggers.splice(0);
  await Promise.all(entries.map(({ logger }) => logger.close()));
  await Promise.all(
    [...new Set(entries.map(({ spoolDirectory }) => spoolDirectory))]
      .map((spoolDirectory) => fs.rm(spoolDirectory, { recursive: true, force: true }))
  );
});

describe('audit persistence reconciliation', () => {
  it('continues to verify existing valid spool entries without changing their hashes', async () => {
    const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
    const eventId = crypto.randomUUID();
    const entry = {
      eventId,
      tenant: 'synthetic-tenant',
      command: 'synthetic.preexisting',
      payload: { nested: { value: 'persisted' } },
      result: { ok: true },
      actor: 'test',
      timestamp: '2026-10-28T05:00:00.000Z',
      prevHash: null
    };
    entry.auditHash = crypto.createHash('sha256').update(stableStringify({
      eventId: entry.eventId,
      tenant: entry.tenant,
      command: entry.command,
      payload: entry.payload,
      result: entry.result,
      actor: entry.actor,
      timestamp: entry.timestamp,
      prevHash: entry.prevHash
    })).digest('hex');
    await fs.mkdir(spoolDirectory, { recursive: true });
    const fileName = `00000000000000000001-${eventId}.json`;
    const entryFile = path.join(spoolDirectory, fileName);
    const originalRecord = `${JSON.stringify({ sequence: 1, entry })}\n`;
    await fs.writeFile(entryFile, originalRecord);
    await fs.writeFile(path.join(spoolDirectory, 'state.json'), `${JSON.stringify({
      version: 1,
      databaseMode: 'synthetic-test-database',
      checkpointSequence: 0,
      checkpointHash: null,
      lastSequence: 1,
      lastHash: entry.auditHash
    })}\n`);

    const logger = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'synthetic-test-database'
    });
    await logger.initialize();

    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 1 });
    assert.equal(logger.getAll()[0].auditHash, entry.auditHash);
    assert.equal(await fs.readFile(entryFile, 'utf8'), originalRecord);
  });

  it('normalizes once and replays the same JSON snapshot after restart', async () => {
    const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
    const persistedEntries = [];
    const eventId = crypto.randomUUID();
    let toJSONCalls = 0;
    const input = {
      eventId,
      timestamp: '2026-10-29T05:00:00.000Z',
      tenant: 'synthetic-tenant',
      command: 'synthetic.normalized',
      payload: {
        nested: { kept: true, omitted: undefined },
        values: [undefined, { omitted: undefined, date: new Date('2026-01-02T03:04:05.000Z') }],
        date: new Date('2026-02-03T04:05:06.000Z'),
        nonFinite: Infinity,
        serialized: {
          toJSON() {
            toJSONCalls += 1;
            return 'serialized';
          }
        }
      },
      result: { ok: true, omitted: undefined }
    };
    const firstLogger = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'synthetic-test-database',
      persistQuery: async () => {
        throw new Error('synthetic database outage');
      }
    });

    const appended = await firstLogger.log(input);
    const normalizedPayload = {
      nested: { kept: true },
      values: [null, { date: '2026-01-02T03:04:05.000Z' }],
      date: '2026-02-03T04:05:06.000Z',
      nonFinite: null,
      serialized: 'serialized'
    };
    assert.equal(toJSONCalls, 1);
    assert.equal(appended.eventId, input.eventId);
    assert.equal(appended.timestamp, input.timestamp);
    assert.deepEqual(appended.payload, normalizedPayload);
    assert.deepEqual(appended.result, { ok: true, governanceSignals: [] });
    const originalHash = appended.auditHash;
    await firstLogger.close();

    const restartedLogger = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'synthetic-test-database',
      persistQuery: async (sql, parameters) => {
        if (sql.includes('INSERT INTO audit_logs')) {
          persistedEntries.push({
            eventId: parameters[0],
            payload: JSON.parse(parameters[4]),
            result: JSON.parse(parameters[5])
          });
        }
        return { rowCount: 1, rows: [] };
      }
    });

    await restartedLogger.initialize();
    assert.deepEqual(restartedLogger.verifyChain(), { valid: true, checked: 2 });
    const recovered = restartedLogger.getAll().find((entry) => entry.eventId === appended.eventId);
    assert.deepEqual(recovered, appended);
    assert.equal(recovered.auditHash, originalHash);

    const replay = await restartedLogger.reconcilePending();
    assert.equal(replay.status, 'reconciled');
    const persistedOriginal = persistedEntries.find((entry) => entry.eventId === appended.eventId);
    assert.deepEqual(persistedOriginal.payload, normalizedPayload);
    assert.equal(persistedOriginal.result.auditHash, originalHash);
    assert.equal(persistedOriginal.result.prevHash, appended.prevHash);
    assert.equal(persistedOriginal.result.auditTimestamp, input.timestamp);
    assert.deepEqual(restartedLogger.verifyChain(), { valid: true, checked: 3 });
  });

  it('rejects unserializable entries without changing sequence, checkpoint, or pending records', async () => {
    const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
    const logger = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'synthetic-test-database',
      persistQuery: async () => {
        throw new Error('synthetic database outage');
      }
    });
    await logger.log({ command: 'synthetic.pending', payload: {}, result: {} });

    const readSpool = async () => {
      const state = JSON.parse(await fs.readFile(path.join(spoolDirectory, 'state.json'), 'utf8'));
      const files = (await fs.readdir(spoolDirectory))
        .filter((name) => name.endsWith('.json') && name !== 'state.json')
        .sort();
      const records = await Promise.all(
        files.map(async (name) => ({
          name,
          content: await fs.readFile(path.join(spoolDirectory, name), 'utf8')
        }))
      );
      return { state, records, status: logger.getPersistenceStatus(), entries: logger.getAll() };
    };
    const before = await readSpool();

    const circular = { value: 'cycle' };
    circular.self = circular;
    await assert.rejects(
      logger.log({ command: 'synthetic.circular', payload: circular, result: {} }),
      /AUDIT_ENTRY_SERIALIZATION_FAILED/
    );
    await assert.rejects(
      logger.log({ command: 'synthetic.bigint', payload: { value: 1n }, result: {} }),
      /AUDIT_ENTRY_SERIALIZATION_FAILED/
    );

    const after = await readSpool();
    assert.deepEqual(after, before);
  });

  it('keeps retained replay evidence isolated from input, subscriber, and returned-object mutations', async () => {
    let persistedPayload;
    const input = {
      command: 'synthetic.mutation',
      payload: { nested: { value: 'original' } },
      result: { data: { value: 'original' } }
    };
    const logger = createTestLogger({
      persistQuery: async (sql, parameters) => {
        if (sql.includes('INSERT INTO audit_logs')) {
          persistedPayload = JSON.parse(parameters[4]);
        }
        return { rowCount: 1, rows: [] };
      }
    });
    logger.subscribe((entry) => {
      entry.payload.nested.value = 'subscriber mutation';
    });

    const logging = logger.log(input);
    input.payload.nested.value = 'caller mutation';
    input.result.data.value = 'caller mutation';
    const returned = await logging;
    returned.payload.nested.value = 'return mutation';
    returned.result.data.value = 'return mutation';
    const exposed = logger.getAll();
    exposed[0].payload.nested.value = 'getAll mutation';

    const retained = logger.getAll()[0];
    assert.equal(retained.payload.nested.value, 'original');
    assert.equal(retained.result.data.value, 'original');
    assert.deepEqual(persistedPayload, { nested: { value: 'original' } });
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 1 });
  });

  it('keeps failures in the hash chain and persists them in order during reconciliation', async () => {
    let failNextWrite = true;
    let failReconciliationMarker = true;
    const persistedEvents = [];
    const logger = createTestLogger({
      persistQuery: async (_sql, parameters) => {
        const persistedResult = JSON.parse(parameters[5]);
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error('synthetic persistence failure');
        }
        if (parameters[3] === 'system.audit.persist_reconciled' && failReconciliationMarker) {
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
    const entriesAfterMarker = logger.getAll();
    assert.deepEqual(reconciliation, {
      status: 'pending',
      pendingCount: 1,
      failedEventId: entriesAfterMarker[2].eventId,
      error: 'synthetic reconciliation marker failure'
    });
    assert.equal(logger.getPersistenceStatus().status, 'pending_reconciliation');
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 3 });

    const markerRecovery = await logger.reconcilePending();
    const entriesAfterRecovery = logger.getAll();
    assert.deepEqual(markerRecovery, {
      status: 'reconciled',
      pendingCount: 0,
      reconciledCount: 1
    });
    assert.deepEqual(persistedEvents, [
      entriesAfterRecovery[0].eventId,
      entriesAfterRecovery[1].eventId,
      entriesAfterRecovery[2].eventId,
      entriesAfterRecovery[3].eventId
    ]);
    assert.equal(entriesAfterRecovery[2].command, 'system.audit.persist_reconciled');
    assert.equal(entriesAfterRecovery[3].command, 'system.audit.persist_reconciled');
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 4 });
    assert.equal(logger.getPersistenceStatus().status, 'clear');

    const subsequent = await logger.log({
      tenant: 'synthetic-tenant',
      command: 'synthetic.subsequent',
      payload: {},
      result: { ok: true }
    });
    assert.deepEqual(persistedEvents, [
      entriesAfterRecovery[0].eventId,
      entriesAfterRecovery[1].eventId,
      entriesAfterRecovery[2].eventId,
      entriesAfterRecovery[3].eventId,
      subsequent.eventId
    ]);
    assert.deepEqual(logger.verifyChain(), { valid: true, checked: 5 });
  });

  it('does not persist later entries ahead of unresolved audit entries', async () => {
    const persistedEvents = [];
    let failNextWrite = true;
    const logger = createTestLogger({
      persistQuery: async (_sql, parameters) => {
        const persistedResult = JSON.parse(parameters[5]);
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

  it('retains the spool and reports a conflict when duplicate event contents differ', async () => {
    for (const alteredField of ['payload', 'command', 'result']) {
      let storedRow;
      const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
      const logger = createTestLogger({
        spoolDirectory,
        databaseStatus: () => 'synthetic-test-database',
        persistQuery: async (sql, parameters) => {
          if (sql.includes('INSERT INTO audit_logs')) {
            storedRow = {
              event_id: parameters[0],
              chain_sequence: parameters[1],
              tenant_id: parameters[2],
              command: parameters[3],
              payload: JSON.parse(parameters[4]),
              result: JSON.parse(parameters[5]),
              actor: parameters[6],
              created_at: new Date('2000-01-01T00:00:00.000Z')
            };
            if (alteredField === 'payload') {
              storedRow.payload = { value: 'altered' };
            } else if (alteredField === 'command') {
              storedRow.command = 'altered.command';
            } else {
              storedRow.result = { ...storedRow.result, ok: false };
            }
            return { rowCount: 0, rows: [] };
          }
          return { rows: [storedRow] };
        }
      });

      const replayed = await logger.log({
        tenant: 'synthetic-tenant',
        command: 'synthetic.command',
        payload: { value: 'original' },
        result: { ok: true }
      });

      assert.equal(logger.getPersistenceStatus().lastError, 'AUDIT_OUTBOX_RECONCILIATION_CONFLICT');
      assert.equal(logger.getPersistenceStatus().pendingCount, 2);
      const state = JSON.parse(await fs.readFile(path.join(spoolDirectory, 'state.json'), 'utf8'));
      assert.equal(state.checkpointSequence, 0);
      const entryFiles = (await fs.readdir(spoolDirectory)).filter(
        (name) => name.endsWith('.json') && name !== 'state.json'
      );
      assert.equal(entryFiles.length, 2);
      const records = await Promise.all(
        entryFiles.map(async (name) =>
          JSON.parse(await fs.readFile(path.join(spoolDirectory, name), 'utf8'))
        )
      );
      const retained = records.find((record) => record.entry.eventId === replayed.eventId);
      assert.ok(retained);
      assert.equal(retained.entry.timestamp, replayed.timestamp);
      assert.equal(retained.entry.auditHash, storedRow.result.auditHash);
      assert.equal(storedRow.result.prevHash, replayed.prevHash);
      assert.equal(storedRow.result.auditHash, replayed.auditHash);
    }
  });

  it('accepts a duplicate replay when stored event contents match despite a different insertion timestamp', async () => {
    let storedRow;
    const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-${crypto.randomUUID()}`);
    const logger = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'synthetic-test-database',
      persistQuery: async (sql, parameters) => {
        if (sql.includes('INSERT INTO audit_logs')) {
          storedRow = {
            event_id: parameters[0],
            chain_sequence: parameters[1],
            tenant_id: parameters[2],
            command: parameters[3],
            payload: JSON.parse(parameters[4]),
            result: JSON.parse(parameters[5]),
            actor: parameters[6],
            created_at: new Date('2000-01-01T00:00:00.000Z')
          };
          return { rowCount: 0, rows: [] };
        }
        return { rows: [storedRow] };
      }
    });

    const replayed = await logger.log({
      tenant: 'synthetic-tenant',
      command: 'synthetic.command',
      payload: { value: 'original' },
      result: { ok: true }
    });

    assert.equal(storedRow.result.auditTimestamp, replayed.timestamp);
    assert.notEqual(storedRow.created_at.toISOString(), replayed.timestamp);
    assert.equal(logger.getPersistenceStatus().status, 'clear');
    assert.equal(logger.getPersistenceStatus().pendingCount, 0);
    const entryFiles = (await fs.readdir(spoolDirectory)).filter(
      (name) => name.endsWith('.json') && name !== 'state.json'
    );
    assert.deepEqual(entryFiles, []);
  });

  it('fails explicitly when the durable outbox reaches its configured capacity', async () => {
    const logger = createTestLogger({
      maxSpoolBytes: 1,
      databaseStatus: () => 'synthetic-test-database'
    });

    await assert.rejects(
      logger.log({ command: 'synthetic.capacity', payload: {}, result: {} }),
      /AUDIT_OUTBOX_CAPACITY_EXCEEDED/
    );
    assert.equal(logger.getPersistenceStatus().status, 'failed');
    assert.equal(logger.getPersistenceStatus().pendingCount, 0);
    assert.equal(
      logger.getPersistenceStatus().lastError,
      'AUDIT_OUTBOX_CAPACITY_EXCEEDED'
    );
  });

  itWithPostgres('recovers in order after restart and suppresses duplicate replay after a lost acknowledgement', async () => {
    const databaseUrl =
      process.env.AUDIT_OUTBOX_TEST_DATABASE_URL || process.env.RECEIPT_LEDGER_TEST_DATABASE_URL;

    const targetUrl = new URL(databaseUrl);
    const databaseName = decodeURIComponent(targetUrl.pathname.slice(1));
    assert.match(databaseName, /^sentinel_test$/);
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = '/postgres';
    const adminPool = new Pool({ connectionString: adminUrl.toString() });
    const spoolDirectory = path.join(os.tmpdir(), `sentinel-audit-db-${crypto.randomUUID()}`);
    const schema = readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8');
    let databasePool = new Pool({ connectionString: databaseUrl, max: 1 });
    const databasePoolErrors = [];
    databasePool.on('error', (error) => databasePoolErrors.push(error));
    let outageStarted = false;
    let logger;

    try {
      await databasePool.query(schema);
      const createDatabaseLogger = (
        pool,
        persistQuery = (text, params) => pool.query(text, params),
        retryOptions = {}
      ) =>
        createTestLogger({
          spoolDirectory,
          databaseStatus: () => 'enabled',
          loadAnchor: async () => {
            const result = await pool.query(
              `SELECT result->>'auditHash' AS audit_hash
               FROM audit_logs
               WHERE result ? 'auditHash'
               ORDER BY id DESC
               LIMIT 1`
            );
            return result.rows[0] ? result.rows[0].audit_hash : null;
          },
          persistQuery,
          ...retryOptions
        });

      logger = createDatabaseLogger(databasePool);
      const baselineEntry = await logger.log({
        command: 'test.audit.baseline',
        payload: {},
        result: { ok: true }
      });
      assert.equal(logger.getPersistenceStatus().pendingCount, 0);

      await adminPool.query(`ALTER DATABASE "${databaseName}" WITH ALLOW_CONNECTIONS false`);
      outageStarted = true;
      await adminPool.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [databaseName]
      );

      const outageEntry = await logger.log({
        command: 'test.audit.during_outage',
        payload: {},
        result: { ok: true }
      });
      assert.equal(logger.getPersistenceStatus().pendingCount, 2);
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 3 });
      assert.ok(databasePoolErrors.some((error) => /terminating connection/i.test(error.message)));
      await logger.close();
      await databasePool.end();
      databasePool = null;

      await adminPool.query(`ALTER DATABASE "${databaseName}" WITH ALLOW_CONNECTIONS true`);
      outageStarted = false;

      databasePool = new Pool({ connectionString: databaseUrl, max: 1 });
      let loseFirstAcknowledgement = true;
      logger = createDatabaseLogger(databasePool, async (text, params) => {
        const result = await databasePool.query(text, params);
        if (loseFirstAcknowledgement && text.includes('INSERT INTO audit_logs')) {
          loseFirstAcknowledgement = false;
          throw new Error('simulated lost database acknowledgement');
        }
        return result;
      });

      await logger.initialize();
      assert.equal((await logger.reconcilePending()).status, 'pending');
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 2 });
      await logger.close();

      let loseRestartAcknowledgement = true;
      logger = createDatabaseLogger(
        databasePool,
        async (text, params) => {
          const result = await databasePool.query(text, params);
          if (loseRestartAcknowledgement && text.includes('INSERT INTO audit_logs')) {
            loseRestartAcknowledgement = false;
            throw new Error('simulated lost acknowledgement after restart');
          }
          return result;
        },
        { retryIntervalMs: 25, maxRetryIntervalMs: 50 }
      );
      await logger.initialize();
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 2 });
      assert.equal((await logger.reconcilePending()).status, 'pending');
      const retryDeadline = Date.now() + 2000;
      while (
        (logger.getPersistenceStatus().pendingCount > 0 || logger.getAll().length < 3) &&
        Date.now() < retryDeadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(logger.getPersistenceStatus().pendingCount, 0);
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 3 });

      const eventIds = [
        baselineEntry.eventId,
        ...logger.getAll().map((entry) => entry.eventId)
      ];
      const persisted = await databasePool.query(
        `SELECT event_id, chain_sequence
         FROM audit_logs
         WHERE event_id = ANY($1::text[])
         ORDER BY chain_sequence`,
        [eventIds]
      );
      assert.deepEqual(
        persisted.rows.map((row) => row.event_id),
        eventIds
      );
      const duplicateCount = await databasePool.query(
        'SELECT COUNT(*)::int AS count FROM audit_logs WHERE event_id = $1',
        [outageEntry.eventId]
      );
      assert.equal(duplicateCount.rows[0].count, 1);
    } finally {
      if (logger) await logger.close();
      if (databasePool) await databasePool.end();
      if (outageStarted) {
        await adminPool.query(`ALTER DATABASE "${databaseName}" WITH ALLOW_CONNECTIONS true`);
      }
      await adminPool.end();
    }
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
