'use strict';

// Phase 3 — Checkpoint 3.1: Federation Envelope Model Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 3.1 deliverables:
//   - envelope.js exports all required functions and constants
//   - createEnvelope produces a structurally valid FEM envelope
//   - validateEnvelope catches all required-field violations
//   - providerSet is sorted by priority
//   - evidenceChain has one slot per provider
//   - executionPlan has primaryProvider and steps
//   - driftAwareness: remediationHooks populated for WARNING and CRITICAL
//   - transitionEnvelope advances status correctly
//   - collectEvidence marks provider slot as collected
//   - activateFallback transitions to FALLBACK status and annotates step
//   - createEnvelope throws on missing required fields

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  FEM_VERSION,
  ENVELOPE_STATUS,
  POLICY_PRIORITY,
  DRIFT_SEVERITY,
  FALLBACK_TRIGGER,
  FALLBACK_ACTION,
  EVIDENCE_STATUS,
  createEnvelope,
  validateEnvelope,
  transitionEnvelope,
  collectEvidence,
  activateFallback
} = require('../apps/sentinel/src/federation/envelope');

// --- Exports ---

assert(typeof FEM_VERSION === 'string', 'FEM_VERSION must be exported');
assert(typeof ENVELOPE_STATUS === 'object', 'ENVELOPE_STATUS must be exported');
assert(typeof POLICY_PRIORITY === 'object', 'POLICY_PRIORITY must be exported');
assert(typeof DRIFT_SEVERITY === 'object', 'DRIFT_SEVERITY must be exported');
assert(typeof FALLBACK_TRIGGER === 'object', 'FALLBACK_TRIGGER must be exported');
assert(typeof FALLBACK_ACTION === 'object', 'FALLBACK_ACTION must be exported');
assert(typeof EVIDENCE_STATUS === 'object', 'EVIDENCE_STATUS must be exported');
assert(typeof createEnvelope === 'function', 'createEnvelope must be exported');
assert(typeof validateEnvelope === 'function', 'validateEnvelope must be exported');
assert(typeof transitionEnvelope === 'function', 'transitionEnvelope must be exported');
assert(typeof collectEvidence === 'function', 'collectEvidence must be exported');
assert(typeof activateFallback === 'function', 'activateFallback must be exported');

console.log('  - All FEM exports present ✓');

// --- ENVELOPE_STATUS values ---

assert(ENVELOPE_STATUS.PENDING === 'pending', 'ENVELOPE_STATUS.PENDING');
assert(ENVELOPE_STATUS.ACTIVE === 'active', 'ENVELOPE_STATUS.ACTIVE');
assert(ENVELOPE_STATUS.EXECUTING === 'executing', 'ENVELOPE_STATUS.EXECUTING');
assert(ENVELOPE_STATUS.COMPLETE === 'complete', 'ENVELOPE_STATUS.COMPLETE');
assert(ENVELOPE_STATUS.FAILED === 'failed', 'ENVELOPE_STATUS.FAILED');
assert(ENVELOPE_STATUS.FALLBACK === 'fallback', 'ENVELOPE_STATUS.FALLBACK');

console.log('  - ENVELOPE_STATUS values correct ✓');

// --- DRIFT_SEVERITY values ---

assert(DRIFT_SEVERITY.NONE === 'NONE', 'DRIFT_SEVERITY.NONE');
assert(DRIFT_SEVERITY.INFO === 'INFO', 'DRIFT_SEVERITY.INFO');
assert(DRIFT_SEVERITY.WARNING === 'WARNING', 'DRIFT_SEVERITY.WARNING');
assert(DRIFT_SEVERITY.CRITICAL === 'CRITICAL', 'DRIFT_SEVERITY.CRITICAL');

console.log('  - DRIFT_SEVERITY values correct ✓');

// --- createEnvelope: basic valid envelope ---

const baseParams = {
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 },
    { provider: 'tilda', capabilityId: 'TILDA-EXECUTE-001', endpoint: '/api/v1/execution', priority: 1 }
  ],
  capabilityScope: {
    capabilityId: 'NEXUS-EXECUTE-001',
    type: 'execute',
    authority: { minimumRole: 'executive' }
  },
  policyScope: {
    requiresApproval: true,
    complianceGates: ['EXECUTIVE_APPROVAL'],
    priority: POLICY_PRIORITY.EXECUTIVE_DESK
  },
  fallbackChain: [
    { provider: 'tilda', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE }
  ]
};

const env = createEnvelope(baseParams);

assert(typeof env.envelopeId === 'string' && env.envelopeId.startsWith('FED-'), 'envelopeId must start with FED-');
assert(env.version === FEM_VERSION, 'version must match FEM_VERSION');
assert(env.tenant === 'nexus', 'tenant preserved');
assert(env.command === 'nexus.command.execute', 'command preserved');
assert(env.status === ENVELOPE_STATUS.PENDING, 'initial status is pending');
assert(typeof env.issuedAt === 'string', 'issuedAt is set');

console.log('  - createEnvelope produces valid envelope ✓');
console.log('  - envelopeId prefixed with FED- ✓');

