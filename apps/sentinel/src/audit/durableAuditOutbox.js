const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const STATE_FILE = 'state.json';
const LOCK_FILE = 'writer.lock';
const ENTRY_FILE_PATTERN = /^(\d{20})-([0-9a-f-]{36})\.json$/i;
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
  let lockHandle;
  let initialized = false;
  let fatalError;
  let lastError = null;

  function assertUsable() {
    if (fatalError) {
      throw fatalError;
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

  async function atomicWrite(filePath, contents) {
    const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    const handle = await fs.open(temporaryPath, 'wx', 0o600);
    try {
      await handle.writeFile(contents, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(temporaryPath, filePath);
    await syncDirectory();
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
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const temporaryPath = `${lockPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
      let temporaryHandle;
      try {
        temporaryHandle = await fs.open(temporaryPath, 'wx', 0o600);
        await temporaryHandle.writeFile(JSON.stringify({
          pid: process.pid,
          hostname: os.hostname()
        }), 'utf8');
        await temporaryHandle.sync();
        await fs.link(temporaryPath, lockPath);
        lockHandle = temporaryHandle;
        temporaryHandle = undefined;
        await fs.unlink(temporaryPath);
        await syncDirectory();
        return;
      } catch (error) {
        if (temporaryHandle) await temporaryHandle.close();
        try {
          await fs.unlink(temporaryPath);
        } catch (cleanupError) {
          if (!cleanupError || cleanupError.code !== 'ENOENT') throw cleanupError;
        }
        if (!error || error.code !== 'EEXIST') throw error;
        let owner;
        try {
          owner = JSON.parse(await fs.readFile(lockPath, 'utf8'));
        } catch {
          throw new Error('AUDIT_OUTBOX_WRITER_LOCK_INVALID');
        }
        if (
          owner.hostname !== os.hostname() ||
          !Number.isSafeInteger(owner.pid) ||
          owner.pid < 1
        ) {
          throw new Error('AUDIT_OUTBOX_WRITER_LOCKED');
        }
        try {
          process.kill(owner.pid, 0);
          throw new Error('AUDIT_OUTBOX_WRITER_LOCKED');
        } catch (probeError) {
          if (probeError && probeError.code !== 'ESRCH') throw probeError;
        }
        await fs.unlink(lockPath);
        await syncDirectory();
      }
    }
    throw new Error('AUDIT_OUTBOX_WRITER_LOCKED');
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

  async function removeEntryFile(fileName) {
    await fs.unlink(path.join(spoolDirectory, fileName));
    await syncDirectory();
  }

  async function initialize({ verifyEntry } = {}) {
    if (initialized) return;
    await acquireLock();

    try {
      const currentDatabaseMode = databaseStatus();
      let loadedState = await readState();
      const files = await listEntryFiles();

      if (!loadedState) {
        const anchor = currentDatabaseMode !== 'disabled'
          ? await loadAnchor()
          : null;
        if (anchor !== null && !/^[a-f0-9]{64}$/.test(anchor)) {
          throw new Error('AUDIT_OUTBOX_DATABASE_ANCHOR_INVALID');
        }
        loadedState = {
          version: 1,
          databaseMode: currentDatabaseMode,
          checkpointSequence: 0,
          checkpointHash: anchor,
          lastSequence: 0,
          lastHash: anchor
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
      const handle = await fs.open(filePath, 'wx', 0o600);
      try {
        await handle.writeFile(content, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      await syncDirectory();

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
    if (lockHandle) {
      await lockHandle.close();
      lockHandle = undefined;
      try {
        await fs.unlink(lockPath);
        await syncDirectory();
      } catch (error) {
        if (!error || error.code !== 'ENOENT') throw error;
      }
    }
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
