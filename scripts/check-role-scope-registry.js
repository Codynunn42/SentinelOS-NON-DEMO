const assert = require('assert');
const {
  ROLE_SCOPE_REGISTRY,
  getDefaultScopesForRole,
  getRoleScopeDefinition,
  isScopeAllowedForRole,
  validateRoleScopeAssignment
} = require('../apps/sentinel/src/security/roleScopeRegistry');

assert.deepStrictEqual(Object.keys(ROLE_SCOPE_REGISTRY), [
  'viewer',
  'operator',
  'approver',
  'auditor',
  'platform'
]);

assert.ok(getRoleScopeDefinition('viewer'));
assert.ok(getRoleScopeDefinition('operator'));
assert.ok(getRoleScopeDefinition('approver'));
assert.ok(getRoleScopeDefinition('auditor'));
assert.ok(getRoleScopeDefinition('platform'));

assert.strictEqual(isScopeAllowedForRole('viewer', 'audit:read'), true);
assert.strictEqual(isScopeAllowedForRole('viewer', 'approval:review'), false);
assert.strictEqual(isScopeAllowedForRole('operator', 'application:submit'), true);
assert.strictEqual(isScopeAllowedForRole('operator', 'deal:execute'), false);
assert.strictEqual(isScopeAllowedForRole('approver', 'approval:review'), true);
assert.strictEqual(isScopeAllowedForRole('auditor', 'receipt:read'), true);
assert.strictEqual(isScopeAllowedForRole('auditor', 'deal:execute'), false);

assert.deepStrictEqual(getDefaultScopesForRole('operator'), [
  'application:submit',
  'application:read',
  'audit:read',
  'receipt:read',
  'approval:read'
]);

assert.deepStrictEqual(validateRoleScopeAssignment('operator', ['application:submit', 'approval:read']), {
  ok: true,
  issues: []
});

assert.deepStrictEqual(validateRoleScopeAssignment('operator', ['deal:execute']), {
  ok: false,
  issues: ['SCOPE_PROHIBITED:deal:execute']
});

assert.deepStrictEqual(validateRoleScopeAssignment('unknown', ['audit:read']), {
  ok: false,
  issues: ['ROLE_NOT_REGISTERED']
});

console.log('Role scope registry check passed');