// --- providerSet ordering ---

assert(Array.isArray(env.providerSet) && env.providerSet.length === 2, 'providerSet has 2 entries');
assert(env.providerSet[0].provider === 'nexus', 'providerSet[0] is nexus (priority 0)');
assert(env.providerSet[1].provider === 'tilda', 'providerSet[1] is tilda (priority 1)');

console.log('  - providerSet sorted by priority ✓');

// --- capabilityScope ---

assert(env.capabilityScope.capabilityId === 'NEXUS-EXECUTE-001', 'capabilityScope.capabilityId preserved');
assert(env.capabilityScope.type === 'execute', 'capabilityScope.type preserved');
assert(env.capabilityScope.authority.minimumRole === 'executive', 'capabilityScope.authority.minimumRole preserved');

console.log('  - capabilityScope correct ✓');

// --- policyScope ---

assert(env.policyScope.requiresApproval === true, 'policyScope.requiresApproval preserved');
assert(Array.isArray(env.policyScope.complianceGates), 'policyScope.complianceGates is array');
assert(env.policyScope.complianceGates.includes('EXECUTIVE_APPROVAL'), 'EXECUTIVE_APPROVAL gate present');
assert(env.policyScope.priority === POLICY_PRIORITY.EXECUTIVE_DESK, 'policyScope.priority preserved');

console.log('  - policyScope correct ✓');

// --- fallbackChain ---

assert(Array.isArray(env.fallbackChain) && env.fallbackChain.length === 1, 'fallbackChain has 1 step');
assert(env.fallbackChain[0].provider === 'tilda', 'fallbackChain[0].provider is tilda');
assert(env.fallbackChain[0].trigger === FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, 'fallbackChain[0].trigger correct');
assert(env.fallbackChain[0].action === FALLBACK_ACTION.REROUTE, 'fallbackChain[0].action correct');
assert(env.fallbackChain[0].activatedAt === null, 'fallbackChain[0] not yet activated');

console.log('  - fallbackChain correct ✓');

// --- evidenceChain ---

assert(Array.isArray(env.evidenceChain) && env.evidenceChain.length === 2, 'evidenceChain has one slot per provider');
assert(env.evidenceChain[0].provider === 'nexus', 'evidenceChain[0] is nexus');
assert(env.evidenceChain[1].provider === 'tilda', 'evidenceChain[1] is tilda');
env.evidenceChain.forEach((entry) => {
  assert(entry.status === EVIDENCE_STATUS.PENDING, `evidenceChain entry for ${entry.provider} is pending`);
  assert(entry.ref === null, `evidenceChain entry for ${entry.provider} has no ref yet`);
});

console.log('  - evidenceChain one slot per provider, all pending ✓');

// --- executionPlan ---

assert(env.executionPlan.primaryProvider === 'nexus', 'executionPlan.primaryProvider is nexus');
assert(Array.isArray(env.executionPlan.steps) && env.executionPlan.steps.length === 2, 'executionPlan has 2 steps');
assert(env.executionPlan.steps[0].isPrimary === true, 'first step is primary');
assert(env.executionPlan.steps[1].isPrimary === false, 'second step is not primary');
assert(env.executionPlan.steps[0].status === 'pending', 'step[0] status pending');
assert(env.executionPlan.currentStepIndex === 0, 'currentStepIndex starts at 0');

console.log('  - executionPlan correct ✓');

// --- driftAwareness: NONE severity ---

assert(env.driftAwareness.severity === DRIFT_SEVERITY.NONE, 'default driftAwareness.severity is NONE');
assert(env.driftAwareness.remediationEnabled === false, 'remediationEnabled false for NONE');
assert(Array.isArray(env.driftAwareness.remediationHooks) && env.driftAwareness.remediationHooks.length === 0, 'no hooks for NONE');

console.log('  - driftAwareness NONE: no remediation hooks ✓');

// --- driftAwareness: WARNING severity populates rescore hook ---

const warningEnv = createEnvelope(Object.assign({}, baseParams, { driftSeverity: DRIFT_SEVERITY.WARNING }));
assert(warningEnv.driftAwareness.severity === DRIFT_SEVERITY.WARNING, 'WARNING severity set');
assert(warningEnv.driftAwareness.remediationEnabled === true, 'remediationEnabled true for WARNING');
assert(warningEnv.driftAwareness.remediationHooks.includes('RESCORE'), 'RESCORE hook for WARNING');

console.log('  - driftAwareness WARNING: RESCORE hook present ✓');

// --- driftAwareness: CRITICAL severity populates reroute + rebuild hooks ---

const criticalEnv = createEnvelope(Object.assign({}, baseParams, { driftSeverity: DRIFT_SEVERITY.CRITICAL }));
assert(criticalEnv.driftAwareness.severity === DRIFT_SEVERITY.CRITICAL, 'CRITICAL severity set');
assert(criticalEnv.driftAwareness.remediationEnabled === true, 'remediationEnabled true for CRITICAL');
assert(criticalEnv.driftAwareness.remediationHooks.includes('REROUTE'), 'REROUTE hook for CRITICAL');
assert(criticalEnv.driftAwareness.remediationHooks.includes('REBUILD_PLAN'), 'REBUILD_PLAN hook for CRITICAL');

