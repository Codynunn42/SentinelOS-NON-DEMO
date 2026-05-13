const crypto = require('crypto');
const { hasText } = require('../../shared/validation');
const {
  buildSentinelDockingEvent,
  evaluateDocking
} = require('../../integrations/docking/protocol');

const FACEPLANE_SDK_VERSION = '0.1.0';

function normalizeId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeCapabilities(value) {
  return normalizeList(value)
    .map((capability) => capability.toUpperCase())
    .filter((capability, index, list) => {
      return ALLOWED_CAPABILITIES.has(capability) && list.indexOf(capability) === index;
    });
}

function highestRequestedTrustTier(capabilities) {
  const rank = {
    TIER_0: 0,
    TIER_1: 1,
    TIER_2: 2
  };

  return capabilities.reduce((current, capability) => {
    const next = TRUST_BY_CAPABILITY[capability] || 'TIER_1';
    return rank[next] > rank[current] ? next : current;
  }, 'TIER_0');
}

function hashManifest(manifest) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(manifest))
    .digest('hex');
}

function buildFacePlaneManifest(input = {}) {
  const requestedCapabilities = normalizeCapabilities(input.requestedCapabilities || input.capabilities);
  const facePlaneId = normalizeId(input.facePlaneId || input.id);
  const tenantId = normalizeId(input.tenantId || input.tenant);
  const manifest = {
    manifestVersion: input.manifestVersion || MANIFEST_VERSION,
    sdkVersion: FACEPLANE_SDK_VERSION,
    facePlaneId,
    tenantId,
    name: hasText(input.name) ? input.name.trim() : '',
    purpose: hasText(input.purpose) ? input.purpose.trim() : '',
    owner: hasText(input.owner) ? input.owner.trim() : '',
    gaasPolicyPack: hasText(input.gaasPolicyPack) ? input.gaasPolicyPack.trim() : '',
    requestedCapabilities,
    approvalModel: hasText(input.approvalModel) ? input.approvalModel.trim() : '',
    telemetryMode: hasText(input.telemetryMode) ? input.telemetryMode.trim().toUpperCase() : '',
    dataClasses: normalizeList(input.dataClasses),
    evidence: normalizeList(input.evidence),
    complianceMandates: normalizeList(input.complianceMandates),
    routes: normalizeList(input.routes),
    controls: normalizeList(input.controls),
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: input.createdAt || new Date().toISOString()
  };

  return {
    ...manifest,
    manifestHash: hashManifest(manifest)
  };
}

function validateFacePlaneManifest(manifest = {}) {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = manifest[field];
    if (Array.isArray(value)) return value.length === 0;
    return !hasText(value);
  });
  const invalid = [];

  if (manifest.manifestVersion !== MANIFEST_VERSION) {
    invalid.push('MANIFEST_VERSION_UNSUPPORTED');
  }

  if (!/^[a-z0-9_-]{3,64}$/.test(manifest.facePlaneId || '')) {
    invalid.push('FACEPLANE_ID_INVALID');
  }

  if (!/^[a-z0-9_-]{3,64}$/.test(manifest.tenantId || '')) {
    invalid.push('TENANT_ID_INVALID');
  }

  if (!['OFF', 'LIMITED', 'ON'].includes(manifest.telemetryMode)) {
    invalid.push('TELEMETRY_MODE_INVALID');
  }

  if (!['human_review_required', 'approval_before_execution', 'read_only'].includes(manifest.approvalModel)) {
    invalid.push('APPROVAL_MODEL_INVALID');
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid
  };
}

function buildDockingManifest(facePlaneManifest = {}) {
  const capabilities = facePlaneManifest.requestedCapabilities || [];

  return {
    udpVersion: '1.0',
    systemId: `FACEPLANE-${String(facePlaneManifest.facePlaneId || '').toUpperCase()}`,
    adapterId: `ADAPTER-${String(facePlaneManifest.tenantId || '').toUpperCase()}-${String(facePlaneManifest.facePlaneId || '').toUpperCase()}`,
    name: facePlaneManifest.name,
    owner: facePlaneManifest.owner,
    requestedTrustTier: highestRequestedTrustTier(capabilities),
    capabilities,
    metadata: {
      type: 'faceplane',
      tenantId: facePlaneManifest.tenantId,
      gaasPolicyPack: facePlaneManifest.gaasPolicyPack,
      manifestHash: facePlaneManifest.manifestHash,
      complianceMandates: facePlaneManifest.complianceMandates || []
    }
  };
}

function evaluateFacePlaneManifest(input = {}) {
  const manifest = input.manifestVersion ? input : buildFacePlaneManifest(input);
  const validation = validateFacePlaneManifest(manifest);

  if (!validation.valid) {
    return {
      status: 'INVALID',
      valid: false,
      manifest,
      validation,
      approvalRequired: false,
      executionMode: 'blocked',
      reason: `Face plane manifest invalid: ${validation.missing.concat(validation.invalid).join(', ')}`
    };
  }

  const dockingManifest = buildDockingManifest(manifest);
  const docking = evaluateDocking(dockingManifest);

  return {
    status: docking.status === 'RESTRICTED'
      ? 'RESTRICTED'
      : docking.approvalRequired
        ? 'PENDING_APPROVAL'
        : 'REGISTERABLE',
    valid: true,
    manifest,
    validation,
    dockingManifest,
    docking,
    approvalRequired: docking.approvalRequired,
    executionMode: docking.executionMode,
    reason: docking.reason
  };
}

function buildFacePlaneRegistrationEvent(input = {}) {
  const evaluation = evaluateFacePlaneManifest(input);
  const dockingEvent = evaluation.dockingManifest
    ? buildSentinelDockingEvent(evaluation.dockingManifest)
    : null;

  return {
    type: 'faceplane.registration.requested',
    source: 'sentinel-faceplane-sdk',
    tenant: evaluation.manifest.tenantId || null,
    facePlaneId: evaluation.manifest.facePlaneId || null,
    status: evaluation.status,
    approvalRequired: evaluation.approvalRequired,
    reason: evaluation.reason,
    evidence: [
      `manifestHash=${evaluation.manifest.manifestHash || 'missing'}`,
      `gaasPolicyPack=${evaluation.manifest.gaasPolicyPack || 'missing'}`,
      `telemetryMode=${evaluation.manifest.telemetryMode || 'missing'}`,
      `approvalModel=${evaluation.manifest.approvalModel || 'missing'}`
    ],
    payload: {
      evaluation,
      dockingEvent
    }
  };
}

module.exports = {
  FACEPLANE_SDK_VERSION,
  MANIFEST_VERSION,
  buildDockingManifest,
  buildFacePlaneManifest,
  buildFacePlaneRegistrationEvent,
  evaluateFacePlaneManifest,
  validateFacePlaneManifest
};
