const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const STATE_FILE = 'state.json';
const LOCK_FILE = 'writer.lock';
const ENTRY_FILE_PATTERN = /^(\d{20})-([0-9a-f-]{36})\.json$/i;
const TEMP_FILE_PATTERN = /^(?:state\.json|\d{20}-[0-9a-f-]{36}\.json)\.\d+\.[0-9a-f-]{36}\.tmp$/i;
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new TypeError(`${name} must be a positive safe integer`);
  }
  return parsed;
}

function createDurableAuditOutbox({
  directory = process.env.SENTINEL_AUDIT_SPOOL_DIR ||
    path.join(process.env.SENTINEL_DATA_DIR || path.join(process.cwd(), '.data'), 'audit-spool'),
  maxBytes = process.env.SENTINEL_AUDIT_SPOOL_MAX_BYTES
    ? parsePositiveInteger(process.env.SENTINEL_AUDIT_SPOOL_MAX_BYTES, 'SENTINEL_AUDIT_SPOOL_MAX_BYTES')
    : DEFAULT_MAX_BYTES,
  databaseStatus,
  loadAnchor
} = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError('maxBytes must be a positive safe integer');
  }
  const spoolDirectory = path.resolve(directory);
  const statePath = path.join(spoolDirectory, STATE_FILE);
  const lockPath = path.join(spoolDirectory, LOCK_FILE);
  const pending = [];
  let state;
  let pendingBytes = 0;
  let lockProcess;
  let lockLostError;
  let initialized = false;
  let fatalError;
  let lastError = null;

  function assertUsable() {
    if (fatalError) {
      throw fatalError;
    }
    if (lockLostError) {
      throw lockLostError;
    }
    if (!initialized) {
      throw new Error('AUDIT_OUTBOX_NOT_INITIALIZED');
    }
  }

  async function syncDirectory() {
    const handle = await fs.open(spoolDirectory, 'r');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async function atomicWrite(filePath, contents, { exclusive = false } = {}) {
    const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    let temporaryExists = false;
    try {
      const handle = await fs.open(temporaryPath, 'wx', 0o600);
      temporaryExists = true;
      try {
        await handle.writeFile(contents, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      if (exclusive) {
        await fs.link(temporaryPath, filePath);
        await fs.unlink(temporaryPath);
      } else {
        await fs.rename(temporaryPath, filePath);
      }
      temporaryExists = false;
      await syncDirectory();
    } catch (error) {
      if (temporaryExists) {
        try {
          await fs.unlink(temporaryPath);
        } catch (cleanupError) {
          if (!cleanupError || cleanupError.code !== 'ENOENT') {
            throw new AggregateError(
              [error, cleanupError],
              'AUDIT_OUTBOX_ATOMIC_WRITE_CLEANUP_FAILED'
            );
          }
        }
      }
      throw error;
    }
  }

  async function writeState(nextState) {
    await atomicWrite(statePath, `${JSON.stringify(nextState)}\n`);
    state = nextState;
  }

  async function readState() {
    try {
      const content = await fs.readFile(statePath, 'utf8');
      const parsed = JSON.parse(content);
      if (
        parsed.version !== 1 ||
        !Number.isSafeInteger(parsed.checkpointSequence) ||
        !Number.isSafeInteger(parsed.lastSequence) ||
        parsed.checkpointSequence < 0 ||
        parsed.lastSequence < parsed.checkpointSequence ||
        !(parsed.checkpointHash === null || /^[a-f0-9]{64}$/.test(parsed.checkpointHash)) ||
        !(parsed.lastHash === null || /^[a-f0-9]{64}$/.test(parsed.lastHash)) ||
        typeof parsed.databaseMode !== 'string'
      ) {
        throw new Error('AUDIT_OUTBOX_STATE_INVALID');
      }
      return parsed;
    } catch (error) {
      if (error && error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async function acquireLock() {
    await fs.mkdir(spoolDirectory, { recursive: true, mode: 0o700 });
    const lockFile = await fs.open(lockPath, 'a', 0o600);
    try {
      if (!(await lockFile.stat()).isFile()) {
        throw new Error('AUDIT_OUTBOX_LOCK_UNSUPPORTED');
      }
    } finally {
      await lockFile.close();
    }

    await new Promise((resolve, reject) => {
      const acquiredMessage = 'AUDIT_OUTBOX_LOCK_ACQUIRED';
      const child = spawn('flock', [
        '-n',
        lockPath,
        'sh',
        '-c',
        `printf '%s\\n' '${acquiredMessage}'; exec cat >/dev/null`
      ], { stdio: ['pipe', 'pipe', 'pipe'] });
      child.unref();
      child.stdin.unref();
      child.stderr.unref();
      let output = '';
      let diagnostics = '';
      let acquired = false;
      lockProcess = child;

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        output += chunk;
        if (!acquired && output.split(/\r?\n/).includes(acquiredMessage)) {
          acquired = true;
          lockLostError = undefined;
          child.stdout.unref();
          resolve();
        }
      });
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => {
        diagnostics += chunk;
      });
      child.once('error', () => {
        lockProcess = undefined;
        reject(new Error('AUDIT_OUTBOX_LOCK_UNSUPPORTED'));
      });
      child.once('exit', (code) => {
        if (!acquired) {
          child.stdout.unref();
          lockProcess = undefined;
          reject(new Error(
            diagnostics.trim()
              ? 'AUDIT_OUTBOX_LOCK_UNSUPPORTED'
              : 'AUDIT_OUTBOX_WRITER_LOCKED'
          ));
          return;
        }
        if (lockProcess === child) {
          lockProcess = undefined;
          lockLostError = new Error('AUDIT_OUTBOX_WRITER_LOCK_LOST');
        }
      });
    });
  }

  async function listEntryFiles() {
    const files = await fs.readdir(spoolDirectory, { withFileTypes: true });
    for (const file of files) {
      if (file.name === STATE_FILE || !file.name.endsWith('.json')) continue;
      if (!file.isFile() || !ENTRY_FILE_PATTERN.test(file.name)) {
        throw new Error('AUDIT_OUTBOX_ENTRY_INVALID');
      }
    }
    return files
      .filter((file) => file.isFile() && ENTRY_FILE_PATTERN.test(file.name))
      .map((file) => {
        const match = file.name.match(ENTRY_FILE_PATTERN);
        return { name: file.name, sequence: Number(match[1]) };
      })
      .sort((left, right) => left.sequence - right.sequence);
  }

  async function removeAbandonedTemporaryFiles() {
    const files = await fs.readdir(spoolDirectory, { withFileTypes: true });
    let removed = false;
    for (const file of files) {
      if (file.isFile() && TEMP_FILE_PATTERN.test(file.name)) {
        await fs.unlink(path.join(spoolDirectory, file.name));
        removed = true;
      }
    }
    if (removed) {
      await syncDirectory();
    }
  }

  async function removeEntryFile(fileName) {
    await fs.unlink(path.join(spoolDirectory, fileName));
    await syncDirectory();
  }

  async function initialize({ verifyEntry, verifyPersistedEntry } = {}) {
    if (initialized) return;
    await acquireLock();

    try {
      const currentDatabaseMode = databaseStatus();
      let loadedState = await readState();
      await removeAbandonedTemporaryFiles();
      const files = await listEntryFiles();
      const databaseAnchor = currentDatabaseMode !== 'disabled'
        ? await loadAnchor()
        : null;
      if (databaseAnchor !== null && !/^[a-f0-9]{64}$/.test(databaseAnchor)) {
        throw new Error('AUDIT_OUTBOX_DATABASE_ANCHOR_INVALID');
      }

      if (!loadedState) {
        loadedState = {
          version: 1,
          databaseMode: currentDatabaseMode,
          checkpointSequence: 0,
          checkpointHash: databaseAnchor,
          lastSequence: 0,
          lastHash: databaseAnchor
        };
      } else if (loadedState.databaseMode !== currentDatabaseMode) {
        throw new Error('AUDIT_OUTBOX_DATABASE_MODE_CHANGED');
      }

      state = loadedState;
      for (const file of files) {
        const fullPath = path.join(spoolDirectory, file.name);
        const stats = await fs.stat(fullPath);
        if (file.sequence <= state.checkpointSequence) {
          await removeEntryFile(file.name);
          continue;
        }
        if (pendingBytes + stats.size > maxBytes) {
          throw new Error('AUDIT_OUTBOX_CAPACITY_EXCEEDED');
        }
        const content = await fs.readFile(fullPath, 'utf8');
        const record = JSON.parse(content);
        if (
          !Number.isSafeInteger(record.sequence) ||
          record.sequence !== file.sequence ||
          !record.entry ||
          typeof record.entry.eventId !== 'string'
        ) {
          throw new Error('AUDIT_OUTBOX_ENTRY_INVALID');
        }
        pending.push({
          sequence: record.sequence,
          fileName: file.name,
          entry: record.entry,
          bytes: stats.size
        });
        pendingBytes += stats.size;
      }

      let expectedSequence = state.checkpointSequence + 1;
      let expectedHash = state.checkpointHash;
      for (const item of pending) {
        if (item.sequence !== expectedSequence || item.entry.prevHash !== expectedHash) {
          throw new Error('AUDIT_OUTBOX_CHAIN_GAP');
        }
        if (!verifyEntry(item.entry, expectedHash)) {
          throw new Error('AUDIT_OUTBOX_CHAIN_INVALID');
        }
        expectedSequence += 1;
        expectedHash = item.entry.auditHash;
      }

      let persistedPending = [];
      if (databaseAnchor !== state.checkpointHash) {
        const persistedPendingIndex = pending.findIndex(
          (item) => item.entry.auditHash === databaseAnchor
        );
        if (persistedPendingIndex < 0) {
          throw new Error('AUDIT_OUTBOX_DATABASE_ANCHOR_MISMATCH');
        }
        persistedPending = pending.slice(0, persistedPendingIndex + 1);
        if (typeof verifyPersistedEntry !== 'function') {
          throw new Error('AUDIT_OUTBOX_PERSISTED_VERIFIER_REQUIRED');
        }
        for (const item of persistedPending) {
          await verifyPersistedEntry(item.entry, item.sequence);
        }
        state = {
          ...state,
          checkpointSequence: persistedPending[persistedPending.length - 1].sequence,
          checkpointHash: databaseAnchor
        };
      }

      const recoveredSequence = expectedSequence - 1;
      if (state.lastSequence > recoveredSequence) {
        throw new Error('AUDIT_OUTBOX_PENDING_ENTRY_MISSING');
      }
      if (state.lastSequence === recoveredSequence && state.lastHash !== expectedHash) {
        throw new Error('AUDIT_OUTBOX_STATE_CHAIN_MISMATCH');
      }

      if (recoveredSequence > state.lastSequence) {
        state = { ...state, lastSequence: recoveredSequence, lastHash: expectedHash };
      }
      if (pendingBytes > maxBytes) {
        throw new Error('AUDIT_OUTBOX_CAPACITY_EXCEEDED');
      }
      await writeState(state);
      for (const item of persistedPending) {
        await removeEntryFile(item.fileName);
        pendingBytes -= item.bytes;
      }
      pending.splice(0, persistedPending.length);
      initialized = true;
    } catch (error) {
      await releaseLock();
      throw error;
    }
  }

  async function append(entry, hashEntry) {
    assertUsable();
    const sequence = state.lastSequence + 1;
    const prevHash = state.lastHash;
    const hashedEntry = hashEntry(entry, prevHash);
    const fileName = `${String(sequence).padStart(20, '0')}-${hashedEntry.eventId}.json`;
    const content = `${JSON.stringify({ sequence, entry: hashedEntry })}\n`;
    const bytes = Buffer.byteLength(content);
    if (pendingBytes + bytes > maxBytes) {
      lastError = 'AUDIT_OUTBOX_CAPACITY_EXCEEDED';
      throw new Error('AUDIT_OUTBOX_CAPACITY_EXCEEDED');
    }

    const filePath = path.join(spoolDirectory, fileName);
    try {
      await atomicWrite(filePath, content, { exclusive: true });

      const nextState = {
        ...state,
        lastSequence: sequence,
        lastHash: hashedEntry.auditHash
      };
      await writeState(nextState);
    } catch (error) {
      fatalError = error;
      throw error;
    }

    pending.push({ sequence, fileName, entry: hashedEntry, bytes });
    pendingBytes += bytes;
    return { sequence, entry: hashedEntry };
  }

  async function flush(persistEntry) {
    assertUsable();
    while (pending.length > 0) {
      const item = pending[0];
      try {
        await persistEntry(item.entry, item.sequence);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown database write failure';
        return {
          status: 'pending',
          pendingCount: pending.length,
          failedEventId: item.entry.eventId,
          error: lastError
        };
      }

      const nextState = {
        ...state,
        checkpointSequence: item.sequence,
        checkpointHash: item.entry.auditHash
      };
      try {
        await writeState(nextState);
      } catch (error) {
        fatalError = error;
        lastError = error instanceof Error ? error.message : 'Audit outbox checkpoint failed';
        return {
          status: 'pending',
          pendingCount: pending.length,
          failedEventId: item.entry.eventId,
          error: lastError
        };
      }

      try {
        await removeEntryFile(item.fileName);
      } catch (error) {
        fatalError = error;
        lastError = error instanceof Error ? error.message : 'Audit outbox cleanup failed';
        return {
          status: 'pending',
          pendingCount: pending.length,
          failedEventId: item.entry.eventId,
          error: lastError
        };
      }
      pending.shift();
      pendingBytes -= item.bytes;
    }
    lastError = null;
    return { status: 'clear', pendingCount: 0 };
  }

  async function close() {
    initialized = false;
    await releaseLock();
  }

  async function releaseLock() {
    if (lockProcess) {
      const child = lockProcess;
      lockProcess = undefined;
      if (child.exitCode === null && child.signalCode === null) {
        child.stdin.end();
        await new Promise((resolve) => child.once('exit', resolve));
      }
    }
    lockLostError = undefined;
  }

  function getStatus() {
    let status = 'uninitialized';
    if (fatalError || (lastError && pending.length === 0)) {
      status = 'failed';
    } else if (initialized) {
      status = pending.length === 0 ? 'clear' : 'pending_reconciliation';
    }
    return {
      status,
      pendingCount: pending.length,
      pendingBytes,
      pendingEventIds: pending.map((item) => item.entry.eventId),
      maxBytes,
      lastError
    };
  }

  return {
    append,
    close,
    flush,
    getStatus,
    initialize,
    get initialAnchorHash() {
      return state && state.checkpointHash;
    },
    get lastHash() {
      return state && state.lastHash;
    },
    get pendingEntries() {
      return pending.map((item) => item.entry);
    },
    get pendingCount() {
      return pending.length;
    }
  };
}

module.exports = {
  createDurableAuditOutbox,
  DEFAULT_MAX_BYTES
};
