#!/usr/bin/env node
// Generate an Ed25519 sovereign-license signing keypair for controlled setup.

const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log('SENTINEL_LICENSE_SIGNING_KEY_PRIVATE_PEM');
console.log(privateKey.trim());
console.log('');
console.log('SENTINEL_LICENSE_KEY_PUBLIC_PEM');
console.log(publicKey.trim());
console.log('');
console.log('Store the private key in an approved signing-key system. Distribute only the public key.');
