const { verifyExecutionPassport } = require('./executionPassport');
const {
  recordAuthorityAllowed,
  recordAuthorityBlocked
} = require('./authorityState');

function getExecutionSource(envelope = {}, context = {}) {
  if (context && context.source) return context.source;
  if (envelope && envelope.source) return envelope.source;
  if (envelope && envelope.metadata && envelope.metadata.source) return envelope.metadata.source;
  return 'unknown';
}

function buildExecutionPath(envelope = {}, context = {}) {
  return {
    route: context.route || null,
    tenant: envelope.tenant || null,
    command: envelope.command || envelope.legacyCommand || 'unknown',
    commandId: envelope.commandId || null,
    sessionId: envelope.sessionId || null,
    source: getExecutionSource(envelope, context),
    actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : null
  };
}

function enforceSentinelExecution(envelope = {}, context = {}) {
  const executionPath = buildExecutionPath(envelope, context);
  console.log('EXECUTION PATH:', JSON.stringify(executionPath));

  if (executionPath.source !== 'sentinel') {
    recordAuthorityBlocked('unauthorized_execution', executionPath);

    return {
      allowed: false,
      statusCode: 403,
      error: 'UNAUTHORIZED_EXECUTION',
      details: {
        status: 'blocked',
        reason: 'unauthorized_execution',
        source: executionPath.source,
        executionPath
      }
    };
  }

  const passport = verifyExecutionPassport(envelope, context.passport || {});
  if (!passport.ok) {
    recordAuthorityBlocked(`unauthorized_execution:${passport.reason}`, executionPath);

    return {
      allowed: false,
      statusCode: 403,
      error: 'UNAUTHORIZED_EXECUTION',
      details: {
        status: 'blocked',
        reason: `unauthorized_execution:${passport.reason}`,
        source: executionPath.source,
        executionPath
      }
    };
  }

  recordAuthorityAllowed(executionPath);

  return {
    allowed: true,
    executionPath
  };
}

module.exports = {
  buildExecutionPath,
  enforceSentinelExecution,
  getExecutionSource
};
