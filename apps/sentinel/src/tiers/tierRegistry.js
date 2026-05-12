// Sentinel Tier Registry
// Purpose: Define canonical deployment tiers for SentinelOS.
// Every command, tenant, and deployment context resolves to one of these tiers.
//
// Tiers:
//   PUBLIC     — cloud-hosted, subscription, platform-connected
//   ENTERPRISE — cloud or private, subscription, platform-connected, advanced policy
//   GOVERNMENT — private or air-gapped, subscription or contract, compliance-aligned
//   SOVEREIGN  — fully air-gapped, one-time purchase, zero platform dependency

const TIERS = Object.freeze({
  PUBLIC: 'PUBLIC',
  ENTERPRISE: 'ENTERPRISE',
  GOVERNMENT: 'GOVERNMENT',
  SOVEREIGN: 'SOVEREIGN'
});

const TIER_DEFINITIONS = Object.freeze({
  [TIERS.PUBLIC]: {
    tier: TIERS.PUBLIC,
    label: 'Sentinel Public',
    description: 'Cloud-hosted, platform-connected, subscription-based.',
    platformConnected: true,
    subscriptionRequired: true,
    airGapped: false,
    sovereignPackage: false,
    allowedCommandClasses: ['read', 'audit', 'health'],
    approvalModel: 'standard',
    telemetryMode: 'platform',
    pricingModel: 'subscription',
    targetBuyer: 'Startups, small teams, developers'
  },

  [TIERS.ENTERPRISE]: {
    tier: TIERS.ENTERPRISE,
    label: 'Sentinel Enterprise',
    description: 'Private or cloud deployment, advanced policy, multi-tenant, subscription.',
    platformConnected: true,
    subscriptionRequired: true,
    airGapped: false,
    sovereignPackage: false,
    allowedCommandClasses: ['read', 'audit', 'health', 'verify', 'execute', 'reconcile', 'orchestrate'],
    approvalModel: 'role_based',
    telemetryMode: 'managed',
    pricingModel: 'subscription',
    targetBuyer: 'Enterprise teams, MSPs, platform engineering leads'
  },

  [TIERS.GOVERNMENT]: {
    tier: TIERS.GOVERNMENT,
    label: 'Sentinel Government',
    description: 'Private or air-gapped deployment, compliance-aligned, contract-based.',
    platformConnected: false,
    subscriptionRequired: true,
    airGapped: true,
    sovereignPackage: false,
    allowedCommandClasses: ['read', 'audit', 'health', 'verify', 'execute', 'reconcile', 'orchestrate'],
    approvalModel: 'multi_party',
    telemetryMode: 'local_only',
    pricingModel: 'contract',
    targetBuyer: 'Government agencies, defense contractors, regulated entities'
  },

  [TIERS.SOVEREIGN]: {
    tier: TIERS.SOVEREIGN,
    label: 'Sentinel Sovereign',
    description: 'Fully air-gapped, one-time purchase, zero platform dependency, self-contained.',
    platformConnected: false,
    subscriptionRequired: false,
    airGapped: true,
    sovereignPackage: true,
    allowedCommandClasses: ['read', 'audit', 'health', 'verify', 'execute', 'reconcile', 'orchestrate'],
    approvalModel: 'sovereign_local',
    telemetryMode: 'local_only',
    pricingModel: 'perpetual_license',
    targetBuyer: 'Sovereign entities, classified environments, buyers requiring zero external dependency'
  }
});

function getTierDefinition(tier) {
  return TIER_DEFINITIONS[tier] || null;
}

function isSovereign(tier) {
  return tier === TIERS.SOVEREIGN;
}

function isPlatformConnected(tier) {
  const def = getTierDefinition(tier);
  return def ? def.platformConnected : false;
}

function requiresSubscription(tier) {
  const def = getTierDefinition(tier);
  return def ? def.subscriptionRequired : true;
}

function getAllTiers() {
  return Object.values(TIER_DEFINITIONS);
}

module.exports = {
  TIERS,
  TIER_DEFINITIONS,
  getAllTiers,
  getTierDefinition,
  isPlatformConnected,
  isSovereign,
  requiresSubscription
};
