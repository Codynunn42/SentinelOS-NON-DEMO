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
  QUERY_TRUST_REGISTRY: 'low',
  WRITE_CAPSULE_STATE: 'medium',
  ACTIVATE_WALLET: 'medium',
  REQUEST_CDLUX_TRANSFER: 'high',
  DEPLOY_CONTRACT: 'high',
  EXECUTE_EXTERNAL_ACTION: 'high',
  UPDATE_AUTHORITY: 'high'
};

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

function evaluateDocking(input = {}) {
  const manifest = normalizeManifest(input);
  const requestedTier = TRUST_TIERS[manifest.requestedTrustTier]
    ? manifest.requestedTrustTier
    : 'TIER_0';
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
    tenant: 'nunncloud',
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

module.exports = {
  CAPABILITY_RISK,
  SUPPORTED_UDP_VERSION,
  TRUST_TIERS,
  buildSentinelDockingEvent,
  evaluateDocking,
  getCapabilityRisk,
  normalizeManifest
};
