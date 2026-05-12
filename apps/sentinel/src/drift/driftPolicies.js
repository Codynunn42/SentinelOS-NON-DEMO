// Drift Policies
// Purpose: Define the hard boundaries of what Sentinel may recommend and what it may never touch.
// These are not runtime checks. They are the governing rules for the drift system.

const IMMUTABLE_TARGETS = Object.freeze([
  'apps/sentinel/src/governance/authorityState.js',
  'apps/sentinel/src/governance/executionGuard.js',
  'apps/sentinel/src/governance/executionPassport.js',
  'apps/sentinel/src/security/signing.js',
  'apps/sentinel/src/audit/auditLogger.js',
  'apps/sentinel/src/approval/approval.js'
]);

const ALLOWED_FORK_TARGETS = Object.freeze([
  'apps/sentinel/src/governance/policyEngine.js',
  'apps/sentinel/src/commands/dispatch.js',
  'apps/sentinel/src/telemetry/telemetrySchema.js',
  'apps/sentinel/src/verification/stateAnchors.js',
  'apps/sentinel/src/learning/engine.js'
]);

function isForkTargetAllowed(filePath) {
  if (IMMUTABLE_TARGETS.includes(filePath)) {
    return false;
  }
  return ALLOWED_FORK_TARGETS.includes(filePath);
}

function validateForkProposal(proposedFork) {
  if (!proposedFork || !Array.isArray(proposedFork.targetFiles)) {
    return { valid: false, reason: 'Fork proposal missing targetFiles' };
  }

  const blocked = proposedFork.targetFiles.filter((f) => IMMUTABLE_TARGETS.includes(f));
  if (blocked.length) {
    return {
      valid: false,
      reason: `Fork targets immutable governance files: ${blocked.join(', ')}`
    };
  }

  return { valid: true };
}

module.exports = {
  ALLOWED_FORK_TARGETS,
  IMMUTABLE_TARGETS,
  isForkTargetAllowed,
  validateForkProposal
};
