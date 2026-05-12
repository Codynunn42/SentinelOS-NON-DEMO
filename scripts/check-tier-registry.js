// scripts/check-tier-registry.js
// Purpose: Verify tier registry and resolver load and classify correctly.

const { TIERS, getAllTiers, getTierDefinition } = require('../apps/sentinel/src/tiers/tierRegistry');
const { resolveTier, classifyOperation } = require('../apps/sentinel/src/tiers/tierResolver');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('Tier registry check\n');

// All four tiers exist
assert('PUBLIC tier defined', !!getTierDefinition(TIERS.PUBLIC));
assert('ENTERPRISE tier defined', !!getTierDefinition(TIERS.ENTERPRISE));
assert('GOVERNMENT tier defined', !!getTierDefinition(TIERS.GOVERNMENT));
assert('SOVEREIGN tier defined', !!getTierDefinition(TIERS.SOVEREIGN));

// Sovereign is not platform connected and not subscription required
const sovereign = getTierDefinition(TIERS.SOVEREIGN);
assert('SOVEREIGN is not platform connected', sovereign.platformConnected === false);
assert('SOVEREIGN does not require subscription', sovereign.subscriptionRequired === false);
assert('SOVEREIGN is air-gapped', sovereign.airGapped === true);
assert('SOVEREIGN pricingModel is perpetual_license', sovereign.pricingModel === 'perpetual_license');

// Government is air-gapped but still contract-based
const gov = getTierDefinition(TIERS.GOVERNMENT);
assert('GOVERNMENT is air-gapped', gov.airGapped === true);
assert('GOVERNMENT pricingModel is contract', gov.pricingModel === 'contract');

// Default resolution is PUBLIC
const defaultResolved = resolveTier({});
assert('Default tier resolves to PUBLIC', defaultResolved.tier === TIERS.PUBLIC);

// Tenant pattern detection
const govResolved = resolveTier({ tenant: 'arizona.gov' });
assert('arizona.gov resolves to GOVERNMENT', govResolved.tier === TIERS.GOVERNMENT);

const sovereignResolved = resolveTier({ tenant: 'sovereign-ops' });
assert('sovereign-ops resolves to SOVEREIGN', sovereignResolved.tier === TIERS.SOVEREIGN);

// Command classification
const classified = classifyOperation('audit.read', 'ownerfi', {});
assert('audit.read classifies as audit class', classified.commandClass === 'audit');
assert('audit.read is allowed in PUBLIC tier', classified.allowed === true);

// getAllTiers returns all four
assert('getAllTiers returns 4 tiers', getAllTiers().length === 4);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
