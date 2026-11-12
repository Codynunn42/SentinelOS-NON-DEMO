'use strict';
const { fixture, document, NOW } = require('./fixtures');

function bridgeFixture(documents = [document()]) {
  const f = fixture(documents);
  const originalAuth = f.deps.authenticate;
  f.deps.authenticate = (caller) => {
    const v = originalAuth(caller);
    return v && { ...v, allowedSensitivityTiers: ['standard'], allowedReleases: ['release-1'],
      allowedEnvironments: ['test'], authorizedScopeIds: ['scope-1'] };
  };
  const context = {
    tenant_id: 'alpha', release_id: 'release-1', environment: 'test', evaluation_cutoff: NOW,
    trusted_scope_id: 'scope-1', corpus_version: 'corpus-1', index_version: 'index-1', policy_version: 'policy-1',
    allowed_sensitivity_tiers: new Set(['standard']),
    proposed_action: { name: 'review', target_tag: 'tag://review/v1.0', release_id: 'release-1', environment: 'test' }
  };
  const records = f.docs.map((d) => ({
    record_id: `lens-${d.id}`, source_id: d.id, source_uri: `urn:source:${d.id}`, source_version: d.version,
    tenant_id: 'alpha', release_id: 'release-1', environment: 'test', sensitivity_tier: 'standard',
    entity_tag: 'tag://review/v1.0', observed_at: '2026-11-03T00:00:00Z', status: 'fixture_verified', text: d.content
  }));
  f.deps.loadLensSnapshot = () => ({ context, records });
  return { ...f, context, records };
}
module.exports = { bridgeFixture };
