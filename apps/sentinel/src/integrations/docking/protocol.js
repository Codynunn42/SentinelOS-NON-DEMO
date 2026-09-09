// Sentinel Universal Docking Protocol Adapter
// Purpose: Normalize external system manifests into governed Sentinel docking decisions.

const SUPPORTED_UDP_VERSION = '1.0';

const TRUST_TIERS = {
  TIER_0: {
    name: 'observed',
    maxRisk: 'low',
    canExecute: false
  },
  TIER_1: {
    name: 'restricted',
    maxRisk: 'medium',
    canExecute: false
  },
  TIER_2: {
    name: 'governed',
    maxRisk: 'high',
    canExecute: true
  }
};

const CAPABILITY_RISK = {
  READ_TELEMETRY: 'low',
  READ_STATUS: 'low',
  READ_BALANCE: 'low',
  FACEPLANE_READ: 'low',
  DOCKING_MANIFEST_REGISTER: 'low',
  QUERY_TRUST_REGISTRY: 'low',
  WRITE_CAPSULE_STATE: 'medium',
  FACEPLANE_WRITE: 'medium',
  GAAS_POLICY_APPLY: 'medium',
  ACTIVATE_WALLET: 'medium',
  FACEPLANE_EXECUTE: 'high',
  FACEPLANE_EXPORT: 'high',
  REQUEST_CDLUX_TRANSFER: 'high',
  DEPLOY_CONTRACT: 'high',
  EXECUTE_EXTERNAL_ACTION: 'high',
  UPDATE_AUTHORITY: 'high'
};

const VALID_TRUST_TIERS = Object.freeze(Object.keys(TRUST_TIERS));
const DOCKING_EVENT_TYPES = Object.freeze(['docking.requested', 'docking.evaluated']);
const LEARNABLE_DOCKING_STATUSES = Object.freeze(['INVALID', 'RESTRICTED', 'PENDING_APPROVAL', 'DOCKABLE']);

function normalizeCapability(capability) {
  return String(capability || '').trim().toUpperCase();
}

function getCapabilityRisk(capability) {
  return CAPABILITY_RISK[normalizeCapability(capability)] || 'medium';
}

function riskRank(risk) {
  return {
    low: 1,
    medium: 2,
    high: 3
  }[risk] || 2;
}

function highestRisk(risks) {
  return risks.reduce((current, next) => {
    return riskRank(next) > riskRank(current) ? next : current;
  }, 'low');
}

function normalizeManifest(input = {}) {
  const capabilities = Array.isArray(input.capabilities)
    ? input.capabilities.map(normalizeCapability).filter(Boolean)
    : [];

  return {
    udpVersion: input.udpVersion || SUPPORTED_UDP_VERSION,
    systemId: input.systemId || input.systemID || 'unknown-system',
    adapterId: input.adapterId || input.capsuleId || input.capsuleID || 'unknown-adapter',
    name: input.name || 'External System',
    owner: input.owner || 'unknown',
    requestedTrustTier: input.trustTierRequest || input.requestedTrustTier || 'TIER_0',
    capabilities,
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    timestamp: input.timestamp || new Date().toISOString()
  };
}

function validateDockingManifest(manifest) {
  const errors = [];

  if (manifest.udpVersion !== SUPPORTED_UDP_VERSION) {
    errors.push('UDP_VERSION_UNSUPPORTED');
  }
  if (!/^[A-Z0-9_-]{3,128}$/.test(manifest.systemId)) {
    errors.push('SYSTEM_ID_INVALID');
  }
  if (!/^[A-Z0-9_-]{3,128}$/.test(manifest.adapterId)) {
    errors.push('ADAPTER_ID_INVALID');
  }
  if (!VALID_TRUST_TIERS.includes(manifest.requestedTrustTier)) {
    errors.push('TRUST_TIER_INVALID');
  }
  if (!manifest.capabilities.length) {
    errors.push('CAPABILITIES_REQUIRED');
  }
  if (new Set(manifest.capabilities).size !== manifest.capabilities.length) {
    errors.push('CAPABILITIES_DUPLICATE');
  }
  if (manifest.capabilities.some((capability) => !Object.hasOwn(CAPABILITY_RISK, capability))) {
    errors.push('CAPABILITY_UNSUPPORTED');
  }

  return { valid: errors.length === 0, errors };
}

