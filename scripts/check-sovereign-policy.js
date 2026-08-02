'use strict';

// Phase 4 — Checkpoint 4.1: Sovereign Policy Engine (SPE) Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 4.1 deliverables:
//   - policy.js exports all required functions and constants
//   - SPE_VERSION is a string
//   - POLICY_STATUS, SOVEREIGN_PRIORITY, DRIFT_ENFORCEMENT, GATE_STATUS, EVAL_DECISION constants correct
//   - createSovereignPolicy: policyId prefixed SPE-, initial state correct
//   - createSovereignPolicy: throws on missing command
//   - createSovereignPolicy: throws on invalid priority
//   - evaluateSovereignPolicy: allows valid active policy with no gates
//   - evaluateSovereignPolicy: blocks suspended policy
//   - evaluateSovereignPolicy: blocks revoked policy
//   - evaluateSovereignPolicy: blocks when drift enforcement LOCKED and non-sovereign caller
//   - evaluateSovereignPolicy: allows when drift enforcement LOCKED and sovereign caller
//   - evaluateSovereignPolicy: blocks when compliance gate is blocked
//   - evaluateSovereignPolicy: defers when compliance gate is open
//   - evaluateSovereignPolicy: allows when all gates passed
//   - applyDriftEnforcement: CRITICAL → LOCKED
//   - applyDriftEnforcement: WARNING → ENFORCED
//   - applyDriftEnforcement: INFO → ADVISORY
//   - applyDriftEnforcement: NONE → NONE (no downgrade from ENFORCED)
//   - applyDriftEnforcement: never downgrades existing enforcement
//   - applyDriftEnforcement: throws on invalid severity
//   - addComplianceGate: gate added with OPEN status
//   - addComplianceGate: throws on duplicate gateId
//   - openGate: gate moves to PASSED
//   - blockGate: gate moves to BLOCKED with reason
//   - applySovereignOverride: status set to OVERRIDE, override payload stored
//   - applySovereignOverride: ALLOW override causes allow decision
//   - applySovereignOverride: BLOCK override causes block decision
//   - applySovereignOverride: throws on missing decision
//   - bindEvidence: evidence ref added to policy
//   - bindEvidence: idempotent (no duplicate refs)
//   - inheritPolicy: child inherits parent driftEnforcement
//   - inheritPolicy: child status is INHERITED, inheritedFrom matches parent
//   - inheritPolicy: child gates reset to OPEN
//   - inheritPolicy: child priority lower than parent
//   - getPolicyStatus: returns correct gate breakdown
//   - getPolicyStatus: gatesClean when all gates passed

const assert = require('assert');

const {
  SPE_VERSION,
  POLICY_STATUS,
  SOVEREIGN_PRIORITY,
  DRIFT_ENFORCEMENT,
  GATE_STATUS,
  EVAL_DECISION,
  createSovereignPolicy,
  evaluateSovereignPolicy,
  applyDriftEnforcement,
  addComplianceGate,
  openGate,
  blockGate,
  applySovereignOverride,
  bindEvidence,
  inheritPolicy,
  getPolicyStatus
} = require('../apps/sentinel/src/sovereign/policy');

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

assert(typeof SPE_VERSION === 'string', 'SPE_VERSION exported');
assert(typeof POLICY_STATUS === 'object', 'POLICY_STATUS exported');
assert(typeof SOVEREIGN_PRIORITY === 'object', 'SOVEREIGN_PRIORITY exported');
assert(typeof DRIFT_ENFORCEMENT === 'object', 'DRIFT_ENFORCEMENT exported');
assert(typeof GATE_STATUS === 'object', 'GATE_STATUS exported');
assert(typeof EVAL_DECISION === 'object', 'EVAL_DECISION exported');
assert(typeof createSovereignPolicy === 'function', 'createSovereignPolicy exported');
assert(typeof evaluateSovereignPolicy === 'function', 'evaluateSovereignPolicy exported');
assert(typeof applyDriftEnforcement === 'function', 'applyDriftEnforcement exported');
assert(typeof addComplianceGate === 'function', 'addComplianceGate exported');
assert(typeof openGate === 'function', 'openGate exported');
assert(typeof blockGate === 'function', 'blockGate exported');
assert(typeof applySovereignOverride === 'function', 'applySovereignOverride exported');
assert(typeof bindEvidence === 'function', 'bindEvidence exported');
assert(typeof inheritPolicy === 'function', 'inheritPolicy exported');
assert(typeof getPolicyStatus === 'function', 'getPolicyStatus exported');

