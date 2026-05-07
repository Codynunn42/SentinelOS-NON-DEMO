const assert = require('assert');
const fs = require('fs');
const {
  getOperatorCase,
  listOperatorCases,
  submitOperatorDecision
} = require('../apps/sentinel/src/governance/vendorOnboarding/operatorEscalation');

const ledgerPath = '/private/tmp/sentinel_operator_escalation_check_ledger.jsonl';
fs.rmSync(ledgerPath, { force: true });

const cases = listOperatorCases();
assert(cases.length >= 2);
assert(cases.every((item) => item.nvopState >= 2));
assert(cases.every((item) => item.riskIndex > 1.3));
assert(cases.every((item) => item.decision === null));

const target = cases[0];
const detail = getOperatorCase(target.workflowId);
assert.strictEqual(detail.workflowId, target.workflowId);
assert(Array.isArray(detail.failedRules));
assert(Array.isArray(detail.ambiguityFlags));
assert(Array.isArray(detail.timeline));
assert(detail.riskInputs.C >= 0);
assert(detail.ruleSetVersion);

const missingRationale = submitOperatorDecision(target.workflowId, {
  decision: 'escalate_further',
  policyReferenceCode: 'POL-VEND-001',
  riskAcceptanceAcknowledged: true
}, { actor: 'operator@example.com' }, { ledgerPath });
assert.strictEqual(missingRationale.ok, false);
assert.strictEqual(missingRationale.error, 'RATIONALE_REQUIRED');

const missingAck = submitOperatorDecision(target.workflowId, {
  decision: 'escalate_further',
  decisionRationale: 'Escalating for tier review due to ambiguity flags.',
  policyReferenceCode: 'POL-VEND-001'
}, { actor: 'operator@example.com' }, { ledgerPath });
assert.strictEqual(missingAck.ok, false);
assert.strictEqual(missingAck.error, 'RISK_ACCEPTANCE_REQUIRED');

const accepted = submitOperatorDecision(target.workflowId, {
  decision: 'escalate_further',
  decisionRationale: 'Escalating for tier review due to cross-policy ambiguity and risk concentration.',
  policyReferenceCode: 'POL-VEND-001',
  riskAcceptanceAcknowledged: true
}, { actor: 'operator@example.com' }, { ledgerPath });
assert.strictEqual(accepted.ok, true);
assert.strictEqual(accepted.decision.operatorId, 'operator@example.com');
assert.strictEqual(accepted.decision.ledgerEntry.workflowId, target.workflowId);
assert.strictEqual(accepted.decision.ledgerEntry.hash, accepted.decision.decisionHash);

const duplicate = submitOperatorDecision(target.workflowId, {
  decision: 'approve',
  decisionRationale: 'Attempting duplicate mutation should be blocked.',
  policyReferenceCode: 'POL-VEND-001',
  riskAcceptanceAcknowledged: true
}, { actor: 'operator@example.com' }, { ledgerPath });
assert.strictEqual(duplicate.ok, false);
assert.strictEqual(duplicate.statusCode, 409);

const ledgerLines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
assert.strictEqual(ledgerLines.length, 1);

console.log('Operator escalation check passed');
