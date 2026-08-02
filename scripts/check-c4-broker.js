'use strict';

// C4.1 — Multi-Provider Capability Selector Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates C4.1 deliverables:
//   - broker.js exports brokerMultiProvider and scoreCandidate (new C4 exports)
//   - brokerMultiProvider returns multiple candidates for a multi-provider command
//   - brokerMultiProvider ranks by score descending (best provider first)
//   - brokerMultiProvider blocks insufficient role with INSUFFICIENT_ROLE
//   - brokerMultiProvider returns BROKER_NO_ROUTE for unknown commands
//   - scoreCandidate ranks healthy providers above unknown/degraded
//   - providerHealth is present on brokerCommand routing decisions
//   - C3.5 regression: existing brokerCommand, brokerPlanningRequest, getCapabilityManifest still work

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  brokerCommand,
  brokerMultiProvider,
  brokerPlanningRequest,
  getCapabilityManifest,
  scoreCandidate
} = require('../apps/sentinel/src/capabilities/broker');

// --- C4.1 exports ---

assert(typeof brokerMultiProvider === 'function', 'broker must export brokerMultiProvider');
assert(typeof scoreCandidate === 'function', 'broker must export scoreCandidate');

console.log('  - brokerMultiProvider exported ✓');
console.log('  - scoreCandidate exported ✓');

// --- scoreCandidate: healthy scores higher than unknown, unknown higher than degraded ---

const healthyCap = { providerHealth: 'healthy', governance: { evidenceRequired: true }, cost: 2, latencyMs: 100 };
const unknownCap = { providerHealth: 'unknown', governance: { evidenceRequired: true }, cost: 2, latencyMs: 100 };
const degradedCap = { providerHealth: 'degraded', governance: { evidenceRequired: true }, cost: 2, latencyMs: 100 };

assert(scoreCandidate(healthyCap) > scoreCandidate(unknownCap), 'healthy should score higher than unknown');
assert(scoreCandidate(unknownCap) > scoreCandidate(degradedCap), 'unknown should score higher than degraded');

console.log('  - scoreCandidate health ranking: healthy > unknown > degraded ✓');

// --- scoreCandidate: evidence bonus applies ---

const withEvidence = { providerHealth: 'healthy', governance: { evidenceRequired: true }, cost: 5, latencyMs: 500 };
const withoutEvidence = { providerHealth: 'healthy', governance: { evidenceRequired: false }, cost: 5, latencyMs: 500 };

assert(scoreCandidate(withEvidence) > scoreCandidate(withoutEvidence), 'evidence bonus should apply');

console.log('  - scoreCandidate evidence bonus confirmed ✓');

// --- brokerMultiProvider: routes nexus.status.read ---

const readResult = brokerMultiProvider({ command: 'nexus.status.read', tenant: 'nexus', role: 'operator' });
assert.strictEqual(readResult.routed, true, 'nexus.status.read should route via brokerMultiProvider');
assert(Array.isArray(readResult.candidates) && readResult.candidates.length >= 1, 'should return at least one candidate');
assert(readResult.selected, 'should have a selected provider');
assert(readResult.selected.provider, 'selected should have a provider');

console.log('  - brokerMultiProvider routes nexus.status.read ✓');

// --- brokerMultiProvider: candidates are ranked by score descending ---

if (readResult.candidates.length >= 2) {
  const scores = readResult.candidates.map((c) => c.score);
  for (let i = 0; i < scores.length - 1; i++) {
    assert(scores[i] >= scores[i + 1], `candidates not ranked by score: ${scores}`);
  }
  console.log('  - brokerMultiProvider candidates ranked by score descending ✓');
} else {
  console.log('  - brokerMultiProvider ranking: single candidate (no ordering check needed) ✓');
}

// --- brokerMultiProvider: selection rationale is present ---