console.log('  - All SPE exports present ✓');

// ---------------------------------------------------------------------------
// Constant values
// ---------------------------------------------------------------------------

assert(POLICY_STATUS.ACTIVE === 'active', 'POLICY_STATUS.ACTIVE');
assert(POLICY_STATUS.SUSPENDED === 'suspended', 'POLICY_STATUS.SUSPENDED');
assert(POLICY_STATUS.OVERRIDE === 'override', 'POLICY_STATUS.OVERRIDE');
assert(POLICY_STATUS.INHERITED === 'inherited', 'POLICY_STATUS.INHERITED');
assert(POLICY_STATUS.REVOKED === 'revoked', 'POLICY_STATUS.REVOKED');

assert(SOVEREIGN_PRIORITY.SOVEREIGN === 'sovereign', 'SOVEREIGN_PRIORITY.SOVEREIGN');
assert(SOVEREIGN_PRIORITY.EXECUTIVE_DESK === 'executive-desk', 'SOVEREIGN_PRIORITY.EXECUTIVE_DESK');
assert(SOVEREIGN_PRIORITY.PROVIDER === 'provider', 'SOVEREIGN_PRIORITY.PROVIDER');
assert(SOVEREIGN_PRIORITY.CAPABILITY === 'capability', 'SOVEREIGN_PRIORITY.CAPABILITY');

assert(DRIFT_ENFORCEMENT.NONE === 'none', 'DRIFT_ENFORCEMENT.NONE');
assert(DRIFT_ENFORCEMENT.ADVISORY === 'advisory', 'DRIFT_ENFORCEMENT.ADVISORY');
assert(DRIFT_ENFORCEMENT.ENFORCED === 'enforced', 'DRIFT_ENFORCEMENT.ENFORCED');
assert(DRIFT_ENFORCEMENT.LOCKED === 'locked', 'DRIFT_ENFORCEMENT.LOCKED');

assert(GATE_STATUS.OPEN === 'open', 'GATE_STATUS.OPEN');
assert(GATE_STATUS.PASSED === 'passed', 'GATE_STATUS.PASSED');
assert(GATE_STATUS.BLOCKED === 'blocked', 'GATE_STATUS.BLOCKED');
assert(GATE_STATUS.DEFERRED === 'deferred', 'GATE_STATUS.DEFERRED');

assert(EVAL_DECISION.ALLOW === 'allow', 'EVAL_DECISION.ALLOW');
assert(EVAL_DECISION.BLOCK === 'block', 'EVAL_DECISION.BLOCK');
assert(EVAL_DECISION.DEFER === 'defer', 'EVAL_DECISION.DEFER');

console.log('  - Constant values correct ✓');

// ---------------------------------------------------------------------------
// createSovereignPolicy — basic creation
// ---------------------------------------------------------------------------

const p1 = createSovereignPolicy({ command: 'nexus.command.execute', providers: ['nexus', 'tilda'] });

assert(typeof p1.policyId === 'string' && p1.policyId.startsWith('SPE-'), 'policyId prefixed SPE-');
assert(p1.command === 'nexus.command.execute', 'command stored');
assert(p1.version === SPE_VERSION, 'version is SPE_VERSION');
assert(p1.status === POLICY_STATUS.ACTIVE, 'initial status is active');
assert(p1.priority === SOVEREIGN_PRIORITY.SOVEREIGN, 'default priority is sovereign');
assert(p1.driftEnforcement === DRIFT_ENFORCEMENT.NONE, 'initial driftEnforcement is none');
assert(Array.isArray(p1.complianceGates) && p1.complianceGates.length === 0, 'complianceGates starts empty');
assert(p1.sovereignOverride === null, 'sovereignOverride starts null');
assert(Array.isArray(p1.evidenceRefs) && p1.evidenceRefs.length === 0, 'evidenceRefs starts empty');
assert(p1.inheritedFrom === null, 'inheritedFrom is null');
assert(Array.isArray(p1.providers) && p1.providers.length === 2, 'providers set');
assert(typeof p1.createdAt === 'string', 'createdAt set');
assert(p1.updatedAt === null, 'updatedAt is null initially');

