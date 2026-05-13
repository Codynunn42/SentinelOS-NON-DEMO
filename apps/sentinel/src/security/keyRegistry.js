const { hasText } = require('../shared/validation');

const DEFAULT_OWNERFI_SCOPES = [
  'application:submit',
  'application:evaluate',
  'application:read',
  'deal:submit',
  'deal:approve',
  'deal:execute',
  'audit:read',
  'receipt:read',
  'approval:read',
  'approval:review'
];

const PLATFORM_SCOPES = [
  ...DEFAULT_OWNERFI_SCOPES,
  'tenant:admin',
  'platform:admin',
  'learning:read',
  'learning:write',
  'media:polish',
  'openai:execute',
  'openai:read',
  'task:orchestrate',
  'task:read',
  'task:execute',
  'telemetry:write',
  'support:write',
  'support:refund',
  'billing:read',
  'billing:write',
  'billing:webhook',
  'security:write',
  'policy:evaluate'
];

function parseKeyRegistry() {
  if (!hasText(process.env.SENTINEL_API_KEYS)) {
    return [];
  }

  try {
    const parsed = JSON.parse(process.env.SENTINEL_API_KEYS);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function buildLegacyKeyRecord() {
  if (!hasText(process.env.SENTINEL_API_KEY)) {
    return null;
  }

  return {
    keyId: process.env.SENTINEL_API_KEY_ID || 'key_ownerfi_approver_legacy',
    secret: process.env.SENTINEL_API_KEY,
    tenant: process.env.SENTINEL_API_KEY_TENANT || 'ownerfi',
    actor: process.env.SENTINEL_API_KEY_ACTOR || 'sentinel.platform@nunncloud.local',
    role: process.env.SENTINEL_API_KEY_ROLE || 'approver',
    scopes: process.env.SENTINEL_API_KEY_SCOPES
      ? process.env.SENTINEL_API_KEY_SCOPES.split(',').map((scope) => scope.trim()).filter(Boolean)
      : PLATFORM_SCOPES,
    status: 'active',
    createdAt: null,
    expiresAt: process.env.SENTINEL_API_KEY_EXPIRES_AT || null
  };
}

function getKeyRecords() {
  const configured = parseKeyRegistry();
  if (configured.length > 0) {
    return configured;
  }

  const legacy = buildLegacyKeyRecord();
  return legacy ? [legacy] : [];
}

function isExpired(record, now = new Date()) {
  if (!hasText(record.expiresAt)) {
    return false;
  }

  const expiresAt = new Date(record.expiresAt);
  return Number.isNaN(expiresAt.getTime()) || expiresAt <= now;
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const scopes = Array.isArray(record.scopes) ? record.scopes.filter(hasText) : [];

  return {
    keyId: record.keyId,
    tenant: record.tenant,
    actor: record.actor,
    role: record.role,
    scopes,
    status: record.status || 'inactive',
    createdAt: record.createdAt || null,
    expiresAt: record.expiresAt || null
  };
}

function validatePrincipal(principal) {
  if (!principal) {
    return 'KEY_NOT_FOUND';
  }

  if (principal.status !== 'active') {
    return 'KEY_INACTIVE';
  }

  if (!hasText(principal.tenant)) {
    return 'KEY_TENANT_REQUIRED';
  }

  if (!hasText(principal.actor)) {
    return 'KEY_ACTOR_REQUIRED';
  }

  if (!hasText(principal.role)) {
    return 'KEY_ROLE_REQUIRED';
  }

  if (!Array.isArray(principal.scopes) || principal.scopes.length === 0) {
    return 'KEY_SCOPES_REQUIRED';
  }

  if (isExpired(principal)) {
    return 'KEY_EXPIRED';
  }

  return null;
}

function resolveApiKey(apiKey) {
  if (!hasText(apiKey)) {
    return {
      ok: false,
      error: 'API_KEY_REQUIRED'
    };
  }

  const records = getKeyRecords();
  if (records.length === 0) {
    return {
      ok: false,
      error: 'KEY_REGISTRY_MISSING'
    };
  }

  const record = records.find((candidate) => candidate.secret === apiKey);
  const principal = normalizeRecord(record);
  const validationError = validatePrincipal(principal);

  if (validationError) {
    return {
      ok: false,
      error: validationError,
      keyId: principal && principal.keyId ? principal.keyId : null
    };
  }

  return {
    ok: true,
    principal
  };
}

function principalHasScope(principal, scope) {
  if (!scope) {
    return true;
  }

  if (!principal || !Array.isArray(principal.scopes)) {
    return false;
  }

  return principal.scopes.includes(scope) || principal.scopes.includes('platform:admin');
}

module.exports = {
  DEFAULT_OWNERFI_SCOPES,
  PLATFORM_SCOPES,
  getKeyRecords,
  principalHasScope,
  resolveApiKey
};
