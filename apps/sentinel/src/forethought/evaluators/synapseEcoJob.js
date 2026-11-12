'use strict';
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { isDeepStrictEqual } = require('node:util');
const { SynapseEcoEvaluator } = require('./synapseEcoEvaluator');
const { authorizeAdvisoryDock } = require('../../integrations/docking/advisoryPolicy');
const { artifactDigest, timestamp } = require('../../archiveIntelligence/artifactPolicy');
const { runDiscoveryAdvisoryJob } = require('../discoveryLens/advisoryBridge');
const { snapshot } = require('../advisoryJob');

const EVALUATOR_SHA256 = createHash('sha256').update(readFileSync(require.resolve('./synapseEcoEvaluator'))).digest('hex');
const MANIFEST = snapshot({ udpVersion: '1.0', systemId: 'SYNAPSEECO-RESEARCH', adapterId: 'SYNAPSEECO-THERMAL',
  version: '0.1.0', codeSha256: EVALUATOR_SHA256, capabilities: ['READ_TELEMETRY', 'READ_STATUS', 'RUN_ADVISORY_EVALUATION'] });
const blocked = (requestId, code) => snapshot({ requestId: typeof requestId === 'string' ? requestId : null,
  status: 'BLOCKED', code, executionAllowed: false, humanReviewRequired: true });

// No API route, scheduling, external provider or actuator is installed here.
// The only domain input is an exact-version, current-authority artifact whose
// full JSON content has passed the Lens/C4 policy and source-identity checks.
function runSynapseEcoJob(request, deps) {
  let stateChanged = false;
  const changed = () => snapshot({ ...blocked(request?.id, 'STATE_CHANGED_BEFORE_RELEASE'),
    domainStatus: 'INSUFFICIENT_EVIDENCE' });
  try {
    if (typeof request?.evidenceId !== 'string' || typeof request.facilityId !== 'string') return blocked(request?.id, 'INVALID_REQUEST');
    request = snapshot(request);
    const jobAnchorTime = deps.clock();
    if (!Number.isFinite(timestamp(jobAnchorTime))) return blocked(request.id, 'INVALID_CLOCK');
    const pins = new Map();
    const pin = (key, value) => {
      const current = snapshot(value);
      if (!pins.has(key)) pins.set(key, current);
      else if (!isDeepStrictEqual(pins.get(key), current)) {
        stateChanged = true;
        throw new Error('STATE_CHANGED_BEFORE_RELEASE');
      }
      return pins.get(key);
    };
    // Pin at the first authorized intake, not a raw pre-authorization read.
    // Re-fetch live state on every check; only stable immutable values proceed.
    const boundDeps = {
      ...deps,
      authenticate: (caller) => pin('principal', deps.authenticate(caller)),
      loadLensSnapshot: () => pin('lens', deps.loadLensSnapshot()),
      resolvePolicy: (id) => pin(`policy:${id}`, deps.resolvePolicy(id)),
      store: {
        listMetadata: () => deps.store.listMetadata(),
        readVersion: (id, version) => {
          const artifact = deps.store.readVersion(id, version);
          return pin(`artifact:${JSON.stringify([id, version])}`, {
            digest: artifactDigest(artifact), artifact
          }).artifact;
        }
      }
    };
    const authorize = () => authorizeAdvisoryDock(MANIFEST, boundDeps.authenticate(request.caller),
      deps.resolveDockingGrant(MANIFEST.adapterId), { currentTime: deps.clock(), codeSha256: EVALUATOR_SHA256, facilityId: request.facilityId });
    const admission = authorize();
    if (!admission.allowed) return blocked(request.id, admission.code);
    const run = () => runDiscoveryAdvisoryJob(request, boundDeps);
    const first = run();
    if (stateChanged) return changed();
    const reviewable = (packet) => packet.status === 'REVIEW_REQUIRED' &&
      packet.discoveryReview?.verdict === 'EVIDENCE_SUPPORTS_PREREQUISITES' &&
      !packet.conflicts.length && !packet.gaps.length;
    if (!reviewable(first)) return blocked(request.id, 'EVIDENCE_REVIEW_REQUIRED');
    const selected = first.evidenceTable.find((e) => e.id === request.evidenceId && e.slot === 'CURRENT_AUTHORITY');
    if (!selected) return blocked(request.id, 'CURRENT_AUTHORITY_REQUIRED');
    const artifact = boundDeps.store.readVersion(selected.id, selected.version);
    const policy = boundDeps.resolvePolicy(selected.id);
    const digest = artifactDigest(artifact);
    if (policy?.digest !== digest || artifact.id !== selected.id || artifact.version !== selected.version ||
        Buffer.byteLength(artifact.content, 'utf8') > 32768) return blocked(request.id, 'EVIDENCE_CHANGED_OR_OVERSIZED');
    const input = JSON.parse(artifact.content);
    if (input.config?.facilityId !== request.facilityId) return blocked(request.id, 'FACILITY_BINDING_MISMATCH');
    const evaluator = new SynapseEcoEvaluator(input.config);
    const evaluation = evaluator.evaluate(input.payload, { asOf: jobAnchorTime });

    // Recheck the complete C4/hold path and docking lease after evaluation.
    // A changed source, roster, scope, grant or access policy discards domain output.
    const second = run();
    if (stateChanged) return changed();
    if (!reviewable(second)) return blocked(request.id, 'STATE_CHANGED_BEFORE_RELEASE');
    const finalAdmission = authorize();
    if (!finalAdmission.allowed) return blocked(request.id, 'STATE_CHANGED_BEFORE_RELEASE');
    const nowArtifact = boundDeps.store.readVersion(selected.id, selected.version);
    const nowPolicy = boundDeps.resolvePolicy(selected.id);
    const posture = (packet) => JSON.stringify({ review: packet.discoveryReview,
      evidence: packet.evidenceTable?.map((e) => ({ id: e.id, version: e.version, slot: e.slot, lifecycle: e.lifecycle, provenance: e.provenance })) });
    if (admission.receipt.grantId !== finalAdmission.receipt.grantId ||
      admission.receipt.manifestSha256 !== finalAdmission.receipt.manifestSha256 ||
      posture(first) !== posture(second) || artifactDigest(nowArtifact) !== digest || nowPolicy?.digest !== digest) return blocked(request.id, 'STATE_CHANGED_BEFORE_RELEASE');
    return snapshot({ requestId: request.id, status: 'REVIEW_REQUIRED', domainStatus: evaluation.status,
      executionAllowed: false, humanReviewRequired: true,
      signOff: { status: 'PENDING_HUMAN_REVIEW', grantsExecution: false },
      localPolicyDecision: finalAdmission.receipt,
      citations: [{ documentId: selected.id, version: selected.version, artifactSha256: digest, locator: 'JSON:$.config,$.payload' }],
      forethought: evaluation.forethought, evaluation,
      limits: ['Synthetic or explicitly approved research inputs only.', 'Model and forecasts do not establish realized savings or green compliance.',
        'Evaluator boundary flags are declarations; the local gate is not production enforcement attestation.'] });
  } catch {
    if (stateChanged) return changed();
    return blocked(request?.id, 'ADAPTER_CONTRACT_OR_INPUT_FAILED');
  }
}

module.exports = { runSynapseEcoJob, MANIFEST, EVALUATOR_SHA256 };
