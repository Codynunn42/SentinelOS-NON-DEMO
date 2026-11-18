'use strict';

const assert = require('node:assert/strict');
const { prepareEvidence, sha256 } = require('../discoveryLensCore');
const { validatePacketInvariants } = require('../forethoughtAdapter');

const action = {
  action_type: 'apply_database_migration',
  target_tag: 'tag://component/db-migration/v3.4',
  release_id: 'REL-2026-10',
  environment: 'staging'
};

const context = {
  tenant_id: 'DEMO-A',
  release_id: 'REL-2026-10',
  environment: 'staging',
  evaluation_cutoff: '2026-10-23T12:00:00Z',
  trusted_scope_id: 'scope-1',
  corpus_version: 'v1',
  index_version: 'v1',
  policy_version: 'v1',
  allowed_sensitivity_tiers: new Set(['standard']),
  proposed_action: action
};

function makeRecord(text = 'Pass.') {
  return {
    record_id: 'M1',
    source_id: 'M1',
    source_uri: 'urn:source:M1',
    source_version: '1.0',
    tenant_id: 'DEMO-A',
    release_id: 'REL-2026-10',
    environment: 'staging',
    sensitivity_tier: 'standard',
    observed_at: '2026-10-20T10:00:00Z',
    status: 'fixture_verified',
    text,
    entity_tag: action.target_tag,
    content_sha256: sha256(text)
  };
}

describe('Discovery Lens Stage 3 invariant regressions', function () {
  it('rejects prerequisite support when retrieval status is insufficient', function () {
    const corpus = [makeRecord()];
    const packet = prepareEvidence(context, 'migration v3.4', corpus);
    packet.retrieval_status = 'insufficient';

    const validation = validatePacketInvariants(packet, context, corpus);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_SUPPORT_WITH_NON_COMPLETE_RETRIEVAL'));
  });

  it('rejects prerequisite support when the trusted context has no action', function () {
    const corpus = [makeRecord()];
    const packet = prepareEvidence(context, 'migration v3.4', corpus);
    const noActionContext = { ...context, proposed_action: null };

    const validation = validatePacketInvariants(packet, noActionContext, corpus);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_PROPOSED_ACTION_WITHOUT_TRUSTED_ACTION'));
    assert.ok(validation.errors.includes('ERR_SUPPORT_WITHOUT_TRUSTED_ACTION'));
  });

  it('halts rather than emitting excerpts over the byte limit', function () {
    const packet = prepareEvidence(context, 'migration v3.4', [makeRecord('x'.repeat(5000))]);

    assert.equal(packet.retrieval_status, 'halted');
    assert.ok(packet.error_codes.includes('ERR_BOUNDS_EXCERPT_TOO_LARGE'));
  });

  it('rejects oversized excerpts at the adapter boundary', function () {
    const corpus = [makeRecord()];
    const packet = prepareEvidence(context, 'migration v3.4', corpus);
    packet.records[0].excerpt = 'x'.repeat(5000);

    const validation = validatePacketInvariants(packet, context, corpus);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_BOUNDS_EXCERPT_TOO_LARGE_M1'));
  });

  it('returns a closed failure for malformed hold arrays without throwing', function () {
    const corpus = [makeRecord()];
    const packet = prepareEvidence(context, 'migration v3.4', corpus);
    packet.governance_holds = {};

    const validation = validatePacketInvariants(packet, context, corpus);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_MALFORMED_ARRAYS'));
  });

  it('rejects duplicate IDs in the trusted corpus snapshot', function () {
    const record = makeRecord();
    const packet = prepareEvidence(context, 'migration v3.4', [record]);

    const validation = validatePacketInvariants(packet, context, [record, { ...record }]);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_DUPLICATE_TRUSTED_RECORD_ID_M1'));
  });

  it('excludes records from a different environment during retrieval', function () {
    const productionRecord = { ...makeRecord(), environment: 'production' };
    const packet = prepareEvidence(context, 'migration v3.4', [productionRecord]);

    assert.equal(packet.records.length, 0);
    assert.equal(packet.retrieval_status, 'insufficient');
    assert.equal(
      validatePacketInvariants(packet, context, [productionRecord]).valid,
      true
    );
  });

  it('rejects a packet that includes a trusted record from another environment', function () {
    const stagingRecord = makeRecord();
    const productionRecord = { ...stagingRecord, environment: 'production' };
    const packet = prepareEvidence(context, 'migration v3.4', [stagingRecord]);
    packet.records[0].environment = productionRecord.environment;

    const validation = validatePacketInvariants(packet, context, [productionRecord]);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_CROSS_ENVIRONMENT_RECORD_M1'));
  });

  it('rejects prerequisite support that cites a failed source record', function () {
    const failedRecord = { ...makeRecord(), status: 'failed' };
    const packet = prepareEvidence(context, 'migration v3.4', [failedRecord]);
    packet.retrieval_status = 'complete';
    packet.action_review.verdict = 'EVIDENCE_SUPPORTS_PREREQUISITES';
    packet.action_review.supporting_ids = ['M1'];
    packet.action_review.blocking_ids = [];
    packet.action_review.conflicting_ids = [];
    packet.action_review.missing_requirements = [];

    const validation = validatePacketInvariants(packet, context, [failedRecord]);

    assert.equal(validation.valid, false);
    assert.ok(validation.errors.includes('ERR_SUPPORT_CITES_NON_VERIFIED_RECORD_M1'));
  });
});
