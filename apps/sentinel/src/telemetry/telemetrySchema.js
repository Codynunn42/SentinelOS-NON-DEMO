const TELEMETRY_STATUSES = Object.freeze({
  safe: 'SAFE_TO_SEND',
  approval: 'APPROVAL_REQUIRED',
  blocked: 'BLOCKED'
});

function createTelemetryResponse({
  status = 'HARMONIZED',
  mode = 'GUARDED_VISIBILITY',
  telemetryState = 'LIMITED',
  summary = { safe: 0, requiresApproval: 0, blocked: 0 },
  details = [],
  safeToSend = [],
  requiresApproval = [],
  blocked = [],
  auditArtifact = null,
  auditHash = null
} = {}) {
  return {
    status,
    mode,
    telemetryState,
    summary,
    details,
    safeToSend,
    requiresApproval,
    blocked,
    auditArtifact,
    auditHash
  };
}

module.exports = {
  TELEMETRY_STATUSES,
  createTelemetryResponse
};
