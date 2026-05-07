const crypto = require('crypto');

function buildEnvelope(input) {
  const command = input.intent.trim();
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const sessionId = typeof metadata.sessionId === 'string' && metadata.sessionId.trim() !== ''
    ? metadata.sessionId.trim()
    : 'control-plane';

  return {
    commandId: crypto.randomUUID(),
    sessionId,
    tenant: input.tenantId.trim(),
    command,
    payload: input.context && typeof input.context === 'object' ? input.context : {},
    metadata: {
      role: input.actor.role.trim(),
      tenantId: input.tenantId.trim(),
      actor: input.actor.userId || metadata.actor,
      ...metadata
    }
  };
}

module.exports = {
  buildEnvelope
};
