const TELEMETRY_STATUSES = Object.freeze({
  safe: 'SAFE_TO_SEND',
  approval: 'APPROVAL_REQUIRED',
  blocked: 'BLOCKED'
});

const TELEMETRY_SEVERITIES = Object.freeze({
  info: 'info',
  warning: 'warning',
  elevated: 'elevated',
  critical: 'critical'
});

const SEVERITY_MAP = Object.freeze({
  low: 'info',
  medium: 'warning',
  high: 'elevated',
  critical: 'critical'
});

function normalizeSeverity(value) {
  if (typeof value === 'string' && TELEMETRY_SEVERITIES[value.toLowerCase()]) {
    return value.toLowerCase();
  }
  return SEVERITY_MAP[typeof value === 'string' ? value.toLowerCase() : ''] || 'info';
}

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
  TELEMETRY_SEVERITIES,
  TELEMETRY_STATUSES,
  createTelemetryResponse,
  normalizeSeverity
};
