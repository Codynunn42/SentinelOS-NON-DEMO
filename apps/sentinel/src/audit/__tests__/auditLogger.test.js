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
});
