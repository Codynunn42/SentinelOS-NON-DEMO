const assert = require('assert');
const { evaluatePolicy } = require('../apps/sentinel/src/governance/policyEngine');

const baseContext = {
  tenant: 'ownerfi',
  command: 'application.submit',
  actor: 'operator@example.com',
  role: 'approver',
  scopes: ['application:submit'],
  requiredScope: 'application:submit'
};

assert.deepStrictEqual(evaluatePolicy(baseContext), {
  allowed: true,
  state: 'clean',
  riskLevel: 'low',
  decision: 'allow',
  approvalRequired: false,
  receiptRequired: true
});

const identityBlock = evaluatePolicy({
  ...baseContext,
  signals: {
    identity: {
      impossibleTravel: true
    }
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
  actor: 'operator@example.com',
  role: 'operator',
  scopes: ['deal:execute'],
  requiredScope: 'deal:execute'
});

assert.strictEqual(roleBlock.allowed, false);
assert.strictEqual(roleBlock.state, 'restricted');
assert.strictEqual(roleBlock.reason, 'ROLE_REQUIRED');
assert.strictEqual(roleBlock.approvalRequired, true);

const invalid = evaluatePolicy({
  tenant: 'ownerfi',
  command: 'application.submit',
  scopes: ['application:submit'],
  requiredScope: 'application:submit'
});

assert.strictEqual(invalid.allowed, false);
assert.strictEqual(invalid.state, 'invalid');
assert.strictEqual(invalid.reason, 'ACTOR_REQUIRED,ROLE_REQUIRED');

const missingScope = evaluatePolicy({
  tenant: 'ownerfi',
  command: 'application.evaluate',
  actor: 'operator@example.com',
  role: 'operator',
  scopes: ['application:submit'],
  requiredScope: 'application:evaluate'
});

assert.strictEqual(missingScope.allowed, false);
assert.strictEqual(missingScope.reason, 'SCOPE_REQUIRED');

console.log('Policy engine check passed');
