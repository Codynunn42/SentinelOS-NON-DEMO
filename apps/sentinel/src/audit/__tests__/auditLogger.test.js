const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const { auditLogger, createAuditLogger } = require('../auditLogger');
const { createDurableAuditOutbox } = require('../durableAuditOutbox');
const { readFileSync } = require('fs');

const createdLoggers = [];
const createdProcesses = new Set();
const createdSpoolDirectories = new Set();
const TEST_AUDIT_HASH = 'a'.repeat(64);
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

function createTestOutbox(directory, overrides = {}) {
  return createDurableAuditOutbox({
    directory,
    databaseStatus: () => 'disabled',
    loadAnchor: async () => null,
    ...overrides
  });
}

function createSpoolDirectory(label) {
  const directory = path.join(os.tmpdir(), `sentinel-audit-${label}-${crypto.randomUUID()}`);
  createdSpoolDirectories.add(directory);
  return directory;
}

function testEntry() {
  return {
    eventId: crypto.randomUUID(),
    command: 'test.audit.locking',
    payload: { retained: true },
    result: {},
    actor: 'test',
    timestamp: new Date().toISOString()
  };
}

function verifyTestEntry(entry, previousHash) {
  return entry.prevHash === previousHash && entry.auditHash === TEST_AUDIT_HASH;
}

function hashTestEntry(entry, previousHash) {
  return { ...entry, prevHash: previousHash, auditHash: TEST_AUDIT_HASH };
}

