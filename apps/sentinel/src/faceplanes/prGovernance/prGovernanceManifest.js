// Sentinel PR Governance FacePlane manifest helpers.
// The FacePlane is limited to read/status capabilities with GAAS policy-pack evaluation only.

const manifestInput = require('./prGovernanceFacePlane.manifest.json');
const {
  buildFacePlaneManifest,
  evaluateFacePlaneManifest
} = require('../sdk/facePlaneSdk');

const PR_GOVERNANCE_ALLOWED_CAPABILITIES = Object.freeze(['FACEPLANE_READ', 'READ_STATUS']);
const PR_GOVERNANCE_COMMAND = 'faceplane.pr.audit';
const PR_GOVERNANCE_REQUIRED_SCOPE = 'repo:read';

function buildPrGovernanceManifest() {
  return buildFacePlaneManifest(JSON.parse(JSON.stringify(manifestInput)));
}

function validatePrGovernanceManifest(manifest = buildPrGovernanceManifest()) {
  const evaluation = evaluateFacePlaneManifest(manifest);
  const violations = [];
  const capabilities = Array.isArray(manifest.requestedCapabilities) ? manifest.requestedCapabilities : [];
  const rawCapabilities = Array.isArray(manifestInput.requestedCapabilities) ? manifestInput.requestedCapabilities : [];

  for (const capability of new Set([...capabilities, ...rawCapabilities.map((item) => String(item).toUpperCase())])) {
    if (!PR_GOVERNANCE_ALLOWED_CAPABILITIES.includes(capability)) {
      violations.push(`CAPABILITY_NOT_PERMITTED:${capability}`);
    }
  }

  if (manifest.approvalModel !== 'read_only') violations.push('APPROVAL_MODEL_NOT_READ_ONLY');
  if (!manifest.gaasPolicyPack) violations.push('GAAS_POLICY_PACK_REQUIRED');
  if (!evaluation.valid) violations.push('SDK_MANIFEST_INVALID');
  if (evaluation.executionMode !== 'read_only') violations.push('EXECUTION_MODE_NOT_READ_ONLY');
  if (evaluation.approvalRequired) violations.push('UNEXPECTED_APPROVAL_PATH');

  const metadata = manifest.metadata || {};
  if (metadata.executionMode !== 'report_only') violations.push('METADATA_EXECUTION_MODE_NOT_REPORT_ONLY');
  if (metadata.requiredScope !== PR_GOVERNANCE_REQUIRED_SCOPE) violations.push('REQUIRED_SCOPE_MISMATCH');
  if (!Array.isArray(metadata.commands) || metadata.commands.join(',') !== PR_GOVERNANCE_COMMAND) {
    violations.push('COMMAND_SURFACE_MISMATCH');
  }

  return {
    valid: violations.length === 0,
    violations,
    evaluation
  };
}

module.exports = {
  PR_GOVERNANCE_ALLOWED_CAPABILITIES,
  PR_GOVERNANCE_COMMAND,
  PR_GOVERNANCE_REQUIRED_SCOPE,
  buildPrGovernanceManifest,
  validatePrGovernanceManifest
};
