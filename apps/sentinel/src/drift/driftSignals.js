// Drift Signals
// Purpose: Detect operational drift patterns from audit history and governance signals.
// Sentinel observes. It does not act.

const { createDriftSignal, DRIFT_TYPES } = require('./driftSchemas');

const APPROVAL_BOTTLENECK_THRESHOLD = 3;
const OPERATOR_OVERRIDE_THRESHOLD = 3;
const BLOCKED_PATH_SPIKE_THRESHOLD = 5;
const RETRY_PATTERN_THRESHOLD = 3;
const WINDOW_SIZE = 50;

function getRecentEntries(auditLog, tenant) {
  const entries = Array.isArray(auditLog) ? auditLog : [];
  const scoped = tenant ? entries.filter((e) => e && e.tenant === tenant) : entries;
  return scoped.slice(-WINDOW_SIZE);
}

function countByCommand(entries) {
  return entries.reduce((counts, entry) => {
    const cmd = entry.command || 'unknown';
    counts[cmd] = (counts[cmd] || 0) + 1;
    return counts;
  }, {});
}

function isBlocked(entry) {
  const result = entry && entry.result ? entry.result : {};
  return (
    result.success === false ||
    String(result.status || result.decision || '').toLowerCase().includes('block') ||
    Boolean(result.error)
  );
}

function detectGovernanceDrift(entries, tenant) {
  const approvalEntries = entries.filter((e) => e.command === 'approval.requested');
  if (approvalEntries.length >= APPROVAL_BOTTLENECK_THRESHOLD) {
    return createDriftSignal({
      type: DRIFT_TYPES.governance,
      severity: 'elevated',
      tenant,
      source: 'audit_analysis',
      pattern: `Approval bottleneck: ${approvalEntries.length} approval requests in recent window`,
      evidence: approvalEntries.slice(-3).map((e) => e.command)
    });
  }
  return null;
}

function detectOperatorDrift(entries, tenant) {
  const overrides = entries.filter((e) =>
    e.command === 'approval.approved' &&
    e.result &&
    e.result.status === 'approved'
  );
  const commandCounts = countByCommand(overrides);
  const repeated = Object.entries(commandCounts).filter(([, count]) => count >= OPERATOR_OVERRIDE_THRESHOLD);
  if (repeated.length) {
    return createDriftSignal({
      type: DRIFT_TYPES.operator,
      severity: 'warning',
      tenant,
      source: 'audit_analysis',
      pattern: `Repeated operator overrides detected: ${repeated.map(([cmd]) => cmd).join(', ')}`,
      evidence: repeated.map(([cmd, count]) => `${cmd}: ${count} times`)
    });
  }
  return null;
}

function detectWorkflowDrift(entries, tenant) {
  const commandCounts = countByCommand(entries.filter(isBlocked));
  const repeated = Object.entries(commandCounts).filter(([, count]) => count >= RETRY_PATTERN_THRESHOLD);
  if (repeated.length) {
    return createDriftSignal({
      type: DRIFT_TYPES.workflow,
      severity: 'elevated',
      tenant,
      source: 'audit_analysis',
      pattern: `Repeated blocked commands indicate workflow inefficiency: ${repeated.map(([cmd]) => cmd).join(', ')}`,
      evidence: repeated.map(([cmd, count]) => `${cmd} blocked ${count} times`)
    });
  }
  return null;
}

function detectTelemetryDrift(entries, tenant) {
  const blockedPaths = entries.filter((e) => e.command === 'blocked-path' || (e.result && e.result.governance === 'preflight' && e.result.success === false));
  if (blockedPaths.length >= BLOCKED_PATH_SPIKE_THRESHOLD) {
    return createDriftSignal({
      type: DRIFT_TYPES.telemetry,
      severity: 'elevated',
      tenant,
      source: 'telemetry_analysis',
      pattern: `Blocked-path event spike: ${blockedPaths.length} events in recent window`,
      evidence: blockedPaths.slice(-3).map((e) => e.command || 'unknown')
    });
  }
  return null;
}

function detectInfrastructureDrift(entries, tenant) {
  const deployEvents = entries.filter((e) => e.command && e.command.startsWith('system.'));
  const failedDeploys = deployEvents.filter(isBlocked);
  if (failedDeploys.length >= 2) {
    return createDriftSignal({
      type: DRIFT_TYPES.infrastructure,
      severity: 'warning',
      tenant,
      source: 'audit_analysis',
      pattern: `Deployment pattern instability: ${failedDeploys.length} failed system events`,
      evidence: failedDeploys.slice(-3).map((e) => e.command || 'unknown')
    });
  }
  return null;
}

function detectDriftSignals(auditLog, options = {}) {
  const tenant = options.tenant || null;
  const entries = getRecentEntries(auditLog, tenant);
  const detectors = [
    detectGovernanceDrift,
    detectOperatorDrift,
    detectWorkflowDrift,
    detectTelemetryDrift,
    detectInfrastructureDrift
  ];

  return detectors
    .map((detect) => detect(entries, tenant))
    .filter(Boolean);
}

module.exports = {
  detectDriftSignals
};
