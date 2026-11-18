'use strict';

const crypto = require('node:crypto');

const BOUNDS = {
  MAX_PACKET_BYTES: 1024 * 1024,
  MAX_RECORDS: 1000,
  MAX_EXCERPT_BYTES: 4 * 1024
};

const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const ENVELOPE_KEYS = new Set([
  'schema_version', 'request_id', 'tenant_id', 'release_id', 'environment',
  'evaluation_cutoff', 'trusted_scope_id', 'corpus_version', 'index_version',
  'policy_version', 'retrieval_status', 'records', 'governance_holds',
  'action_review', 'proposed_action', 'error_codes', 'timings_ms'
]);

const RECORD_KEYS = new Set([
  'record_id', 'source_id', 'source_uri', 'source_version', 'tenant_id',
  'release_id', 'environment', 'sensitivity_tier', 'entity_tag', 'observed_at',
  'status', 'content_sha256', 'excerpt', 'excerpt_start_utf8_byte', 'excerpt_end_utf8_byte'
]);

const HOLD_KEYS = new Set(['record_id', 'applies_to']);
const APPLIES_TO_KEYS = new Set(['release_id', 'environment', 'target_tags']);

const REVIEW_KEYS = new Set([
  'verdict', 'supporting_ids', 'blocking_ids', 'conflicting_ids',
  'missing_requirements', 'rationale', 'next_evidence_request',
  'authorization_evidenced', 'execution_allowed'
]);

const PROPOSED_ACTION_KEYS = new Set(['name', 'target_tag', 'release_id', 'environment']);

