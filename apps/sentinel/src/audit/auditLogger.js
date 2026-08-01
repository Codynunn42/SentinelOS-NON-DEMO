const { query, getDatabaseStatus } = require('../db/client');
const { evaluateGovernanceSignals } = require('../governance/governanceSignals');
const crypto = require('crypto');

const auditLog = [];
const subscribers = new Set();
let lastAuditHash = null;

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

function verifyAuditChain(entries = auditLog) {
  if (!Array.isArray(entries)) {
    return {
      valid: false,
      reason: 'entries_not_array',
      checked: 0
    };
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const expectedPrevHash = index === 0 ? null : entries[index - 1].auditHash;

    if (!entry || entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        reason: 'previous_hash_mismatch',
        index,
        expectedPrevHash,
        actualPrevHash: entry ? entry.prevHash : null,
        checked: index
      };
    }

    const expectedAuditHash = hashAuditEntry(entry, entry.prevHash);
    if (entry.auditHash !== expectedAuditHash) {
      return {
        valid: false,
        reason: 'audit_hash_mismatch',
        index,
        expectedAuditHash,
        actualAuditHash: entry.auditHash,
        checked: index
      };
    }
  }

  return {
    valid: true,
    checked: entries.length,
    lastAuditHash: entries.length ? entries[entries.length - 1].auditHash : null
  };
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

function publishAuditEvent(entry) {
  for (const subscriber of subscribers) {
    try {
      subscriber(entry);
    } catch (_) {
      subscribers.delete(subscriber);
    }
  }
}

function subscribeAuditEvents(callback) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

const auditLogger = {
  async log(entry) {
    const timestampedEntry = {
      ...entry,
      eventId: entry.eventId || crypto.randomUUID(),
      correlationId: entry.correlationId || null,
      inputPayloadHash: hashPayload(entry.payload),
      signatureVersion: (entry.result && entry.result.signatureVersion) || 'unsigned',
      timestamp: entry.timestamp || new Date().toISOString()
    };
    const governanceSignals = evaluateGovernanceSignals(timestampedEntry);
    const result =
      timestampedEntry.result && typeof timestampedEntry.result === 'object'
        ? timestampedEntry.result
        : {};
    const signaledEntry = {
      ...timestampedEntry,
      result: {
        ...result,
        governanceSignals
      }
    };
    const prevHash = lastAuditHash;
    const auditHash = hashAuditEntry(signaledEntry, prevHash);
    const hashedEntry = {
      ...signaledEntry,
      prevHash,
      auditHash
    };
    lastAuditHash = auditHash;

    auditLog.push(hashedEntry);
    publishAuditEvent(hashedEntry);

    try {
      await query(
        `INSERT INTO audit_logs (tenant_id, command, payload, result, actor)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
        [
          hashedEntry.tenant || null,
          hashedEntry.command,
          JSON.stringify(hashedEntry.payload || {}),
          JSON.stringify({
            ...(hashedEntry.result || {}),
            eventId: hashedEntry.eventId,
            prevHash: hashedEntry.prevHash,
            auditHash: hashedEntry.auditHash
          }),
          hashedEntry.actor || null
        ]
      );
    } catch (error) {
      const failureEntry = {
        eventId: crypto.randomUUID(),
        correlationId: hashedEntry.correlationId || null,
        tenant: entry.tenant || null,
        command: 'system.audit.persist_failed',
        payload: { originalCommand: entry.command },
        result: {
          error: error instanceof Error ? error.message : 'Unknown database write failure',
          databaseStatus: getDatabaseStatus(),
          tenant: entry.tenant || null
        },
        actor: 'system',
        timestamp: new Date().toISOString()
      };
      failureEntry.result.governanceSignals = evaluateGovernanceSignals(failureEntry);
      failureEntry.inputPayloadHash = hashPayload(failureEntry.payload);
      failureEntry.signatureVersion = 'system';
      failureEntry.prevHash = lastAuditHash;
      failureEntry.auditHash = hashAuditEntry(failureEntry, failureEntry.prevHash);
      lastAuditHash = failureEntry.auditHash;
      auditLog.push(failureEntry);
      publishAuditEvent(failureEntry);
    }

    return hashedEntry;
  },

  getAll() {
    return auditLog;
  },

  verifyChain(entries = auditLog) {
    return verifyAuditChain(entries);
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
    const memoryEntry = auditLog.find((entry) => {
      if (tenant && entry.tenant !== tenant) {
        return false;
      }

      const receipt = getReceipt(entry);
      return receipt && receipt.receiptId === receiptId;
    });

    if (memoryEntry) {
      return {
        receipt: getReceipt(memoryEntry),
        entry: memoryEntry,
        source: 'memory'
      };
    }

    const result = await query(
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

    return {
      receipt: getReceipt(entry),
      entry,
      source: 'database'
    };
  }
};

module.exports = {
  auditLogger,
  hashAuditEntry,
  verifyAuditChain,
  subscribeAuditEvents
};
