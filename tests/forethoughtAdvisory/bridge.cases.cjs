'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { runDiscoveryAdvisoryJob } = require('../../apps/sentinel/src/forethought/discoveryLens/advisoryBridge');
const { document } = require('./fixtures');
const { bridgeFixture } = require('./bridgeFixtures');
const run = (f) => runDiscoveryAdvisoryJob(f.request, f.deps);

test('Stage 3 Lens and C4 produce a combined packet with exact source citations', () => {
  const f = bridgeFixture(), before = JSON.stringify(f.docs); const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.discoveryReview.verdict, 'EVIDENCE_SUPPORTS_PREREQUISITES');
  assert.equal(r.discoveryReview.authorization_evidenced, false); assert.equal(r.executionAllowed, false);
  assert.equal(r.conclusions[0].citation.documentId, f.docs[0].id);
  assert.equal(r.conclusions[0].citation.version, f.records[0].source_version);
  assert.equal(JSON.stringify(f.docs), before); assert(Object.isFrozen(r.discoveryReview));
});
test('Lens target selection excludes irrelevant source claims from C4 synthesis', () => {
  const f = bridgeFixture([document(), document({ id: 'other-policy' })]);
  f.records[1].entity_tag = 'tag://other/v2.0'; const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.evidenceTable.length, 1);
  assert.equal(r.conclusions.length, 1); assert.equal(r.evidenceTable[0].id, 'policy-a');
});
test('unrelated-keyword release hold cannot be lost by C4 lexical discovery', () => {
  const f = bridgeFixture([document(), document({ id: 'release-hold', title: 'ZZZ', tags: [] })]);
  f.records[1].status = 'held'; f.records[1].entity_tag = 'tag://governance/release-hold/release-1';
  const r = run(f); assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.equal(r.discoveryReview.verdict, 'BLOCKING_EVIDENCE_PRESENT');
  assert(r.discoveryReview.blocking_ids.includes('lens-release-hold')); assert.equal(r.executionAllowed, false);
});
test('fixture_verified never overrides expiry or unverified authority', () => {
  for (const type of ['expired', 'untrusted']) {
    const d = document(); if (type === 'expired') d.lifecycle.validUntil = '2026-11-08T00:00:00Z';
    const f = bridgeFixture([d]); if (type === 'untrusted') f.policies[d.id].authorityBinding.revoked = true;
    const r = run(f); assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.conclusions.length, 0);
    assert.equal(r.discoveryReview.verdict, 'INSUFFICIENT_EVIDENCE'); assert.equal(r.discoveryReview.supporting_ids.length, 0);
  }
});
test('synthesis conflict or required gap downgrades Lens prerequisite support', () => {
  const f = bridgeFixture([document(), document({ id: 'conflict', content: 'The review deadline is Monday.', claims: [{ subject: 'review', predicate: 'deadline', value: 'Monday', line: 1, quote: 'The review deadline is Monday.' }] })]);
  assert.equal(run(f).discoveryReview.verdict, 'INSUFFICIENT_EVIDENCE');
  const g = bridgeFixture(); g.request.requiredKeys.push('review:owner');
  assert.equal(run(g).discoveryReview.verdict, 'INSUFFICIENT_EVIDENCE');
});
test('missing/mismatched scope grant denies before payload retrieval', () => {
  for (const field of ['tenant', 'allowedSensitivityTiers', 'allowedReleases', 'allowedEnvironments', 'authorizedScopeIds']) {
    const f = bridgeFixture(); const original = f.deps.authenticate;
    f.deps.authenticate = (caller) => ({ ...original(caller), [field]: field === 'tenant' ? 'beta' : [] });
    const r = run(f); assert.equal(r.status, 'BLOCKED'); assert.equal(f.readCount(), 0);
    assert(!JSON.stringify(r).includes('policy-a')); assert(!r.discoveryReview);
  }
});
test('content/version/source identity mismatch halts instead of substituting evidence', () => {
  for (const change of [(f) => f.records[0].text = 'forged', (f) => f.records[0].source_version = 'v2', (f) => f.records[0].source_id = 'unknown']) {
    const f = bridgeFixture(); change(f); const r = run(f);
    assert.equal(r.status, 'BLOCKED'); assert(!r.conclusions); assert(!JSON.stringify(r).includes('forged'));
  }
});
test('changing snapshot membership or sensitivity grants blocks packet release', () => {
  for (const change of [(f) => f.records.push({ ...f.records[0], record_id: 'new-hold' }), (f) => f.context.allowed_sensitivity_tiers.add('secret')]) {
    const f = bridgeFixture(); let n = 0;
    f.deps.loadLensSnapshot = () => { if (++n === 3) change(f); return { context: f.context, records: f.records }; };
    const r = run(f); assert.equal(r.status, 'BLOCKED'); assert(!r.discoveryReview);
  }
});
test('bridge rejects duplicate record IDs, missing versions and test-only hooks', () => {
  for (const change of [(f) => f.records.push({ ...f.records[0] }), (f) => delete f.records[0].source_version, (f) => f.context.__test_injected_contaminated_records = []]) {
    const f = bridgeFixture(); change(f); assert.equal(run(f).status, 'BLOCKED');
  }
});
test('distinct verified records sharing a source preserve both supporting IDs', () => {
  const f = bridgeFixture();
  f.records.push({ ...f.records[0], record_id: 'lens-alias' });
  const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.equal(r.discoveryReview.verdict, 'EVIDENCE_SUPPORTS_PREREQUISITES');
  assert.deepEqual([...r.discoveryReview.supporting_ids].sort(), ['lens-alias', 'lens-policy-a']);
  assert.equal(f.readCount(), 2); assert.equal(r.evidenceTable.length, 1);
  assert.equal(r.executionAllowed, false);
});
test('shared-source held record and valid excerpt cannot lose the blocking ID', () => {
  const f = bridgeFixture(), excerpt = 'The review deadline';
  f.records.push({ ...f.records[0], record_id: 'lens-hold', status: 'held',
    entity_tag: 'tag://governance/release-hold/release-1',
    excerpt, excerpt_start_utf8_byte: 0, excerpt_end_utf8_byte: Buffer.byteLength(excerpt, 'utf8') });
  const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.equal(r.discoveryReview.verdict, 'BLOCKING_EVIDENCE_PRESENT');
  assert(r.discoveryReview.blocking_ids.includes('lens-hold'));
  assert.equal(f.readCount(), 2); assert.equal(r.executionAllowed, false);
});
test('shared-source conflicting versions block before payload reads', () => {
  const f = bridgeFixture();
  f.records.push({ ...f.records[0], record_id: 'lens-alias', source_version: 'v2' });
  assert.equal(run(f).status, 'BLOCKED'); assert.equal(f.readCount(), 0);
});
test('shared-source conflicting content fails closed for every record', () => {
  const f = bridgeFixture();
  f.records.push({ ...f.records[0], record_id: 'lens-alias', text: 'forged' });
  const r = run(f);
  assert.equal(r.status, 'BLOCKED'); assert(!r.discoveryReview); assert(!r.conclusions);
});
test('shared-source malformed excerpt fails closed', () => {
  const f = bridgeFixture();
  f.records.push({ ...f.records[0], record_id: 'lens-alias', excerpt: 'forged',
    excerpt_start_utf8_byte: 0, excerpt_end_utf8_byte: 6 });
  const r = run(f);
  assert.equal(r.status, 'BLOCKED'); assert(!r.discoveryReview);
});
test('shared-source unverified alias remains conflicting and foreign alias stays excluded', () => {
  const f = bridgeFixture();
  f.records.push({ ...f.records[0], record_id: 'lens-unverified', status: 'unverified' });
  f.records.push({ ...f.records[0], record_id: 'lens-foreign', environment: 'prod', source_version: 'v2' });
  const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED');
  assert.equal(r.discoveryReview.verdict, 'BLOCKING_EVIDENCE_PRESENT');
  assert(r.discoveryReview.conflicting_ids.includes('lens-unverified'));
  assert(!r.discoveryReview.conflicting_ids.includes('lens-foreign'));
  assert.equal(r.discoveryReview.supporting_ids.length, 0);
  assert.equal(r.executionAllowed, false);
});
test('global environment records remain included; foreign environment remains excluded', () => {
  const f = bridgeFixture(); f.records[0].environment = 'all'; assert.equal(run(f).status, 'REVIEW_REQUIRED');
  f.records[0].environment = 'prod'; const r = run(f);
  assert.equal(r.status, 'REVIEW_REQUIRED'); assert.equal(r.conclusions.length, 0);
  assert.equal(r.discoveryReview.verdict, 'INSUFFICIENT_EVIDENCE');
});