console.log('  - createSovereignPolicy: policyId prefixed SPE- ✓');
console.log('  - createSovereignPolicy: initial state correct ✓');

// policyId uniqueness
const p2 = createSovereignPolicy({ command: 'nexus.command.execute' });
assert(p1.policyId !== p2.policyId, 'policyIds are unique');
console.log('  - createSovereignPolicy: policyIds are unique ✓');

// throws on missing command
let threwNoCommand = false;
try { createSovereignPolicy({}); } catch (e) { threwNoCommand = e.message === 'SPE_COMMAND_REQUIRED'; }
assert(threwNoCommand, 'throws SPE_COMMAND_REQUIRED on missing command');
console.log('  - createSovereignPolicy: throws on missing command ✓');

// throws on invalid priority
let threwBadPriority = false;
try { createSovereignPolicy({ command: 'x', priority: 'bogus' }); } catch (e) { threwBadPriority = true; }
assert(threwBadPriority, 'throws on invalid priority');
console.log('  - createSovereignPolicy: throws on invalid priority ✓');

// ---------------------------------------------------------------------------
// evaluateSovereignPolicy — active policy, no gates
// ---------------------------------------------------------------------------

const evalResult1 = evaluateSovereignPolicy(p1, { actor: 'operator@nexus', role: 'operator' });
assert(evalResult1.decision === EVAL_DECISION.ALLOW, 'allows active policy with no gates');
assert(evalResult1.allowed === true, 'allowed: true');
assert(evalResult1.reason === null, 'no reason on clean allow');
console.log('  - evaluateSovereignPolicy: allows active policy with no gates ✓');

// suspended policy
const pSuspended = { ...p1, status: POLICY_STATUS.SUSPENDED };
const evalSuspended = evaluateSovereignPolicy(pSuspended, {});
assert(evalSuspended.decision === EVAL_DECISION.BLOCK, 'blocks suspended policy');
assert(evalSuspended.reason === 'POLICY_SUSPENDED', 'reason is POLICY_SUSPENDED');
console.log('  - evaluateSovereignPolicy: blocks suspended policy ✓');

// revoked policy
const pRevoked = { ...p1, status: POLICY_STATUS.REVOKED };
const evalRevoked = evaluateSovereignPolicy(pRevoked, {});
assert(evalRevoked.decision === EVAL_DECISION.BLOCK, 'blocks revoked policy');
assert(evalRevoked.reason === 'POLICY_REVOKED', 'reason is POLICY_REVOKED');
console.log('  - evaluateSovereignPolicy: blocks revoked policy ✓');

// ---------------------------------------------------------------------------
// evaluateSovereignPolicy — LOCKED drift enforcement
// ---------------------------------------------------------------------------

const pLocked = applyDriftEnforcement(p1, 'CRITICAL');

// Non-sovereign caller is blocked
const evalLocked = evaluateSovereignPolicy(pLocked, { callerPriority: SOVEREIGN_PRIORITY.PROVIDER });
assert(evalLocked.decision === EVAL_DECISION.BLOCK, 'blocks non-sovereign caller under LOCKED enforcement');
assert(evalLocked.reason === 'DRIFT_ENFORCEMENT_LOCKED', 'reason is DRIFT_ENFORCEMENT_LOCKED');
console.log('  - evaluateSovereignPolicy: blocks non-sovereign caller when LOCKED ✓');

// Sovereign caller is allowed
const evalLockedSov = evaluateSovereignPolicy(pLocked, { callerPriority: SOVEREIGN_PRIORITY.SOVEREIGN });
assert(evalLockedSov.decision === EVAL_DECISION.ALLOW, 'allows sovereign caller under LOCKED enforcement');
console.log('  - evaluateSovereignPolicy: allows sovereign caller when LOCKED ✓');

// ---------------------------------------------------------------------------
// evaluateSovereignPolicy — compliance gates
// ---------------------------------------------------------------------------

let pWithGates = addComplianceGate(p1, { gateId: 'GATE-EXEC-001', label: 'Execution authority' });

