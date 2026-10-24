const crypto = require('crypto');
const { ManagedIdentityCredential } = require('@azure/identity');
const { CryptographyClient, KeyClient } = require('@azure/keyvault-keys');

function parseVersionedKeyId(keyId) {
  if (typeof keyId !== 'string' || !keyId.trim()) {
    throw new Error('SENTINEL_RECEIPT_KEY_ID_REQUIRED');
  }

  const parsed = new URL(keyId);
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    segments.length !== 3 ||
    segments[0] !== 'keys' ||
    !segments[1] ||
    !segments[2] ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('SENTINEL_RECEIPT_KEY_ID_MUST_BE_VERSIONED');
  }

  return {
    vaultUrl: parsed.origin,
    name: segments[1],
    version: segments[2],
    keyId: parsed.toString().replace(/\/$/, '')
  };
}

function publicKeyFromJwk(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('SENTINEL_RECEIPT_KEY_MUST_BE_EC_P256');
  }

  return crypto.createPublicKey({
    key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
    format: 'jwk'
  });
}

function createAzureKeyVaultReceiptSigner(options = {}) {
  const keyInfo = parseVersionedKeyId(options.keyId || process.env.SENTINEL_RECEIPT_KEY_ID);
  const credential = options.credential || new ManagedIdentityCredential(
    process.env.AZURE_CLIENT_ID || undefined
  );
  const keyClient = options.keyClient || new KeyClient(keyInfo.vaultUrl, credential);
  const cryptoClient = options.cryptoClient || new CryptographyClient(keyInfo.keyId, credential);
  const publicKeyPromises = new Map();

  async function getPublicKey(requestedKeyId = keyInfo.keyId) {
    const requestedKey = parseVersionedKeyId(requestedKeyId);
    if (requestedKey.vaultUrl !== keyInfo.vaultUrl || requestedKey.name !== keyInfo.name) {
      throw new Error('SENTINEL_RECEIPT_VERIFICATION_KEY_OUT_OF_SCOPE');
    }

    if (!publicKeyPromises.has(requestedKey.keyId)) {
      const publicKeyPromise = keyClient.getKey(requestedKey.name, { version: requestedKey.version })
        .then((key) => {
          const actualId = key.id && key.id.replace(/\/$/, '');
          if (actualId !== requestedKey.keyId) {
            throw new Error('SENTINEL_RECEIPT_KEY_VERSION_MISMATCH');
          }
          return publicKeyFromJwk(key.key);
        })
        .catch((error) => {
          publicKeyPromises.delete(requestedKey.keyId);
          throw error;
        });
      publicKeyPromises.set(requestedKey.keyId, publicKeyPromise);
    }
    return publicKeyPromises.get(requestedKey.keyId);
  }

  return {
    keyId: keyInfo.keyId,
    async ensureReady() {
      const publicKey = await getPublicKey();
      const probe = Buffer.from('SentinelOS receipt signer readiness v1', 'utf8');
      const digest = crypto.createHash('sha256').update(probe).digest();
      const result = await cryptoClient.sign('ES256', digest);
      const valid = crypto.verify(
        'sha256',
        probe,
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(result.signature)
      );
      if (!valid) {
        throw new Error('SENTINEL_RECEIPT_SIGNER_SELF_CHECK_FAILED');
      }
    },
    async sign(data) {
      await getPublicKey();
      const digest = crypto.createHash('sha256').update(data).digest();
      const result = await cryptoClient.sign('ES256', digest);
      return Buffer.from(result.signature);
    },
    getPublicKey
  };
}

module.exports = {
  createAzureKeyVaultReceiptSigner,
  parseVersionedKeyId,
  publicKeyFromJwk
};
