const { buildPolicyContext, evaluatePolicy } = require('./policyEngine');
const { getDecisionSigningKey, signDecision } = require('../security/signing');

function buildGovernanceDecision(policy, policyContext, options = {}) {
  const decision = {
    decisionType: 'policy.preflight',
    tenant: policyContext.tenant || null,
    command: policyContext.command || null,
    actor: policyContext.actor || null,
    role: policyContext.role || null,
    requiredScope: policyContext.requiredScope || null,
    allowed: Boolean(policy.allowed),
    state: policy.state,
    riskLevel: policy.riskLevel,
    decision: policy.decision,
    reason: policy.reason || null,
    approvalRequired: Boolean(policy.approvalRequired),
    receiptRequired: policy.receiptRequired !== false
  };

  return signDecision(decision, getDecisionSigningKey(options));
}

function blocked(statusCode, error, details = {}) {
  return {
    allowed: false,
    statusCode,
    error,
    decision: details.decision || null,
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
  const decision = buildGovernanceDecision(policy, policyContext, options);

  if (!policy.allowed) {
    return blocked(policy.statusCode || 400, getLegacyError(policy), {
      ...policy.details,
      decision,
      policy,
      policyContext: {
        tenant: policyContext.tenant,
        actor: policyContext.actor,
        role: policyContext.role,
        command: policyContext.command,
        requiredScope: policyContext.requiredScope,
        decision
      }
    });
  }

  return {
    allowed: true,
    decision,
    policy,
    policyContext: {
      ...policyContext,
      decision
    }
  };
}

module.exports = {
  buildGovernanceDecision,
  buildPolicyContext,
  governanceCheck,
  evaluatePolicy
};
