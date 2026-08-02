'use strict';

// Phase 3 — Checkpoint 3.3: Federated Policy Merge Rules Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 3.3 deliverables:
//   - policyMerge.js exports all required functions and constants
//   - mergeProviderPolicies: clean merge when no conflicts
//   - requiresApproval: OR-merge (any provider requiring approval → merged requires approval)
//   - complianceGates: union (no duplicates)
//   - minimumRole: most-restrictive wins (platform > executive > operator)
//   - Priority ordering: executive-desk wins over provider over capability
//   - CRITICAL drift forces requiresApproval=true and adds DRIFT_CRITICAL_HOLD gate
//   - WARNING drift adds DRIFT_WARNING_ADVISORY gate (not approval)
//   - Executive Desk driftOverride suppresses drift gates
//   - Empty input returns EMPTY_INPUT outcome with safe defaults
//   - applyMergedPolicy updates envelope policyScope correctly
//   - Conflict tracking captures requiresApproval disagreement
//   - Deduplication: duplicate gates appear only once in merged output

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  FPMR_VERSION,
  POLICY_PRIORITY,
  MERGE_OUTCOME,
  mergeProviderPolicies,
  applyMergedPolicy
} = require('../apps/sentinel/src/federation/policyMerge');

const { createEnvelope, FALLBACK_TRIGGER, FALLBACK_ACTION } = require('../apps/sentinel/src/federation/envelope');

// --- Exports ---

assert(typeof FPMR_VERSION === 'string', 'FPMR_VERSION exported');
assert(typeof POLICY_PRIORITY === 'object', 'POLICY_PRIORITY exported');
assert(typeof MERGE_OUTCOME === 'object', 'MERGE_OUTCOME exported');
assert(typeof mergeProviderPolicies === 'function', 'mergeProviderPolicies exported');
assert(typeof applyMergedPolicy === 'function', 'applyMergedPolicy exported');

console.log('  - All FPMR exports present ✓');

// --- POLICY_PRIORITY values ---

assert(POLICY_PRIORITY.EXECUTIVE_DESK === 'executive-desk', 'POLICY_PRIORITY.EXECUTIVE_DESK');
assert(POLICY_PRIORITY.PROVIDER === 'provider', 'POLICY_PRIORITY.PROVIDER');
assert(POLICY_PRIORITY.CAPABILITY === 'capability', 'POLICY_PRIORITY.CAPABILITY');

console.log('  - POLICY_PRIORITY values correct ✓');

// --- MERGE_OUTCOME values ---

assert(typeof MERGE_OUTCOME.CLEAN === 'string', 'MERGE_OUTCOME.CLEAN');
assert(typeof MERGE_OUTCOME.CONFLICT_RESOLVED === 'string', 'MERGE_OUTCOME.CONFLICT_RESOLVED');
assert(typeof MERGE_OUTCOME.DRIFT_OVERRIDE === 'string', 'MERGE_OUTCOME.DRIFT_OVERRIDE');
assert(typeof MERGE_OUTCOME.EMPTY_INPUT === 'string', 'MERGE_OUTCOME.EMPTY_INPUT');

console.log('  - MERGE_OUTCOME values correct ✓');

// --- Empty input returns safe defaults ---

const emptyResult = mergeProviderPolicies([]);
assert(emptyResult.outcome === MERGE_OUTCOME.EMPTY_INPUT, 'empty input → EMPTY_INPUT');
assert(emptyResult.merged.requiresApproval === false, 'empty: requiresApproval defaults false');
assert(Array.isArray(emptyResult.merged.complianceGates) && emptyResult.merged.complianceGates.length === 0, 'empty: complianceGates defaults []');
assert(emptyResult.merged.minimumRole === 'operator', 'empty: minimumRole defaults operator');
assert(emptyResult.version === FPMR_VERSION, 'version present');

console.log('  - Empty input returns safe defaults ✓');

// --- Clean merge: no conflicts ---

const cleanResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: ['AUDIT_TRAIL'], minimumRole: 'operator' },
  { provider: 'tilda', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: ['AUDIT_TRAIL'], minimumRole: 'operator' }
]);

assert(cleanResult.outcome === MERGE_OUTCOME.CLEAN, 'identical inputs → CLEAN');
assert(cleanResult.merged.requiresApproval === false, 'no approval needed when no provider requires it');
assert(cleanResult.merged.complianceGates.includes('AUDIT_TRAIL'), 'AUDIT_TRAIL gate present');
assert(cleanResult.merged.complianceGates.filter((g) => g === 'AUDIT_TRAIL').length === 1, 'AUDIT_TRAIL deduplicated');