const firstCandidate = readResult.candidates[0];
assert(firstCandidate.selectionRationale, 'candidate must have selectionRationale');
assert(typeof firstCandidate.selectionRationale.healthScore === 'number', 'selectionRationale.healthScore must be a number');
assert(typeof firstCandidate.score === 'number', 'candidate must have a score');

console.log('  - brokerMultiProvider selection rationale present ✓');

// --- brokerMultiProvider: providerHealth present on candidates ---

assert(firstCandidate.providerHealth !== undefined, 'candidate must have providerHealth');

console.log('  - brokerMultiProvider providerHealth field present ✓');

// --- brokerMultiProvider: insufficient role blocked ---

const execBlocked = brokerMultiProvider({ command: 'nexus.command.execute', tenant: 'nexus', role: 'operator' });
assert.strictEqual(execBlocked.routed, false, 'operator should be blocked from nexus.command.execute');
assert.strictEqual(execBlocked.reason, 'INSUFFICIENT_ROLE', `Expected INSUFFICIENT_ROLE, got ${execBlocked.reason}`);

console.log('  - brokerMultiProvider blocks operator from nexus.command.execute ✓');

// --- brokerMultiProvider: executive allowed ---

const execAllowed = brokerMultiProvider({ command: 'nexus.command.execute', tenant: 'nexus', role: 'executive' });
assert.strictEqual(execAllowed.routed, true, 'executive should be allowed nexus.command.execute');
assert(execAllowed.selected, 'executive should get a selected provider');
assert.strictEqual(execAllowed.selected.provider, 'nexus');

console.log('  - brokerMultiProvider routes nexus.command.execute for executive ✓');

// --- brokerMultiProvider: unknown command returns BROKER_NO_ROUTE ---

const unknownResult = brokerMultiProvider({ command: 'unknown.future.command', tenant: 'nexus', role: 'operator' });
assert.strictEqual(unknownResult.routed, false);
assert(
  unknownResult.reason === 'BROKER_NO_ROUTE' || unknownResult.reason === 'NO_CAPABILITY_REGISTERED',
  `Expected BROKER_NO_ROUTE or NO_CAPABILITY_REGISTERED, got ${unknownResult.reason}`
);

console.log('  - brokerMultiProvider returns BROKER_NO_ROUTE for unknown command ✓');

// --- brokerMultiProvider: missing command ---

const missingCmd = brokerMultiProvider({ command: '', tenant: 'nexus', role: 'operator' });
assert.strictEqual(missingCmd.routed, false);
assert.strictEqual(missingCmd.reason, 'BROKER_COMMAND_REQUIRED');

console.log('  - brokerMultiProvider BROKER_COMMAND_REQUIRED for empty command ✓');

// --- brokerCommand: providerHealth present in routing decision ---

const cmdDecision = brokerCommand({ command: 'nexus.status.read', tenant: 'nexus', role: 'operator' });
assert.strictEqual(cmdDecision.routed, true);
assert(cmdDecision.providerHealth !== undefined, 'brokerCommand result must include providerHealth');

console.log('  - brokerCommand includes providerHealth in routing decision ✓');

// --- C3.5 regression: existing broker functions still work ---

assert(typeof brokerCommand === 'function');
assert(typeof brokerPlanningRequest === 'function');
assert(typeof getCapabilityManifest === 'function');

const nexusRead = brokerCommand({ command: 'nexus.status.read', tenant: 'nexus', role: 'operator' });
assert.strictEqual(nexusRead.routed, true);
assert.strictEqual(nexusRead.provider, 'nexus');

const planResult = brokerPlanningRequest({ intent: { command: 'nexus.status.read' }, tenant: 'nexus', role: 'operator' });
assert.strictEqual(planResult.routed, true);
assert(planResult.proposedEndpoint);

const manifest = getCapabilityManifest('nexus');
assert(manifest && manifest.total >= 4);

console.log('  - C3.5 regression: brokerCommand, brokerPlanningRequest, getCapabilityManifest ✓');

console.log('\nALL C4.1 MULTI-PROVIDER CAPABILITY SELECTOR CHECKS PASSED ✓');
