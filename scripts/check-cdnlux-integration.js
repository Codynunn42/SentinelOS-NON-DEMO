const assert = require('assert');
const {
  buildCdnluxEvent,
  buildSentinelSecurityEvent,
  requiresApproval
} = require('../apps/sentinel/src/integrations/cdnlux/cdnlux');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');

const transferEvent = buildCdnluxEvent({
  type: 'cdnlux.token.transfer_requested',
  action: 'transfer',
  amount: 25,
  requestedBy: 'sentinel-operator'
});

assert.strictEqual(transferEvent.utilityToken.symbol, 'CDNLUX');
assert.strictEqual(transferEvent.riskLevel, 'high');
assert.strictEqual(requiresApproval(transferEvent), true);

const securityEvent = buildSentinelSecurityEvent(transferEvent);

assert.strictEqual(securityEvent.source, 'cdnlux');
assert.strictEqual(securityEvent.riskLevel, 'high');
assert.strictEqual(securityEvent.trustContext.drift, true);
assert.ok(securityEvent.evidence.includes('utilityToken=CDNLUX'));

console.log('CDNLUX SentinelOS integration scaffold passed');

dispatchCommand({
  tenant: 'nunncloud',
  command: 'cdnlux.token.evaluate',
  payload: {
    type: 'cdnlux.token.transfer_requested',
    action: 'transfer',
    amount: 25,
    requestedBy: 'sentinel-operator'
  },
  metadata: {
    actor: 'local-check',
    role: 'operator'
  }
}).then((result) => {
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.integration, 'cdnlux');
  assert.strictEqual(result.data.approvalRequired, true);
  console.log('CDNLUX Sentinel command surface passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
