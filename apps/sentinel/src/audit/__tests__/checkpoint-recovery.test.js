const assert = require('assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { readFileSync } = require('fs');
const { Pool } = require('pg');
const { createAuditLogger } = require('../auditLogger');
const databaseUrl =
  process.env.AUDIT_OUTBOX_TEST_DATABASE_URL || process.env.RECEIPT_LEDGER_TEST_DATABASE_URL;
const itWithPostgres = databaseUrl ? it : it.skip;

describe('audit startup checkpoint recovery', () => {
  let directory;
  let loggers;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-checkpoint-'));
    loggers = [];
  });

  afterEach(async () => {
    for (const logger of loggers) await logger.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  async function fixture() {
    const rows = new Map();
    let unavailable = true;
    let rowReads = 0;
    const query = async (sql, params) => {
      if (unavailable) throw new Error('injected database outage');
      if (sql.includes('INSERT INTO audit_logs')) {
        if (rows.has(params[0])) return { rowCount: 0, rows: [] };
        rows.set(params[0], {
          event_id: params[0],
          chain_sequence: params[1],
          tenant_id: params[2],
          command: params[3],
          payload: JSON.parse(params[4]),
          result: JSON.parse(params[5]),
          actor: params[6]
        });
        return { rowCount: 1, rows: [{ event_id: params[0] }] };
      }
      assert.match(sql, /WHERE event_id = \$1/);
      rowReads += 1;
      return { rows: rows.has(params[0]) ? [rows.get(params[0])] : [] };
    };
    function logger(anchor) {
      const instance = createAuditLogger({
        spoolDirectory: directory,
        databaseStatus: () => 'enabled',
        loadAnchor: async () => anchor,
        persistQuery: query,
        retryIntervalMs: 60000,
        maxRetryIntervalMs: 60000
      });
      loggers.push(instance);
      return instance;
    }
    const first = logger(null);
    const original = await first.log({
      tenant: 'review-fixture',
      command: 'review.original',
      payload: { retained: 'original' },
      result: { ok: true }
    });
    const entries = first.getAll();
    assert.equal(entries.length, 2);
    await first.close();
    unavailable = false;
    async function store(entry, sequence) {
      await query('INSERT INTO audit_logs', [
        entry.eventId, sequence, entry.tenant || 'ownerfi', entry.command,
        JSON.stringify(entry.payload || {}),
        JSON.stringify({
          ...entry.result,
          eventId: entry.eventId,
          prevHash: entry.prevHash,
          auditHash: entry.auditHash,
          auditTimestamp: entry.timestamp
        }),
        entry.actor || null
      ]);
    }
    await store(original, 1);
    return { rows, original, entries, logger, store, rowReads: () => rowReads };
  }

  async function spoolFiles() {
    return (await fs.readdir(directory)).filter((name) => /^\d{20}-/.test(name)).sort();
  }

  it('verifies the retained suffix and checks database event inventory separately', async () => {
    const f = await fixture();
    const recovered = f.logger(f.original.auditHash);
    await recovered.initialize();
    assert.deepEqual(recovered.verifyChain(), { valid: true, checked: 1 });
    assert.deepEqual(recovered.getAll().map((entry) => entry.eventId), [f.entries[1].eventId]);
    assert.equal((await recovered.reconcilePending()).status, 'reconciled');
    const suffix = recovered.getAll();
    assert.equal(suffix.length, 2);
    assert.deepEqual(recovered.verifyChain(), { valid: true, checked: 2 });
    assert.equal(suffix[1].command, 'system.audit.persist_reconciled');
    assert.deepEqual(suffix[1].payload.reconciledEventIds, [f.entries[1].eventId]);
    assert.deepEqual([...f.rows.keys()], [f.original.eventId, ...suffix.map((entry) => entry.eventId)]);
  });

  it('retains spool evidence when recovered checkpoint publication is interrupted', async () => {
    const f = await fixture();
    const statePath = path.join(directory, 'state.json');
    const before = await fs.readFile(statePath, 'utf8');
    const filesBefore = await spoolFiles();
    const recovering = f.logger(f.original.auditHash);
    const rename = fs.rename;
    fs.rename = async (source, destination) => {
      if (destination === statePath) {
        throw new Error('injected interruption before checkpoint publication');
      }
      return rename(source, destination);
    };
    try {
      await assert.rejects(recovering.initialize(), /injected interruption/);
    } finally {
      fs.rename = rename;
      await recovering.close();
    }
    assert.equal(await fs.readFile(statePath, 'utf8'), before);
    assert.deepEqual(await spoolFiles(), filesBefore);
    assert.equal(f.rows.has(f.original.eventId), true);
    const restarted = f.logger(f.original.auditHash);
    await restarted.initialize();
    assert.deepEqual(restarted.verifyChain(), { valid: true, checked: 1 });
    assert.equal((await spoolFiles()).length, 1);
  });

  it('recovers after checkpoint publication when prefix deletion is interrupted', async () => {
    const f = await fixture();
    await f.store(f.entries[1], 2);
    const files = await spoolFiles();
    const recovering = f.logger(f.entries[1].auditHash);
    const unlink = fs.unlink;
    fs.unlink = async (file) => {
      if (file === path.join(directory, files[1])) {
        throw new Error('injected prefix deletion interruption');
      }
      return unlink(file);
    };
    try {
      await assert.rejects(recovering.initialize(), /injected prefix deletion/);
    } finally {
      fs.unlink = unlink;
      await recovering.close();
    }
    const checkpoint = JSON.parse(await fs.readFile(path.join(directory, 'state.json'), 'utf8'));
    assert.equal(checkpoint.checkpointSequence, 2);
    assert.equal(checkpoint.checkpointHash, f.entries[1].auditHash);
    assert.deepEqual(await spoolFiles(), [files[1]]);
    const restarted = f.logger(f.entries[1].auditHash);
    await restarted.initialize();
    assert.deepEqual(restarted.verifyChain(), { valid: true, checked: 0 });
    assert.deepEqual(await spoolFiles(), []);
  });

  for (const field of [
    'event_id', 'chain_sequence', 'tenant_id', 'command', 'payload',
    'result', 'actor', 'auditTimestamp', 'prevHash', 'auditHash', 'missing'
  ]) {
    it(`rejects a stored ${field} conflict on both duplicate replay and startup without deleting evidence`, async () => {
      const f = await fixture();
      const row = f.rows.get(f.original.eventId);
      if (field === 'missing') {
        f.rows.set(f.original.eventId, undefined);
      } else if (['auditTimestamp', 'prevHash', 'auditHash'].includes(field)) {
        row.result[field] = 'altered';
      } else {
        row[field] = field === 'chain_sequence' ? 99 : { altered: true };
      }
      const filesBefore = await spoolFiles();
      const stateBefore = await fs.readFile(path.join(directory, 'state.json'), 'utf8');
      const replay = f.logger(null);
      await replay.initialize();
      const result = await replay.reconcilePending();
      assert.equal(result.status, 'pending');
      assert.equal(result.error, 'AUDIT_OUTBOX_RECONCILIATION_CONFLICT');
      assert.equal(f.rowReads(), 1);
      await replay.close();
      const recovered = f.logger(f.original.auditHash);
      await assert.rejects(recovered.initialize(), /AUDIT_OUTBOX_RECONCILIATION_CONFLICT/);
      assert.equal(f.rowReads(), 2);
      assert.deepEqual(await spoolFiles(), filesBefore);
      assert.equal(await fs.readFile(path.join(directory, 'state.json'), 'utf8'), stateBefore);
    });
  }

  it('validates every persisted prefix event, not only the matching database tail', async () => {
    const f = await fixture();
    await f.store(f.entries[1], 2);
    f.rows.get(f.original.eventId).payload = { altered: true };
    const filesBefore = await spoolFiles();
    const recovered = f.logger(f.entries[1].auditHash);
    await assert.rejects(recovered.initialize(), /AUDIT_OUTBOX_RECONCILIATION_CONFLICT/);
    assert.deepEqual(await spoolFiles(), filesBefore);
  });

  itWithPostgres('preserves PostgreSQL conflict evidence and recovers after the stored row is repaired', async () => {
    assert.equal(decodeURIComponent(new URL(databaseUrl).pathname.slice(1)), 'sentinel_test');
    const pool = new Pool({ connectionString: databaseUrl });
    let original;
    let entries;
    let unavailable = true;
    let loseAcknowledgement = false;
    const logger = (anchor) => {
      const instance = createAuditLogger({
        spoolDirectory: directory,
        databaseStatus: () => 'enabled',
        loadAnchor: async () => anchor,
        persistQuery: async (sql, params) => {
          if (unavailable) throw new Error('injected database outage');
          const result = await pool.query(sql, params);
          if (loseAcknowledgement && sql.includes('INSERT INTO audit_logs')) {
            loseAcknowledgement = false;
            throw new Error('injected lost acknowledgement');
          }
          return result;
        },
        retryIntervalMs: 60000,
        maxRetryIntervalMs: 60000
      });
      loggers.push(instance);
      return instance;
    };
    try {
      await pool.query(readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8'));
      const first = logger(null);
      original = await first.log({
        tenant: 'checkpoint-pg-test',
        command: 'test.checkpoint.pg',
        payload: { retained: true },
        result: { ok: true }
      });
      entries = first.getAll();
      await first.close();
      unavailable = false;
      const lostAck = logger(null);
      await lostAck.initialize();
      loseAcknowledgement = true;
      try {
        assert.equal((await lostAck.reconcilePending()).status, 'pending');
      } finally {
        await lostAck.close();
      }
      const filesBefore = await spoolFiles();
      await pool.query(
        'UPDATE audit_logs SET payload = $1::jsonb WHERE event_id = $2',
        [JSON.stringify({ altered: true }), original.eventId]
      );
      const conflicting = logger(original.auditHash);
      await assert.rejects(conflicting.initialize(), /AUDIT_OUTBOX_RECONCILIATION_CONFLICT/);
      await conflicting.close();
      assert.deepEqual(await spoolFiles(), filesBefore);
      await pool.query(
        'UPDATE audit_logs SET payload = $1::jsonb WHERE event_id = $2',
        [JSON.stringify(original.payload), original.eventId]
      );
      const repaired = logger(original.auditHash);
      await repaired.initialize();
      assert.deepEqual(repaired.verifyChain(), { valid: true, checked: 1 });
      assert.equal((await repaired.reconcilePending()).status, 'reconciled');
      const eventIds = [original.eventId, ...repaired.getAll().map((entry) => entry.eventId)];
      const persisted = await pool.query(
        'SELECT event_id FROM audit_logs WHERE event_id = ANY($1::text[]) ORDER BY chain_sequence',
        [eventIds]
      );
      assert.deepEqual(persisted.rows.map((row) => row.event_id), eventIds);
    } finally {
      for (const instance of loggers) await instance.close();
      if (entries) {
        const ids = [...new Set(entries.concat(
          ...loggers.map((instance) => instance.getAll())
        ).map((entry) => entry.eventId))];
        await pool.query('DELETE FROM audit_logs WHERE event_id = ANY($1::text[])', [ids]);
      }
      await pool.end();
    }
  });
});
