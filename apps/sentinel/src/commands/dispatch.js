const { getSurfaceRegistry } = require('./registry');
const { normalizeCommandEnvelope } = require('../types/command');
const { auditLogger } = require('../audit/auditLogger');

async function dispatchCommand(body, context) {
  const envelope = normalizeCommandEnvelope(body);

  if (!envelope.tenant) {
    return {
      success: false,
      statusCode: 400,
      error: 'Tenant is required'
    };
  }

  if (!envelope.command) {
    return {
      success: false,
      statusCode: 400,
      error: 'Command is required'
    };
  }

  const surfaceRegistry = getSurfaceRegistry();
  const surface = surfaceRegistry[envelope.tenant];
  if (!surface) {
    return {
      success: false,
      statusCode: 400,
      error: `Unknown tenant: ${envelope.tenant}`
    };
  }

  const handler = surface.handlers[envelope.command];
  if (!handler) {
    return {
      success: false,
      statusCode: 400,
      error: `Unknown command: ${envelope.command}`
    };
  }

  if (
    envelope.command === 'deal.execute' &&
    (!envelope.metadata || envelope.metadata.role !== 'approver')
  ) {
    const failure = {
      success: false,
      statusCode: 403,
      error: 'FORBIDDEN',
      details: {
        requiredRole: 'approver'
      }
    };

    await auditLogger.log({
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result: failure,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return failure;
  }

  try {
    const result = await handler(
      envelope.payload,
      {
        ...context,
        tenant: envelope.tenant
      },
      envelope
    );

    await auditLogger.log({
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    const failure = {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Execution error'
    };

    await auditLogger.log({
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result: failure,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return failure;
  }
}

module.exports = {
  dispatchCommand
};
