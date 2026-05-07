const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  buildCommandTrustInput,
  buildTrustScoreResult,
  computeTrustScore,
  explainTrustScore
} = require('../apps/sentinel/src/trustScore');

assert.strictEqual(computeTrustScore({
  roleMatched: true,
  policyPassed: true,
  riskLevel: 'low',
  retries: 0,
  latencyMs: 10
}), 100);

const blocked = {
  roleMatched: false,
  policyPassed: false,
  riskLevel: 'high',
  retries: 2,
  latencyMs: 750,
  manualOverride: true
};

assert.strictEqual(computeTrustScore(blocked), 1);
assert.deepStrictEqual(explainTrustScore(blocked), [
  'role_mismatch',
  'policy_blocked',
  'high_risk',
  'retry_penalty',
  'latency_penalty',
  'manual_override'
]);

const input = buildCommandTrustInput({
  envelope: {
    command: 'deal.execute',
    metadata: { role: 'operator', retries: 1 }
  },
  policy: {
    allowed: false,
    riskLevel: 'medium',
    details: { requiredRole: 'approver' }
  },
  policyContext: { role: 'operator' },
  latencyMs: 600,
  result: { success: false }
});
const trust = buildTrustScoreResult(input);

assert.strictEqual(input.roleMatched, false);
assert.strictEqual(input.policyPassed, false);
assert.strictEqual(trust.trustScore, 28);
assert(trust.reasons.includes('role_mismatch'));
assert(trust.reasons.includes('policy_blocked'));

async function main() {
  const blockedResult = await dispatchCommand({
    tenant: 'ownerfi',
    command: 'deal.execute',
    payload: { applicationId: 'app_missing' },
    metadata: {
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['deal:execute']
    }
  }, {
    principal: {
      tenant: 'ownerfi',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['deal:execute']
    }
  });

  assert.strictEqual(blockedResult.success, false);
  assert.strictEqual(blockedResult.data.trustScore, 35);
  assert(blockedResult.data.reasons.includes('role_mismatch'));
  assert(blockedResult.data.reasons.includes('policy_blocked'));
  assert(blockedResult.data.reasons.includes('medium_risk'));

  console.log('Trust score check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
