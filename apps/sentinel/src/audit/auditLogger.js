const { query, getDatabaseStatus } = require('../db/client');

const auditLog = [];

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

const auditLogger = {
  async log(entry) {
    auditLog.push(entry);

    try {
      await query(
        `INSERT INTO audit_logs (tenant_id, command, payload, result, actor)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
        [
          entry.tenant || null,
          entry.command,
          JSON.stringify(entry.payload || {}),
          JSON.stringify(entry.result || {}),
          entry.actor || null
        ]
      );
    } catch (error) {
      auditLog.push({
        command: 'system.audit.persist_failed',
        payload: { originalCommand: entry.command },
        result: {
          error: error instanceof Error ? error.message : 'Unknown database write failure',
          databaseStatus: getDatabaseStatus(),
          tenant: entry.tenant || null
        },
        actor: 'system',
        timestamp: new Date().toISOString()
      });
    }
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
  auditLogger
};
