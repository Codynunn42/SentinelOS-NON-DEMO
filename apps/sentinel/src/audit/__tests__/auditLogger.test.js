const assert = require('assert');
const crypto = require('crypto');
const { auditLogger } = require('../auditLogger');

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

  it('falls back to legacy receipts when the signed receipts table is absent', async () => {
    const auditLoggerPath = require.resolve('../auditLogger');
    const databaseClientPath = require.resolve('../../db/client');
    const originalAuditLoggerModule = require.cache[auditLoggerPath];
    const databaseClientModule = require.cache[databaseClientPath];
    const originalDatabaseExports = databaseClientModule.exports;
    databaseClientModule.exports = {
      ...originalDatabaseExports,
      query: async (sql) => {
        if (sql.includes('FROM signed_receipts')) {
          const error = new Error('relation "signed_receipts" does not exist');
          error.code = '42P01';
          throw error;
        }
        return { rows: [] };
      }
    };
    delete require.cache[auditLoggerPath];

    try {
      const { auditLogger: isolatedAuditLogger } = require('../auditLogger');
      const receiptId = `rcpt-legacy-${crypto.randomUUID()}`;
      await isolatedAuditLogger.log({
        tenant: 'legacy-test-tenant',
        command: 'legacy.receipt.test',
        payload: {},
        result: { receipt: { receiptId, tenantId: 'legacy-test-tenant' } }
      });

      const match = await isolatedAuditLogger.getByReceiptId(receiptId, 'legacy-test-tenant');
      assert.ok(match);
      assert.strictEqual(match.source, 'memory');
      assert.strictEqual(match.receipt.receiptId, receiptId);
    } finally {
      databaseClientModule.exports = originalDatabaseExports;
      require.cache[auditLoggerPath] = originalAuditLoggerModule;
    }
  });
});
