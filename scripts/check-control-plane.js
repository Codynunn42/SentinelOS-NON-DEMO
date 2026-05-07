const assert = require('assert');
const { buildEnvelope, validateControlInput } = require('../apps/sentinel/src/controlPlane');

const input = {
  intent: 'deal.execute',
  entity: 'deal',
  action: 'execute',
  context: { dealId: 'demo-123' },
  actor: { role: 'operator', userId: 'operator@nunncloud.local' },
  tenantId: 'ownerfi',
  metadata: { sessionId: 'session-001', source: 'check-control-plane' }
};

assert.strictEqual(validateControlInput(input), true);

const envelope = buildEnvelope(input);
assert.ok(envelope.commandId);
assert.strictEqual(envelope.sessionId, 'session-001');
assert.strictEqual(envelope.tenant, 'ownerfi');
assert.strictEqual(envelope.command, 'deal.execute');
assert.deepStrictEqual(envelope.payload, { dealId: 'demo-123' });
assert.strictEqual(envelope.metadata.role, 'operator');
assert.strictEqual(envelope.metadata.tenantId, 'ownerfi');
assert.strictEqual(envelope.metadata.actor, 'operator@nunncloud.local');
assert.strictEqual(envelope.metadata.source, 'check-control-plane');

assert.throws(() => validateControlInput({
  ...input,
  intent: 'deal.approve'
}), /Intent contract mismatch/);

assert.throws(() => validateControlInput({
  ...input,
  actor: {}
}), /Missing actor role/);

console.log('Control Plane check passed');