console.log('  - driftAwareness CRITICAL: REROUTE + REBUILD_PLAN hooks present ✓');

// --- validateEnvelope: catches missing required fields ---

const { valid: v1, errors: e1 } = validateEnvelope(null);
assert(v1 === false && e1.includes('ENVELOPE_REQUIRED'), 'null envelope rejected');

const { valid: v2, errors: e2 } = validateEnvelope({ tenant: 'nexus', command: 'test' });
assert(v2 === false, 'incomplete envelope rejected');
assert(e2.some((e) => e.includes('ENVELOPE_ID')), 'missing envelopeId detected');
assert(e2.some((e) => e.includes('PROVIDER_SET')), 'missing providerSet detected');

console.log('  - validateEnvelope catches missing required fields ✓');

// --- transitionEnvelope: status transitions ---

const active = transitionEnvelope(env, ENVELOPE_STATUS.ACTIVE);
assert(active.status === ENVELOPE_STATUS.ACTIVE, 'transition to active');

const executing = transitionEnvelope(active, ENVELOPE_STATUS.EXECUTING);
assert(executing.status === ENVELOPE_STATUS.EXECUTING, 'transition to executing');

const complete = transitionEnvelope(executing, ENVELOPE_STATUS.COMPLETE);
assert(complete.status === ENVELOPE_STATUS.COMPLETE, 'transition to complete');

// invalid transition rejected
let threw = false;
try { transitionEnvelope(env, 'INVALID_STATUS'); } catch (e) { threw = true; }
assert(threw, 'invalid status transition throws');

console.log('  - transitionEnvelope status transitions correct ✓');
console.log('  - invalid status transition throws ✓');

// --- collectEvidence: marks provider slot collected ---

const withEvidence = collectEvidence(env, 'nexus', 'EV-RUN-003-001');
const nexusSlot = withEvidence.evidenceChain.find((e) => e.provider === 'nexus');
const tildaSlot = withEvidence.evidenceChain.find((e) => e.provider === 'tilda');

assert(nexusSlot.status === EVIDENCE_STATUS.COLLECTED, 'nexus evidence collected');
assert(nexusSlot.ref === 'EV-RUN-003-001', 'nexus evidence ref set');
assert(typeof nexusSlot.collectedAt === 'string', 'nexus collectedAt set');
assert(tildaSlot.status === EVIDENCE_STATUS.PENDING, 'tilda evidence still pending');

console.log('  - collectEvidence marks provider slot as collected ✓');
console.log('  - other provider slots unaffected ✓');

// --- activateFallback: transitions to FALLBACK and annotates step ---

const fallbackEnv = activateFallback(
  env,
  'tilda',
  FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD,
  'Provider health degraded below 0.3 threshold'
);

assert(fallbackEnv.status === ENVELOPE_STATUS.FALLBACK, 'envelope transitions to FALLBACK');
const activatedStep = fallbackEnv.fallbackChain.find(
  (s) => s.provider === 'tilda' && s.trigger === FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD
);
assert(activatedStep, 'fallback step found');
assert(typeof activatedStep.activatedAt === 'string', 'activatedAt set on fallback step');
assert(activatedStep.reason === 'Provider health degraded below 0.3 threshold', 'reason set on fallback step');

console.log('  - activateFallback transitions to FALLBACK ✓');
console.log('  - fallback step annotated with activatedAt and reason ✓');

// --- createEnvelope: throws on missing required fields ---

let threwTenant = false;
try { createEnvelope({ command: 'x', providerSet: [{}], capabilityScope: { capabilityId: 'X' } }); } catch (e) { threwTenant = true; }
assert(threwTenant, 'createEnvelope throws when tenant missing');

let threwCommand = false;
try { createEnvelope({ tenant: 'nexus', providerSet: [{}], capabilityScope: { capabilityId: 'X' } }); } catch (e) { threwCommand = true; }
assert(threwCommand, 'createEnvelope throws when command missing');

let threwProviderSet = false;
try { createEnvelope({ tenant: 'nexus', command: 'x', providerSet: [], capabilityScope: { capabilityId: 'X' } }); } catch (e) { threwProviderSet = true; }
assert(threwProviderSet, 'createEnvelope throws when providerSet is empty');

console.log('  - createEnvelope throws on missing tenant ✓');
console.log('  - createEnvelope throws on missing command ✓');
console.log('  - createEnvelope throws on empty providerSet ✓');

// --- envelopeId uniqueness: two envelopes never share an ID ---

const envA = createEnvelope(baseParams);
const envB = createEnvelope(baseParams);
assert(envA.envelopeId !== envB.envelopeId, 'envelopeId is unique across envelopes');

console.log('  - envelopeId is unique ✓');

console.log('\nALL CHECKPOINT 3.1 — FEDERATION ENVELOPE MODEL CHECKS PASSED ✓');
