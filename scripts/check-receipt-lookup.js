const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

resetLocalPassportState();

function buildReceipt(command, entity, outcome, tenantId = 'ownerfi') {
  return {
    receiptId: 'rcpt_local_receipt_lookup_check',
    auditId: 'audit_local_receipt_lookup_check',
    comm: 'Sentinel AI by Cody Nunn | Nunn Cloud',
    command,
    tenantId,
    status: 'executed',
    verified: true,
    entity,
    outcome,
    timestamp: new Date().toISOString()
  };
}

dispatchCommand(
  signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    payload: {
      name: 'Receipt Lookup Check',
      vehicle: '2020 Toyota Camry',
      amount: 18000,
      creditScore: 700
    },
    metadata: {
      actor: 'local-check',
      role: 'approver'
    }
  }),
  {
    buildReceipt,
    emitSecurityEvent: () => {},
    principal: {
      keyId: 'key_local_check',
      tenant: 'ownerfi',
      actor: 'local-check',
      role: 'approver',
      scopes: ['application:submit', 'receipt:read'],
      status: 'active'
    }
  }
)
  .then(async (result) => {
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.receipt.receiptId, 'rcpt_local_receipt_lookup_check');

    const match = await auditLogger.getByReceiptId('rcpt_local_receipt_lookup_check', 'ownerfi');

    assert.ok(match);
    assert.strictEqual(match.source, 'memory');
    assert.strictEqual(match.receipt.receiptId, 'rcpt_local_receipt_lookup_check');
    assert.strictEqual(match.entry.command, 'application.submit');
    assert.ok(match.entry.auditHash);
    assert.ok(Object.prototype.hasOwnProperty.call(match.entry, 'prevHash'));

    console.log('Receipt lookup check passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
