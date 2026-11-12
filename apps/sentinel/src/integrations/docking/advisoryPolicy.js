'use strict';
const { createHash } = require('node:crypto');
const { timestamp } = require('../../archiveIntelligence/artifactPolicy');
const { snapshot } = require('../../forethought/advisoryJob');

const CAPABILITIES = Object.freeze(['READ_TELEMETRY', 'READ_STATUS', 'RUN_ADVISORY_EVALUATION']);
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// A restrictive profile layered beside the legacy manifest scaffold. This is
// an unsigned local policy decision, not proof of deployed actuator isolation.
function authorizeAdvisoryDock(manifest, principal, grant, { currentTime, codeSha256, facilityId } = {}) {
  const deny = (code) => snapshot({ allowed: false, code, executionAllowed: false });
  if (!manifest || manifest.udpVersion !== '1.0') return deny('UNSUPPORTED_PROTOCOL');
  if (![manifest.systemId, manifest.adapterId, manifest.version, facilityId].every((v) => typeof v === 'string' && v.trim())) return deny('INVALID_MANIFEST');
  if (!Array.isArray(manifest.capabilities) || !manifest.capabilities.length || manifest.capabilities.length > CAPABILITIES.length ||
    new Set(manifest.capabilities).size !== manifest.capabilities.length ||
    manifest.capabilities.some((cap) => !CAPABILITIES.includes(cap))) return deny('CAPABILITY_DENIED');
  const now = timestamp(currentTime);
  if (!Number.isFinite(now) || !/^[a-f0-9]{64}$/.test(codeSha256) || manifest.codeSha256 !== codeSha256) return deny('INVALID_CODE_OR_CLOCK');
  if (!principal || principal.authenticated !== true || !grant ||
    typeof principal.subject !== 'string' || typeof principal.tenant !== 'string' ||
    grant.subject !== principal.subject || grant.tenant !== principal.tenant ||
    grant.adapterId !== manifest.adapterId || grant.version !== manifest.version || grant.codeSha256 !== codeSha256 ||
    grant.readOnly !== true || grant.executionAllowed !== false ||
    typeof grant.grantId !== 'string' || !grant.grantId || grant.revoked !== false) return deny('DOCKING_NOT_AUTHORIZED');
  const before = timestamp(grant.notBefore), expires = timestamp(grant.expiresAt);
  if (!Number.isFinite(before) || !Number.isFinite(expires) || now < before || now >= expires) return deny('GRANT_EXPIRED_OR_NOT_ACTIVE');
  if (!Array.isArray(grant.facilityIds) || !grant.facilityIds.includes(facilityId) ||
    !Array.isArray(grant.capabilities) || grant.capabilities.some((cap) => !CAPABILITIES.includes(cap)) ||
    manifest.capabilities.some((cap) => !grant.capabilities.includes(cap))) return deny('CAPABILITY_OR_FACILITY_DENIED');
  const receipt = {
    issuer: 'LOCAL_ADVISORY_POLICY_GATE', evidenceType: 'UNSIGNED_LOCAL_DECISION',
    manifestSha256: digest(manifest), grantId: grant.grantId,
    tenant: principal.tenant, subject: principal.subject, adapterId: manifest.adapterId,
    codeSha256, facilityId, evaluatedAt: currentTime, expiresAt: grant.expiresAt,
    capabilities: [...manifest.capabilities], executionAllowed: false,
    limitation: 'Requires trusted adapters; not a signed SentinelOS receipt or physical isolation attestation.'
  };
  return snapshot({ allowed: true, executionAllowed: false, receipt: { ...receipt, receiptSha256: digest(receipt) } });
}

module.exports = { authorizeAdvisoryDock, CAPABILITIES };
