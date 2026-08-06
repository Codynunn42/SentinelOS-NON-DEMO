const ROLE_SCOPE_REGISTRY = {
  viewer: {
    role: 'viewer',
    description: 'Read-only operational visibility.',
    defaultScopes: ['audit:read', 'receipt:read', 'approval:read'],
    prohibitedScopes: [
      'application:submit',
      'application:evaluate',
      'deal:approve',
      'deal:execute',
      'approval:review',
      'tenant:admin',
      'platform:admin'
    ]
  },
  operator: {
    role: 'operator',
    description: 'Submit and operate non-execution workflows.',
    defaultScopes: [
      'application:submit',
      'application:read',
      'audit:read',
      'receipt:read',
      'approval:read'
    ],
    prohibitedScopes: ['approval:review', 'deal:execute', 'tenant:admin', 'platform:admin']
  },
  approver: {
    role: 'approver',
    description: 'Review and approve controlled actions.',
    defaultScopes: [
      'application:submit',
      'application:evaluate',
      'application:read',
      'deal:submit',
      'deal:approve',
      'audit:read',
      'receipt:read',
      'approval:read',
      'approval:review'
    ],
    prohibitedScopes: ['platform:admin']
  },
  auditor: {
    role: 'auditor',
    description: 'Audit, receipt, and approval visibility.',
    defaultScopes: ['audit:read', 'receipt:read', 'approval:read'],
    prohibitedScopes: [
      'application:submit',
      'application:evaluate',
      'deal:submit',
      'deal:approve',
      'deal:execute',
      'approval:review',
      'tenant:admin',
      'platform:admin'
    ]
  },
  platform: {
    role: 'platform',
    description: 'Governed platform maintenance.',
    defaultScopes: ['platform:admin'],
    prohibitedScopes: []
  }
};

function getRoleScopeDefinition(role) {
  return ROLE_SCOPE_REGISTRY[role] || null;
}

function getDefaultScopesForRole(role) {
  const definition = getRoleScopeDefinition(role);
  return definition ? [...definition.defaultScopes] : [];
}

function isScopeAllowedForRole(role, scope) {
  const definition = getRoleScopeDefinition(role);

  if (!definition || !scope) {
    return false;
  }

  if (definition.prohibitedScopes.includes(scope)) {
    return false;
  }

  return definition.defaultScopes.includes(scope) || definition.defaultScopes.includes('platform:admin');
}

function validateRoleScopeAssignment(role, scopes = []) {
  const definition = getRoleScopeDefinition(role);
  const issues = [];

  if (!definition) {
    return {
      ok: false,
      issues: ['ROLE_NOT_REGISTERED']
    };
  }

  if (!Array.isArray(scopes) || scopes.length === 0) {
    issues.push('SCOPES_REQUIRED');
  }

  scopes.forEach((scope) => {
    if (definition.prohibitedScopes.includes(scope)) {
      issues.push(`SCOPE_PROHIBITED:${scope}`);
    }
  });

  return {
    ok: issues.length === 0,
    issues
  };
}

module.exports = {
  ROLE_SCOPE_REGISTRY,
  getRoleScopeDefinition,
  getDefaultScopesForRole,
  isScopeAllowedForRole,
  validateRoleScopeAssignment
};
