const assert = require('assert');
const { routeArchiveIntelligenceIntake } = require('../apps/sentinel/src/learning/interpretation');

const futureTheory = routeArchiveIntelligenceIntake({
  id: 'incoming_managed_results',
  title: 'Managed Results future theory',
  body: 'Keep Managed Results as a future-facing operator logic idea, not active SentinelOS scope.',
  source: 'memory-layer',
  tags: ['Managed Results', 'SINTENIX']
});

assert.strictEqual(futureTheory.component, 'archive_intelligence');
assert.strictEqual(futureTheory.managedBy, 'forethought_interpretation');
assert.strictEqual(futureTheory.lane, 'idea_ledger');
assert.strictEqual(futureTheory.activeExecutionAllowed, false);
assert.strictEqual(futureTheory.executionMode, 'observe_route_only');
assert.strictEqual(futureTheory.interpretation.requiresApproval, true);
assert(futureTheory.interpretation.evidence.includes('docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md'));
assert(futureTheory.operatorLogicLabels.includes('SINTENIX'));

const archiveReference = routeArchiveIntelligenceIntake({
  id: 'incoming_ownerfi_lineage',
  title: 'OwnerFi proof lineage',
  body: 'Use the 2026-04-23 daily brief only as archive context for OwnerFi proof history.',
  source: 'archive'
});

assert.strictEqual(archiveReference.lane, 'archive_reference');
assert(archiveReference.evidenceConnections.some((connection) => connection.decision === 'ARCHIVE'));
assert(archiveReference.evidenceConnections.some((connection) => connection.path === 'docs/DAILY_BRIEF_2026-04-23.md'));
assert.strictEqual(archiveReference.activeExecutionAllowed, false);

const currentTruth = routeArchiveIntelligenceIntake({
  id: 'incoming_phase_1_1',
  title: 'Phase 1.1 approval continuity',
  body: 'Phase 1.1 approval board and FacePlane approval continuity are the current truth.',
  source: 'operator'
});

assert.strictEqual(currentTruth.lane, 'active_context');
assert(currentTruth.evidenceConnections.some((connection) => connection.role === 'current_truth'));
assert.strictEqual(currentTruth.interpretation.requiresApproval, false);
assert.strictEqual(currentTruth.interpretation.actionGate, 'observe_only');

const deferredDraft = routeArchiveIntelligenceIntake({
  id: 'incoming_arizona_spo',
  title: 'Arizona SPO public sector idea',
  body: 'Could this public sector procurement memo be sent later?',
  source: 'operator'
});

assert.strictEqual(deferredDraft.lane, 'deferred_review');
assert(deferredDraft.evidenceConnections.some((connection) => connection.decision === 'DEFER'));
assert.strictEqual(deferredDraft.interpretation.requiresApproval, true);
assert.strictEqual(deferredDraft.interpretation.riskLevel, 'high');

const archivalCognition = routeArchiveIntelligenceIntake({
  id: 'incoming_archive_intelligence_boundary_20260513',
  title: 'Archive intelligence boundary',
  body: [
    'SentinelOS is governed execution and operational control.',
    'Archive intelligence is archival cognition, lineage interpretation, and historical synthesis.',
    'Archive intelligence informs SentinelOS but does not control SentinelOS.',
    'One governs. One understands.'
  ].join(' '),
  source: 'operator',
  tags: ['SINTENIX', 'archive interpretation', 'historical intelligence']
});

assert.strictEqual(archivalCognition.component, 'archive_intelligence');
assert.strictEqual(archivalCognition.lane, 'archive_cognition');
assert.strictEqual(archivalCognition.activeExecutionAllowed, false);
assert(archivalCognition.evidenceConnections.some((connection) => connection.role === 'archive_intelligence_boundary'));
assert(archivalCognition.interpretation.requiresApproval);

console.log('Archive intelligence docking check passed');
