const fs = require('fs');
const { createAuditLedger, stableStringify } = require('./auditLedger');
const { RULE_SET_VERSION } = require('./nvopConfig');
const {
  DRIFT_BASELINE,
  DRIFT_CONFIG_VERSION,
  DRIFT_TOLERANCE
} = require('./driftConfig');
const crypto = require('crypto');

const DEFAULT_THRESHOLD_LEDGER_PATH = '/private/tmp/sentinel_threshold_change_ledger.jsonl';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function rateFor(metrics, state) {
  const count = Number(metrics && metrics.nvop_state_distribution && metrics.nvop_state_distribution[String(state)] || 0);
  const total = Number(metrics && metrics.case_count || 0);
  return total > 0 ? count / total : 0;
}

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function readMetrics(metricsOrPath) {
  if (typeof metricsOrPath === 'string') {
    return JSON.parse(fs.readFileSync(metricsOrPath, 'utf8'));
  }

  return metricsOrPath || {};
}

function severityRank(severity) {
  return ['NONE', 'INFO', 'WARNING', 'CRITICAL'].indexOf(severity);
}

function maxSeverity(left, right) {
  return severityRank(left) >= severityRank(right) ? left : right;
}

function classifyEscalationRate(value, tolerance) {
  if (value < tolerance.warningLow || value > tolerance.warningHigh) return 'CRITICAL';
  if (value < tolerance.infoLow || value > tolerance.infoHigh) return 'WARNING';
  if (value < tolerance.normalLow || value > tolerance.normalHigh) return 'INFO';
  return 'NONE';
}

function classifyRefusalRate(value, tolerance) {
  if (value > tolerance.warningHigh) return 'CRITICAL';
  if (value > tolerance.stableHigh) return 'WARNING';
  return 'NONE';
}

function classifyDistributionShift(delta, tolerance) {
  const absolute = Math.abs(delta);
  if (absolute > tolerance.criticalAbsoluteDelta) return 'CRITICAL';
  if (absolute > tolerance.warningAbsoluteDelta) return 'WARNING';
  return 'NONE';
}

function classifyOverrideRate(value, tolerance) {
  if (value > tolerance.warningHigh) return 'CRITICAL';
  if (value > tolerance.infoHigh) return 'WARNING';
  if (value > tolerance.stableHigh) return 'INFO';
  return 'NONE';
}

function classifyLatencyDelta(relativeDelta, tolerance) {
  const absolute = Math.abs(relativeDelta);
  if (absolute > tolerance.criticalRelativeDelta) return 'CRITICAL';
  if (absolute > tolerance.warningRelativeDelta) return 'WARNING';
  if (absolute > tolerance.infoRelativeDelta) return 'INFO';
  return 'NONE';
}

function compareMetric(name, current, baseline, severity) {
  return {
    name,
    current: round(current),
    baseline: round(baseline),
    delta: round(current - baseline),
    severity,
    breached: severity !== 'NONE'
  };
}

function summarizeRiskHistogram(histogram = {}) {
  const buckets = Object.entries(histogram).map(([bucket, count]) => {
    const lower = Number(bucket.split('-')[0]);
    return { bucket, lower, count: Number(count) };
  });
  const low = buckets.filter((item) => item.lower < 0.5).reduce((total, item) => total + item.count, 0);
  const advisory = buckets.filter((item) => item.lower >= 0.5 && item.lower < 1.3).reduce((total, item) => total + item.count, 0);
  const escalation = buckets.filter((item) => item.lower >= 1.3 && item.lower <= 3.0).reduce((total, item) => total + item.count, 0);
  const refusal = buckets.filter((item) => item.lower > 3.0).reduce((total, item) => total + item.count, 0);

  return {
    low,
    advisory,
    escalation,
    refusal,
    shape:
      low >= advisory && advisory >= escalation && refusal <= escalation
        ? 'smooth_tail'
        : 'review_required'
  };
}

function rateDistribution(metrics) {
  return {
    0: rateFor(metrics, 0),
    1: rateFor(metrics, 1),
    2: rateFor(metrics, 2),
    3: rateFor(metrics, 3)
  };
}