// Open gate → defer
const evalOpenGate = evaluateSovereignPolicy(pWithGates, {});
assert(evalOpenGate.decision === EVAL_DECISION.DEFER, 'defers when gate is open');
assert(evalOpenGate.reason && evalOpenGate.reason.startsWith('COMPLIANCE_GATE_PENDING'), 'reason starts COMPLIANCE_GATE_PENDING');
console.log('  - evaluateSovereignPolicy: defers when compliance gate is open ✓');

// Pass gate → allow
const pGatePassed = openGate(pWithGates, 'GATE-EXEC-001');
const evalGatePassed = evaluateSovereignPolicy(pGatePassed, {});
assert(evalGatePassed.decision === EVAL_DECISION.ALLOW, 'allows when all gates passed');
console.log('  - evaluateSovereignPolicy: allows when all gates passed ✓');

// Block gate → block
const pGateBlocked = blockGate(pWithGates, 'GATE-EXEC-001', 'DRIFT_CRITICAL_HOLD');
const evalGateBlocked = evaluateSovereignPolicy(pGateBlocked, {});
assert(evalGateBlocked.decision === EVAL_DECISION.BLOCK, 'blocks when gate is blocked');
assert(evalGateBlocked.reason && evalGateBlocked.reason.startsWith('COMPLIANCE_GATE_BLOCKED'), 'reason starts COMPLIANCE_GATE_BLOCKED');
console.log('  - evaluateSovereignPolicy: blocks when compliance gate is blocked ✓');

// ---------------------------------------------------------------------------
// applyDriftEnforcement
// ---------------------------------------------------------------------------

const pCritical = applyDriftEnforcement(p1, 'CRITICAL');
assert(pCritical.driftEnforcement === DRIFT_ENFORCEMENT.LOCKED, 'CRITICAL → LOCKED');
assert(typeof pCritical.updatedAt === 'string', 'updatedAt set after drift enforcement');
console.log('  - applyDriftEnforcement: CRITICAL → LOCKED ✓');

const pWarning = applyDriftEnforcement(p1, 'WARNING');
assert(pWarning.driftEnforcement === DRIFT_ENFORCEMENT.ENFORCED, 'WARNING → ENFORCED');
console.log('  - applyDriftEnforcement: WARNING → ENFORCED ✓');

const pInfo = applyDriftEnforcement(p1, 'INFO');
assert(pInfo.driftEnforcement === DRIFT_ENFORCEMENT.ADVISORY, 'INFO → ADVISORY');
console.log('  - applyDriftEnforcement: INFO → ADVISORY ✓');

const pNone = applyDriftEnforcement(p1, 'NONE');
assert(pNone.driftEnforcement === DRIFT_ENFORCEMENT.NONE, 'NONE → NONE');
console.log('  - applyDriftEnforcement: NONE → NONE ✓');

// Never downgrade from ENFORCED
const pEnforced = applyDriftEnforcement(p1, 'WARNING'); // ENFORCED
const pDowngrade = applyDriftEnforcement(pEnforced, 'INFO'); // should stay ENFORCED
assert(pDowngrade.driftEnforcement === DRIFT_ENFORCEMENT.ENFORCED, 'never downgrades from ENFORCED to ADVISORY');
console.log('  - applyDriftEnforcement: never downgrades existing enforcement ✓');

// throws on invalid severity
let threwBadSeverity = false;
try { applyDriftEnforcement(p1, 'BOGUS'); } catch (e) { threwBadSeverity = true; }
assert(threwBadSeverity, 'throws on invalid drift severity');
console.log('  - applyDriftEnforcement: throws on invalid severity ✓');

// ---------------------------------------------------------------------------
// addComplianceGate
// ---------------------------------------------------------------------------

let pGate = addComplianceGate(p1, { gateId: 'GATE-001', label: 'Identity verification' });
assert(pGate.complianceGates.length === 1, 'gate added');
assert(pGate.complianceGates[0].gateId === 'GATE-001', 'gateId stored');
assert(pGate.complianceGates[0].status === GATE_STATUS.OPEN, 'gate starts OPEN');
assert(pGate.complianceGates[0].label === 'Identity verification', 'label stored');
console.log('  - addComplianceGate: gate added with OPEN status ✓');

// throws on duplicate gateId
let threwDuplicateGate = false;
try { addComplianceGate(pGate, { gateId: 'GATE-001' }); } catch (e) { threwDuplicateGate = true; }
assert(threwDuplicateGate, 'throws on duplicate gateId');
console.log('  - addComplianceGate: throws on duplicate gateId ✓');

