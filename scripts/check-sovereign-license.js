const assert = require('assert');
const crypto = require('crypto');
const {
  generateLicense,
  validateLicense,
  verifyLicenseSignature
} = require('../apps/sentinel/src/sovereign/sovereignLicense');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
const otherKeypair = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const license = generateLicense({
  licenseId: 'SOS-TEST-0001',
  issuedTo: 'Test Organization',
  capabilities: ['audit', 'govern'],
  privateKey
});

assert.strictEqual(license.signatureAlgorithm, 'ed25519:v1');
assert.strictEqual(verifyLicenseSignature(license, publicKey), true);
assert.strictEqual(validateLicense(license, publicKey).valid, true);
assert.strictEqual(validateLicense(license, otherKeypair.publicKey).valid, false);
assert.strictEqual(
  validateLicense({ ...license, issuedTo: 'Forged Organization' }, publicKey).valid,
  false
);
assert.strictEqual(
  validateLicense({ ...license, signatureAlgorithm: 'hmac-sha256:v1' }, publicKey).reason,
  'LICENSE_SIGNATURE_ALGORITHM_UNSUPPORTED'
);
assert.throws(
  () => generateLicense({ issuedTo: 'Missing Key' }),
  /PRIVATE_KEY_REQUIRED/
);

console.log('Sovereign license asymmetric signature check passed');
