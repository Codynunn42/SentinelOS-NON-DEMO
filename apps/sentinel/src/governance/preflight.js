const { buildPolicyContext, evaluatePolicy } = require('./policyEngine');

function blocked(statusCode, error, details = {}) {
  return {
    allowed: false,
    statusCode,
    error,
    details
  };
}

function getLegacyError(policy) {
  if (policy.reason.includes('TENANT_REQUIRED')) return 'TENANT_REQUIRED';
  if (policy.reason.includes('COMMAND_REQUIRED')) return 'COMMAND_REQUIRED';
  if (policy.reason.includes('METADATA_REQUIRED')) return 'METADATA_REQUIRED';
  if (policy.reason.includes('ACTOR_REQUIRED') || policy.reason.includes('ROLE_REQUIRED') || policy.reason.includes('SCOPES_REQUIRED')) {
    return policy.state === 'invalid' ? 'METADATA_INCOMPLETE' : 'FORBIDDEN';
  }

  if (policy.reason === 'TENANT_MISMATCH') return 'TENANT_MISMATCH';
  if (policy.reason === 'SCOPE_MAPPING_REQUIRED') return 'SCOPE_MAPPING_REQUIRED';
  if (policy.reason === 'SCOPE_REQUIRED') return 'SCOPE_REQUIRED';
  if (policy.reason === 'impossible_travel') return 'IDENTITY_RISK_BLOCKED';

  return policy.reason || 'POLICY_BLOCKED';
}

function governanceCheck(envelope, signals = {}, principal = null, options = {}) {
  const policyContext = buildPolicyContext(envelope, principal, {
    ...options,
    signals
  });
  const policy = evaluatePolicy(policyContext);

  if (!policy.allowed) {
    return blocked(policy.statusCode || 400, getLegacyError(policy), {
      ...policy.details,
      policy,
      policyContext: {
        tenant: policyContext.tenant,
        actor: policyContext.actor,
        role: policyContext.role,
        command: policyContext.command,
        requiredScope: policyContext.requiredScope
      }
    });
  }

  return {
    allowed: true,
    policy,
    policyContext
  };
}

module.exports = {
  buildPolicyContext,
  governanceCheck,
  evaluatePolicy
};
