const REQUIRED_METADATA = ['actor', 'role'];

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function blocked(statusCode, error, details = {}) {
  return {
    allowed: false,
    statusCode,
    error,
    details
  };
}

function governanceCheck(envelope) {
  if (!hasText(envelope.tenant)) {
    return blocked(400, 'TENANT_REQUIRED', {
      required: ['tenant']
    });
  }

  if (!hasText(envelope.command)) {
    return blocked(400, 'COMMAND_REQUIRED', {
      required: ['command']
    });
  }

  if (!envelope.metadata || typeof envelope.metadata !== 'object') {
    return blocked(400, 'METADATA_REQUIRED', {
      required: REQUIRED_METADATA
    });
  }

  const missingMetadata = REQUIRED_METADATA.filter((field) => !hasText(envelope.metadata[field]));
  if (missingMetadata.length) {
    return blocked(400, 'METADATA_INCOMPLETE', {
      required: REQUIRED_METADATA,
      missing: missingMetadata
    });
  }

  if (envelope.command === 'deal.execute' && envelope.metadata.role !== 'approver') {
    return blocked(403, 'FORBIDDEN', {
      requiredRole: 'approver',
      actor: envelope.metadata.actor,
      role: envelope.metadata.role
    });
  }

  return {
    allowed: true
  };
}

module.exports = {
  governanceCheck
};
