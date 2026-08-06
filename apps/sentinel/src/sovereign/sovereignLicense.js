// Sentinel Sovereign License Verifier
// Purpose: Verify a sovereign license locally using a signed license file.
// Zero platform dependency. No call-home. No subscription check.
// Verification uses Ed25519 against a buyer-distributable public key.
//
// License file format (JSON):
// {
//   "licenseId": "SOS-2026-XXXX",
//   "tier": "SOVEREIGN",
//   "issuedTo": "<organization name>",
//   "issuedAt": "<ISO timestamp>",
//   "version": "1.0",
//   "capabilities": ["execute", "audit", "govern", "drift"],
//   "signatureAlgorithm": "ed25519:v1",
//   "signature": "<base64 signature>"
// }

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LICENSE_PATH = process.env.SENTINEL_LICENSE_FILE
  || path.join(process.cwd(), 'sentinel.license.json');

const LICENSE_PUBLIC_KEY = process.env.SENTINEL_LICENSE_KEY || '';

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildLicensePayload(license) {
  const { signature, ...unsigned } = license;
  return stableStringify(unsigned);
}

function verifyLicenseSignature(license, key) {
  if (!key || !license.signature || license.signatureAlgorithm !== 'ed25519:v1') {
    return false;
  }
  try {
    const payload = Buffer.from(buildLicensePayload(license));
    return crypto.verify(null, payload, key, Buffer.from(license.signature, 'base64'));
  } catch {
    return false;
  }
}

function loadLicense(licensePath) {
  try {
    const raw = fs.readFileSync(licensePath || LICENSE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function validateLicense(license, key) {
  if (!license) {
    return { valid: false, reason: 'LICENSE_NOT_FOUND' };
  }

  if (license.tier !== 'SOVEREIGN') {
    return { valid: false, reason: 'LICENSE_TIER_MISMATCH' };
  }

  if (!license.licenseId || !license.issuedTo || !license.issuedAt) {
    return { valid: false, reason: 'LICENSE_INCOMPLETE' };
  }

  if (license.signatureAlgorithm !== 'ed25519:v1') {
    return { valid: false, reason: 'LICENSE_SIGNATURE_ALGORITHM_UNSUPPORTED' };
  }

  if (!verifyLicenseSignature(license, key || LICENSE_PUBLIC_KEY)) {
    return { valid: false, reason: 'LICENSE_SIGNATURE_INVALID' };
  }

  return {
    valid: true,
    licenseId: license.licenseId,
    issuedTo: license.issuedTo,
    issuedAt: license.issuedAt,
    version: license.version || '1.0',
    signatureAlgorithm: license.signatureAlgorithm,
    capabilities: Array.isArray(license.capabilities) ? license.capabilities : []
  };
}

function verifySovereignLicense(options = {}) {
  const license = options.license || loadLicense(options.licensePath);
  const key = options.key || LICENSE_PUBLIC_KEY;
  return validateLicense(license, key);
}

function generateLicense({ licenseId, issuedTo, capabilities = [], privateKey }) {
  if (!privateKey) {
    throw new Error('PRIVATE_KEY_REQUIRED');
  }

  const license = {
    licenseId: licenseId || `SOS-${Date.now()}`,
    tier: 'SOVEREIGN',
    issuedTo,
    issuedAt: new Date().toISOString(),
    version: '1.0',
    capabilities,
    signatureAlgorithm: 'ed25519:v1'
  };

  const payload = Buffer.from(buildLicensePayload(license));
  const signature = crypto.sign(null, payload, privateKey).toString('base64');

  return { ...license, signature };
}

module.exports = {
  generateLicense,
  loadLicense,
  validateLicense,
  verifySovereignLicense,
  verifyLicenseSignature
};
