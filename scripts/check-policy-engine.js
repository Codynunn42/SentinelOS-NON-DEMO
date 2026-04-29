const assert = require('assert');
const { evaluatePolicy } = require('../apps/sentinel/src/governance/policyEngine');

const baseEnvelope = {
  tenant: 'ownerfi',
  command: 'application.submit',
  metadata: {
    actor: 'operator@example.com',
    role: 'approver'
  }
};

assert.deepStrictEqual(evaluatePolicy(baseEnvelope), {
  allowed: true,
  state: 'clean',
  riskLevel: 'low',
  decision: 'allow',
  approvalRequired: false
});

const identityBlock = evaluatePolicy(baseEnvelope, {
  identity: {
    impossibleTravel: true
  }
});

assert.strictEqual(identityBlock.allowed, false);
assert.strictEqual(identityBlock.state, 'drift');
assert.strictEqual(identityBlock.riskLevel, 'high');
assert.strictEqual(identityBlock.decision, 'block');
assert.strictEqual(identityBlock.reason, 'impossible_travel');
assert.strictEqual(identityBlock.approvalRequired, true);

const roleBlock = evaluatePolicy({
  tenant: 'ownerfi',
  command: 'deal.execute',
  metadata: {
    actor: 'operator@example.com',
    role: 'operator'
  }
});

assert.strictEqual(roleBlock.allowed, false);
assert.strictEqual(roleBlock.state, 'restricted');
assert.strictEqual(roleBlock.reason, 'ROLE_REQUIRED');
assert.strictEqual(roleBlock.approvalRequired, true);

const invalid = evaluatePolicy({
  tenant: 'ownerfi',
  command: 'application.submit',
  metadata: {}
});

assert.strictEqual(invalid.allowed, false);
assert.strictEqual(invalid.state, 'invalid');
assert.strictEqual(invalid.reason, 'ACTOR_REQUIRED,ROLE_REQUIRED');

console.log('Policy engine check passed');
