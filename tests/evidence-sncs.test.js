const test = require('node:test');
const assert = require('node:assert/strict');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { resetLocalPassportState, signLocalCommand } = require('../scripts/lib/sentinelPassport');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');

test('application.submit emits SNCS-style evidence in the command result and audit trail', async () => {
  process.env.SENTINEL_SIGNING_KEY = 'evidence-test-signing-key';
  resetLocalPassportState();

  const result = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    source: 'sentinel',
    payload: {
      name: 'Evidence Test',
      vehicle: '2022 Toyota Corolla',
      amount: 12000,
      creditScore: 720
    },
    metadata: {
      source: 'sentinel',
      actor: 'evidence@example.com',
      role: 'approver',
      scopes: ['application:submit']
    }
  }), {
    buildReceipt: (command, entity, outcome, tenantId = 'ownerfi') => ({
      receiptId: `rcpt_${Date.now()}`,
      auditId: `audit_${Date.now()}`,
      command,
      tenantId,
      status: 'executed',
      verified: true,
      entity,
      outcome,
      timestamp: new Date().toISOString()
    }),
    emitSecurityEvent: () => {},
    principal: {
      tenant: 'ownerfi',
      actor: 'evidence@example.com',
      role: 'approver',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.data && result.data.evidence, 'expected evidence object in command result');
  assert.strictEqual(result.data.evidence.evidenceType, 'cross-provider');
  assert.strictEqual(result.data.evidence.status, 'verified');

  const auditEntries = auditLogger.getAll();
  const latestEntry = [...auditEntries].reverse().find((entry) => entry.command === 'application.submit');
  assert.ok(latestEntry, 'expected application.submit audit entry');
  assert.ok(latestEntry.result && latestEntry.result.data && latestEntry.result.data.evidence, 'expected evidence in audit entry');
  assert.strictEqual(latestEntry.result.data.evidence.evidenceType, 'cross-provider');
});
