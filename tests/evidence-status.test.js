const test = require('node:test');
const assert = require('node:assert/strict');
const { computeEvidenceStatus } = require('../apps/sentinel/src/evidence/status');
const { emitSNCSEvidence } = require('../apps/sentinel/src/evidence/sncs');

test('computeEvidenceStatus returns verified once SNCS evidence exists for a capability', () => {
  emitSNCSEvidence({}, {
    sessionId: 'session-1',
    capabilityId: 'repo-read',
    provider: 'github',
    evidenceType: 'cross-provider',
    status: 'verified'
  });

  const status = computeEvidenceStatus('repo-read');
  assert.strictEqual(status, 'verified');
});

test('computeEvidenceStatus returns pending-cross-provider when session, receipt, ledger exist without SNCS', () => {
  const status = computeEvidenceStatus('planning');
  assert.strictEqual(status, 'pending-cross-provider');
});
