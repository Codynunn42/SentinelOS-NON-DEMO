'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateArtifact, artifactDigest } = require('../../apps/sentinel/src/archiveIntelligence/artifactPolicy');
const { routeArchiveIntelligenceIntake } = require('../../apps/sentinel/src/archiveIntelligence/intakeRouter');
const { runAdvisoryJob, semanticDigest, snapshot } = require('../../apps/sentinel/src/forethought/advisoryJob');
const { NOW, document, fixture, cases } = require('./fixtures');
const run = (f) => runAdvisoryJob(f.request, f.deps);

test('legacy May keywords cannot establish current authority or bypass review', () => {
  const r = routeArchiveIntelligenceIntake({ title: 'Phase 1.1 approval continuity FacePlane current truth' });
  assert.equal(r.lane, 'archive_reference');
  assert(r.evidenceConnections.length);
  assert(r.evidenceConnections.every((c) => c.slot === 'HISTORICAL_CONTEXT'));
  assert.equal(r.interpretation.confidence, null);
  assert.equal(r.interpretation.requiresApproval, true);
  assert.equal(r.activeExecutionAllowed, false);
});
test('trusted active artifact can occupy authority slot without granting execution', () => {
  const f = fixture();
  const r = routeArchiveIntelligenceIntake({ title: 'review' }, { validatedArtifacts: f.docs, authorityBindings: { 'policy-a': f.policies['policy-a'].authorityBinding }, currentTime: NOW });
  assert.equal(r.lane, 'active_context'); assert.equal(r.activeExecutionAllowed, false);
  assert.equal(r.interpretation.requiresApproval, true);
});
test('freshness decreases with time independently of trusted authority', () => {
  const f = fixture(), d = f.docs[0], binding = f.policies[d.id].authorityBinding;
  const a = evaluateArtifact(d, { currentTime: NOW, authorityBinding: binding });
  const b = evaluateArtifact(d, { currentTime: '2026-11-15T00:00:00Z', authorityBinding: binding });
  assert(b.freshness.score < a.freshness.score); assert.equal(b.slot, 'CURRENT_AUTHORITY');
  assert.equal(evaluateArtifact(d, { currentTime: NOW }).slot, 'HISTORICAL_CONTEXT');
});
test('expired/nonactive/superseded/missing/malformed/future metadata never establishes authority', () => {
  for (const change of [
    (d) => d.lifecycle.validUntil = '2026-11-08T00:00:00Z',
    (d) => d.lifecycle.status = 'STALE', (d) => d.lifecycle.status = 'SUPERSEDED',
    (d) => d.lifecycle.status = 'UNDER_HOLD', (d) => d.lifecycle.supersededBy = 'v2',
    (d) => delete d.lifecycle.validUntil, (d) => d.provenance.authorityLevel = 6,
    (d) => d.provenance.authorityLevel = '4', (d) => d.provenance.authoredAt = '2026-02-30T00:00:00Z',
    (d) => d.provenance.ingestedAt = '2027-01-01T00:00:00Z', (d) => delete d.version,
    (d) => d.lifecycle.validUntil = '2026-10-01T00:00:00Z'
  ]) {
    const d = document(); change(d); const f = fixture([d]);
    assert.equal(evaluateArtifact(d, { currentTime: NOW, authorityBinding: f.policies[d.id].authorityBinding }).slot, 'HISTORICAL_CONTEXT');
  }
});
test('expiry equality is valid; the first later instant is expired', () => {
  const d = document(); d.lifecycle.validUntil = NOW; const f = fixture([d]);
  assert.equal(evaluateArtifact(d, { currentTime: NOW, authorityBinding: f.policies[d.id].authorityBinding }).slot, 'CURRENT_AUTHORITY');
  assert.equal(evaluateArtifact(d, { currentTime: '2026-11-09T20:00:00.001Z', authorityBinding: f.policies[d.id].authorityBinding }).slot, 'HISTORICAL_CONTEXT');
});
test('forged metadata, revoked authority and replayed version cannot become current', () => {
  for (const modify of [
    (f) => f.docs[0].provenance.authorityLevel = 5,
    (f) => f.policies['policy-a'].authorityBinding.revoked = true,
    (f) => f.policies['policy-a'].activeVersion = 'v2'
  ]) {
    const f = fixture(); modify(f); const r = run(f);
    assert(r.status === 'BLOCKED' || r.conclusions.length === 0);
  }
});
test('denials do not read content or expose source IDs, titles, hold vectors or payloads', () => {
  for (const modify of [
    (f) => f.request.caller = { token: 'bad', authenticated: true, tenant: 'alpha' },
    (f) => f.policies['policy-a'].tenant = 'beta',
    (f) => f.policies['policy-a'].readers = [],
    (f) => f.policies['policy-a'].classification = 3,
    (f) => f.request.requestedClassification = 3,
    (f) => f.policies['policy-a'].readBlocked = true,
    (f) => delete f.policies['policy-a'].readBlocked,
    (f) => delete f.policies['policy-a']
  ]) {
    const f = fixture(); modify(f); const r = run(f);
    assert.equal(r.status, 'BLOCKED'); assert.equal(f.readCount(), 0);
    assert.deepEqual(Object.keys(r).sort(), ['requestId', 'status', 'code', 'executionAllowed', 'telemetry'].sort());
    assert(!JSON.stringify(r).includes('policy-a')); assert(!JSON.stringify(r).includes('Friday'));
    assert.equal(r.telemetry.stages.filter((t) => t.name === 'forethought').length, 0);
  }
});
test('retention hold alone allows read; explicit read hold and UNDER_HOLD stop synthesis', () => {
  const f = fixture(); f.policies['policy-a'].retentionHold = true;
  assert.equal(run(f).status, 'REVIEW_REQUIRED');
  f.policies['policy-a'].readBlocked = true; assert.equal(run(f).status, 'BLOCKED');
  const g = fixture([document({ lifecycle: { status: 'UNDER_HOLD', validUntil: '2026-12-01T00:00:00Z', supersededBy: null } })]);
  assert.equal(run(g).status, 'BLOCKED');
});
test('C4 returns supported line citations, a pending signoff, and immutable input/output', () => {
  const f = fixture(); const before = JSON.stringify([f.request, f.docs, f.policies]); const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.conclusions[0].citation.startLine, 1);
  assert.equal(r.conclusions[0].citation.quote, f.docs[0].content);
  assert.equal(r.executionAllowed, false); assert.equal(r.signOff.status, 'PENDING_HUMAN_REVIEW');
  assert(Object.isFrozen(r.evidenceTable[0].provenance));
  assert.throws(() => { r.evidenceTable[0].provenance.authorityLevel = 5; }, TypeError);
  assert.equal(JSON.stringify([f.request, f.docs, f.policies]), before);
  const frozen = snapshot(f.request); assert(Object.isFrozen(frozen.caller));
});
test('structured contradictions remain unresolved and missing required evidence is explicit', () => {
  const f = cases()[4]; f.request.requiredKeys.push('review:owner'); const r = run(f);
  assert.equal(r.conflicts.length, 1); assert.equal(r.conflicts[0].alternatives.length, 2);
  assert.equal(r.conclusions.length, 0); assert.deepEqual(r.gaps, ['review:owner']);
  assert(r.nextUsefulAction.includes('resolve'));
});
test('historical evidence remains visible but cannot support a current conclusion', () => {
  const r = run(cases()[1]); assert.equal(r.conclusions.length, 0);
  assert.equal(r.evidenceTable[0].slot, 'HISTORICAL_CONTEXT'); assert.equal(r.gaps.length, 1);
});
test('invalid quote or nonexistent line fails closed without partial packet', () => {
  for (const line of [1, 9]) {
    const d = document(); d.claims[0].quote = 'Fabricated quote'; d.claims[0].line = line;
    const r = run(fixture([d])); assert.equal(r.code, 'INVALID_CITATION'); assert(!r.conclusions);
  }
});
test('expiry or revocation between validation and release blocks the packet', () => {
  const f = fixture(); let calls = 0;
  f.deps.clock = () => ++calls === 1 ? NOW : '2026-12-02T00:00:00Z';
  assert.equal(run(f).code, 'EVIDENCE_CHANGED');
  const g = fixture(); let policyCalls = 0;
  g.deps.resolvePolicy = (id) => { if (++policyCalls > 1) g.policies[id].readers = []; return g.policies[id]; };
  assert.equal(run(g).code, 'ACCESS_DENIED');
});
test('ordinary clock advance within validity does not block a packet', () => {
  const f = fixture(); let calls = 0; f.deps.clock = () => ++calls === 1 ? NOW : '2026-11-09T20:00:00.001Z';
  assert.equal(run(f).status, 'REVIEW_REQUIRED');
});
test('missing clock, store failure, malformed input yield structured failure', () => {
  const f = fixture(); f.deps.clock = () => 'bad'; assert.equal(run(f).code, 'INVALID_CLOCK');
  f.deps.store.listMetadata = () => { throw new Error('secret failure detail'); };
  const r = run(f); assert.equal(r.code, 'INTERNAL_FAILURE'); assert(!JSON.stringify(r).includes('secret'));
  assert.equal(runAdvisoryJob(null, f.deps).code, 'INVALID_REQUEST');
});
test('100 frozen benchmark cases have repeatable semantics and expected safety outcomes', () => {
  for (const f of cases()) {
    const a = run(f), b = run(f); assert.equal(semanticDigest(a), semanticDigest(b));
    assert.equal(a.executionAllowed, false);
    assert.equal(a.status, [5, 6].includes(f.kind) ? 'BLOCKED' : 'REVIEW_REQUIRED');
    if ([1, 2, 3, 8].includes(f.kind)) assert.equal(a.conclusions.length, 0);
  }
});
test('telemetry keeps CPU, RSS, heap and unknown energy separate', () => {
  const r = run(fixture()); assert.deepEqual(r.telemetry.stages.map((t) => t.name), ['lens', 'sentinel', 'forethought', 'desk', 'telemetry']);
  assert.equal(r.telemetry.energyJ, null); assert.equal(r.telemetry.energyStatus, 'UNKNOWN');
  assert(r.telemetry.cpuUserUs >= 0); assert(r.telemetry.sampledMaxRssBytes > 0);
});
test('a denied source after an allowed source still returns no partial findings', () => {
  const f = fixture([document(), document({ id: 'restricted-secret' })]);
  f.policies['restricted-secret'].tenant = 'beta';
  const r = run(f); assert.equal(r.status, 'BLOCKED'); assert.equal(f.readCount(), 1);
  assert(!JSON.stringify(r).includes('restricted-secret')); assert(!r.evidenceTable); assert(!r.conclusions);
});
test('source mutation after discovery fails identity validation', () => {
  const f = fixture(); f.docs[0].content = 'Changed after trusted registry publication.';
  assert.equal(run(f).code, 'EVIDENCE_CHANGED');
});
