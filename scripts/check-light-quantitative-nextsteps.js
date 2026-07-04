const assert = require('assert');
const {
  COMMANDS,
  buildLightQuantitativeNextStepsResult,
  sentinelOsHandlers
} = require('../apps/sentinel/src/commands/sentinelOsHandlers');

const result = buildLightQuantitativeNextStepsResult({
  mode: 'light',
  source: 'docs/NEXT_STEPS_DEEP_DIVE_SUMMARIES_2026-07-03.md',
  customerScopeFieldsComplete: false,
  ownerIntentAfterScope: true
});

assert.strictEqual(result.command, COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS);
assert.strictEqual(result.mode, 'light');
assert.strictEqual(result.conclusion.discoveryAndQuestionnaire, 'authorized_to_prepare');
assert.strictEqual(result.conclusion.productionCustomerDealExecution, 'not_authorized_yet');
assert.strictEqual(result.conclusion.livePaymentCollection, 'not_authorized');

const customerLane = result.lanes.find((lane) => lane.lane === 'customer_discovery_intake_and_risk');
assert(customerLane);
assert.strictEqual(customerLane.decision, 'authorize_questionnaire_preparation');
assert(customerLane.output.customer_identity_fields.length > 0);
assert(customerLane.output.prohibited_claims_section.some((claim) => claim.includes('No regulated finance claim')));

const productionLane = result.lanes.find((lane) => lane.lane === 'production_customer_deal_execution');
assert(productionLane);
assert.strictEqual(productionLane.decision, 'hold_pending_completed_customer_scope');
assert(productionLane.missingIfHeld.includes('customer_identity'));

const completedScopeResult = buildLightQuantitativeNextStepsResult({
  customerScopeFieldsComplete: true,
  ownerIntentAfterScope: true
});
const completedProductionLane = completedScopeResult.lanes.find((lane) => lane.lane === 'production_customer_deal_execution');
assert.strictEqual(completedProductionLane.decision, 'prepare_owner_authorization_packet');
assert.strictEqual(completedScopeResult.conclusion.productionCustomerDealExecution, 'prepare_authorization_packet_for_owner_review');

(async () => {
  const handled = await sentinelOsHandlers[COMMANDS.LIGHT_QUANTITATIVE_NEXT_STEPS](
    { mode: 'light', customerScopeFieldsComplete: false },
    {
      tenant: 'sentinelos',
      buildReceipt: () => ({ receiptId: 'local-receipt-light-quantitative-nextsteps', auditId: 'audit-light-quantitative-nextsteps' }),
      emitSecurityEvent: () => {}
    }
  );

  assert.strictEqual(handled.success, true);
  assert.strictEqual(handled.statusCode, 200);
  assert.strictEqual(handled.data.receipt.receiptId, 'local-receipt-light-quantitative-nextsteps');
  console.log('Light quantitative next steps check passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
