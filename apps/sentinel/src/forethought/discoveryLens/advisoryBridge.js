'use strict';

const { prepareEvidence, BOUNDS } = require('./discoveryLensCore');
const { interpretEvidence } = require('./forethoughtAdapter');
const { evaluateForethought } = require('../interpretation');
const { runAdvisoryJob, snapshot } = require('../advisoryJob');

function blocked() { throw new Error('Discovery/advisory integration validation failed'); }

/**
 * Isolated, synchronous integration entry point, not an API or live adapter.
 * authenticate, resolvePolicy, loadLensSnapshot, store and clock are trusted
 * operator-installed adapters. Request fields never populate those adapters.
 * Lens source text comes only from artifacts that have passed C4 read checks.
 */
function runDiscoveryAdvisoryJob(request, deps) {
  let boundSnapshot;
  let scopedRecords;
  let context;
  function load() {
    const value = deps.loadLensSnapshot();
    if (!value || !value.context || !Array.isArray(value.records)) blocked();
    if (value.records.length > BOUNDS.MAX_RECORDS) blocked();
    if (Object.keys(value.context).some((key) => key.startsWith('__test'))) blocked();
    const clone = structuredClone(value);
    if (!(clone.context.allowed_sensitivity_tiers instanceof Set) || !clone.context.allowed_sensitivity_tiers.size) blocked();
    for (const key of ['tenant_id', 'release_id', 'environment', 'trusted_scope_id', 'evaluation_cutoff', 'corpus_version', 'index_version', 'policy_version']) {
      if (typeof clone.context[key] !== 'string' || !clone.context[key]) blocked();
    }
    const seen = new Set();
    for (const record of clone.records) {
      if (typeof record?.record_id !== 'string' || !record.record_id || seen.has(record.record_id) ||
        typeof record.source_id !== 'string' || !record.source_id ||
        typeof record.source_version !== 'string' || !record.source_version ||
        typeof record.entity_tag !== 'string' || typeof record.text !== 'string') blocked();
      seen.add(record.record_id);
    }
    return clone;
  }
  // Set members are serialized explicitly: JSON.stringify(Set) alone loses them.
  const identity = (value) => JSON.stringify({ ...value, context: {
    ...value.context, allowed_sensitivity_tiers: [...value.context.allowed_sensitivity_tiers].sort()
  } });
  const authenticate = (caller) => {
    const verified = deps.authenticate(caller);
    if (!verified || !context || verified.tenant !== context.tenant_id ||
      !Array.isArray(verified.allowedSensitivityTiers) ||
      [...context.allowed_sensitivity_tiers].some((tier) => !verified.allowedSensitivityTiers.includes(tier)) ||
      !verified.allowedReleases?.includes(context.release_id) ||
      !verified.allowedEnvironments?.includes(context.environment) ||
      !verified.authorizedScopeIds?.includes(context.trusted_scope_id)) return null;
    return verified;
  };

  return runAdvisoryJob(request, {
    ...deps, authenticate,
    discoverCandidates: () => {
      boundSnapshot = load();
      context = { ...boundSnapshot.context, request_id: request.id };
      // Preserve the complete in-scope roster, including records that do not
      // match query words. Discovery Lens's separate hold channel needs them.
      scopedRecords = boundSnapshot.records.filter((record) => record.tenant_id === context.tenant_id &&
        record.release_id === context.release_id &&
        (record.environment === context.environment || record.environment === 'all') &&
        context.allowed_sensitivity_tiers.has(record.sensitivity_tier));
      const metadata = deps.store.listMetadata();
      if (!Array.isArray(metadata) || metadata.length > BOUNDS.MAX_RECORDS) blocked();
      const unique = new Set();
      for (const item of metadata) {
        if (!item || typeof item.id !== 'string' || unique.has(item.id)) blocked();
        unique.add(item.id);
      }
      const sources = new Map();
      const candidates = [];
      for (const record of scopedRecords) {
        const prior = sources.get(record.source_id);
        if (prior) {
          if (prior.source_version !== record.source_version || prior.text !== record.text) blocked();
          continue;
        }
        sources.set(record.source_id, record);
        const item = metadata.find((m) => m.id === record.source_id && m.version === record.source_version);
        if (!item) blocked();
        candidates.push(item);
      }
      return candidates;
    },
    selectEvidence: (ctx) => {
      // A changing roster/policy snapshot requires a new complete job, never
      // silent mixing of versions during synthesis or packet release.
      if (identity(load()) !== identity(boundSnapshot)) blocked();
      const records = scopedRecords.map((record) => {
        const entry = ctx.evidence.find((e) => e.artifact.id === record.source_id && e.artifact.version === record.source_version);
        if (!entry || entry.artifact.content !== record.text) blocked();
        return record;
      });
      const packet = prepareEvidence(context, ctx.request.query, records);
      const checked = interpretEvidence({ learningState: {
        state: 'unknown', actionGate: 'human_review_required', requiresApproval: true,
        reason: 'Discovery evidence remains advisory.'
      } }, {}, packet, evaluateForethought, context, records);
      if (checked.halted || !checked.evidenceReview) blocked();
      const selected = new Set(packet.records.map((r) => r.source_id));
      const evidence = ctx.evidence.filter((entry) => selected.has(entry.artifact.id));
      let review = checked.evidenceReview;
      // fixture_verified is not freshness/current-authority verification.
      // Stale or untrusted supporting records must not support prerequisites.
      if (review.verdict === 'EVIDENCE_SUPPORTS_PREREQUISITES' && review.supporting_ids.some((id) => {
        const record = records.find((r) => r.record_id === id);
        return !evidence.some((e) => e.artifact.id === record?.source_id && e.evaluation.slot === 'CURRENT_AUTHORITY');
      })) review = {
        ...review, verdict: 'INSUFFICIENT_EVIDENCE', supporting_ids: [],
        missing_requirements: ['current trusted authority for supporting evidence'],
        rationale: 'Fixture support status cannot override lifecycle or authority validation.',
        next_evidence_request: 'Request current trusted evidence before reviewing prerequisites.'
      };
      return snapshot({ ...ctx, evidence, discoveryReview: review });
    }
  });
}

module.exports = { runDiscoveryAdvisoryJob };
