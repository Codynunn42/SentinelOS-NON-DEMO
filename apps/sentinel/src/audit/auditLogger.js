const { query, getDatabaseStatus } = require('../db/client');
const { evaluateGovernanceSignals } = require('../governance/governanceSignals');
const { getReceiptSigner } = require('../receipts/receiptRuntime');
const {
  markUnsignedLegacy,
  verifySignedReceipt
} = require('../receipts/signedReceipt');
const { createDurableAuditOutbox } = require('./durableAuditOutbox');
const crypto = require('crypto');

const DEFAULT_RETRY_INTERVAL_MS = 5000;
const MAX_RETRY_INTERVAL_MS = 60000;

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

function hashPayload(payload) {
  return crypto.createHash('sha256').update(stableStringify(payload || {})).digest('hex');
}

function hashAuditEntry(entry, prevHash) {
  return crypto
    .createHash('sha256')
    .update(stableStringify({
      eventId: entry.eventId || null,
      tenant: entry.tenant || null,
      command: entry.command,
      payload: entry.payload || {},
      result: entry.result || {},
      actor: entry.actor || null,
      timestamp: entry.timestamp || null,
      prevHash: prevHash || null
    }))
    .digest('hex');
}

function fromAuditRow(row) {
  if (!row) {
    return null;
  }

  return {
    tenant: row.tenant_id || row.tenant || null,
    command: row.command,
    payload: row.payload || {},
    result: row.result || {},
    actor: row.actor || undefined,
    timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function getReceipt(entry) {
  if (!entry || !entry.result) {
    return null;
  }

  if (entry.result.receipt && typeof entry.result.receipt.receiptId === 'string') {
    return entry.result.receipt;
  }

  if (
    entry.result.data &&
    entry.result.data.receipt &&
    typeof entry.result.data.receipt.receiptId === 'string'
  ) {
    return entry.result.data.receipt;
  }

  return null;
}

function replaceReceipt(entry, receipt) {
  if (entry.result && entry.result.receipt) {
    return {
      ...entry,
      result: { ...entry.result, receipt }
    };
  }
  if (entry.result && entry.result.data && entry.result.data.receipt) {
    return {
      ...entry,
      result: {
        ...entry.result,
        data: { ...entry.result.data, receipt }
      }
    };
  }
  return entry;
}

function publishAuditEvent(entry, subscribers) {
  for (const subscriber of subscribers) {
    try {
      subscriber(entry);
    } catch (_) {
      subscribers.delete(subscriber);
    }
  }
}

function verifyAuditChain(entries, initialHash = null) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  if (!normalizedEntries.length) {
    return { valid: true, checked: 0 };
  }

  let previousHash = initialHash;
  for (let index = 0; index < normalizedEntries.length; index += 1) {
    const entry = normalizedEntries[index];
    const expectedHash = hashAuditEntry(entry, previousHash);
    if (entry.prevHash !== previousHash || entry.auditHash !== expectedHash) {
      return { valid: false, reason: 'audit_hash_mismatch', checked: index + 1 };
    }
    previousHash = entry.auditHash;
  }

  return { valid: true, checked: normalizedEntries.length };
}

function createAuditLogger({
  persistQuery = query,
  databaseStatus = getDatabaseStatus,
  spoolDirectory,
  maxSpoolBytes,
  loadAnchor,
  retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
  maxRetryIntervalMs = MAX_RETRY_INTERVAL_MS
} = {}) {
  if (
    !Number.isSafeInteger(retryIntervalMs) ||
    retryIntervalMs < 1 ||
    !Number.isSafeInteger(maxRetryIntervalMs) ||
    maxRetryIntervalMs < retryIntervalMs
  ) {
    throw new TypeError('Audit retry intervals must be positive safe integers and maximum >= initial');
  }
  const auditLog = [];
  const subscribers = new Set();
  let chainAnchorHash = null;
  let initialized = false;
  let closed = false;
  let retryTimer;
  let nextRetryIntervalMs = retryIntervalMs;
  let writeQueue = Promise.resolve();

  const outbox = createDurableAuditOutbox({
    ...(spoolDirectory ? { directory: spoolDirectory } : {}),
    ...(maxSpoolBytes !== undefined ? { maxBytes: maxSpoolBytes } : {}),
    databaseStatus,
    loadAnchor: loadAnchor || (async () => {
      if (databaseStatus() !== 'enabled') return null;
      const result = await persistQuery(
        `SELECT result->>'auditHash' AS audit_hash
         FROM audit_logs
         WHERE result ? 'auditHash'
         ORDER BY id DESC
         LIMIT 1`
      );
      if (!result || !Array.isArray(result.rows)) {
        throw new Error('AUDIT_OUTBOX_DATABASE_UNAVAILABLE');
      }
      return result.rows[0] ? result.rows[0].audit_hash : null;
    })
  });

  async function ensureInitialized() {
    if (closed) {
      throw new Error('AUDIT_LOGGER_CLOSED');
    }
    if (initialized) return;
    await outbox.initialize({
      verifyEntry: (entry, prevHash) =>
        entry.prevHash === prevHash && entry.auditHash === hashAuditEntry(entry, prevHash)
    });
    chainAnchorHash = outbox.initialAnchorHash;
    auditLog.push(...outbox.pendingEntries);
    initialized = true;
  }

  async function appendHashedEntry(entry) {
    const { entry: hashedEntry } = await outbox.append(entry, (value, prevHash) => ({
      ...value,
      prevHash,
      auditHash: hashAuditEntry(value, prevHash)
    }));
    auditLog.push(hashedEntry);
    publishAuditEvent(hashedEntry, subscribers);
    return hashedEntry;
  }

  async function persistEntry(entry, sequence) {
    const result = await persistQuery(
      `INSERT INTO audit_logs
         (event_id, chain_sequence, tenant_id, command, payload, result, actor)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [
        entry.eventId,
        sequence,
        entry.tenant || 'ownerfi',
        entry.command,
        JSON.stringify(entry.payload || {}),
        JSON.stringify({
          ...(entry.result || {}),
          eventId: entry.eventId,
          prevHash: entry.prevHash,
          auditHash: entry.auditHash,
          auditTimestamp: entry.timestamp
        }),
        entry.actor || null
      ]
    );
    if (result === null) {
      throw new Error('AUDIT_OUTBOX_DATABASE_UNAVAILABLE');
    }
    if (result && result.rowCount === 0) {
      const existing = await persistQuery(
        `SELECT event_id, chain_sequence, tenant_id, command, payload, result, actor
         FROM audit_logs
         WHERE event_id = $1`,
        [entry.eventId]
      );
      const row = existing && existing.rows && existing.rows[0];
      const expectedPayload = JSON.parse(JSON.stringify(entry.payload || {}));
      const expectedResult = JSON.parse(JSON.stringify({
        ...(entry.result || {}),
        eventId: entry.eventId,
        prevHash: entry.prevHash,
        auditHash: entry.auditHash,
        auditTimestamp: entry.timestamp
      }));
      if (
        !row ||
        row.event_id !== entry.eventId ||
        Number(row.chain_sequence) !== sequence ||
        row.tenant_id !== (entry.tenant || 'ownerfi') ||
        row.command !== entry.command ||
        stableStringify(row.payload) !== stableStringify(expectedPayload) ||
        stableStringify(row.result) !== stableStringify(expectedResult) ||
        row.actor !== (entry.actor || null) ||
        !row.result ||
        row.result.auditTimestamp !== entry.timestamp ||
        row.result.prevHash !== entry.prevHash ||
        row.result.auditHash !== entry.auditHash
      ) {
        throw new Error('AUDIT_OUTBOX_RECONCILIATION_CONFLICT');
      }
    }
  }

  async function reconcilePendingInternal() {
    await ensureInitialized();
    if (outbox.pendingCount === 0) {
      return { status: 'clear', pendingCount: 0 };
    }

    const reconciledEventIds = outbox.pendingEntries.map((entry) => entry.eventId);
    const pendingResult = await outbox.flush(persistEntry);
    if (pendingResult.status === 'pending') return pendingResult;

    await appendHashedEntry({
      eventId: crypto.randomUUID(),
      command: 'system.audit.persist_reconciled',
      payload: { reconciledEventIds },
      result: {
        status: 'reconciled',
        reconciledCount: reconciledEventIds.length
      },
      actor: 'system',
      timestamp: new Date().toISOString()
    });
    const markerResult = await outbox.flush(persistEntry);
    if (markerResult.status === 'pending') return markerResult;
    return { status: 'reconciled', pendingCount: 0, reconciledCount: reconciledEventIds.length };
  }

  function clearScheduledRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    nextRetryIntervalMs = retryIntervalMs;
  }

  function scheduleRetry() {
    if (closed || retryTimer || outbox.pendingCount === 0) return;
    const delay = nextRetryIntervalMs;
    nextRetryIntervalMs = Math.min(nextRetryIntervalMs * 2, maxRetryIntervalMs);
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      if (closed) return;
      serializeWrite(async () => {
        const result = await reconcilePendingWithRetry();
        return result;
      }).catch((error) => {
        console.error(`Scheduled audit outbox retry failed: ${error.message}`);
      });
    }, delay);
    if (typeof retryTimer.unref === 'function') retryTimer.unref();
  }

  async function reconcilePendingWithRetry() {
    const result = await reconcilePendingInternal();
    if (result.status === 'pending') {
      scheduleRetry();
    } else {
      clearScheduledRetry();
    }
    return result;
  }

  function serializeWrite(action) {
    const operation = writeQueue.then(action);
    writeQueue = operation.catch(() => {});
    return operation;
  }

  async function logInternal(entry) {
    await ensureInitialized();
    if (outbox.pendingCount > 0) {
      await reconcilePendingWithRetry();
    }

    const result = entry.result && typeof entry.result === 'object' ? entry.result : {};
    const signatureVersion = result.signatureVersion || 'unsigned';
    const timestampedEntry = {
      ...entry,
      eventId: entry.eventId || crypto.randomUUID(),
      correlationId: entry.correlationId || null,
      inputPayloadHash: hashPayload(entry.payload),
      signatureVersion,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    const governanceSignals = evaluateGovernanceSignals(timestampedEntry);
    const existingResult =
      timestampedEntry.result && typeof timestampedEntry.result === 'object'
        ? timestampedEntry.result
        : {};
    const signaledEntry = {
      ...timestampedEntry,
      result: {
        ...existingResult,
        governanceSignals
      }
    };
    const hashedEntry = await appendHashedEntry(signaledEntry);

    if (outbox.pendingCount > 1) {
      await appendPersistenceFailureEntry(
        entry,
        hashedEntry.eventId,
        new Error('AUDIT_PERSISTENCE_RECONCILIATION_PENDING')
      );
      scheduleRetry();
      return hashedEntry;
    }

    const persistenceResult = await outbox.flush(persistEntry);
    if (persistenceResult.status === 'pending') {
      await appendPersistenceFailureEntry(entry, hashedEntry.eventId, new Error(persistenceResult.error));
      scheduleRetry();
    }

    return hashedEntry;
  }

  async function appendPersistenceFailureEntry(originalEntry, originalEventId, error) {
    await appendHashedEntry({
      eventId: crypto.randomUUID(),
      command: 'system.audit.persist_failed',
      payload: {
        originalCommand: originalEntry.command,
        originalEventId
      },
      result: {
        error: error instanceof Error ? error.message : 'Unknown database write failure',
        databaseStatus: databaseStatus(),
        persistenceStatus: 'pending_reconciliation',
        tenant: originalEntry.tenant || null
      },
      actor: 'system',
      timestamp: new Date().toISOString()
    });
  }

  return {
  verifyChain() {
    return verifyAuditChain(auditLog, chainAnchorHash);
  },

  log(entry) {
    return serializeWrite(() => logInternal(entry));
  },

  initialize() {
    return serializeWrite(ensureInitialized);
  },

  reconcilePending() {
    return serializeWrite(reconcilePendingWithRetry);
  },

  getPersistenceStatus() {
    return outbox.getStatus();
  },

  close() {
    return serializeWrite(async () => {
      closed = true;
      clearScheduledRetry();
      initialized = false;
      await outbox.close();
    });
  },

  subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  getAll() {
    return auditLog;
  },

  getByTenant(tenant) {
    return auditLog.filter((entry) => entry && entry.tenant === tenant);
  },

  getByApplicationId(applicationId, tenant) {
    return auditLog.filter((entry) => {
      if (tenant && entry.tenant !== tenant) {
        return false;
      }

      const payloadApplicationId =
        entry && entry.payload && typeof entry.payload.applicationId === 'string'
          ? entry.payload.applicationId
          : null;

      const resultApplicationId =
        entry &&
        entry.result &&
        entry.result.data &&
        typeof entry.result.data.applicationId === 'string'
          ? entry.result.data.applicationId
          : null;

      const receiptOutcomeApplicationId =
        entry &&
        entry.result &&
        entry.result.data &&
        entry.result.data.receipt &&
        entry.result.data.receipt.outcome &&
        typeof entry.result.data.receipt.outcome.applicationId === 'string'
          ? entry.result.data.receipt.outcome.applicationId
          : null;

      return (
        payloadApplicationId === applicationId ||
        resultApplicationId === applicationId ||
        receiptOutcomeApplicationId === applicationId
      );
    });
  },

  async getByReceiptId(receiptId, tenant) {
    const signedResult = await persistQuery(
      `SELECT receipt_id, tenant_id, signed_receipt, signature_algorithm, key_id, signature, created_at
       FROM signed_receipts
       WHERE receipt_id = $1
         AND ($2::text IS NULL OR tenant_id = $2)
       LIMIT 1`,
      [receiptId, tenant || null]
    );
    const signedRow = signedResult && signedResult.rows && signedResult.rows[0]
      ? signedResult.rows[0]
      : null;
    if (signedRow) {
      const storedReceipt = signedRow.signed_receipt;
      let verification = { ok: false, status: 'verification_key_unavailable', verified: false };
      try {
        const signer = getReceiptSigner();
        verification = await verifySignedReceipt(storedReceipt, signer.getPublicKey);
      } catch (error) {
        console.error('Signed receipt verification unavailable:', error);
      }
      const storageMetadataMatches = Boolean(storedReceipt && typeof storedReceipt === 'object') &&
        storedReceipt.receiptId === signedRow.receipt_id &&
        storedReceipt.tenantId === signedRow.tenant_id &&
        storedReceipt.signature &&
        storedReceipt.signature.algorithm === signedRow.signature_algorithm &&
        storedReceipt.signature.keyId === signedRow.key_id &&
        storedReceipt.signature.value === signedRow.signature;
      if (!storageMetadataMatches) {
        verification = { ok: false, status: 'storage_metadata_mismatch', verified: false };
      }
      const receipt = {
        ...storedReceipt,
        verification_status: verification.status,
        verified: verification.ok
      };
      return {
        receipt,
        entry: {
          tenant: signedRow.tenant_id,
          command: storedReceipt.command,
          payload: {},
          result: { receipt },
          actor: storedReceipt.authority && storedReceipt.authority.actor,
          timestamp: signedRow.created_at instanceof Date
            ? signedRow.created_at.toISOString()
            : signedRow.created_at
        },
        source: 'database'
      };
    }

    const memoryEntry = auditLog.find((entry) => {
      if (tenant && entry.tenant !== tenant) {
        return false;
      }

      const receipt = getReceipt(entry);
      return receipt && receipt.receiptId === receiptId;
    });

    if (memoryEntry) {
      const memoryReceipt = getReceipt(memoryEntry);
      let receipt = markUnsignedLegacy(memoryReceipt);
      if (memoryReceipt && memoryReceipt.schemaVersion === 'sentinel-receipt/v1') {
        let verification = { ok: false, status: 'verification_key_unavailable', verified: false };
        try {
          verification = await verifySignedReceipt(memoryReceipt, getReceiptSigner().getPublicKey);
        } catch (error) {
          console.error('In-memory signed receipt verification unavailable:', error);
        }
        receipt = {
          ...memoryReceipt,
          verification_status: verification.status,
          verified: verification.ok
        };
      }
      return {
        receipt,
        entry: replaceReceipt(memoryEntry, receipt),
        source: 'memory'
      };
    }

    const result = await persistQuery(
      `SELECT tenant_id, command, payload, result, actor, created_at
       FROM audit_logs
       WHERE ($2::text IS NULL OR tenant_id = $2)
         AND (
           result @> $1::jsonb
           OR result @> $3::jsonb
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [
        JSON.stringify({ data: { receipt: { receiptId } } }),
        tenant || null,
        JSON.stringify({ receipt: { receiptId } })
      ]
    );

    const row = result && result.rows && result.rows[0] ? result.rows[0] : null;
    if (!row) {
      return null;
    }

    const entry = fromAuditRow(row);
    const legacyReceipt = getReceipt(entry);
    const receipt = legacyReceipt ? markUnsignedLegacy(legacyReceipt) : legacyReceipt;

    return {
      receipt,
      entry: receipt ? replaceReceipt(entry, receipt) : entry,
      source: 'database'
    };
  }
  };
}

const auditLogger = createAuditLogger();

function subscribeAuditEvents(callback) {
  return auditLogger.subscribe(callback);
}

module.exports = {
  auditLogger,
  createAuditLogger,
  subscribeAuditEvents,
  verifyAuditChain
};