console.log('  - Clean merge: no conflicts, deduplication applied ✓');

// --- requiresApproval: OR-merge ---

const approvalResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [] },
  { provider: 'tilda', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: true, complianceGates: [] },
  { provider: 'github', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: [] }
]);

assert(approvalResult.merged.requiresApproval === true, 'OR-merge: any provider requiring approval → merged requires approval');

console.log('  - requiresApproval OR-merge: any true → merged true ✓');

// --- Conflict tracking ---

assert(Array.isArray(approvalResult.conflicts), 'conflicts is array');
assert(approvalResult.conflicts.length > 0, 'conflicts captured when providers disagree');
assert(approvalResult.outcome === MERGE_OUTCOME.CONFLICT_RESOLVED, 'outcome is CONFLICT_RESOLVED when conflicts exist');

console.log('  - Conflict tracking captures requiresApproval disagreement ✓');

// --- complianceGates: union, no duplicates ---

const gateResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: ['AUDIT_TRAIL', 'EXECUTIVE_APPROVAL'] },
  { provider: 'tilda', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: ['AUDIT_TRAIL', 'RATE_LIMIT'] },
  { provider: 'github', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: ['RATE_LIMIT'] }
]);

assert(gateResult.merged.complianceGates.includes('AUDIT_TRAIL'), 'AUDIT_TRAIL in union');
assert(gateResult.merged.complianceGates.includes('EXECUTIVE_APPROVAL'), 'EXECUTIVE_APPROVAL in union');
assert(gateResult.merged.complianceGates.includes('RATE_LIMIT'), 'RATE_LIMIT in union');
assert(gateResult.merged.complianceGates.filter((g) => g === 'AUDIT_TRAIL').length === 1, 'AUDIT_TRAIL not duplicated');
assert(gateResult.merged.complianceGates.filter((g) => g === 'RATE_LIMIT').length === 1, 'RATE_LIMIT not duplicated');

console.log('  - complianceGates union with deduplication ✓');

// --- minimumRole: most restrictive wins ---

const roleResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [], minimumRole: 'operator' },
  { provider: 'tilda', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: [], minimumRole: 'executive' },
  { provider: 'github', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: [], minimumRole: 'operator' }
]);

assert(roleResult.merged.minimumRole === 'executive', 'most restrictive role wins (executive > operator)');

console.log('  - minimumRole: most restrictive wins ✓');

// --- platform is most restrictive ---

const platformResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.EXECUTIVE_DESK, requiresApproval: false, complianceGates: [], minimumRole: 'platform' },
  { provider: 'tilda', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [], minimumRole: 'executive' }
]);

assert(platformResult.merged.minimumRole === 'platform', 'platform is most restrictive role');

console.log('  - minimumRole: platform is most restrictive ✓');

// --- CRITICAL drift forces requiresApproval + DRIFT_CRITICAL_HOLD gate ---

const critDriftResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [] },
  { provider: 'tilda', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: [] }
], { driftScores: { nexus: 'CRITICAL', tilda: 'NONE' } });

assert(critDriftResult.merged.requiresApproval === true, 'CRITICAL drift forces requiresApproval=true');
assert(critDriftResult.merged.complianceGates.includes('DRIFT_CRITICAL_HOLD'), 'DRIFT_CRITICAL_HOLD gate added');
assert(critDriftResult.outcome === MERGE_OUTCOME.DRIFT_OVERRIDE, 'outcome is DRIFT_OVERRIDE');
assert(critDriftResult.driftHardenings.length > 0, 'driftHardenings recorded');

console.log('  - CRITICAL drift: requiresApproval forced true ✓');
console.log('  - CRITICAL drift: DRIFT_CRITICAL_HOLD gate added ✓');
console.log('  - outcome is DRIFT_OVERRIDE ✓');

// --- WARNING drift adds advisory gate only (no requiresApproval change) ---

const warnDriftResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [] }
], { driftScores: { nexus: 'WARNING' } });

assert(warnDriftResult.merged.requiresApproval === false, 'WARNING drift does NOT force requiresApproval');
assert(warnDriftResult.merged.complianceGates.includes('DRIFT_WARNING_ADVISORY'), 'DRIFT_WARNING_ADVISORY gate added for WARNING');
assert(!warnDriftResult.merged.complianceGates.includes('DRIFT_CRITICAL_HOLD'), 'DRIFT_CRITICAL_HOLD not added for WARNING');