// ---------------------------------------------------------------------------
// openGate
// ---------------------------------------------------------------------------

const pOpened = openGate(pGate, 'GATE-001');
assert(pOpened.complianceGates[0].status === GATE_STATUS.PASSED, 'gate moves to PASSED');
assert(typeof pOpened.complianceGates[0].resolvedAt === 'string', 'resolvedAt set');
console.log('  - openGate: gate moves to PASSED ✓');

// ---------------------------------------------------------------------------
// blockGate
// ---------------------------------------------------------------------------

const pBlocked2 = blockGate(pGate, 'GATE-001', 'SOVEREIGN_HOLD');
assert(pBlocked2.complianceGates[0].status === GATE_STATUS.BLOCKED, 'gate moves to BLOCKED');
assert(pBlocked2.complianceGates[0].reason === 'SOVEREIGN_HOLD', 'reason stored');
console.log('  - blockGate: gate moves to BLOCKED with reason ✓');

// ---------------------------------------------------------------------------
// applySovereignOverride
// ---------------------------------------------------------------------------

const pOverrideAllow = applySovereignOverride(p1, {
  decision: EVAL_DECISION.ALLOW,
  reason: 'EXECUTIVE_GRANT',
  issuedBy: 'executive-desk'
});

assert(pOverrideAllow.status === POLICY_STATUS.OVERRIDE, 'status set to OVERRIDE');
assert(pOverrideAllow.sovereignOverride !== null, 'sovereignOverride payload stored');
assert(pOverrideAllow.sovereignOverride.decision === EVAL_DECISION.ALLOW, 'override decision is allow');
assert(pOverrideAllow.sovereignOverride.reason === 'EXECUTIVE_GRANT', 'override reason stored');
assert(typeof pOverrideAllow.sovereignOverride.overrideId === 'string', 'overrideId generated');
assert(typeof pOverrideAllow.sovereignOverride.issuedAt === 'string', 'issuedAt set');

const evalOverrideAllow = evaluateSovereignPolicy(pOverrideAllow, {});
assert(evalOverrideAllow.decision === EVAL_DECISION.ALLOW, 'ALLOW override causes allow decision');
assert(evalOverrideAllow.reason === 'SOVEREIGN_OVERRIDE_ALLOW', 'reason is SOVEREIGN_OVERRIDE_ALLOW');
console.log('  - applySovereignOverride: status set to OVERRIDE ✓');
console.log('  - applySovereignOverride: ALLOW override causes allow decision ✓');

const pOverrideBlock = applySovereignOverride(p1, {
  decision: EVAL_DECISION.BLOCK,
  reason: 'SANCTIONS_HOLD'
});

const evalOverrideBlock = evaluateSovereignPolicy(pOverrideBlock, {});
assert(evalOverrideBlock.decision === EVAL_DECISION.BLOCK, 'BLOCK override causes block decision');
assert(evalOverrideBlock.reason === 'SANCTIONS_HOLD', 'block reason from override');
console.log('  - applySovereignOverride: BLOCK override causes block decision ✓');

// throws on missing decision
let threwNoDecision = false;
try { applySovereignOverride(p1, {}); } catch (e) { threwNoDecision = true; }
assert(threwNoDecision, 'throws on missing override decision');
console.log('  - applySovereignOverride: throws on missing decision ✓');

// ---------------------------------------------------------------------------
// bindEvidence
// ---------------------------------------------------------------------------

const pEvidence = bindEvidence(p1, 'ENTRY-ABC001');
assert(pEvidence.evidenceRefs.length === 1, 'evidence ref added');
assert(pEvidence.evidenceRefs[0] === 'ENTRY-ABC001', 'correct ref stored');

const pEvidence2 = bindEvidence(pEvidence, 'CHAIN-XYZ002');
assert(pEvidence2.evidenceRefs.length === 2, 'second ref added');

// idempotent
const pEvidence3 = bindEvidence(pEvidence2, 'ENTRY-ABC001');
assert(pEvidence3.evidenceRefs.length === 2, 'no duplicate refs');
console.log('  - bindEvidence: evidence ref added ✓');
console.log('  - bindEvidence: idempotent (no duplicate refs) ✓');

