'use strict';

const crypto = require('node:crypto');

const SCHEMA_VERSION = '0.2';

const BOUNDS = {
  MAX_PACKET_BYTES: 1024 * 1024,      // 1 MiB
  MAX_RECORDS: 1000,                  // 1,000 records
  MAX_SOURCE_TEXT_BYTES: 64 * 1024,  // 64 KiB
  MAX_EXCERPT_BYTES: 4 * 1024,       // 4 KiB
  MAX_ID_TAG_LENGTH: 256
};

const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function sha256(content) {
  return crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex');
}

function normalizeText(text) {
  return String(text || '').toLowerCase().replace(/[-_]/g, ' ');
}

function parseVersions(text) {
  const norm = normalizeText(text);
  const matches = norm.match(/\bv\d+(?:\.\d+)+\b/g);
  return matches ? new Set(matches) : new Set();
}

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !RFC3339_REGEX.test(dateStr)) return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return false;
  const [, yStr, mStr, dStr, hStr, minStr, sStr] = match;
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const h = parseInt(hStr, 10);
  const min = parseInt(minStr, 10);
  const s = parseInt(sStr, 10);

  if (m < 1 || m > 12) return false;
  if (h > 23 || min > 59 || s > 59) return false;

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > daysInMonth) return false;

  return !isNaN(new Date(dateStr).getTime());
}

class DiscoveryLensCache {
  constructor() {
    this._entries = new Map();
  }

  computeKey(context, query) {
    const action = context.proposed_action || {};
    return [
      context.trusted_scope_id || '',
      context.tenant_id || '',
      context.release_id || '',
      context.environment || '',
      context.evaluation_cutoff || '',
      Array.from(context.allowed_sensitivity_tiers || []).sort().join(','),
      context.corpus_version || '',
      context.index_version || '',
      context.policy_version || '',
      normalizeText(query),
      action.name || action.action_type || '',
      action.target_tag || '',
      action.release_id || '',
      action.environment || ''
    ].join('::');
  }

  get(key) {
    return this._entries.get(key) || null;
  }

  set(key, packet) {
    this._entries.set(key, packet);
  }

  invalidate() {
    this._entries.clear();
  }
}

function normalizeProposedAction(action) {
  if (!action || typeof action !== 'object') return null;
  return {
    name: action.name || action.action_type || '',
    target_tag: action.target_tag || '',
    release_id: action.release_id || '',
    environment: action.environment || ''
  };
}

/**
 * Stage 3 Core: prepareEvidence
 */
