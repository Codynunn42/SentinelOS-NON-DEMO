'use strict';

// Phase 3 — Checkpoint 3.4: Provider Fallback & Failover Logic Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 3.4 deliverables:
//   - failover.js exports PFFL_VERSION, FAILOVER_OUTCOME, executeFailover, detectFailoverTrigger
//   - executeFailover: successful reroute when viable fallback exists
//   - nextProvider is set to the new primary after reroute
//   - envelope transitions to FALLBACK status on reroute
//   - failover evidence appended to evidenceChain for failing provider
//   - execution plan rebuilt with new primary after reroute
//   - executeFailover: ABORTED when no viable fallback provider exists
//   - envelope transitions to FAILED on abort
//   - detectFailoverTrigger: degraded health → HEALTH_BELOW_THRESHOLD
//   - detectFailoverTrigger: CRITICAL drift → DRIFT_CRITICAL
//   - detectFailoverTrigger: healthy/NONE → null (no trigger)
//   - missing params to executeFailover → ABORTED gracefully

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  PFFL_VERSION,
  FAILOVER_OUTCOME,
  executeFailover,
  detectFailoverTrigger
} = require('../apps/sentinel/src/federation/failover');

const {
  createEnvelope,
  ENVELOPE_STATUS,
  FALLBACK_TRIGGER,
  FALLBACK_ACTION,
  EVIDENCE_STATUS,
  transitionEnvelope
} = require('../apps/sentinel/src/federation/envelope');

// --- Exports ---

assert(typeof PFFL_VERSION === 'string', 'PFFL_VERSION exported');
assert(typeof FAILOVER_OUTCOME === 'object', 'FAILOVER_OUTCOME exported');
assert(typeof executeFailover === 'function', 'executeFailover exported');
assert(typeof detectFailoverTrigger === 'function', 'detectFailoverTrigger exported');

console.log('  - All PFFL exports present ✓');

// --- FAILOVER_OUTCOME values ---

assert(FAILOVER_OUTCOME.REROUTED === 'REROUTED', 'FAILOVER_OUTCOME.REROUTED');
assert(FAILOVER_OUTCOME.ABORTED === 'ABORTED', 'FAILOVER_OUTCOME.ABORTED');
assert(typeof FAILOVER_OUTCOME.RESCORED === 'string', 'FAILOVER_OUTCOME.RESCORED');
assert(typeof FAILOVER_OUTCOME.PLAN_REBUILT === 'string', 'FAILOVER_OUTCOME.PLAN_REBUILT');

console.log('  - FAILOVER_OUTCOME values correct ✓');

// --- Test envelope: 3 providers, nexus is primary ---

const baseEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 },
    { provider: 'tilda', capabilityId: 'TILDA-EXECUTE-001', endpoint: '/api/v1/execution', priority: 1 },
    { provider: 'github', capabilityId: 'GITHUB-EXECUTE-001', endpoint: '/api/v1/execution', priority: 2 }
  ],
  capabilityScope: {
    capabilityId: 'NEXUS-EXECUTE-001',
    type: 'execute',
    authority: { minimumRole: 'operator' }
  },
  policyScope: {
    requiresApproval: false,
    complianceGates: [],
    priority: 'executive-desk'
  },
  fallbackChain: [
    { provider: 'tilda', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE },
    { provider: 'github', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE }
  ]
});

// Transition to ACTIVE so it's in a valid pre-failover state
const activeEnvelope = transitionEnvelope(baseEnvelope, ENVELOPE_STATUS.ACTIVE);

// --- Successful reroute: nexus fails, tilda/github healthy ---

const result1 = executeFailover({
  envelope: activeEnvelope,
  failedProvider: 'nexus',
  trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD,
  reason: 'Provider health dropped to degraded',
  providerHealth: { nexus: 'degraded', tilda: 'healthy', github: 'healthy' },
  driftScores: { nexus: 'NONE', tilda: 'NONE', github: 'NONE' },
  role: 'operator'
});

assert(result1.outcome === FAILOVER_OUTCOME.REROUTED, 'outcome is REROUTED');
assert(result1.envelope.status === ENVELOPE_STATUS.FALLBACK, 'envelope transitions to FALLBACK');
assert(result1.nextProvider !== null, 'nextProvider is set');
assert(result1.nextProvider !== 'nexus', 'nextProvider is not the failed provider');
assert(typeof result1.reroutedAt === 'string', 'reroutedAt is set');

console.log('  - executeFailover: successful reroute ✓');
console.log(`  - nextProvider after reroute: ${result1.nextProvider} ✓`);

// --- envelope transitions to FALLBACK status ---

assert(result1.envelope.status === ENVELOPE_STATUS.FALLBACK, 'FALLBACK status on reroute ✓');

console.log('  - envelope transitions to FALLBACK on reroute ✓');

// --- failover evidence appended for failing provider ---

