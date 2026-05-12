// Sentinel Sovereign Boot Guard
// Purpose: Enforce sovereign license verification at startup.
// If SENTINEL_SOVEREIGN_MODE is set, the server will not start without a valid license.
// No platform call. No network check. Local verification only.

const { verifySovereignLicense } = require('./sovereignLicense');
const { TIERS } = require('../tiers/tierRegistry');
const { resolveTier } = require('../tiers/tierResolver');

function enforceSovereignBoot() {
  const resolved = resolveTier({});

  if (resolved.tier !== TIERS.SOVEREIGN) {
    return { sovereign: false, tier: resolved.tier };
  }

  const result = verifySovereignLicense();

  if (!result.valid) {
    console.error(`FATAL: Sovereign license verification failed — ${result.reason}`);
    console.error('Provide a valid sentinel.license.json and SENTINEL_LICENSE_KEY to start in sovereign mode.');
    process.exit(1);
  }

  console.log(`Sentinel Sovereign Mode — License verified`);
  console.log(`  License ID : ${result.licenseId}`);
  console.log(`  Issued To  : ${result.issuedTo}`);
  console.log(`  Issued At  : ${result.issuedAt}`);
  console.log(`  Version    : ${result.version}`);
  console.log(`  Capabilities: ${result.capabilities.join(', ')}`);

  return {
    sovereign: true,
    tier: TIERS.SOVEREIGN,
    license: result
  };
}

module.exports = {
  enforceSovereignBoot
};
