#!/usr/bin/env node
// scripts/generate-sovereign-license.js
// Purpose: Generate a signed sovereign license file for a buyer.
// Run: node scripts/generate-sovereign-license.js
//
// Required env:
//   SENTINEL_LICENSE_SIGNING_KEY  — your private signing key (keep secret, never ship)
//   SOVEREIGN_LICENSE_ID          — unique license ID (e.g. SOS-2026-0001)
//   SOVEREIGN_ISSUED_TO           — buyer organization name
//   SOVEREIGN_CAPABILITIES        — comma-separated list (default: execute,audit,govern,drift)

const path = require('path');
const fs = require('fs');
const { generateLicense } = require('../apps/sentinel/src/sovereign/sovereignLicense');

const signingKey = process.env.SENTINEL_LICENSE_SIGNING_KEY;
const licenseId = process.env.SOVEREIGN_LICENSE_ID || `SOS-${Date.now()}`;
const issuedTo = process.env.SOVEREIGN_ISSUED_TO;
const capabilitiesRaw = process.env.SOVEREIGN_CAPABILITIES || 'execute,audit,govern,drift';
const capabilities = capabilitiesRaw.split(',').map((c) => c.trim()).filter(Boolean);

if (!signingKey) {
  console.error('ERROR: SENTINEL_LICENSE_SIGNING_KEY is required');
  process.exit(1);
}

if (!issuedTo) {
  console.error('ERROR: SOVEREIGN_ISSUED_TO is required');
  process.exit(1);
}

const license = generateLicense({ licenseId, issuedTo, capabilities, signingKey });
const outputPath = path.join(process.cwd(), `${licenseId}.license.json`);

fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

console.log(`Sovereign license generated`);
console.log(`  License ID   : ${license.licenseId}`);
console.log(`  Issued To    : ${license.issuedTo}`);
console.log(`  Issued At    : ${license.issuedAt}`);
console.log(`  Capabilities : ${license.capabilities.join(', ')}`);
console.log(`  Output       : ${outputPath}`);
console.log('');
console.log('Deliver this file to the buyer along with their SENTINEL_LICENSE_KEY.');
console.log('The SENTINEL_LICENSE_SIGNING_KEY stays with you. Never ship it.');