console.log('  - WARNING drift: advisory gate added, requiresApproval unchanged ✓');

// --- Executive Desk driftOverride suppresses drift gates ---

const driftOverrideResult = mergeProviderPolicies([
  { provider: 'exec-desk', priority: POLICY_PRIORITY.EXECUTIVE_DESK, requiresApproval: false, complianceGates: [], driftOverride: true },
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [] }
], { driftScores: { nexus: 'CRITICAL' } });

assert(driftOverrideResult.merged.driftOverride === true, 'driftOverride from executive desk preserved');
assert(!driftOverrideResult.merged.complianceGates.includes('DRIFT_CRITICAL_HOLD'), 'DRIFT_CRITICAL_HOLD suppressed by driftOverride');
assert(driftOverrideResult.merged.requiresApproval === false, 'requiresApproval NOT forced when driftOverride is true');

console.log('  - Executive Desk driftOverride suppresses drift gates ✓');

// --- Priority ordering: executive-desk wins ---

const priorityResult = mergeProviderPolicies([
  { provider: 'exec-desk', priority: POLICY_PRIORITY.EXECUTIVE_DESK, requiresApproval: true, complianceGates: ['EXEC_ONLY'], minimumRole: 'executive' },
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: ['PROVIDER_GATE'], minimumRole: 'operator' }
]);

assert(priorityResult.merged.priority === POLICY_PRIORITY.EXECUTIVE_DESK, 'top priority is executive-desk');
assert(priorityResult.merged.requiresApproval === true, 'executive-desk requiresApproval wins');
assert(priorityResult.merged.complianceGates.includes('EXEC_ONLY'), 'executive-desk gate preserved');
assert(priorityResult.merged.complianceGates.includes('PROVIDER_GATE'), 'provider gate still in union');

console.log('  - Priority ordering: executive-desk at top ✓');

// --- sources deduplication ---

const sourceResult = mergeProviderPolicies([
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: [] },
  { provider: 'nexus', priority: POLICY_PRIORITY.CAPABILITY, requiresApproval: false, complianceGates: [] }
]);

assert(sourceResult.sources.filter((s) => s === 'nexus').length === 1, 'sources deduplicated');

console.log('  - sources deduplicated ✓');

// --- applyMergedPolicy: updates envelope policyScope ---

const testEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 }
  ],
  capabilityScope: { capabilityId: 'NEXUS-EXECUTE-001', type: 'execute', authority: { minimumRole: 'operator' } },
  policyScope: { requiresApproval: false, complianceGates: [], priority: 'capability' },
  fallbackChain: []
});

const providerPolicies = [
  { provider: 'exec-desk', priority: POLICY_PRIORITY.EXECUTIVE_DESK, requiresApproval: true, complianceGates: ['EXECUTIVE_APPROVAL'], minimumRole: 'executive' },
  { provider: 'nexus', priority: POLICY_PRIORITY.PROVIDER, requiresApproval: false, complianceGates: ['AUDIT_TRAIL'], minimumRole: 'operator' }
];

const { envelope: updatedEnvelope, mergeResult } = applyMergedPolicy(testEnvelope, providerPolicies);

assert(updatedEnvelope.policyScope.requiresApproval === true, 'applyMergedPolicy: requiresApproval updated');
assert(updatedEnvelope.policyScope.complianceGates.includes('EXECUTIVE_APPROVAL'), 'applyMergedPolicy: EXECUTIVE_APPROVAL gate present');
assert(updatedEnvelope.policyScope.complianceGates.includes('AUDIT_TRAIL'), 'applyMergedPolicy: AUDIT_TRAIL gate present');
assert(updatedEnvelope.policyScope.minimumRole === 'executive', 'applyMergedPolicy: minimumRole updated to executive');
assert(updatedEnvelope.envelopeId === testEnvelope.envelopeId, 'applyMergedPolicy: envelopeId preserved');
assert(mergeResult.outcome === MERGE_OUTCOME.CONFLICT_RESOLVED || mergeResult.outcome === MERGE_OUTCOME.CLEAN, 'mergeResult returned');

console.log('  - applyMergedPolicy updates envelope policyScope correctly ✓');
console.log('  - applyMergedPolicy preserves envelopeId ✓');

console.log('\nALL CHECKPOINT 3.3 — FEDERATED POLICY MERGE RULES CHECKS PASSED ✓');
