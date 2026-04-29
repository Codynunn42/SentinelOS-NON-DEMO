function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function blocked(state, riskLevel, reason, details = {}) {
  return {
    allowed: false,
    state,
    riskLevel,
    decision: 'block',
    reason,
    approvalRequired: Boolean(details.approvalRequired),
    statusCode: details.statusCode || 400,
    details
  };
}

function allowed() {
  return {
    allowed: true,
    state: 'clean',
    riskLevel: 'low',
    decision: 'allow',
    approvalRequired: false
  };
}

function evaluatePolicy(envelope = {}, signals = {}) {
  const missing = [];

  if (!hasText(envelope.tenant)) {
    missing.push('TENANT_REQUIRED');
  }

  if (!hasText(envelope.command)) {
    missing.push('COMMAND_REQUIRED');
  }

  if (!envelope.metadata || typeof envelope.metadata !== 'object') {
    missing.push('METADATA_REQUIRED');
  } else {
    if (!hasText(envelope.metadata.actor)) {
      missing.push('ACTOR_REQUIRED');
    }

    if (!hasText(envelope.metadata.role)) {
      missing.push('ROLE_REQUIRED');
    }
  }

  if (missing.length) {
    return blocked('invalid', 'low', missing.join(','), {
      required: ['tenant', 'command', 'metadata.actor', 'metadata.role'],
      missing,
      approvalRequired: false,
      statusCode: 400
    });
  }

  if (signals.identity && signals.identity.impossibleTravel === true) {
    return blocked('drift', 'high', 'impossible_travel', {
      actor: envelope.metadata.actor,
      approvalRequired: true,
      statusCode: 403
    });
  }

  if (envelope.command === 'deal.execute' && envelope.metadata.role !== 'approver') {
    return blocked('restricted', 'medium', 'ROLE_REQUIRED', {
      requiredRole: 'approver',
      actor: envelope.metadata.actor,
      role: envelope.metadata.role,
      approvalRequired: true,
      statusCode: 403
    });
  }

  return allowed();
}

module.exports = {
  evaluatePolicy
};
