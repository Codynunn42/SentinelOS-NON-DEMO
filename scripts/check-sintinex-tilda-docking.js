const assert = require('assert');
const { routeSintinexIntake } = require('../apps/sentinel/src/learning/tilda');

const futureTheory = routeSintinexIntake({
  id: 'incoming_managed_results',
  title: 'Managed Results future theory',
  body: 'Keep Managed Results as a future-facing SINTINEX idea, not active SentinelOS scope.',
  source: 'memory-layer',
  tags: ['Managed Results', 'SINTINEX']
});

assert.strictEqual(futureTheory.system, 'SINTENIX');
assert(futureTheory.aliases.includes('SINTINEX'));
assert.strictEqual(futureTheory.managedBy, 'TILDA');
assert.strictEqual(futureTheory.lane, 'sintinex_idea_ledger');
assert.strictEqual(futureTheory.activeExecutionAllowed, false);
assert.strictEqual(futureTheory.executionMode, 'observe_route_only');
assert.strictEqual(futureTheory.tilda.requiresApproval, true);
assert(futureTheory.tilda.evidence.includes('docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md'));

const archiveReference = routeSintinexIntake({
  id: 'incoming_ownerfi_lineage',
  title: 'OwnerFi proof lineage',
  body: 'Use the 2026-04-23 daily brief only as archive context for OwnerFi proof history.',
  source: 'archive'
});

assert.strictEqual(archiveReference.lane, 'archive_reference');
assert(archiveReference.archiveConnections.some((connection) => connection.decision === 'ARCHIVE'));
assert(archiveReference.archiveConnections.some((connection) => connection.path === 'docs/DAILY_BRIEF_2026-04-23.md'));
assert.strictEqual(archiveReference.activeExecutionAllowed, false);

const currentTruth = routeSintinexIntake({
  id: 'incoming_phase_1_1',
  title: 'Phase 1.1 approval continuity',
  body: 'Phase 1.1 approval board and FacePlane approval continuity are the current truth.',
  source: 'operator'
});

assert.strictEqual(currentTruth.lane, 'active_context');
assert(currentTruth.archiveConnections.some((connection) => connection.role === 'current_truth'));
assert.strictEqual(currentTruth.tilda.requiresApproval, false);
assert.strictEqual(currentTruth.tilda.actionGate, 'observe_only');

const deferredDraft = routeSintinexIntake({
  id: 'incoming_arizona_spo',
  title: 'Arizona SPO public sector idea',
  body: 'Could this public sector procurement memo be sent later?',
  source: 'operator'
});

assert.strictEqual(deferredDraft.lane, 'deferred_review');
assert(deferredDraft.archiveConnections.some((connection) => connection.decision === 'DEFER'));
assert.strictEqual(deferredDraft.tilda.requiresApproval, true);
assert.strictEqual(deferredDraft.tilda.riskLevel, 'high');

const archivalCognition = routeSintinexIntake({
  id: 'incoming_sintenix_boundary_20260513',
  title: 'SINTENIX archival cognition boundary',
  body: [
    'SentinelOS is governed execution and operational control.',
    'SINTENIX is archival cognition, lineage interpretation, and historical synthesis.',
    'SINTENIX informs SentinelOS but does not control SentinelOS.',
    'One governs. One understands.'
  ].join(' '),
  source: 'operator',
  tags: ['SINTENIX', 'archive interpretation', 'historical intelligence']
});

assert.strictEqual(archivalCognition.system, 'SINTENIX');
assert.strictEqual(archivalCognition.lane, 'sintenix_archival_cognition');
assert.strictEqual(archivalCognition.activeExecutionAllowed, false);
assert(archivalCognition.archiveConnections.some((connection) => connection.role === 'sintenix_boundary'));
assert(archivalCognition.tilda.requiresApproval);

console.log('SINTINEX TILDA docking check passed');
