const crypto = require('crypto');
const { stableStringify } = require('../security/signing');

const DEFAULT_SURFACE = 'sentinelos-control-plane';
const NONCE_TTL_MS = 5 * 60 * 1000;
const seenNonces = new Map();

function getPassportSecret(options = {}) {
  const secret = options.secret || process.env.SENTINEL_HMAC_SECRET;
  return typeof secret === 'string' && secret.trim() ? secret.trim() : null;
}

function canonicalizePassport(env = {}) {
  return stableStringify({
    commandId: env.commandId || null,
    timestamp: env.timestamp || null,
    nonce: env.nonce || null,
    tenant: env.tenant || null,
    command: env.command || null,
    payload: env.payload || {},
    meta: env.meta || {}
  });
}

function signExecutionPassport(env = {}, options = {}) {
  const secret = getPassportSecret(options);
  if (!secret) {
    throw new Error('SENTINEL_HMAC_SECRET_REQUIRED');
  }

  const prepared = {
    ...env,
    commandId: env.commandId || crypto.randomUUID(),
    timestamp: Number.isFinite(env.timestamp) ? env.timestamp : Date.now(),
    nonce: env.nonce || crypto.randomUUID(),
    meta: {
      tenantId: env.tenant || env.meta?.tenantId || env.metadata?.tenantId || null,
      surface: DEFAULT_SURFACE,
      ...(env.meta && typeof env.meta === 'object' ? env.meta : {})
    }
  };
  const sig = crypto
    .createHmac('sha256', secret)
    .update(canonicalizePassport(prepared))
    .digest('base64');

  return {
    ...prepared,
    source: 'sentinel',
    sig,
    metadata: {
      ...(prepared.metadata && typeof prepared.metadata === 'object' ? prepared.metadata : {}),
      source: 'sentinel'
    }
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function pruneExpiredNonces(now = Date.now()) {
  for (const [nonce, expiresAt] of seenNonces.entries()) {
    if (expiresAt <= now) {
      seenNonces.delete(nonce);
    }
  }
}

function preventReplay(env = {}, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const ttl = Number.isFinite(options.ttlMs) ? options.ttlMs : NONCE_TTL_MS;

  pruneExpiredNonces(now);

  if (!env.nonce) {
    return { ok: false, reason: 'missing_nonce' };
  }

  if (!Number.isFinite(env.timestamp)) {
    return { ok: false, reason: 'missing_timestamp' };
  }

  if (Math.abs(now - env.timestamp) > ttl) {
    return { ok: false, reason: 'stale' };
  }

  if (seenNonces.has(env.nonce)) {
    return { ok: false, reason: 'replay' };
  }

  seenNonces.set(env.nonce, now + ttl);
  return { ok: true };
}

function enforcePassportScope(env = {}, options = {}) {
  const expectedSurface = options.surface || DEFAULT_SURFACE;
  const meta = env.meta && typeof env.meta === 'object' ? env.meta : {};

  if (meta.surface !== expectedSurface) {
    return { ok: false, reason: 'scope_violation' };
  }

  if (!meta.tenantId || meta.tenantId !== env.tenant) {
    return { ok: false, reason: 'scope_violation' };
  }

  return { ok: true };
}

function verifyExecutionPassport(env = {}, options = {}) {
  const secret = getPassportSecret(options);
  if (!secret) {
    return { ok: false, reason: 'missing_secret' };
  }

  if (!env.sig) {
    return { ok: false, reason: 'missing_signature' };
  }

  const scope = enforcePassportScope(env, options);
  if (!scope.ok) {
    return scope;
  }

  const mac = crypto
    .createHmac('sha256', secret)
    .update(canonicalizePassport(env))
    .digest('base64');

  if (!safeEqual(mac, env.sig)) {
    return { ok: false, reason: 'bad_signature' };
  }

  return preventReplay(env, options);
}

function resetExecutionPassportState() {
  seenNonces.clear();
}

module.exports = {
  DEFAULT_SURFACE,
  NONCE_TTL_MS,
  canonicalizePassport,
  preventReplay,
  resetExecutionPassportState,
  signExecutionPassport,
  verifyExecutionPassport
};