function sha256(content) {
  return crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex');
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
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

/**
 * Full Schema v0.2, Closed-Object, and Trusted Snapshot Invariant Validation.
 */
function validatePacketInvariants(packet, trustedContext, trustedCorpusSnapshot) {
  const errors = [];

  // 1. Mandatory Trust Inputs
  if (!trustedContext || typeof trustedContext !== 'object') {
    return { valid: false, halted: true, errors: ['ERR_MISSING_TRUSTED_CONTEXT'] };
  }
  if (!trustedCorpusSnapshot || !Array.isArray(trustedCorpusSnapshot)) {
    return { valid: false, halted: true, errors: ['ERR_MISSING_TRUSTED_SNAPSHOT'] };
  }

  // 2. Top-level object & closed schema check
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    return { valid: false, halted: true, errors: ['ERR_PACKET_NOT_OBJECT'] };
  }

  for (const k of Object.keys(packet)) {
    if (!ENVELOPE_KEYS.has(k)) {
      errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_${k}`);
    }
  }

  for (const reqField of ENVELOPE_KEYS) {
    if (packet[reqField] === undefined) {
      errors.push(`ERR_MISSING_FIELD_${reqField}`);
    }
  }

  if (packet.schema_version !== '0.2') {
    errors.push('ERR_UNSUPPORTED_SCHEMA_VERSION');
  }

  const VALID_STATUSES = new Set(['complete', 'insufficient', 'halted']);
  if (!VALID_STATUSES.has(packet.retrieval_status)) {
    errors.push('ERR_INVALID_RETRIEVAL_STATUS');
  }

  if (!isValidCalendarDate(packet.evaluation_cutoff)) {
    errors.push('ERR_INVALID_CUTOFF_TIMESTAMP');
  }

  const isRecordsArray = Array.isArray(packet.records);
  const isHoldsArray = Array.isArray(packet.governance_holds);

  if (!isRecordsArray || !isHoldsArray) {
    errors.push('ERR_MALFORMED_ARRAYS');
  }

  if (Buffer.byteLength(JSON.stringify(packet), 'utf8') > BOUNDS.MAX_PACKET_BYTES) {
    errors.push('ERR_BOUNDS_PACKET_TOO_LARGE');
  }
  if (isRecordsArray && packet.records.length > BOUNDS.MAX_RECORDS) {
    errors.push('ERR_BOUNDS_MAX_RECORDS_EXCEEDED');
  }

  if (!isRecordsArray || !isHoldsArray) {
    return { valid: false, halted: true, errors: Array.from(new Set(errors)) };
  }

  // Schema v0.2 Halted State Check
  if (packet.retrieval_status === 'halted') {
    if ((isRecordsArray && packet.records.length > 0) || (isHoldsArray && packet.governance_holds.length > 0) || packet.action_review !== null) {
      errors.push('ERR_HALTED_PACKET_NON_EMPTY');
    }
    return { valid: false, halted: true, errors: errors.length > 0 ? Array.from(new Set(errors)) : (packet.error_codes || ['ERR_RETRIEVAL_HALTED']) };
  }

  // Schema v0.2 AllOf Check: complete/insufficient must carry non-null action_review object
  if (packet.action_review === null || packet.action_review === undefined || typeof packet.action_review !== 'object' || Array.isArray(packet.action_review)) {
    errors.push('ERR_MISSING_ACTION_REVIEW');
  }

  // 3. Trusted Context Scope & Version Reconciliations
  if (packet.tenant_id !== trustedContext.tenant_id) errors.push('ERR_SCOPE_TENANT_MISMATCH');
  if (packet.release_id !== trustedContext.release_id) errors.push('ERR_SCOPE_RELEASE_MISMATCH');
  if (packet.environment !== trustedContext.environment) errors.push('ERR_SCOPE_ENV_MISMATCH');
  if (packet.evaluation_cutoff !== trustedContext.evaluation_cutoff) errors.push('ERR_SCOPE_CUTOFF_MISMATCH');
  if (trustedContext.trusted_scope_id && packet.trusted_scope_id !== trustedContext.trusted_scope_id) {
    errors.push('ERR_SCOPE_ID_MISMATCH');
  }
  if (trustedContext.corpus_version && packet.corpus_version !== trustedContext.corpus_version) {
    errors.push('ERR_CORPUS_VERSION_MISMATCH');
  }
  if (trustedContext.index_version && packet.index_version !== trustedContext.index_version) {
    errors.push('ERR_INDEX_VERSION_MISMATCH');
  }
  if (trustedContext.policy_version && packet.policy_version !== trustedContext.policy_version) {
    errors.push('ERR_POLICY_VERSION_MISMATCH');
  }

  // Proposed Action Reconciliation & Closed Schema Validation
  const pAction = packet.proposed_action;
  const tAction = trustedContext.proposed_action;
  if (tAction) {
    const tName = tAction.name || tAction.action_type || '';
    const pName = pAction ? (pAction.name || pAction.action_type || '') : '';
    if (!pAction || pName !== tName || pAction.target_tag !== tAction.target_tag || pAction.release_id !== tAction.release_id || pAction.environment !== tAction.environment) {
      errors.push('ERR_PROPOSED_ACTION_MISMATCH');
    }
  } else if (pAction !== null) {
    errors.push('ERR_PROPOSED_ACTION_WITHOUT_TRUSTED_ACTION');
  }
  if (pAction && typeof pAction === 'object' && !Array.isArray(pAction)) {
    for (const ak of Object.keys(pAction)) {
      if (!PROPOSED_ACTION_KEYS.has(ak)) {
        errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_PROPOSED_ACTION_${ak}`);
      }
    }
  } else if (pAction !== null) {
    errors.push('ERR_MALFORMED_PROPOSED_ACTION');
  }

  const snapshotMap = new Map();
  for (const record of trustedCorpusSnapshot) {
    if (!record || typeof record !== 'object' || Array.isArray(record) ||
        typeof record.record_id !== 'string' || !record.record_id ||
        typeof record.text !== 'string') {
      errors.push('ERR_MALFORMED_TRUSTED_RECORD');
      continue;
    }
    if (snapshotMap.has(record.record_id)) {
      errors.push(`ERR_DUPLICATE_TRUSTED_RECORD_ID_${record.record_id}`);
      continue;
    }
    snapshotMap.set(record.record_id, record);
  }
  if (errors.some(error => error === 'ERR_MALFORMED_TRUSTED_RECORD' || error.startsWith('ERR_DUPLICATE_TRUSTED_RECORD_ID_'))) {
    return { valid: false, halted: true, errors: Array.from(new Set(errors)) };
  }
  const validRecordIds = new Set();
  const recordStatusMap = new Map();
  const recordTagMap = new Map();
  const recordEnvMap = new Map();
  const cutoffTime = isValidCalendarDate(packet.evaluation_cutoff) ? new Date(packet.evaluation_cutoff).getTime() : 0;

  if (isRecordsArray) {
    for (const r of packet.records) {
      if (!r || typeof r !== 'object' || Array.isArray(r)) {
        errors.push('ERR_MALFORMED_RECORD_ITEM');
        continue;
      }

      for (const rk of Object.keys(r)) {
        if (!RECORD_KEYS.has(rk)) {
          errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_RECORD_${rk}`);
        }
      }

      for (const reqRecField of RECORD_KEYS) {
        if (r[reqRecField] === undefined) {
          errors.push(`ERR_MISSING_RECORD_FIELD_${reqRecField}`);
        }
      }

      if (typeof r.excerpt !== 'string') {
        errors.push(`ERR_INVALID_EXCERPT_${r.record_id}`);
      } else if (Buffer.byteLength(r.excerpt, 'utf8') > BOUNDS.MAX_EXCERPT_BYTES) {
        errors.push(`ERR_BOUNDS_EXCERPT_TOO_LARGE_${r.record_id}`);
      }

      if (validRecordIds.has(r.record_id)) {
        errors.push(`ERR_DUPLICATE_RECORD_ID_${r.record_id}`);
      }

      if (r.tenant_id !== packet.tenant_id) {
        errors.push('ERR_CROSS_TENANT_RECORD_IN_PACKET');
      }
      if (r.release_id !== packet.release_id) {
        errors.push('ERR_CROSS_RELEASE_RECORD_IN_PACKET');
      }
      if (r.environment !== trustedContext.environment && r.environment !== 'all') {
        errors.push(`ERR_CROSS_ENVIRONMENT_RECORD_${r.record_id}`);
      }

      if (trustedContext.allowed_sensitivity_tiers && !trustedContext.allowed_sensitivity_tiers.has(r.sensitivity_tier)) {
        errors.push(`ERR_UNAUTHORIZED_SENSITIVITY_${r.record_id}`);
      }

      if (!isValidCalendarDate(r.observed_at)) {
        errors.push(`ERR_INVALID_SOURCE_TIMESTAMP_${r.record_id}`);
      } else {
        const obsTime = new Date(r.observed_at).getTime();
        if (obsTime > cutoffTime) {
          errors.push(`ERR_FUTURE_RECORD_PAST_CUTOFF_${r.record_id}`);
        }
      }

      // Strict provenance against trusted snapshot
      const trusted = snapshotMap.get(r.record_id);
      if (!trusted) {
        errors.push(`ERR_UNVERIFIED_SOURCE_RECORD_${r.record_id}`);
      } else {
        if (trusted.tenant_id !== packet.tenant_id || r.tenant_id !== trusted.tenant_id) {
          errors.push(`ERR_TENANT_TAMPER_${r.record_id}`);
        }
        if (r.release_id !== trusted.release_id) {
          errors.push(`ERR_RELEASE_TAMPER_${r.record_id}`);
        }
        if (r.environment !== trusted.environment) {
          errors.push(`ERR_ENVIRONMENT_TAMPER_${r.record_id}`);
        }
        if (r.sensitivity_tier !== trusted.sensitivity_tier) {
          errors.push(`ERR_SENSITIVITY_TAMPER_${r.record_id}`);
        }
        if (r.entity_tag !== trusted.entity_tag) {
          errors.push(`ERR_ENTITY_TAG_TAMPER_${r.record_id}`);
        }
        if (r.observed_at !== trusted.observed_at) {
          errors.push(`ERR_OBSERVED_AT_TAMPER_${r.record_id}`);
        }
        const expectedUri = trusted.source_uri || `urn:source:${trusted.record_id}`;
        if (r.source_uri !== expectedUri) {
          errors.push(`ERR_SOURCE_URI_TAMPER_${r.record_id}`);
        }
        const expectedSourceId = trusted.source_id || trusted.record_id;
        if (r.source_id !== expectedSourceId) {
          errors.push(`ERR_SOURCE_ID_TAMPER_${r.record_id}`);
        }
        const expectedVersion = trusted.source_version || '1.0';
        if (r.source_version !== expectedVersion) {
          errors.push(`ERR_SOURCE_VERSION_TAMPER_${r.record_id}`);
        }
        if (r.status !== trusted.status) {
          errors.push(`ERR_STATUS_TAMPER_${r.record_id}`);
        }

        const expectedDigest = sha256(trusted.text);
        if (r.content_sha256 !== expectedDigest) {
          errors.push(`ERR_DIGEST_MISMATCH_${r.record_id}`);
        }

        if (r.excerpt_start_utf8_byte !== undefined && r.excerpt_end_utf8_byte !== undefined) {
          const textBuf = Buffer.from(trusted.text, 'utf8');
          const start = r.excerpt_start_utf8_byte;
          const end = r.excerpt_end_utf8_byte;
          const excerptBytes = Buffer.byteLength(r.excerpt || '', 'utf8');

          if (start < 0 || end > textBuf.length || (end - start) !== excerptBytes) {
            errors.push(`ERR_BYTE_OFFSETS_INVALID_${r.record_id}`);
          }
          if (start >= 0 && end <= textBuf.length) {
            const sliced = textBuf.subarray(start, end).toString('utf8');
            if (sliced !== r.excerpt) {
              errors.push(`ERR_EXCERPT_MISMATCH_${r.record_id}`);
            }
          }
        }
      }

      validRecordIds.add(r.record_id);
      recordStatusMap.set(r.record_id, r.status);
      recordTagMap.set(r.record_id, r.entity_tag);
      recordEnvMap.set(r.record_id, r.environment);
    }
  }

  // Governance Holds Validation
  if (isHoldsArray) {
    for (const h of packet.governance_holds) {
      if (!h || typeof h !== 'object' || Array.isArray(h)) {
        errors.push('ERR_MALFORMED_HOLD_ITEM');
        continue;
      }
      for (const hk of Object.keys(h)) {
        if (!HOLD_KEYS.has(hk)) {
          errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_HOLD_${hk}`);
        }
      }
      if (!h.record_id || !h.applies_to || typeof h.applies_to !== 'object' || Array.isArray(h.applies_to)) {
        errors.push('ERR_MALFORMED_HOLD_FIELDS');
        continue;
      }
      for (const atk of Object.keys(h.applies_to)) {
        if (!APPLIES_TO_KEYS.has(atk)) {
          errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_APPLIES_TO_${atk}`);
        }
      }
      if (!h.applies_to.release_id || !h.applies_to.environment || !Array.isArray(h.applies_to.target_tags)) {
        errors.push('ERR_MALFORMED_APPLIES_TO_FIELDS');
      }
      if (!validRecordIds.has(h.record_id)) {
        errors.push(`ERR_HOLD_REFERENCES_MISSING_RECORD_${h.record_id}`);
      }
    }
  }

  // Complete Applicable-Hold Verification (Both release-wide and target-component holds)
  const proposedAction = trustedContext.proposed_action || null;
  const targetTag = proposedAction ? (proposedAction.target_tag || '') : '';

  for (const tr of trustedCorpusSnapshot) {
    if (tr.tenant_id === packet.tenant_id &&
        tr.release_id === packet.release_id &&
        (tr.environment === 'all' || tr.environment === packet.environment) &&
        tr.status === 'held' &&
        isValidCalendarDate(tr.observed_at) &&
        new Date(tr.observed_at).getTime() <= cutoffTime) {
      
      const isReleaseWide = tr.entity_tag && tr.entity_tag.startsWith('tag://governance/release-hold/');
      const isTargetHold = Boolean(targetTag && tr.entity_tag === targetTag);

      if (isReleaseWide || isTargetHold) {
        const packetHoldIds = new Set((packet.governance_holds || []).map(h => h.record_id));
        if (!packetHoldIds.has(tr.record_id)) {
          errors.push(`ERR_OMITTED_APPLICABLE_HOLD_${tr.record_id}`);
        }
      }
    }
  }

  // Action review invariants
  if (packet.action_review && typeof packet.action_review === 'object' && !Array.isArray(packet.action_review)) {
    const ar = packet.action_review;
    for (const rvk of Object.keys(ar)) {
      if (!REVIEW_KEYS.has(rvk)) {
        errors.push(`ERR_SCHEMA_ADDITIONAL_PROPERTIES_REVIEW_${rvk}`);
      }
    }
    for (const reqRevField of REVIEW_KEYS) {
      if (ar[reqRevField] === undefined) {
        errors.push(`ERR_MISSING_REVIEW_FIELD_${reqRevField}`);
      }
    }

    if (ar.authorization_evidenced !== false) {
      errors.push('ERR_FORGED_AUTHORIZATION_FLAG');
    }
    if (ar.execution_allowed !== false) {
      errors.push('ERR_FORGED_EXECUTION_FLAG');
    }

    const VALID_VERDICTS = new Set(['EVIDENCE_SUPPORTS_PREREQUISITES', 'BLOCKING_EVIDENCE_PRESENT', 'INSUFFICIENT_EVIDENCE']);
    if (!VALID_VERDICTS.has(ar.verdict)) {
      errors.push('ERR_INVALID_ACTION_VERDICT');
    }

    if (!Array.isArray(ar.supporting_ids) || !Array.isArray(ar.blocking_ids) || !Array.isArray(ar.conflicting_ids) || !Array.isArray(ar.missing_requirements)) {
      errors.push('ERR_MALFORMED_ACTION_REVIEW_ARRAYS');
    } else {
      for (const sid of ar.supporting_ids) {
        if (!validRecordIds.has(sid)) {
          errors.push(`ERR_NONEXISTENT_SUPPORTING_ID_${sid}`);
        } else {
          // Action relevance validation: supporting record MUST match action target_tag and environment
          if (proposedAction) {
            const sidTag = recordTagMap.get(sid);
            if (sidTag !== targetTag) {
              errors.push(`ERR_SUPPORT_TARGET_MISMATCH_${sid}`);
            }
            const sidEnv = recordEnvMap.get(sid);
            if (sidEnv !== 'all' && sidEnv !== packet.environment) {
              errors.push(`ERR_SUPPORT_ENV_MISMATCH_${sid}`);
            }
          }
        }
      }
      for (const bid of ar.blocking_ids) {
        if (!validRecordIds.has(bid)) {
          errors.push(`ERR_NONEXISTENT_BLOCKING_ID_${bid}`);
        }
      }

      if (ar.verdict === 'EVIDENCE_SUPPORTS_PREREQUISITES') {
        if (packet.retrieval_status !== 'complete') {
          errors.push('ERR_SUPPORT_WITH_NON_COMPLETE_RETRIEVAL');
        }
        if (!proposedAction) {
          errors.push('ERR_SUPPORT_WITHOUT_TRUSTED_ACTION');
        }
        if (ar.supporting_ids.length === 0) {
          errors.push('ERR_SUPPORT_VERDICT_EMPTY_SUPPORTING_IDS');
        }
        if (ar.blocking_ids.length > 0 || ar.conflicting_ids.length > 0) {
          errors.push('ERR_SUPPORT_VERDICT_WITH_BLOCKERS_PRESENT');
        }
        for (const sid of ar.supporting_ids) {
          const recStatus = recordStatusMap.get(sid);
          if (recStatus !== 'fixture_verified') {
            errors.push(`ERR_SUPPORT_CITES_NON_VERIFIED_RECORD_${sid}`);
          }
        }
        for (const [rid, stat] of recordStatusMap.entries()) {
          if (stat === 'held') {
            const hTag = recordTagMap.get(rid);
            if (hTag && (hTag.startsWith('tag://governance/release-hold/') || hTag === targetTag)) {
              errors.push(`ERR_SUPPORT_VERDICT_CONTRADICTED_BY_HELD_RECORD_${rid}`);
            }
          }
        }
      }
    }
  }

  const uniqueErrors = Array.from(new Set(errors));
  return {
    valid: uniqueErrors.length === 0,
    halted: false,
    errors: uniqueErrors
  };
}

/**
 * Stage 3 Adapter: interpretEvidence
 */
function interpretEvidence(trustedInput, trustedOptions, evidencePacket, evaluateForethought, trustedContext, trustedCorpusSnapshot) {
  if (!trustedInput || typeof trustedInput !== 'object') {
    throw new Error('trustedInput is required and must be an object');
  }
  if (typeof evaluateForethought !== 'function') {
    throw new Error('evaluateForethought must be a callable function');
  }

  // 1. Independent Invariant & Provenance Validation
  const validation = validatePacketInvariants(evidencePacket, trustedContext, trustedCorpusSnapshot);
  if (!validation.valid) {
    return {
      interpretation: null,
      evidenceReview: null,
      halted: true,
      error_codes: validation.errors
    };
  }

  // 2. Clone Trusted Input to Prevent analysis.js Mutation (F22)
  const clonedInput = deepClone(trustedInput);
  const clonedOptions = deepClone(trustedOptions || {});

  // 3. Locate Target learningState Without Shadowing summary.learningState (F16)
  let targetLearningState = null;
  if (clonedInput.learningState && typeof clonedInput.learningState === 'object') {
    targetLearningState = clonedInput.learningState;
  } else if (clonedInput.summary && clonedInput.summary.learningState && typeof clonedInput.summary.learningState === 'object') {
    targetLearningState = clonedInput.summary.learningState;
  } else {
    clonedInput.learningState = {};
    targetLearningState = clonedInput.learningState;
  }

  targetLearningState.evidence = (evidencePacket.records || []).map(r => r.source_uri);

  // 4. Delegate to Real Baseline Forethought Core
  const interpretationResult = evaluateForethought(clonedInput, clonedOptions);

  return {
    interpretation: interpretationResult,
    evidenceReview: evidencePacket.action_review || null,
    halted: false,
    error_codes: []
  };
}

module.exports = {
  interpretEvidence,
  validatePacketInvariants,
  deepClone,
  isValidCalendarDate
};
