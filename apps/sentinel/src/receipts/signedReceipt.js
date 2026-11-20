const crypto = require('crypto');

const SIGNED_RECEIPT_VERSION = 'sentinel-receipt/v1';
const SIGNATURE_ALGORITHM = 'ES256';
const SIGNATURE_DOMAIN = Buffer.from('SentinelOS receipt v1\0', 'utf8');

function canonicalize(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('RECEIPT_NUMBER_INVALID');
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }

  if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError('RECEIPT_VALUE_UNSUPPORTED');
  }

  const keys = Object.keys(value).sort();
  if (keys.some((key) => value[key] === undefined)) {
    throw new TypeError('RECEIPT_UNDEFINED_VALUE');
  }

  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

function signingBytes(payload) {
  return Buffer.concat([SIGNATURE_DOMAIN, Buffer.from(canonicalize(payload), 'utf8')]);
}

function normalizeAuthority(authority) {
  if (!authority || typeof authority !== 'object') {
    throw new TypeError('RECEIPT_AUTHORITY_REQUIRED');
  }

  const { tenant, actor, apiKeyId, effectiveRole, effectiveScopes, decision } = authority;
  if (
    typeof tenant !== 'string' || !tenant.trim() ||
    typeof actor !== 'string' || !actor.trim() ||
    typeof apiKeyId !== 'string' || !apiKeyId.trim() ||
    typeof effectiveRole !== 'string' || !effectiveRole.trim() ||
    !Array.isArray(effectiveScopes) ||
    !decision || typeof decision !== 'object' ||
    decision.result !== 'allow' ||
    typeof decision.decisionId !== 'string' || !decision.decisionId.trim() ||
    typeof decision.decidedAt !== 'string' || !Number.isFinite(Date.parse(decision.decidedAt))
  ) {
    throw new TypeError('RECEIPT_AUTHORITY_INVALID');
  }

  const scopes = effectiveScopes.map((scope) => {
    if (typeof scope !== 'string' || !scope.trim()) {
      throw new TypeError('RECEIPT_SCOPE_INVALID');
    }
    return scope.trim();
  });
  if (new Set(scopes).size !== scopes.length) {
    throw new TypeError('RECEIPT_SCOPE_DUPLICATE');
  }

  return {
    tenant: tenant.trim(),
    actor: actor.trim(),
    apiKeyId: apiKeyId.trim(),
    effectiveRole: effectiveRole.trim(),
    effectiveScopes: scopes.sort(),
    decision: {
      decisionId: decision.decisionId.trim(),
      result: 'allow',
      state: typeof decision.state === 'string' ? decision.state : null,
      riskLevel: typeof decision.riskLevel === 'string' ? decision.riskLevel : null,
      requiredScope: typeof decision.requiredScope === 'string' ? decision.requiredScope : null,
      approvalId: typeof decision.approvalId === 'string' ? decision.approvalId : null,
      policyVersion: typeof decision.policyVersion === 'string' ? decision.policyVersion : null,
      decidedAt: new Date(decision.decidedAt).toISOString()
    }
  };
}

function buildUnsignedReceipt(receipt, authority) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    throw new TypeError('RECEIPT_REQUIRED');
  }

  const {
    schemaVersion,
    authority: ignoredAuthority,
    signature,
    verificationStatus,
    verification_status,
    verified,
    ...receiptPayload
  } = receipt;

  if (typeof receiptPayload.receiptId !== 'string' || !receiptPayload.receiptId.trim()) {
    throw new TypeError('RECEIPT_ID_REQUIRED');
  }
  if (
    typeof receiptPayload.tenantId !== 'string' ||
    receiptPayload.tenantId.trim() !== normalizeAuthority(authority).tenant
  ) {
    throw new TypeError('RECEIPT_TENANT_AUTHORITY_MISMATCH');
  }

  return {
    schemaVersion: SIGNED_RECEIPT_VERSION,
    receipt: receiptPayload,
    authority: normalizeAuthority(authority)
  };
}

async function signReceipt(receipt, authority, signer) {
  if (!signer || typeof signer.sign !== 'function' || typeof signer.keyId !== 'string' || !signer.keyId) {
    throw new Error('RECEIPT_SIGNER_UNAVAILABLE');
  }

  const unsigned = buildUnsignedReceipt(receipt, authority);
  const signatureMetadata = { algorithm: SIGNATURE_ALGORITHM, keyId: signer.keyId };
  const signatureValue = await signer.sign(signingBytes({ ...unsigned, signature: signatureMetadata }));
  const signature = Buffer.from(signatureValue);
  if (signature.length !== 64) {
    throw new Error('RECEIPT_SIGNATURE_FORMAT_INVALID');
  }

  return {
    ...unsigned.receipt,
    schemaVersion: SIGNED_RECEIPT_VERSION,
    authority: unsigned.authority,
    signature: {
      ...signatureMetadata,
      value: signature.toString('base64url')
    },
    verification_status: 'verified',
    verified: true
  };
}

async function verifySignedReceipt(receipt, getPublicKey) {
  if (!receipt || receipt.schemaVersion !== SIGNED_RECEIPT_VERSION) {
    return { ok: false, status: 'unsupported_version', verified: false };
  }
  if (!receipt.signature || receipt.signature.algorithm !== SIGNATURE_ALGORITHM) {
    return { ok: false, status: 'unsupported_algorithm', verified: false };
  }
  if (typeof receipt.signature.keyId !== 'string' || !receipt.signature.keyId) {
    return { ok: false, status: 'key_id_missing', verified: false };
  }

  let unsigned;
  try {
    unsigned = buildUnsignedReceipt(receipt, receipt.authority);
  } catch (error) {
    return {
      ok: false,
      status: error instanceof Error ? error.message : 'receipt_invalid',
      verified: false
    };
  }

  let publicKey;
  try {
    publicKey = await getPublicKey(receipt.signature.keyId);
  } catch {
    return { ok: false, status: 'verification_key_unavailable', verified: false };
  }
  if (!publicKey) {
    return { ok: false, status: 'verification_key_unavailable', verified: false };
  }

  try {
    const signature = Buffer.from(receipt.signature.value, 'base64url');
    const valid = signature.length === 64 && crypto.verify(
      'sha256',
      signingBytes({
        ...unsigned,
        signature: {
          algorithm: receipt.signature.algorithm,
          keyId: receipt.signature.keyId
        }
      }),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      signature
    );
    return {
      ok: valid,
      status: valid ? 'verified' : 'signature_mismatch',
      verified: valid
    };
  } catch {
    return { ok: false, status: 'signature_malformed', verified: false };
  }
}

function markUnsignedLegacy(receipt) {
  return {
    ...receipt,
    verification_status: 'unsigned_legacy',
    verified: false
  };
}

module.exports = {
  SIGNED_RECEIPT_VERSION,
  canonicalize,
  markUnsignedLegacy,
  signReceipt,
  signingBytes,
  verifySignedReceipt
};