function prepareEvidence(trustedContext, query, corpusSnapshot) {
  const tStart = process.hrtime.bigint();
  const timings = {};

  if (!trustedContext || typeof trustedContext !== 'object') {
    throw new Error('trustedContext is required and must be an object');
  }
  const {
    tenant_id,
    release_id,
    environment,
    evaluation_cutoff,
    trusted_scope_id = 'default_trusted_scope',
    corpus_version = 'corpus-v1',
    index_version = 'index-v1',
    policy_version = 'policy-v1',
    allowed_sensitivity_tiers = new Set(['standard']),
    request_id = `req-${Date.now()}`
  } = trustedContext;

  if (!Array.isArray(corpusSnapshot)) {
    return buildHaltedPacket(trustedContext, request_id, ['ERR_INVALID_CORPUS_SNAPSHOT'], { scope_filter: 0.01, invariant_gate: 0.01 });
  }

  const errorCodes = [];

  if (!isValidCalendarDate(evaluation_cutoff)) {
    errorCodes.push('ERR_INVALID_CUTOFF_TIMESTAMP');
    return buildHaltedPacket(trustedContext, request_id, errorCodes, { scope_filter: 0.01, invariant_gate: 0.01 });
  }

  if (corpusSnapshot.length > BOUNDS.MAX_RECORDS) {
    errorCodes.push('ERR_BOUNDS_MAX_RECORDS_EXCEEDED');
    return buildHaltedPacket(trustedContext, request_id, errorCodes, { scope_filter: 0.01, invariant_gate: 0.01 });
  }

  // Pre-Index duplicate record ID detection
  const seenCorpusIds = new Set();
  for (const record of corpusSnapshot) {
    if (record && record.record_id) {
      if (seenCorpusIds.has(record.record_id)) {
        errorCodes.push('ERR_DUPLICATE_RECORD_ID');
        return buildHaltedPacket(trustedContext, request_id, errorCodes, { scope_filter: 0.01, invariant_gate: 0.01 });
      }
      seenCorpusIds.add(record.record_id);
    }
  }

  const cutoffTime = new Date(evaluation_cutoff).getTime();

  // 1. Pre-Filtering Gate
  const tFilterStart = process.hrtime.bigint();
  const eligiblePool = [];

  for (const record of corpusSnapshot) {
    if (!record || !record.record_id || !record.tenant_id || typeof record.text !== 'string') {
      errorCodes.push('ERR_MALFORMED_RECORD');
      continue;
    }

    if (!isValidCalendarDate(record.observed_at)) {
      errorCodes.push('ERR_INVALID_SOURCE_TIMESTAMP');
      continue;
    }

    if (record.record_id.length > BOUNDS.MAX_ID_TAG_LENGTH || (record.entity_tag && record.entity_tag.length > BOUNDS.MAX_ID_TAG_LENGTH)) {
      errorCodes.push('ERR_BOUNDS_ID_TOO_LONG');
      continue;
    }

    if (record.tenant_id !== tenant_id) continue;
    if (record.environment !== environment && record.environment !== 'all') continue;
    if (!allowed_sensitivity_tiers.has(record.sensitivity_tier)) continue;

    const observedTime = new Date(record.observed_at).getTime();
    if (observedTime > cutoffTime) continue;

    eligiblePool.push(record);
  }
  timings.scope_filter = Number(process.hrtime.bigint() - tFilterStart) / 1e6;

  // 2. Post-Filter Contamination Injection Hook
  if (trustedContext.__test_injected_contaminated_records) {
    for (const injected of trustedContext.__test_injected_contaminated_records) {
      eligiblePool.push(injected);
    }
  }

  const tGateStart = process.hrtime.bigint();
  for (const record of eligiblePool) {
    if (record.tenant_id !== tenant_id) {
      errorCodes.push('ERR_CONTAMINATED_PARTITION');
    }
    if (record.text && Buffer.byteLength(record.text, 'utf8') > BOUNDS.MAX_SOURCE_TEXT_BYTES) {
      errorCodes.push('ERR_BOUNDS_SOURCE_TOO_LARGE');
    }
  }

  if (eligiblePool.length > BOUNDS.MAX_RECORDS) {
    errorCodes.push('ERR_BOUNDS_MAX_RECORDS_EXCEEDED');
  }

  if (errorCodes.length > 0) {
    timings.invariant_gate = Number(process.hrtime.bigint() - tGateStart) / 1e6;
    return buildHaltedPacket(trustedContext, request_id, Array.from(new Set(errorCodes)), timings);
  }

  // 3. Hold Channel Failure Simulation Hook
  if (trustedContext.__test_simulate_hold_channel_failure) {
    timings.invariant_gate = Number(process.hrtime.bigint() - tGateStart) / 1e6;
    return {
      schema_version: SCHEMA_VERSION,
      request_id,
      tenant_id,
      release_id,
      environment,
      evaluation_cutoff,
      trusted_scope_id,
      corpus_version,
      index_version,
      policy_version,
      retrieval_status: 'insufficient',
      records: [],
      governance_holds: [],
      action_review: {
        verdict: 'INSUFFICIENT_EVIDENCE',
        supporting_ids: [],
        blocking_ids: [],
        conflicting_ids: [],
        missing_requirements: ['governance hold channel availability'],
        rationale: 'Hold retrieval channel failed or truncated; prerequisite support forbidden.',
        next_evidence_request: 'Restore governance hold channel connectivity.',
        authorization_evidenced: false,
        execution_allowed: false
      },
      proposed_action: normalizeProposedAction(trustedContext.proposed_action),
      error_codes: ['ERR_HOLD_CHANNEL_FAILURE'],
      timings_ms: { scope_filter: timings.scope_filter, retrieve: 0.01, invariant_gate: 0.01 }
    };
  }

  // 4. Dual-Channel Indexing (Indexes both release-level and component-level holds)
  const tRetrieveStart = process.hrtime.bigint();
  const entityTagIndex = new Map();
  const governanceHolds = [];

  for (const record of eligiblePool) {
    if (record.entity_tag) {
      if (!entityTagIndex.has(record.entity_tag)) {
        entityTagIndex.set(record.entity_tag, []);
      }
      entityTagIndex.get(record.entity_tag).push(record);
    }
    // All held records in scope are indexed into governance holds
    if (record.status === 'held') {
      const isReleaseWide = record.entity_tag.startsWith('tag://governance/release-hold/');
      governanceHolds.push({
        record_id: record.record_id,
        record: record,
        release_id: record.release_id,
        environment: record.environment,
        target_tags: isReleaseWide ? [] : [record.entity_tag]
      });
    }
  }

  // 5. Query / Action Parsing & Routing
  const normQuery = normalizeText(query);
  const queryVersions = parseVersions(query);
  const targetVer = queryVersions.size > 0 ? Array.from(queryVersions)[0] : null;

  const rawAction = trustedContext.proposed_action || null;
  const proposedAction = normalizeProposedAction(rawAction);
  let queryActionConflict = false;
  let useTagShortcut = false;

  if (proposedAction && proposedAction.target_tag) {
    const actionVersions = parseVersions(proposedAction.target_tag);
    const actionVer = actionVersions.size > 0 ? Array.from(actionVersions)[0] : null;

    if (targetVer && actionVer && targetVer !== actionVer) {
      queryActionConflict = true;
      useTagShortcut = false;
    } else {
      useTagShortcut = true;
    }
  }

  let ch1Records = [];
  if (useTagShortcut && proposedAction) {
    ch1Records = entityTagIndex.get(proposedAction.target_tag) || [];
  } else {
    ch1Records = eligiblePool.filter(r => {
      const rNorm = normalizeText(r.text);
      if (targetVer) {
        const rVers = parseVersions(r.text);
        if (!rVers.has(targetVer)) return false;
      }
      return normQuery.split(/\s+/).some(term => term.length > 2 && rNorm.includes(term));
    });
  }

  // Channel 2 Retrieval: Holds matching scope release and environment
  const applicableHolds = governanceHolds.filter(h => {
    if (h.release_id !== release_id) return false;
    if (h.environment !== 'all' && h.environment !== environment) return false;
    if (h.target_tags && h.target_tags.length > 0 && proposedAction) {
      return h.target_tags.includes(proposedAction.target_tag);
    }
    return true;
  });

  const seenIds = new Set();
  const retrievedRecords = [];
  const holdRecords = applicableHolds.map(h => h.record);

  for (const r of [...ch1Records, ...holdRecords]) {
    if (!seenIds.has(r.record_id)) {
      seenIds.add(r.record_id);
      retrievedRecords.push(r);
    }
  }
  timings.retrieve = Number(process.hrtime.bigint() - tRetrieveStart) / 1e6;

  // 6. Source Excerpt & Digest Verification
  const tPostGateStart = process.hrtime.bigint();
  for (const r of retrievedRecords) {
    const computedDigest = sha256(r.text);
    if (r.content_sha256 && r.content_sha256 !== computedDigest) {
      errorCodes.push('ERR_SOURCE_INTEGRITY_TAMPER');
    }

    const excerpt = r.excerpt === undefined ? r.text : r.excerpt;
    if (typeof excerpt !== 'string') {
      errorCodes.push('ERR_INVALID_EXCERPT');
    } else if (Buffer.byteLength(excerpt, 'utf8') > BOUNDS.MAX_EXCERPT_BYTES) {
      errorCodes.push('ERR_BOUNDS_EXCERPT_TOO_LARGE');
    }

    if (excerpt && r.excerpt_start_utf8_byte !== undefined && r.excerpt_end_utf8_byte !== undefined) {
      const textBuf = Buffer.from(r.text, 'utf8');
      const start = r.excerpt_start_utf8_byte;
      const end = r.excerpt_end_utf8_byte;
      const excerptBytes = Buffer.byteLength(excerpt, 'utf8');

      if (start < 0 || end > textBuf.length || (end - start) !== excerptBytes) {
        errorCodes.push('ERR_INVALID_BYTE_OFFSETS');
      } else {
        const sliced = textBuf.subarray(start, end).toString('utf8');
        if (sliced !== excerpt) {
          errorCodes.push('ERR_EXCERPT_MISMATCH');
        }
      }
    }
  }

  if (errorCodes.length > 0) {
    timings.invariant_gate = Number(process.hrtime.bigint() - tPostGateStart) / 1e6;
    return buildHaltedPacket(trustedContext, request_id, Array.from(new Set(errorCodes)), timings);
  }
  timings.invariant_gate = Number(process.hrtime.bigint() - tPostGateStart) / 1e6;

  // 7. Action Review Evaluation
  let actionReview = null;
  let retrievalStatus = 'complete';

  if (proposedAction) {
    actionReview = evaluateProposedAction(
      proposedAction,
      release_id,
      environment,
      retrievedRecords,
      applicableHolds,
      queryActionConflict
    );
    if (actionReview.verdict === 'INSUFFICIENT_EVIDENCE') {
      retrievalStatus = 'insufficient';
    }
  } else {
    const scopeBlockingIds = applicableHolds.map(h => h.record_id);
    if (scopeBlockingIds.length > 0) {
      actionReview = {
        verdict: 'BLOCKING_EVIDENCE_PRESENT',
        supporting_ids: [],
        blocking_ids: scopeBlockingIds,
        conflicting_ids: [],
        missing_requirements: [],
        rationale: 'Active release hold present in scope; no action declared.',
        next_evidence_request: 'Declare proposed action and resolve active holds.',
        authorization_evidenced: false,
        execution_allowed: false
      };
      retrievalStatus = 'insufficient';
    } else {
      actionReview = {
        verdict: 'INSUFFICIENT_EVIDENCE',
        supporting_ids: [],
        blocking_ids: [],
        conflicting_ids: [],
        missing_requirements: ['declared proposed action'],
        rationale: 'No proposed action declared for evaluation.',
        next_evidence_request: 'Declare a proposed action to evaluate evidence against.',
        authorization_evidenced: false,
        execution_allowed: false
      };
      retrievalStatus = 'insufficient';
    }
  }

  const formattedRecords = retrievedRecords.map(r => formatSourceRecord(r));
  const formattedHolds = applicableHolds.map(h => ({
    record_id: h.record_id,
    applies_to: {
      release_id: h.release_id,
      environment: h.environment,
      target_tags: h.target_tags || []
    }
  }));

  const packet = {
    schema_version: SCHEMA_VERSION,
    request_id,
    tenant_id,
    release_id,
    environment,
    evaluation_cutoff,
    trusted_scope_id,
    corpus_version,
    index_version,
    policy_version,
    retrieval_status: retrievalStatus,
    records: formattedRecords,
    governance_holds: formattedHolds,
    action_review: actionReview,
    proposed_action: proposedAction,
    error_codes: errorCodes,
    timings_ms: timings
  };

  const packetPayloadBytes = Buffer.byteLength(JSON.stringify(packet), 'utf8');
  if (packetPayloadBytes > BOUNDS.MAX_PACKET_BYTES) {
    return buildHaltedPacket(trustedContext, request_id, ['ERR_BOUNDS_PACKET_TOO_LARGE'], timings);
  }

  return packet;
}

