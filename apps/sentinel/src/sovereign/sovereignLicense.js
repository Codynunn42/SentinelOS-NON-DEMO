// Sentinel Sovereign License Verifier
// Purpose: Verify a sovereign license locally using a signed license file.
// Zero platform dependency. No call-home. No subscription check.
// Verification uses HMAC-SHA256 against the buyer's license key.
//
// License file format (JSON):
// {
//   "licenseId": "SOS-2026-XXXX",
//   "tier": "SOVEREIGN",
//   "issuedTo": "<organization name>",
//   "issuedAt": "<ISO timestamp>",
//   "version": "1.0",
//   "capabilities": ["execute", "audit", "govern", "drift"],
//   "signature": "<hmac-sha256 hex>"
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
  if (!key || !license.signature) {
    return false;
  }
  const payload = buildLicensePayload(license);
  const expected = crypto
    .createHmac('sha256', key)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(license.signature)
  );
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

  if (!verifyLicenseSignature(license, key || LICENSE_PUBLIC_KEY)) {
    return { valid: false, reason: 'LICENSE_SIGNATURE_INVALID' };
  }

  return {
    valid: true,
    licenseId: license.licenseId,
    issuedTo: license.issuedTo,
    issuedAt: license.issuedAt,
    version: license.version || '1.0',
    capabilities: Array.isArray(license.capabilities) ? license.capabilities : []
  };
}

function verifySovereignLicense(options = {}) {
  const license = options.license || loadLicense(options.licensePath);
  const key = options.key || LICENSE_PUBLIC_KEY;
  return validateLicense(license, key);
}

function generateLicense({ licenseId, issuedTo, capabilities = [], signingKey }) {
  if (!signingKey) {
    throw new Error('SIGNING_KEY_REQUIRED');
  }

  const license = {
    licenseId: licenseId || `SOS-${Date.now()}`,
    tier: 'SOVEREIGN',
    issuedTo,
    issuedAt: new Date().toISOString(),
    version: '1.0',
    capabilities
  };

  const payload = buildLicensePayload(license);
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(payload)
    .digest('hex');

  return { ...license, signature };
}

module.exports = {
  generateLicense,
  loadLicense,
  validateLicense,
  verifySovereignLicense,
  verifyLicenseSignature
};
