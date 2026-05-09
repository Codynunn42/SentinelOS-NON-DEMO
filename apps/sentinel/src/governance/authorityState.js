const authorityState = {
  authority: 'ENFORCED',
  lastCheck: null,
  lastAllowed: null,
  lastBlocked: null,
  drift: null,
  nextAction: null
};

function now() {
  return new Date().toISOString();
}

function compactExecutionPath(executionPath = {}) {
  return {
    command: executionPath.command || 'unknown',
    tenant: executionPath.tenant || null,
    route: executionPath.route || null,
    source: executionPath.source || 'unknown',
    actor: executionPath.actor || null,
    commandId: executionPath.commandId || null,
    time: now()
  };
}

function recordAuthorityAllowed(executionPath) {
  authorityState.lastCheck = now();
  authorityState.lastAllowed = compactExecutionPath(executionPath);
  authorityState.nextAction = null;
}

function recordAuthorityBlocked(reason, executionPath) {
  authorityState.lastCheck = now();
  authorityState.lastBlocked = {
    ...compactExecutionPath(executionPath),
    reason: reason || 'unauthorized_execution'
  };
  authorityState.drift = 'execution_authority_violation';
  authorityState.nextAction = 'hold_and_escalate';
}

function getAuthorityStatus() {
  return {
    ...authorityState,
    lastCheck: authorityState.lastCheck || now()
  };
}

function resetAuthorityStatus() {
  authorityState.lastCheck = null;
  authorityState.lastAllowed = null;
  authorityState.lastBlocked = null;
  authorityState.drift = null;
  authorityState.nextAction = null;
}

module.exports = {
  getAuthorityStatus,
  recordAuthorityAllowed,
  recordAuthorityBlocked,
  resetAuthorityStatus
};