function evaluateContainmentDrift(metricsOrPath, options = {}) {
  const metrics = readMetrics(metricsOrPath);
  const baseline = options.baseline || DRIFT_BASELINE;
  const tolerance = options.tolerance || DRIFT_TOLERANCE;
  const escalationRate = Number(metrics.escalation_rate || 0);
  const refusalRate = rateFor(metrics, 3);
  const advisoryRate = rateFor(metrics, 1);
  const queuePeak = Number(metrics.operator_queue_peak_depth || 0);
  const ledgerIntegrityPercent = Number(metrics.ledger_integrity_percent || 0);
  const distribution = rateDistribution(metrics);
  const overrideRate = Number(metrics.operator_override_rate || 0);
  const currentState2Latency =
    metrics.average_latency_seconds_by_state && metrics.average_latency_seconds_by_state[2] !== undefined
      ? Number(metrics.average_latency_seconds_by_state[2])
      : metrics.average_latency_seconds_by_state && metrics.average_latency_seconds_by_state['2'] !== undefined
        ? Number(metrics.average_latency_seconds_by_state['2'])
        : baseline.averageLatencySecondsByState[2];
  const baselineState2Latency = baseline.averageLatencySecondsByState[2];
  const latencyDelta =
    baselineState2Latency > 0 ? (currentState2Latency - baselineState2Latency) / baselineState2Latency : 0;
  const comparisons = [
    compareMetric('escalation_rate', escalationRate, baseline.escalationRate, classifyEscalationRate(escalationRate, tolerance.escalationRate)),
    compareMetric('refusal_rate', refusalRate, baseline.refusalRate, classifyRefusalRate(refusalRate, tolerance.refusalRate)),
    compareMetric('operator_override_rate', overrideRate, 0, classifyOverrideRate(overrideRate, tolerance.operatorOverrideRate)),
    compareMetric('state2_latency_relative_delta', latencyDelta, 0, classifyLatencyDelta(latencyDelta, tolerance.latencyDrift)),
    compareMetric(
      'ledger_integrity_percent',
      ledgerIntegrityPercent,
      baseline.ledgerIntegrityPercent,
      ledgerIntegrityPercent < baseline.ledgerIntegrityPercent ? 'CRITICAL' : 'NONE'
    )
  ];

  for (const state of [0, 1, 2, 3]) {
    const current = distribution[state];
    const expected = baseline.stateDistribution[state];
    comparisons.push(compareMetric(
      `state_${state}_distribution`,
      current,
      expected,
      classifyDistributionShift(current - expected, tolerance.distributionShift)
    ));
  }

  const histogram = summarizeRiskHistogram(metrics.risk_index_histogram || {});
  const breached = comparisons.filter((item) => item.breached);
  const maxComparisonSeverity = breached.reduce((severity, item) => maxSeverity(severity, item.severity), 'NONE');
  const sustainedWindows = Number(options.sustainedWindows || 1);
  const sustainedCritical =
    maxComparisonSeverity === 'CRITICAL' && sustainedWindows >= tolerance.sustainedDeviationWindows;
  const posture =
    comparisons.some((item) => item.name === 'ledger_integrity_percent' && item.severity === 'CRITICAL')
      ? 'audit_integrity_failure'
      : sustainedCritical
        ? 'critical_drift'
        : breached.length === 0 && histogram.shape === 'smooth_tail'
        ? 'stable'
        : breached.some((item) => ['escalation_rate', 'refusal_rate', 'operator_override_rate'].includes(item.name))
          ? 'containment_drift'
          : 'watch';
  const severity =
    posture === 'audit_integrity_failure'
      ? 'CRITICAL'
      : sustainedCritical
        ? 'CRITICAL'
        : histogram.shape !== 'smooth_tail' && maxComparisonSeverity === 'NONE'
          ? 'INFO'
          : maxComparisonSeverity;

  return {
    driftConfigVersion: DRIFT_CONFIG_VERSION,
    ruleSetVersion: metrics.rule_set_version || baseline.ruleSetVersion,
    caseCount: metrics.case_count || 0,
    posture,
    severity,
    breached,
    comparisons,
    histogram,
    boundaryTriggerFrequency: metrics.boundary_trigger_frequency || {},
    summary:
      posture === 'stable'
        ? 'Containment posture remains within frozen v1 baseline tolerance.'
        : 'Containment posture requires governance review before presentation or threshold change.',
    generatedAt: new Date().toISOString()
  };
}

function logThresholdChange(change, options = {}) {
  const ledger = createAuditLedger({
    ledgerPath: options.ledgerPath || DEFAULT_THRESHOLD_LEDGER_PATH
  });
  const timestamp = change.timestamp || new Date().toISOString();
  const thresholdRecord = {
    actor: change.actor || 'unknown',
    reason: change.reason || '',
    from: change.from,
    to: change.to,
    approvalReference: change.approvalReference || null,
    timestamp
  };

  if (!thresholdRecord.reason.trim()) {
    throw new Error('THRESHOLD_CHANGE_REASON_REQUIRED');
  }

  if (!thresholdRecord.from || !thresholdRecord.to) {
    throw new Error('THRESHOLD_CHANGE_DIFF_REQUIRED');
  }

  const hash = sha256(stableStringify(thresholdRecord));
  return ledger.appendEntry({
    workflowId: change.workflowId || `threshold_change_${timestamp}`,
    capabilityId: change.capabilityId || 'vendor-onboarding.threshold-change',
    ruleSetVersion: change.ruleSetVersion || RULE_SET_VERSION,
    nvopState: 2,
    latencyClass: 'governance_review',
    escalationFlag: true,
    timestamp,
    hash
  });
}

module.exports = {
  DEFAULT_BASELINE: DRIFT_BASELINE,
  evaluateContainmentDrift,
  logThresholdChange,
  summarizeRiskHistogram
};
