const assert = require('assert');
const {
  principalHasScope,
  resolveApiKey
} = require('../apps/sentinel/src/security/keyRegistry');

const originalApiKey = process.env.SENTINEL_API_KEY;
const originalApiKeys = process.env.SENTINEL_API_KEYS;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_ownerfi_operator_001',
    secret: 'operator-secret',
    tenant: 'ownerfi',
    actor: 'gregg@ownerfi.com',
    role: 'operator',
    scopes: ['application:submit', 'application:read', 'audit:read', 'approval:read'],
    status: 'active',
    createdAt: '2026-04-29T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z'
  },
  {
    keyId: 'key_ownerfi_inactive_001',
    secret: 'inactive-secret',
    tenant: 'ownerfi',
    actor: 'inactive@ownerfi.com',
    role: 'viewer',
    scopes: ['audit:read'],
    status: 'inactive'
  }
]);

const resolved = resolveApiKey('operator-secret');
assert.strictEqual(resolved.ok, true);
assert.strictEqual(resolved.principal.keyId, 'key_ownerfi_operator_001');
assert.strictEqual(resolved.principal.tenant, 'ownerfi');
assert.strictEqual(resolved.principal.actor, 'gregg@ownerfi.com');
assert.strictEqual(resolved.principal.role, 'operator');
assert.strictEqual(principalHasScope(resolved.principal, 'application:submit'), true);
assert.strictEqual(principalHasScope(resolved.principal, 'approval:read'), true);
assert.strictEqual(principalHasScope(resolved.principal, 'deal:execute'), false);

const inactive = resolveApiKey('inactive-secret');
assert.strictEqual(inactive.ok, false);
assert.strictEqual(inactive.error, 'KEY_INACTIVE');

const missing = resolveApiKey('missing-secret');
assert.strictEqual(missing.ok, false);
assert.strictEqual(missing.error, 'KEY_NOT_FOUND');

process.env.SENTINEL_API_KEYS = '';
process.env.SENTINEL_API_KEY = 'legacy-secret';

const legacy = resolveApiKey('legacy-secret');
assert.strictEqual(legacy.ok, true);
assert.strictEqual(legacy.principal.tenant, 'ownerfi');
assert.strictEqual(legacy.principal.actor, 'sentinel.platform@nunncloud.local');
assert.strictEqual(principalHasScope(legacy.principal, 'receipt:read'), true);

if (originalApiKey === undefined) {
  delete process.env.SENTINEL_API_KEY;
} else {
  process.env.SENTINEL_API_KEY = originalApiKey;
}

if (originalApiKeys === undefined) {
  delete process.env.SENTINEL_API_KEYS;
} else {
  process.env.SENTINEL_API_KEYS = originalApiKeys;
}

console.log('Key registry check passed');