function startOutboxProcess(directory, { append = false } = {}) {
  const outboxPath = path.resolve(__dirname, '../durableAuditOutbox');
  const script = `
    const { createDurableAuditOutbox } = require(${JSON.stringify(outboxPath)});
    const outbox = createDurableAuditOutbox({
      directory: process.env.AUDIT_TEST_SPOOL,
      databaseStatus: () => 'disabled',
      loadAnchor: async () => null
    });
    const verifyEntry = (entry, previousHash) =>
      entry.prevHash === previousHash && entry.auditHash === '${TEST_AUDIT_HASH}';
    (async () => {
      await outbox.initialize({ verifyEntry });
      let eventId = '';
      if (process.env.AUDIT_TEST_APPEND === '1') {
        const { entry } = await outbox.append({
          eventId: require('crypto').randomUUID(),
          command: 'test.audit.locking',
          payload: { retained: true },
          result: {},
          actor: 'test',
          timestamp: new Date().toISOString()
        }, (value, previousHash) => ({
          ...value,
          prevHash: previousHash,
          auditHash: '${TEST_AUDIT_HASH}'
        }));
        eventId = entry.eventId;
      }
      process.stdout.write('READY ' + eventId + String.fromCharCode(10));
      process.stdin.once('end', () => {
        outbox.close().catch((error) => {
          process.stderr.write(error.message + String.fromCharCode(10));
          process.exitCode = 2;
        });
      });
      process.stdin.resume();
    })().catch((error) => {
      process.stderr.write(error.message + String.fromCharCode(10));
      process.exitCode = 2;
    });
  `;
  const child = spawn(process.execPath, ['-e', script], {
    env: {
      ...process.env,
      AUDIT_TEST_SPOOL: directory,
      AUDIT_TEST_APPEND: append ? '1' : '0'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  createdProcesses.add(child);
  child.once('exit', () => createdProcesses.delete(child));
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  return {
    child,
    get output() {
      return { stdout, stderr };
    },
    waitForStartup() {
      return new Promise((resolve, reject) => {
        const onData = () => {
          const readyLine = stdout.split(/\r?\n/).find((line) => line.startsWith('READY '));
          if (readyLine) {
            child.stdout.off('data', onData);
            resolve({ ready: true, eventId: readyLine.slice('READY '.length) });
          }
        };
        child.stdout.on('data', onData);
        child.once('error', reject);
        child.once('exit', (code) => {
          if (!stdout.split(/\r?\n/).some((line) => line.startsWith('READY '))) {
            resolve({ ready: false, code, stdout, stderr });
          }
        });
        onData();
      });
    },
    waitForExit() {
      if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
      return new Promise((resolve) => child.once('exit', resolve));
    }
  };
}

async function initializeAfterLockRelease(directory) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const outbox = createTestOutbox(directory);
    try {
      await outbox.initialize({ verifyEntry: verifyTestEntry });
      return outbox;
    } catch (error) {
      await outbox.close();
      if (!/AUDIT_OUTBOX_WRITER_LOCKED/.test(error.message)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error('Timed out waiting for outbox writer lock release');
}

afterEach(async () => {
  const processes = [...createdProcesses];
  for (const child of processes) {
    child.kill('SIGKILL');
  }
  await Promise.all(processes.map((child) =>
    child.exitCode !== null || child.signalCode !== null
      ? Promise.resolve()
      : new Promise((resolve) => child.once('exit', resolve))
  ));
  const entries = createdLoggers.splice(0);
  await Promise.all(entries.map(({ logger }) => logger.close()));
  await Promise.all(
    [...new Set([
      ...entries.map(({ spoolDirectory }) => spoolDirectory),
      ...createdSpoolDirectories
    ])]
      .map((spoolDirectory) => fs.rm(spoolDirectory, { recursive: true, force: true }))
  );
  createdSpoolDirectories.clear();
});

describe('durable audit outbox writer locking', () => {
  it('rejects a database tail that no longer matches the persisted outbox checkpoint', async () => {
    const spoolDirectory = createSpoolDirectory('stale-anchor');
    const originalDatabaseAnchor = 'b'.repeat(64);
    const outbox = createTestOutbox(spoolDirectory, {
      databaseStatus: () => 'enabled',
      loadAnchor: async () => originalDatabaseAnchor
    });
    await outbox.initialize({ verifyEntry: verifyTestEntry });
    await outbox.append(testEntry(), hashTestEntry);
    await outbox.flush(async () => {});
    await outbox.close();

    const restoredDatabase = createTestOutbox(spoolDirectory, {
      databaseStatus: () => 'enabled',
      loadAnchor: async () => 'c'.repeat(64)
    });
    await assert.rejects(
      restoredDatabase.initialize({ verifyEntry: verifyTestEntry }),
      /AUDIT_OUTBOX_DATABASE_ANCHOR_MISMATCH/
    );
    await restoredDatabase.close();
  });

  it('advances the checkpoint when the database already contains a pending spool entry', async () => {
    const spoolDirectory = createSpoolDirectory('persisted-before-checkpoint');
    const first = createTestOutbox(spoolDirectory, {
      databaseStatus: () => 'enabled',
      loadAnchor: async () => 'b'.repeat(64)
    });
    await first.initialize({ verifyEntry: verifyTestEntry });
    const appended = await first.append(testEntry(), hashTestEntry);
    await first.close();

    const recovered = createTestOutbox(spoolDirectory, {
      databaseStatus: () => 'enabled',
      loadAnchor: async () => appended.entry.auditHash
    });
    await recovered.initialize({
      verifyEntry: verifyTestEntry,
      verifyPersistedEntry: async (entry, sequence) => {
        assert.deepEqual(entry, appended.entry);
        assert.equal(sequence, appended.sequence);
      }
    });
    assert.equal(recovered.pendingCount, 0);
    assert.equal(recovered.initialAnchorHash, appended.entry.auditHash);
    assert.equal(recovered.lastHash, appended.entry.auditHash);
    assert.deepEqual(
      (await fs.readdir(spoolDirectory)).filter((name) => name.includes(appended.entry.eventId)),
      []
    );
    await recovered.close();
  });

  it('does not leave a partial final spool entry after an interrupted write', async () => {
    const spoolDirectory = createSpoolDirectory('interrupted-entry');
    const outbox = createTestOutbox(spoolDirectory);
    await outbox.initialize({ verifyEntry: verifyTestEntry });
    const entry = testEntry();
    const originalOpen = fs.open;
    fs.open = async (...args) => {
      const handle = await originalOpen(...args);
      if (!String(args[0]).includes(`${entry.eventId}.json`)) return handle;
      return new Proxy(handle, {
        get(target, property) {
          if (property === 'writeFile') {
            return async () => {
              throw new Error('synthetic interrupted spool write');
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });
    };

    try {
      await assert.rejects(
        outbox.append(entry, hashTestEntry),
        /synthetic interrupted spool write/
      );
    } finally {
      fs.open = originalOpen;
    }

    assert.deepEqual(
      (await fs.readdir(spoolDirectory)).filter((name) => name.includes(`${entry.eventId}.json`)),
      []
    );
    await outbox.close();
  });

  it('removes abandoned atomic-write temporary files during locked recovery', async () => {
    const spoolDirectory = createSpoolDirectory('orphaned-temp');
    const initial = createTestOutbox(spoolDirectory);
    await initial.initialize({ verifyEntry: verifyTestEntry });
    await initial.close();
    const abandonedFiles = [
      `state.json.${process.pid}.${crypto.randomUUID()}.tmp`,
      `00000000000000000001-${crypto.randomUUID()}.json.${process.pid}.${crypto.randomUUID()}.tmp`
    ];
    await Promise.all(abandonedFiles.map((name) =>
      fs.writeFile(path.join(spoolDirectory, name), 'incomplete')
    ));

    const recovered = createTestOutbox(spoolDirectory);
    await recovered.initialize({ verifyEntry: verifyTestEntry });
    const remaining = await fs.readdir(spoolDirectory);
    assert.ok(abandonedFiles.every((name) => !remaining.includes(name)));
    await recovered.close();
  });

  it('does not let a second live logger in the same process take the writer lock', async () => {
    const spoolDirectory = createSpoolDirectory('lock');
    const first = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'disabled'
    });
    const second = createTestLogger({
      spoolDirectory,
      databaseStatus: () => 'disabled'
    });

    await first.initialize();
    await assert.rejects(second.initialize(), /AUDIT_OUTBOX_WRITER_LOCKED/);
    await first.close();
    await second.initialize();
    assert.equal(second.getPersistenceStatus().status, 'clear');
  });

  it('admits only one of simultaneous process recovery attempts', async function () {
    const spoolDirectory = createSpoolDirectory('race');
    const contenders = [
      startOutboxProcess(spoolDirectory),
      startOutboxProcess(spoolDirectory)
    ];
    const outcomes = await Promise.all(contenders.map((contender) => contender.waitForStartup()));

    assert.equal(outcomes.filter((outcome) => outcome.ready).length, 1);
    assert.equal(outcomes.filter((outcome) => !outcome.ready).length, 1);
    assert.match(outcomes.find((outcome) => !outcome.ready).stderr, /AUDIT_OUTBOX_WRITER_LOCKED/);

    const winner = contenders[outcomes.findIndex((outcome) => outcome.ready)];
    winner.child.stdin.end();
    await Promise.all(contenders.map((contender) => contender.waitForExit()));

    const reacquired = createTestOutbox(spoolDirectory);
    await reacquired.initialize({ verifyEntry: verifyTestEntry });
    await reacquired.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  }).timeout(10000);

  it('recovers retained spool entries after the writer process dies abruptly', async () => {
    const spoolDirectory = createSpoolDirectory('crash');
    const writer = startOutboxProcess(spoolDirectory, { append: true });
    const startup = await writer.waitForStartup();
    assert.equal(startup.ready, true);
    assert.ok(startup.eventId);

    writer.child.kill('SIGKILL');
    await writer.waitForExit();

    const recovered = await initializeAfterLockRelease(spoolDirectory);
    assert.equal(recovered.pendingCount, 1);
    assert.equal(recovered.pendingEntries[0].eventId, startup.eventId);
    await recovered.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  });

  it('ignores stale lock metadata from a different hostname and a reused PID', async () => {
    const spoolDirectory = createSpoolDirectory('restart');
    await fs.mkdir(spoolDirectory, { recursive: true });
    const staleMetadata = JSON.stringify({
      pid: process.pid,
      hostname: 'previous-container-host'
    });
    await fs.writeFile(path.join(spoolDirectory, 'writer.lock'), staleMetadata);

    const outbox = createTestOutbox(spoolDirectory);
    await outbox.initialize({ verifyEntry: verifyTestEntry });
    assert.equal(await fs.readFile(path.join(spoolDirectory, 'writer.lock'), 'utf8'), staleMetadata);
    await outbox.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  });

  it('fails closed when the filesystem lock utility is unavailable', async () => {
    const spoolDirectory = createSpoolDirectory('unsupported');
    const originalPath = process.env.PATH;
    const emptyPath = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-no-flock-'));
    process.env.PATH = emptyPath;
    try {
      const outbox = createTestOutbox(spoolDirectory);
      await assert.rejects(
        outbox.initialize({ verifyEntry: verifyTestEntry }),
        /AUDIT_OUTBOX_LOCK_UNSUPPORTED/
      );
    } finally {
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
      await fs.rm(emptyPath, { recursive: true, force: true });
    }

    const recovered = createTestOutbox(spoolDirectory);
    await recovered.initialize({ verifyEntry: verifyTestEntry });
    await recovered.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  });

  it('releases the lock after initialization failure without changing the spool', async () => {
    const spoolDirectory = createSpoolDirectory('init');
    const initial = createTestOutbox(spoolDirectory);
    await initial.initialize({ verifyEntry: verifyTestEntry });
    await initial.append(testEntry(), hashTestEntry);
    await initial.close();
    const filesBeforeFailure = (await fs.readdir(spoolDirectory)).sort();

    const failing = createTestOutbox(spoolDirectory, {
      databaseStatus: () => {
        throw new Error('synthetic initialization failure');
      }
    });
    await assert.rejects(failing.initialize({ verifyEntry: verifyTestEntry }), /synthetic initialization failure/);
    assert.deepEqual((await fs.readdir(spoolDirectory)).sort(), filesBeforeFailure);

    const recovered = createTestOutbox(spoolDirectory);
    await recovered.initialize({ verifyEntry: verifyTestEntry });
    assert.equal(recovered.pendingCount, 1);
    await recovered.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  });

  it('preserves pending entries across clean shutdown and lock reacquisition', async () => {
    const spoolDirectory = createSpoolDirectory('shutdown');
    const first = createTestOutbox(spoolDirectory);
    await first.initialize({ verifyEntry: verifyTestEntry });
    const appended = await first.append(testEntry(), hashTestEntry);
    await first.close();

    const second = createTestOutbox(spoolDirectory);
    await second.initialize({ verifyEntry: verifyTestEntry });
    assert.equal(second.pendingCount, 1);
    assert.equal(second.pendingEntries[0].eventId, appended.entry.eventId);
    await second.close();
    await fs.rm(spoolDirectory, { recursive: true, force: true });
  });
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
    assert.ok(entries[1].result.governanceSignals.some((signal) =>
      signal.type === 'audit_persistence_failure' && signal.severity === 'high'
    ));
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
      const failureEntry = logger.getAll()[2];
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
      assert.deepEqual(logger.getAll().map((entry) => entry.eventId), [failureEntry.eventId]);
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 1 });
      assert.equal((await logger.reconcilePending()).status, 'pending');
      const retryDeadline = Date.now() + 2000;
      while (
        (logger.getPersistenceStatus().pendingCount > 0 || logger.getAll().length < 2) &&
        Date.now() < retryDeadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(logger.getPersistenceStatus().pendingCount, 0);
      assert.deepEqual(logger.verifyChain(), { valid: true, checked: 2 });
      const marker = logger.getAll()[1];
      assert.equal(marker.command, 'system.audit.persist_reconciled');
      assert.deepEqual(marker.payload.reconciledEventIds, [failureEntry.eventId]);

      const eventIds = [
        baselineEntry.eventId,
        outageEntry.eventId,
        failureEntry.eventId,
        marker.eventId
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