function evaluateDocking(input = {}) {
  const manifest = normalizeManifest(input);
  const validation = validateDockingManifest(manifest);

  if (!validation.valid) {
    return {
      protocol: 'universal-docking-protocol',
      udpVersion: manifest.udpVersion,
      status: 'INVALID',
      manifest,
      validation,
      trustTier: { requested: manifest.requestedTrustTier, granted: null, name: null },
      riskLevel: 'high',
      capabilityRisks: [],
      capabilitiesGranted: [],
      capabilitiesDenied: manifest.capabilities,
      approvalRequired: true,
      executionMode: 'blocked',
      reason: `Docking manifest rejected: ${validation.errors.join(', ')}.`
    };
  }

  const requestedTier = manifest.requestedTrustTier;
  const capabilityRisks = manifest.capabilities.map((capability) => ({
    capability,
    risk: getCapabilityRisk(capability)
  }));
  const riskLevel = highestRisk(capabilityRisks.map((item) => item.risk));
  const tier = TRUST_TIERS[requestedTier];
  const tierAllowsRisk = riskRank(riskLevel) <= riskRank(tier.maxRisk);
  const approvalRequired = riskLevel === 'high' || requestedTier === 'TIER_2';
  const grantedCapabilities = tierAllowsRisk
    ? manifest.capabilities
    : manifest.capabilities.filter((capability) => {
        return riskRank(getCapabilityRisk(capability)) <= riskRank(tier.maxRisk);
      });
  const deniedCapabilities = manifest.capabilities.filter((capability) => {
    return !grantedCapabilities.includes(capability);
  });

  const status = deniedCapabilities.length
    ? 'RESTRICTED'
    : approvalRequired
      ? 'PENDING_APPROVAL'
      : 'DOCKABLE';

  return {
    protocol: 'universal-docking-protocol',
    udpVersion: manifest.udpVersion,
    status,
    manifest,
    validation,
    trustTier: {
      requested: manifest.requestedTrustTier,
      granted: requestedTier,
      name: tier.name
    },
    riskLevel,
    capabilityRisks,
    capabilitiesGranted: grantedCapabilities,
    capabilitiesDenied: deniedCapabilities,
    approvalRequired,
    executionMode: approvalRequired ? 'approval_required' : 'read_only',
    reason: buildReason(status, riskLevel, deniedCapabilities)
  };
}

function buildReason(status, riskLevel, deniedCapabilities) {
  if (deniedCapabilities.length) {
    return `Docking restricted because requested capabilities exceed granted trust tier: ${deniedCapabilities.join(', ')}.`;
  }

  if (status === 'PENDING_APPROVAL') {
    return `Docking requires approval because requested capability risk is ${riskLevel}.`;
  }

  return 'Docking request is compatible with read-only or low-risk Sentinel governance.';
}

function buildSentinelDockingEvent(input = {}) {
  const docking = evaluateDocking(input);

  return {
    type: 'docking.requested',
    eventType: 'docking.requested',
    source: 'universal-docking-protocol',
    tenant: docking.manifest.metadata.tenantId || 'nunncloud',
    riskLevel: docking.riskLevel,
    reason: docking.reason,
    evidence: [
      `systemId=${docking.manifest.systemId}`,
      `adapterId=${docking.manifest.adapterId}`,
      `trustTier=${docking.trustTier.granted}`,
      `status=${docking.status}`
    ],
    payload: docking
  };
}

function analyzeDockingLearning(events = []) {
  const candidates = (Array.isArray(events) ? events : [])
    .filter((event) => event && (DOCKING_EVENT_TYPES.includes(event.type) || event.command === 'docking.evaluate'));
  const observations = candidates
    .map((event) => event.docking || event.payload || event.data || {})
    .filter((docking) => (
      docking.protocol === 'universal-docking-protocol' &&
      LEARNABLE_DOCKING_STATUSES.includes(docking.status)
    ));
  const counts = observations.reduce((result, docking) => {
    result[docking.status] = (result[docking.status] || 0) + 1;
    return result;
  }, {});
  const hasSecurityConcern = ['INVALID', 'RESTRICTED'].some((status) => counts[status] > 0);
  const pendingApprovals = counts.PENDING_APPROVAL || 0;

  return {
    scope: 'docking_operations_security',
    observations: observations.length,
    ignoredEvents: candidates.length - observations.length,
    statusCounts: counts,
    learningBoundary: 'recommendation_only',
    automaticChange: false,
    actionGate: hasSecurityConcern || pendingApprovals ? 'human_review_required' : 'observe_only',
    recommendation: hasSecurityConcern
      ? 'Upgrade manifest validation and retain the current trust-tier and approval gates; do not grant new capabilities automatically.'
      : pendingApprovals
        ? 'Keep approval gates in place and review pending high-risk docking requests with their evidence.'
        : observations.length
          ? 'Keep current read-only docking posture; no capability or trust-tier expansion is authorized from learning alone.'
          : 'Collect governed docking outcomes before proposing an operations-security change.'
  };
}

module.exports = {
  CAPABILITY_RISK,
  DOCKING_EVENT_TYPES,
  LEARNABLE_DOCKING_STATUSES,
  SUPPORTED_UDP_VERSION,
  TRUST_TIERS,
  buildSentinelDockingEvent,
  evaluateDocking,
  getCapabilityRisk,
  normalizeManifest,
  validateDockingManifest,
  analyzeDockingLearning
};
