const crypto = require('crypto');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function stripSignatureFields(decision) {
  const { signature, signedAt, signatureVersion, ...unsignedDecision } = decision || {};
  return unsignedDecision;
}

function getSigningKey(key) {
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

function getDecisionSigningKey(options = {}) {
  return getSigningKey(
    options.key ||
      process.env.SENTINEL_SIGNING_KEY ||
      process.env.BILLING_SIGN_KEY ||
      process.env.SENTINEL_HMAC_SECRET
  );
}

function signDecision(decision, key) {
  const signingKey = getSigningKey(key);
  if (!signingKey) {
    return {
      ...decision,
      signature: null,
      signedAt: null,
      signatureVersion: 'unsigned'
    };
  }

  const signedAt = new Date().toISOString();
  const payload = stableStringify(stripSignatureFields(decision));
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(payload)
    .digest('hex');

  return {
    ...decision,
    signature,
    signedAt,
    signatureVersion: 'hmac-sha256:v1'
  };
}

function verifyDecision(decision, key) {
  const signingKey = getSigningKey(key);
  if (!signingKey || !decision || typeof decision.signature !== 'string') {
    return false;
  }

  const payload = stableStringify(stripSignatureFields(decision));
  const expected = crypto
    .createHmac('sha256', signingKey)
    .update(payload)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(decision.signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

module.exports = {
  getDecisionSigningKey,
  signDecision,
  stableStringify,
  stripSignatureFields,
  verifyDecision
};