const failedProviderEvidence = result1.envelope.evidenceChain.find((e) => e.provider === 'nexus');
assert(failedProviderEvidence, 'evidence slot exists for nexus');
assert(failedProviderEvidence.status === EVIDENCE_STATUS.FAILED, 'nexus evidence status is FAILED');
assert(typeof failedProviderEvidence.failoverTrigger === 'string', 'failoverTrigger set on evidence');
assert(typeof failedProviderEvidence.failoverReason === 'string', 'failoverReason set on evidence');
assert(typeof failedProviderEvidence.failoverAt === 'string', 'failoverAt set on evidence');

console.log('  - failover evidence appended to evidenceChain for failing provider ✓');

// --- execution plan rebuilt with new primary ---

assert(result1.envelope.executionPlan.primaryProvider !== 'nexus', 'executionPlan primaryProvider updated away from failed nexus');
assert(Array.isArray(result1.envelope.executionPlan.steps), 'executionPlan steps is array');
assert(result1.envelope.executionPlan.steps.length > 0, 'executionPlan has steps');
assert(result1.envelope.executionPlan.steps[0].isPrimary === true, 'first step is primary');
assert(result1.envelope.executionPlan.steps[0].provider === result1.nextProvider, 'first step provider matches nextProvider');

console.log('  - execution plan rebuilt with new primary ✓');

// --- ABORTED when no viable fallback provider ---

const singleProviderEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 }
  ],
  capabilityScope: { capabilityId: 'NEXUS-EXECUTE-001', type: 'execute', authority: { minimumRole: 'operator' } },
  policyScope: { requiresApproval: false, complianceGates: [], priority: 'capability' },
  fallbackChain: []
});

const activeSingle = transitionEnvelope(singleProviderEnvelope, ENVELOPE_STATUS.ACTIVE);

const result2 = executeFailover({
  envelope: activeSingle,
  failedProvider: 'nexus',
  trigger: FALLBACK_TRIGGER.API_FAILURE,
  reason: 'API returned 503',
  providerHealth: { nexus: 'degraded' },
  driftScores: { nexus: 'NONE' },
  role: 'operator'
});

assert(result2.outcome === FAILOVER_OUTCOME.ABORTED, 'ABORTED when only provider fails');
assert(result2.envelope.status === ENVELOPE_STATUS.FAILED, 'envelope transitions to FAILED on abort');
assert(result2.nextProvider === null, 'nextProvider is null on abort');

console.log('  - executeFailover: ABORTED when no viable fallback ✓');
console.log('  - envelope transitions to FAILED on abort ✓');

// --- all providers degraded triggers abort ---

const result3 = executeFailover({
  envelope: activeEnvelope,
  failedProvider: 'nexus',
  trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD,
  reason: 'All providers degraded',
  providerHealth: { nexus: 'degraded', tilda: 'degraded', github: 'degraded' },
  driftScores: { nexus: 'NONE', tilda: 'NONE', github: 'NONE' },
  role: 'operator'
});

assert(result3.outcome === FAILOVER_OUTCOME.ABORTED, 'ABORTED when all providers degraded after reroute');
assert(result3.envelope.status === ENVELOPE_STATUS.FAILED, 'envelope FAILED when all degraded');

console.log('  - All providers degraded: ABORTED correctly ✓');

// --- detectFailoverTrigger: degraded health ---

const t1 = detectFailoverTrigger('nexus', { nexus: 'degraded' }, { nexus: 'NONE' });
assert(t1 === FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, 'degraded → HEALTH_BELOW_THRESHOLD');

console.log('  - detectFailoverTrigger: degraded → HEALTH_BELOW_THRESHOLD ✓');

// --- detectFailoverTrigger: CRITICAL drift ---

const t2 = detectFailoverTrigger('tilda', { tilda: 'healthy' }, { tilda: 'CRITICAL' });
assert(t2 === FALLBACK_TRIGGER.DRIFT_CRITICAL, 'CRITICAL drift → DRIFT_CRITICAL');

console.log('  - detectFailoverTrigger: CRITICAL drift → DRIFT_CRITICAL ✓');

// --- detectFailoverTrigger: healthy/NONE → null ---

const t3 = detectFailoverTrigger('github', { github: 'healthy' }, { github: 'NONE' });
assert(t3 === null, 'healthy/NONE → null (no trigger)');

const t4 = detectFailoverTrigger('github', { github: 'healthy' }, { github: 'WARNING' });
assert(t4 === null, 'healthy/WARNING → null (WARNING does not trigger failover)');

console.log('  - detectFailoverTrigger: healthy/NONE → null ✓');
console.log('  - detectFailoverTrigger: healthy/WARNING → null ✓');

// --- Missing params → ABORTED gracefully ---

const resultNull = executeFailover({});
assert(resultNull.outcome === FAILOVER_OUTCOME.ABORTED, 'missing params → ABORTED gracefully');
assert(resultNull.envelope === null, 'envelope is null when no envelope provided');

console.log('  - executeFailover: missing params handled gracefully ✓');

console.log('\nALL CHECKPOINT 3.4 — PROVIDER FALLBACK & FAILOVER LOGIC CHECKS PASSED ✓');
