const { evaluatePolicy } = require('./policyEngine');

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
  if (policy.reason.includes('ACTOR_REQUIRED') || policy.reason.includes('ROLE_REQUIRED')) {
    return policy.state === 'invalid' ? 'METADATA_INCOMPLETE' : 'FORBIDDEN';
  }

  if (policy.reason === 'impossible_travel') return 'IDENTITY_RISK_BLOCKED';

  return policy.reason || 'POLICY_BLOCKED';
}

function governanceCheck(envelope, signals = {}) {
  const policy = evaluatePolicy(envelope, signals);

  if (!policy.allowed) {
    return blocked(policy.statusCode || 400, getLegacyError(policy), {
      ...policy.details,
      policy
    });
  }

  return {
    allowed: true,
    policy
  };
}

module.exports = {
  governanceCheck,
  evaluatePolicy
};
