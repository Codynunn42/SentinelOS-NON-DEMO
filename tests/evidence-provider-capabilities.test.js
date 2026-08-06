const test = require('node:test');
const assert = require('node:assert/strict');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { resetLocalPassportState, signLocalCommand } = require('../scripts/lib/sentinelPassport');

test('dispatch emits SNCS evidence for GitHub-style capability envelopes', async () => {
  process.env.SENTINEL_SIGNING_KEY = 'evidence-test-signing-key';
  resetLocalPassportState();

  const result = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    source: 'sentinel',
    payload: {
      name: 'GitHub Capability Evidence',
      vehicle: '2022 Toyota Corolla',
      amount: 12000,
      creditScore: 720,
      providerId: 'github',
      capabilityId: 'repo-read'
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
  assert.ok(result.data && result.data.evidence, 'expected evidence object on command result');
  assert.strictEqual(result.data.evidence.capabilityId, 'repo-read');
  assert.strictEqual(result.data.evidence.provider, 'github');
  assert.strictEqual(result.data.evidence.evidenceType, 'cross-provider');
  assert.ok(result.data.evidence.moduleEvidence, 'expected module evidence entry');
});

test('dispatch emits SNCS evidence for Microsoft365-style capability envelopes', async () => {
  process.env.SENTINEL_SIGNING_KEY = 'evidence-test-signing-key';
  resetLocalPassportState();

  const result = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    source: 'sentinel',
    payload: {
      name: 'Microsoft365 Capability Evidence',
      vehicle: '2022 Toyota Corolla',
      amount: 12000,
      creditScore: 720,
      providerId: 'microsoft365',
      capabilityId: 'calendar-read'
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
  assert.ok(result.data && result.data.evidence, 'expected evidence object on command result');
  assert.strictEqual(result.data.evidence.capabilityId, 'calendar-read');
  assert.strictEqual(result.data.evidence.provider, 'microsoft365');
  assert.strictEqual(result.data.evidence.evidenceType, 'cross-provider');
  assert.ok(result.data.evidence.moduleEvidence, 'expected module evidence entry');
});
