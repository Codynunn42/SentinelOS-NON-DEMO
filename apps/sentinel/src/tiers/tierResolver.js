// Sentinel Tier Resolver
// Purpose: Resolve the correct deployment tier for any command, tenant, or context.
// This is the single classification entry point used by policy, telemetry, and audit.

const { TIERS, getTierDefinition } = require('./tierRegistry');

const GOVERNMENT_TENANT_PATTERNS = [
  /\.gov$/i,
  /\.mil$/i,
  /government/i,
  /federal/i,
  /defense/i,
  /dod/i,
  /agency/i
];

const SOVEREIGN_INDICATORS = [
  'sovereign',
  'air-gapped',
  'airgapped',
  'classified',
  'perpetual'
];

function detectTierFromEnv() {
  const envTier = process.env.SENTINEL_DEPLOYMENT_TIER;
  if (envTier && TIERS[envTier.toUpperCase()]) {
    return TIERS[envTier.toUpperCase()];
  }

  if (process.env.SENTINEL_SOVEREIGN_MODE === '1' || process.env.SENTINEL_SOVEREIGN_MODE === 'true') {
    return TIERS.SOVEREIGN;
  }

  if (process.env.SENTINEL_GOV_MODE === '1' || process.env.SENTINEL_GOV_MODE === 'true') {
    return TIERS.GOVERNMENT;
  }

  return null;
}

function detectTierFromTenant(tenant) {
  if (!tenant || typeof tenant !== 'string') {
    return null;
  }

  const normalized = tenant.toLowerCase();

  if (SOVEREIGN_INDICATORS.some((indicator) => normalized.includes(indicator))) {
    return TIERS.SOVEREIGN;
  }

  if (GOVERNMENT_TENANT_PATTERNS.some((pattern) => pattern.test(tenant))) {
    return TIERS.GOVERNMENT;
  }

  return null;
}

function detectTierFromMetadata(metadata = {}) {
  const tier = metadata.tier || metadata.deploymentTier || metadata.sentinelTier;
  if (tier && TIERS[String(tier).toUpperCase()]) {
    return TIERS[String(tier).toUpperCase()];
  }
  return null;
}

function resolveTier(context = {}) {
  // Priority: env override > explicit metadata > tenant pattern > default PUBLIC
  const envTier = detectTierFromEnv();
  if (envTier) {
    return {
      tier: envTier,
      source: 'environment',
      definition: getTierDefinition(envTier)
    };
  }

  const metaTier = detectTierFromMetadata(context.metadata || {});
  if (metaTier) {
    return {
      tier: metaTier,
      source: 'metadata',
      definition: getTierDefinition(metaTier)
    };
  }

  const tenantTier = detectTierFromTenant(context.tenant);
  if (tenantTier) {
    return {
      tier: tenantTier,
      source: 'tenant',
      definition: getTierDefinition(tenantTier)
    };
  }

  return {
    tier: TIERS.PUBLIC,
    source: 'default',
    definition: getTierDefinition(TIERS.PUBLIC)
  };
}

function classifyOperation(command, tenant, metadata = {}) {
  const resolved = resolveTier({ tenant, metadata });
  const def = resolved.definition;

  const commandClass = resolveCommandClass(command);
  const allowed = def.allowedCommandClasses.includes(commandClass);

  return {
    tier: resolved.tier,
    tierLabel: def.label,
    source: resolved.source,
    commandClass,
    allowed,
    platformConnected: def.platformConnected,
    sovereignPackage: def.sovereignPackage,
    approvalModel: def.approvalModel,
    telemetryMode: def.telemetryMode,
    pricingModel: def.pricingModel
  };
}

function resolveCommandClass(command) {
  if (!command || typeof command !== 'string') return 'unknown';
  const cmd = command.toLowerCase();

  if (cmd.includes('audit') || cmd.includes('log') || cmd.includes('history')) return 'audit';
  if (cmd.includes('health') || cmd.includes('status') || cmd.includes('ready')) return 'health';
  if (cmd.includes('verify') || cmd.includes('validate') || cmd.includes('check')) return 'verify';
  if (cmd.includes('reconcile')) return 'reconcile';
  if (cmd.includes('orchestrate') || cmd.includes('workflow')) return 'orchestrate';
  if (cmd.includes('execute') || cmd.includes('deploy') || cmd.includes('run')) return 'execute';
  if (cmd.includes('read') || cmd.includes('get') || cmd.includes('list') || cmd.includes('fetch')) return 'read';

  return 'read';
}

module.exports = {
  classifyOperation,
  detectTierFromEnv,
  detectTierFromTenant,
  resolveTier,
  resolveCommandClass
};