function evaluateProposedAction(action, scopeRelease, scopeEnv, records, holds, hasConflict) {
  if (hasConflict) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      supporting_ids: [],
      blocking_ids: [],
      conflicting_ids: [],
      missing_requirements: ['resolution of query-action target conflict'],
      rationale: 'Query target version contradicts declared action target entity.',
      next_evidence_request: 'Align query constraints with proposed target.',
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  if (action.release_id !== scopeRelease) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      supporting_ids: [],
      blocking_ids: [],
      conflicting_ids: [],
      missing_requirements: [`evidence matching release ${action.release_id}`],
      rationale: `Action release ${action.release_id} does not match active scope ${scopeRelease}.`,
      next_evidence_request: `Provide evidence for ${action.release_id}.`,
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  if (action.environment !== scopeEnv) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      supporting_ids: [],
      blocking_ids: [],
      conflicting_ids: [],
      missing_requirements: [`action environment ${action.environment} matching scope environment ${scopeEnv}`],
      rationale: `Action declared for ${action.environment} outside active ${scopeEnv} scope.`,
      next_evidence_request: `Execute in trusted scope ${action.environment}.`,
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  const scopeBlockingIds = holds.map(h => h.record_id);
  const targetRecords = records.filter(r => r.entity_tag === action.target_tag && r.release_id === scopeRelease);
  const targetBlockingIds = targetRecords.filter(r => r.status === 'held').map(r => r.record_id);
  const conflictingIds = targetRecords.filter(r => r.status === 'unverified').map(r => r.record_id);

  const allBlockingIds = Array.from(new Set([...scopeBlockingIds, ...targetBlockingIds]));

  if (allBlockingIds.length > 0) {
    return {
      verdict: 'BLOCKING_EVIDENCE_PRESENT',
      supporting_ids: [],
      blocking_ids: allBlockingIds,
      conflicting_ids: conflictingIds,
      missing_requirements: [],
      rationale: 'Active release hold or target-level failure is present.',
      next_evidence_request: 'Resolve outstanding hold/rollback condition.',
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  if (conflictingIds.length > 0) {
    return {
      verdict: 'BLOCKING_EVIDENCE_PRESENT',
      supporting_ids: [],
      blocking_ids: [],
      conflicting_ids: conflictingIds,
      missing_requirements: [],
      rationale: 'Unresolved contrary or unverified claims present on target component; prerequisite support forbidden.',
      next_evidence_request: 'Resolve conflicting or unverified claims on target.',
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  const supportingIds = targetRecords
    .filter(r => r.status === 'fixture_verified' && (r.environment === action.environment || r.environment === 'all'))
    .map(r => r.record_id);

  if (supportingIds.length > 0) {
    return {
      verdict: 'EVIDENCE_SUPPORTS_PREREQUISITES',
      supporting_ids: supportingIds,
      blocking_ids: [],
      conflicting_ids: [],
      missing_requirements: [],
      rationale: 'All declared action prerequisites satisfied by attributable fixture evidence.',
      next_evidence_request: 'Submit for authorized review.',
      authorization_evidenced: false,
      execution_allowed: false
    };
  }

  return {
    verdict: 'INSUFFICIENT_EVIDENCE',
    supporting_ids: [],
    blocking_ids: [],
    conflicting_ids: [],
    missing_requirements: [`valid verified evidence for ${action.target_tag} in ${action.environment}`],
    rationale: `Target evidence missing or environment incompatible (requires ${action.environment}).`,
    next_evidence_request: `Collect attributable pass record for ${action.target_tag} in ${action.environment}.`,
    authorization_evidenced: false,
    execution_allowed: false
  };
}

function formatSourceRecord(r) {
  const excerpt = r.excerpt !== undefined ? r.excerpt : r.text;
  const excerptBytes = Buffer.byteLength(excerpt, 'utf8');
  return {
    record_id: r.record_id,
    source_id: r.source_id || r.record_id,
    source_uri: r.source_uri || `urn:source:${r.record_id}`,
    source_version: r.source_version || '1.0',
    tenant_id: r.tenant_id,
    release_id: r.release_id,
    environment: r.environment,
    sensitivity_tier: r.sensitivity_tier,
    entity_tag: r.entity_tag,
    observed_at: r.observed_at,
    status: r.status,
    content_sha256: r.content_sha256 || sha256(r.text),
    excerpt: excerpt,
    excerpt_start_utf8_byte: r.excerpt_start_utf8_byte !== undefined ? r.excerpt_start_utf8_byte : 0,
    excerpt_end_utf8_byte: r.excerpt_end_utf8_byte !== undefined ? r.excerpt_end_utf8_byte : excerptBytes
  };
}

function buildHaltedPacket(context, requestId, errorCodes, timings) {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    tenant_id: context.tenant_id || 'unknown',
    release_id: context.release_id || 'unknown',
    environment: context.environment || 'unknown',
    evaluation_cutoff: context.evaluation_cutoff || new Date().toISOString(),
    trusted_scope_id: context.trusted_scope_id || 'default_scope',
    corpus_version: context.corpus_version || 'v1',
    index_version: context.index_version || 'v1',
    policy_version: context.policy_version || 'v1',
    retrieval_status: 'halted',
    records: [],
    governance_holds: [],
    action_review: null,
    proposed_action: normalizeProposedAction(context.proposed_action),
    error_codes: errorCodes,
    timings_ms: timings
  };
}

module.exports = {
  prepareEvidence,
  DiscoveryLensCache,
  sha256,
  isValidCalendarDate,
  normalizeProposedAction,
  BOUNDS,
  RFC3339_REGEX
};
