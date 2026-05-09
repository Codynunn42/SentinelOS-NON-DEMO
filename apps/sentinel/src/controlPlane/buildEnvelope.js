const crypto = require('crypto');
const { signExecutionPassport } = require('../governance/executionPassport');

function buildEnvelope(input) {
  const command = input.intent.trim();
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const sessionId = typeof metadata.sessionId === 'string' && metadata.sessionId.trim() !== ''
    ? metadata.sessionId.trim()
    : 'control-plane';

  const envelope = {
    commandId: crypto.randomUUID(),
    sessionId,
    tenant: input.tenantId.trim(),
    command,
    source: 'sentinel',
    payload: input.context && typeof input.context === 'object' ? input.context : {},
    metadata: {
      role: input.actor.role.trim(),
      tenantId: input.tenantId.trim(),
      actor: input.actor.userId || metadata.actor,
      ...metadata,
      source: 'sentinel'
    }
  };

  return signExecutionPassport(envelope);
}

module.exports = {
  buildEnvelope
};
