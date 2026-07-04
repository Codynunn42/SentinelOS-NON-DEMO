const assert = require('assert');
const {
  buildWhiteGloveSupportRequest
} = require('../apps/sentinel/src/whiteGlove/supportRequest');

const proofRequest = buildWhiteGloveSupportRequest(
  'The Azure proof route is failing and I need white glove support to get it one step closer.'
);

assert.strictEqual(proofRequest.status, 'solution_step_prepared');
assert.strictEqual(proofRequest.inferredIntent, 'restore_live_proof');
assert.strictEqual(
  proofRequest.nextGate,
  'RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF'
);
assert(proofRequest.holds.includes('Azure_mutation'));
assert(proofRequest.qualityScore >= 7);

const supportRequest = buildWhiteGloveSupportRequest(
  'Support item: help classify this blocker and tell me what evidence is missing.'
);

assert.strictEqual(supportRequest.inferredIntent, 'support_item_triage');
assert.strictEqual(supportRequest.whiteGloveStatus, 'ON_WITH_GOVERNANCE_GUARDRAILS');
assert(supportRequest.nextSolutionStep.includes('Classify the support item'));

const executionRequest = buildWhiteGloveSupportRequest(
  'Deploy this and push the fix after you update the runtime.'
);

assert.strictEqual(executionRequest.inferredIntent, 'execution_requested');
assert.strictEqual(executionRequest.executionAuthority, 'held_pending_explicit_gate');
assert(executionRequest.nonAuthorization.includes('deployment'));

console.log('White glove support request processor check passed');
