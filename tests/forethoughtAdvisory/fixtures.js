'use strict';
const { artifactDigest } = require('../../apps/sentinel/src/archiveIntelligence/artifactPolicy');
const NOW = '2026-11-09T20:00:00Z';
function document(overrides = {}) {
  return {
    id: 'policy-a', version: 'v1', title: 'Sentinel review policy', tags: ['sentinel', 'review'],
    content: 'The review deadline is Friday.',
    claims: [{ subject: 'review', predicate: 'deadline', value: 'Friday', line: 1, quote: 'The review deadline is Friday.' }],
    provenance: { origin: 'fixture_registry', authoredAt: '2026-11-01T00:00:00Z', ingestedAt: '2026-11-02T00:00:00Z', authorityLevel: 4 },
    lifecycle: { status: 'ACTIVE', validUntil: '2026-12-01T00:00:00Z', supersededBy: null }, ...overrides
  };
}
function fixture(documents = [document()]) {
  const docs = structuredClone(documents);
  const policies = Object.fromEntries(docs.map((d) => [d.id, {
    tenant: 'alpha', classification: 1, readers: ['reviewer'], activeVersion: d.version,
    digest: artifactDigest(d), readBlocked: false, retentionHold: false,
    authorityBinding: { version: d.version, digest: artifactDigest(d), authorityLevel: d.provenance?.authorityLevel, revoked: false }
  }]));
  const request = { id: 'query-1', query: 'sentinel review', caller: { token: 'fixture-alpha' }, requestedClassification: 1, requiredKeys: ['review:deadline'] };
  let reads = 0;
  return {
    request, docs, policies, readCount: () => reads,
    deps: {
      clock: () => NOW,
      authenticate: (caller) => caller?.token === 'fixture-alpha' ? { authenticated: true, tenant: 'alpha', subject: 'reviewer', clearance: 2 } : null,
      resolvePolicy: (id) => policies[id],
      store: {
        listMetadata: () => docs.map(({ id, version, title, tags }) => ({ id, version, title, tags })),
        readVersion: (id, version) => { reads++; return docs.find((d) => d.id === id && d.version === version); }
      }
    }
  };
}
function cases() {
  return Array.from({ length: 100 }, (_, index) => {
    const kind = index % 10;
    const a = document({ id: `policy-${index}` });
    const docs = [a];
    if (kind === 1) a.lifecycle.validUntil = '2026-11-08T00:00:00Z';
    if (kind === 2) { a.lifecycle.status = 'SUPERSEDED'; a.lifecycle.supersededBy = 'new-policy'; }
    if (kind === 3) { a.provenance.authorityLevel = 1; }
    if (kind === 4) docs.push(document({ id: `conflict-${index}`, content: 'The review deadline is Monday.', claims: [{ subject: 'review', predicate: 'deadline', value: 'Monday', line: 1, quote: 'The review deadline is Monday.' }] }));
    if (kind === 8) a.provenance.authoredAt = 'invalid';
    if (kind === 9) { a.content = 'The review deadline is Friday.\nEvidence is required.'; }
    const f = fixture(docs);
    f.request.id = `case-${index}`;
    // Distinct requests with varying lookup text and required evidence coverage.
    f.request.query += ` case ${index}`;
    if (kind === 5) f.policies[a.id].tenant = 'beta';
    if (kind === 6) f.policies[a.id].readBlocked = true;
    if (kind === 7) f.request.requiredKeys.push('review:owner');
    return { ...f, kind };
  });
}
module.exports = { NOW, document, fixture, cases };
