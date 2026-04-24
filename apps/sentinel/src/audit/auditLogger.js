const { query, getDatabaseStatus } = require('../db/client');

const auditLog = [];

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
  }
};

module.exports = {
  auditLogger
};