// ---------------------------------------------------------------------------
// inheritPolicy
// ---------------------------------------------------------------------------

const parentPolicy = createSovereignPolicy({
  command: 'sovereign.execute',
  providers: ['nexus', 'tilda'],
  priority: SOVEREIGN_PRIORITY.SOVEREIGN
});

let parentWithDrift = applyDriftEnforcement(parentPolicy, 'WARNING');
parentWithDrift = addComplianceGate(parentWithDrift, { gateId: 'GATE-INHERIT-001', label: 'Inherited gate' });
parentWithDrift = openGate(parentWithDrift, 'GATE-INHERIT-001');

const childPolicy = inheritPolicy(parentWithDrift, { command: 'sovereign.execute.sub', providers: ['nexus'] });

assert(childPolicy.status === POLICY_STATUS.INHERITED, 'child status is INHERITED');
assert(childPolicy.inheritedFrom === parentWithDrift.policyId, 'inheritedFrom matches parent policyId');
assert(childPolicy.driftEnforcement === DRIFT_ENFORCEMENT.ENFORCED, 'child inherits parent driftEnforcement');
assert(childPolicy.complianceGates.length === 1, 'child inherits parent gates');
assert(childPolicy.complianceGates[0].gateId === 'GATE-INHERIT-001', 'gate gateId preserved');
assert(childPolicy.complianceGates[0].status === GATE_STATUS.OPEN, 'child gates reset to OPEN');
assert(childPolicy.priority !== SOVEREIGN_PRIORITY.SOVEREIGN, 'child priority is lower than parent');
console.log('  - inheritPolicy: child status is INHERITED ✓');
console.log('  - inheritPolicy: inheritedFrom matches parent policyId ✓');
console.log('  - inheritPolicy: child inherits parent driftEnforcement ✓');
console.log('  - inheritPolicy: child gates reset to OPEN ✓');
console.log('  - inheritPolicy: child priority lower than parent ✓');

// ---------------------------------------------------------------------------
// getPolicyStatus
// ---------------------------------------------------------------------------

let pStatus = createSovereignPolicy({ command: 'test.status', providers: ['nexus'] });
pStatus = addComplianceGate(pStatus, { gateId: 'GATE-S1', label: 'Gate 1' });
pStatus = addComplianceGate(pStatus, { gateId: 'GATE-S2', label: 'Gate 2' });
pStatus = openGate(pStatus, 'GATE-S1');
pStatus = blockGate(pStatus, 'GATE-S2', 'TEST_BLOCK');
pStatus = bindEvidence(pStatus, 'ENTRY-STATUS-001');

const summary = getPolicyStatus(pStatus);

assert(summary.policyId === pStatus.policyId, 'summary.policyId matches');
assert(summary.command === 'test.status', 'summary.command matches');
assert(summary.status === POLICY_STATUS.ACTIVE, 'summary.status correct');
assert(summary.driftEnforcement === DRIFT_ENFORCEMENT.NONE, 'summary.driftEnforcement correct');
assert(summary.hasOverride === false, 'summary.hasOverride is false');
assert(summary.overrideDecision === null, 'summary.overrideDecision is null');
assert(summary.evidenceCount === 1, 'summary.evidenceCount is 1');
assert(summary.gates.total === 2, 'summary.gates.total is 2');
assert(summary.gates.passed === 1, 'summary.gates.passed is 1');
assert(summary.gates.blocked === 1, 'summary.gates.blocked is 1');
assert(summary.gatesClean === false, 'gatesClean is false when gates blocked');
console.log('  - getPolicyStatus: gate breakdown correct ✓');

// gatesClean when all passed
let pAllPassed = createSovereignPolicy({ command: 'test.clean' });
pAllPassed = addComplianceGate(pAllPassed, { gateId: 'G1', label: 'G1' });
pAllPassed = openGate(pAllPassed, 'G1');
const summaryClean = getPolicyStatus(pAllPassed);
assert(summaryClean.gatesClean === true, 'gatesClean is true when all gates passed');
console.log('  - getPolicyStatus: gatesClean when all gates passed ✓');

console.log('\nALL CHECKPOINT 4.1 — SOVEREIGN POLICY ENGINE CHECKS PASSED ✓');
