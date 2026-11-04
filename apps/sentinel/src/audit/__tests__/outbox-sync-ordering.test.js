const assert = require('assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { createDurableAuditOutbox } = require('../durableAuditOutbox');

const ENTRY_FILE_SUFFIX = /\d{20}-[0-9a-f-]{36}\.json$/i;

function computeHash(entry, prevHash) {
  const { auditHash, ...rest } = entry;
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ ...rest, prevHash }))
    .digest('hex');
}

function hashEntry(value, prevHash) {
  value.prevHash = prevHash;
  value.auditHash = computeHash(value, prevHash);
  return value;
}

const verifyEntry = (entry, prevHash) =>
  entry.prevHash === prevHash && entry.auditHash === computeHash(entry, prevHash);

describe('audit outbox durable sync ordering', () => {
  let directory;
  let statePath;
  let outboxes;
  let ops;
  let failNext;
  let restoreFs;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-sync-order-'));
    statePath = path.join(directory, 'state.json');
    outboxes = [];
    ops = [];
    failNext = null;
    restoreFs = instrumentFs();
  });

  afterEach(async () => {
    restoreFs();
    for (const outbox of outboxes) await outbox.close();
    await fs.rm(directory, { recursive: true, force: true });
  });

  function record(op) {
    ops.push(op);
    if (failNext && failNext.match(op, ops)) {
      const { error } = failNext;
      failNext = null;
      op.injectedFailure = true;
      throw error;
    }
  }

  function instrumentFs() {
    const realOpen = fs.open;
    const realRename = fs.rename;
    const realUnlink = fs.unlink;

    fs.open = async (...args) => {
      const handle = await realOpen.apply(fs, args);
      const target = path.resolve(String(args[0]));
      if (target === directory || target.startsWith(`${directory}${path.sep}`)) {
        const realSync = handle.sync.bind(handle);
        handle.sync = async () => {
          record(
            target === directory
              ? { op: 'dir-sync' }
              : { op: 'file-sync', target }
          );
          return realSync();
        };
      }
      return handle;
    };
    fs.rename = async (from, to) => {
      const resolvedTo = path.resolve(String(to));
      if (resolvedTo.startsWith(`${directory}${path.sep}`)) {
        record({ op: 'rename', from: path.resolve(String(from)), to: resolvedTo });
      }
      return realRename.call(fs, from, to);
    };
    fs.unlink = async (target) => {
      const resolved = path.resolve(String(target));
      if (resolved.startsWith(`${directory}${path.sep}`)) {
        record({ op: 'unlink', target: resolved });
      }
      return realUnlink.call(fs, target);
    };

    return () => {
      fs.open = realOpen;
      fs.rename = realRename;
      fs.unlink = realUnlink;
    };
  }

  function createOutbox({ anchor = async () => null } = {}) {
    const outbox = createDurableAuditOutbox({
      directory,
      databaseStatus: () => 'enabled',
      loadAnchor: anchor
    });
    outboxes.push(outbox);
    return outbox;
  }

  async function appendEntry(outbox) {
    const { entry } = await outbox.append(
      {
        eventId: crypto.randomUUID(),
        tenant: 'sync-order-fixture',
        command: 'sync.order.probe',
        payload: { probe: true },
        result: { ok: true }
      },
      hashEntry
    );
    return entry;
  }

  function persistRecorder(persisted) {
    return async (entry, sequence) => {
      record({ op: 'persist', eventId: entry.eventId, sequence });
      persisted.push({ entry, sequence });
    };
  }

  async function spoolEntryFiles() {
    return (await fs.readdir(directory))
      .filter((name) => ENTRY_FILE_SUFFIX.test(name))
      .sort();
  }

  function indexOf(fromOps, predicate, description) {
    const index = fromOps.findIndex(predicate);
    assert.ok(index >= 0, `expected operation not observed: ${description}`);
    return index;
  }

  it('fsyncs the published checkpoint after the database write and before spool prefix deletion', async () => {
    const outbox = createOutbox();
    await outbox.initialize({ verifyEntry });
    await appendEntry(outbox);
    const [entryFile] = await spoolEntryFiles();
    const entryPath = path.join(directory, entryFile);

    ops = [];
    const result = await outbox.flush(persistRecorder([]));
    assert.equal(result.status, 'clear');

    const persistIndex = indexOf(ops, (op) => op.op === 'persist', 'database persist');
    const stateRenameIndex = indexOf(
      ops,
      (op) => op.op === 'rename' && op.to === statePath,
      'checkpoint state rename'
    );
    const stateRename = ops[stateRenameIndex];
    const stateContentSyncIndex = indexOf(
      ops,
      (op) => op.op === 'file-sync' && op.target === stateRename.from,
      'checkpoint temp file fsync'
    );
    const unlinkIndex = indexOf(
      ops,
      (op) => op.op === 'unlink' && op.target === entryPath,
      'spool entry deletion'
    );
    const publishSyncIndex = indexOf(
      ops,
      (op, index) => op.op === 'dir-sync' && index > stateRenameIndex,
      'directory fsync after checkpoint rename'
    );
    const postUnlinkSyncIndex = indexOf(
      ops,
      (op, index) => op.op === 'dir-sync' && index > unlinkIndex,
      'directory fsync after spool deletion'
    );

    assert.ok(persistIndex < stateContentSyncIndex, 'checkpoint written only after database persist');
    assert.ok(stateContentSyncIndex < stateRenameIndex, 'checkpoint contents fsynced before rename');
    assert.ok(stateRenameIndex < publishSyncIndex, 'checkpoint rename precedes its directory fsync');
    assert.ok(publishSyncIndex < unlinkIndex, 'checkpoint durably published before spool deletion');
    assert.ok(unlinkIndex < postUnlinkSyncIndex, 'spool deletion followed by directory fsync');
    assert.ok(
      !ops.slice(0, stateRenameIndex).some((op) => op.op === 'unlink'),
      'no spool deletion before the checkpoint rename'
    );
  });

  it('retains the spool entry and fails closed when checkpoint publication cannot be made durable', async () => {
    const outbox = createOutbox();
    await outbox.initialize({ verifyEntry });
    const entry = await appendEntry(outbox);
    const [entryFile] = await spoolEntryFiles();

    failNext = {
      match: (op, log) => {
        if (op.op !== 'dir-sync') return false;
        const lastRename = [...log].reverse().find((item) => item.op === 'rename');
        return Boolean(lastRename && lastRename.to === statePath);
      },
      error: Object.assign(new Error('injected checkpoint publication failure'), { code: 'EIO' })
    };
    const persisted = [];
    const result = await outbox.flush(persistRecorder(persisted));

    assert.equal(result.status, 'pending');
    assert.equal(result.pendingCount, 1);
    assert.equal(result.failedEventId, entry.eventId);
    assert.match(result.error, /injected checkpoint publication failure/);
    assert.equal(persisted.length, 1);
    assert.ok(
      !ops.some((op) => op.op === 'unlink' && ENTRY_FILE_SUFFIX.test(op.target)),
      'no spool deletion attempted after failed checkpoint publication'
    );
    assert.deepEqual(await spoolEntryFiles(), [entryFile]);
    await assert.rejects(appendEntry(outbox), /injected checkpoint publication failure/);
    await assert.rejects(outbox.flush(persistRecorder([])), /injected checkpoint publication failure/);
  });

  it('publishes the checkpoint durably before deletion so an interrupted deletion is cleaned up on restart', async () => {
    const outbox = createOutbox();
    await outbox.initialize({ verifyEntry });
    const entry = await appendEntry(outbox);
    const [entryFile] = await spoolEntryFiles();
    const entryPath = path.join(directory, entryFile);

    failNext = {
      match: (op) => op.op === 'unlink' && op.target === entryPath,
      error: Object.assign(new Error('injected spool deletion failure'), { code: 'EIO' })
    };
    const result = await outbox.flush(persistRecorder([]));

    assert.equal(result.status, 'pending');
    assert.equal(result.failedEventId, entry.eventId);
    assert.match(result.error, /injected spool deletion failure/);
    await assert.rejects(appendEntry(outbox), /injected spool deletion failure/);

    const publishedState = JSON.parse(await fs.readFile(statePath, 'utf8'));
    assert.equal(publishedState.checkpointSequence, 1);
    assert.equal(publishedState.checkpointHash, entry.auditHash);
    assert.deepEqual(await spoolEntryFiles(), [entryFile]);
    await outbox.close();

    ops = [];
    const recovered = createOutbox({ anchor: async () => entry.auditHash });
    await recovered.initialize({ verifyEntry });

    assert.equal(recovered.pendingCount, 0);
    assert.deepEqual(await spoolEntryFiles(), []);
    const recoveryRenameIndex = indexOf(
      ops,
      (op) => op.op === 'rename' && op.to === statePath,
      'recovered checkpoint rename'
    );
    const recoveryUnlinkIndex = indexOf(
      ops,
      (op) => op.op === 'unlink' && op.target === entryPath,
      'covered spool file deletion during recovery'
    );
    assert.ok(
      recoveryRenameIndex < recoveryUnlinkIndex,
      'recovered checkpoint published before covered spool deletion'
    );
    assert.ok(
      ops.some(
        (op, index) =>
          op.op === 'dir-sync' && index > recoveryRenameIndex && index < recoveryUnlinkIndex
      ),
      'recovered checkpoint directory fsync precedes covered spool deletion'
    );
  });

  it('fails closed when the deletion directory fsync fails and recovers cleanly on restart', async () => {
    const outbox = createOutbox();
    await outbox.initialize({ verifyEntry });
    const entry = await appendEntry(outbox);
    const [entryFile] = await spoolEntryFiles();
    const entryPath = path.join(directory, entryFile);

    failNext = {
      match: (op, log) => {
        if (op.op !== 'dir-sync') return false;
        const previous = log[log.length - 2];
        return Boolean(previous && previous.op === 'unlink' && previous.target === entryPath);
      },
      error: Object.assign(new Error('injected deletion fsync failure'), { code: 'EIO' })
    };
    const result = await outbox.flush(persistRecorder([]));

    assert.equal(result.status, 'pending');
    assert.equal(result.failedEventId, entry.eventId);
    assert.match(result.error, /injected deletion fsync failure/);
    await assert.rejects(appendEntry(outbox), /injected deletion fsync failure/);
    await outbox.close();

    const recovered = createOutbox({ anchor: async () => entry.auditHash });
    await recovered.initialize({ verifyEntry });
    assert.equal(recovered.pendingCount, 0);
    assert.equal(recovered.initialAnchorHash, entry.auditHash);
    assert.deepEqual(await spoolEntryFiles(), []);
  });
});
