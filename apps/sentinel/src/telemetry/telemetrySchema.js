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

const TELEMETRY_SEVERITY_RANK = Object.freeze({
  info: 0,
  warning: 1,
  elevated: 2,
  critical: 3
});

const SEVERITY_MAP = Object.freeze({
  low: 'info',
  medium: 'warning',
  high: 'elevated',
  critical: 'critical'
});

const TELEMETRY_ACTION_MAP = Object.freeze({
  'workflow.metrics': {
    command: 'telemetry.metric.write',
    riskLevel: 'low',
    reason: 'Workflow metrics are safe to harmonize.'
  },
  'deal.execution': {
    command: 'telemetry.audit.summary',
    riskLevel: 'medium',
    approvalRequired: true,
    reason: 'Deal execution telemetry requires governed review before release.'
  },
  'external.export': {
    command: 'telemetry.export.external',
    riskLevel: 'high',
    forceBlock: true,
    reason: 'External telemetry export is blocked without explicit approval boundary.'
  },
  'sensitive.payload': {
    command: 'telemetry.payload.sensitive',
    riskLevel: 'high',
    forceBlock: true,
    reason: 'Sensitive payload telemetry is blocked from direct transmission.'
  }
});

function normalizeSeverity(value) {
  if (typeof value === 'string' && TELEMETRY_SEVERITIES[value.toLowerCase()]) {
    return value.toLowerCase();
  }
  return SEVERITY_MAP[typeof value === 'string' ? value.toLowerCase() : ''] || 'info';
}

function maxSeverity(values = []) {
  return values
    .map(normalizeSeverity)
    .sort((left, right) => TELEMETRY_SEVERITY_RANK[right] - TELEMETRY_SEVERITY_RANK[left])[0] || 'info';
}

function normalizeTelemetryFindingSeverity({
  status = TELEMETRY_STATUSES.safe,
  riskLevel = 'low',
  forceBlock = false,
  approvalRequired = false,
  policy = {}
} = {}) {
  const policyRisk = policy && policy.riskLevel ? policy.riskLevel : null;
  const baseRisk = maxSeverity([riskLevel, policyRisk]);

  if (forceBlock || status === TELEMETRY_STATUSES.blocked) {
    return maxSeverity(['elevated', baseRisk]);
  }

  if (approvalRequired || status === TELEMETRY_STATUSES.approval || (policy && policy.approvalRequired)) {
    return maxSeverity(['warning', baseRisk]);
  }

  return normalizeSeverity(baseRisk);
}

function summarizeSeverity(details = []) {
  return details.reduce(
    (summary, detail) => {
      const severity = normalizeSeverity(detail && detail.severity);
      summary[severity] += 1;
      summary.highest = maxSeverity([summary.highest, severity]);
      return summary;
    },
    {
      info: 0,
      warning: 0,
      elevated: 0,
      critical: 0,
      highest: 'info'
    }
  );
}

function createTelemetryResponse({
  status = 'HARMONIZED',
  mode = 'GUARDED_VISIBILITY',
  telemetryState = 'LIMITED',
  summary = { safe: 0, requiresApproval: 0, blocked: 0 },
  severitySummary = { info: 0, warning: 0, elevated: 0, critical: 0, highest: 'info' },
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
    severitySummary,
    details,
    safeToSend,
    requiresApproval,
    blocked,
    auditArtifact,
    auditHash
  };
}

module.exports = {
  SEVERITY_MAP,
  TELEMETRY_ACTION_MAP,
  TELEMETRY_SEVERITY_RANK,
  TELEMETRY_SEVERITIES,
  TELEMETRY_STATUSES,
  createTelemetryResponse,
  maxSeverity,
  normalizeSeverity,
  normalizeTelemetryFindingSeverity,
  summarizeSeverity
};
