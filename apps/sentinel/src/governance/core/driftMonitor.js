const crypto = require('crypto');
const baseline = require('./containmentBaseline_v1.json');
const { driftConfig } = require('./driftConfig');
const { appendDriftEvent, stableStringify } = require('./driftPolicyLedger');

const SEVERITY_ORDER = ['NONE', 'INFO', 'WARNING', 'CRITICAL'];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function severityRank(severity) {
  return SEVERITY_ORDER.indexOf(severity);
}

function maxSeverity(left, right) {
  return severityRank(left) >= severityRank(right) ? left : right;
}

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function rateFor(metrics, state) {
  const count = Number(metrics && metrics.nvop_state_distribution && metrics.nvop_state_distribution[String(state)] || 0);
  const total = Number(metrics && metrics.case_count || 0);
  return total > 0 ? count / total : 0;
}

function classifyEscalation(value, config) {
  if (value < config.criticalLower || value > config.criticalUpper) return 'CRITICAL';
  if (value < config.warningLower || value > config.warningUpper) return 'WARNING';
  if (value < config.infoLower || value > config.infoUpper) return 'INFO';
  return 'NONE';
}

function classifyRefusal(value, config) {
  if (value > config.criticalUpper) return 'CRITICAL';
  if (value > config.warningUpper) return 'WARNING';
  return 'NONE';
}

function classifyDistribution(delta, config) {
  const absolute = Math.abs(delta);
  if (absolute > config.criticalAbsoluteShift) return 'CRITICAL';
  if (absolute > config.warningAbsoluteShift) return 'WARNING';
  return 'NONE';
}

function classifyOverride(value, config) {
  if (value > config.warningUpper) return 'CRITICAL';
  if (value > config.infoUpper) return 'WARNING';
  if (value > config.stableUpper) return 'INFO';
  return 'NONE';
}

function classifyLatency(relativeDelta, config) {
  const absolute = Math.abs(relativeDelta);
  if (absolute > config.criticalPercent) return 'CRITICAL';
  if (absolute > config.warningPercent) return 'WARNING';
  if (absolute > config.infoPercent) return 'INFO';
  return 'NONE';
}

function buildDriftEvent({ type, baselineValue, observedValue, toleranceBand, severity, windowStart, windowEnd, sustainedCount }) {
  const timestamp = new Date().toISOString();
  const raw = {
    type,
    baselineValue,
    observedValue,
    toleranceBand,
    severity,
    windowStart,
    windowEnd,
    sustainedCount,
    acknowledged: false,
    acknowledgedBy: null,
    timestamp
  };

  return Object.freeze({
    driftId: `drift_${sha256(stableStringify(raw)).slice(0, 18)}`,
    ...raw,
    hash: sha256(stableStringify(raw))
  });
}

function readMetric(metrics, key, fallback = 0) {
  return metrics && metrics[key] !== undefined ? Number(metrics[key]) : fallback;
}

function getState2Latency(metrics) {
  const profile = metrics.average_latency_seconds_by_state || {};
  if (profile[2] !== undefined) return Number(profile[2]);
  if (profile.state2 !== undefined) return Number(profile.state2);
  if (profile['2'] !== undefined) return Number(profile['2']);
  return baseline.latencyProfile.averageReviewSecondsByState.state2;
}

function evaluateMetric({ events, type, baselineValue, observedValue, toleranceBand, severity, windowStart, windowEnd, sustainedCount }) {
  if (severity === 'NONE') {
    return;
  }

  const sustainedSeverity =
    severity === 'CRITICAL' && sustainedCount < driftConfig.sustainedDeviationWindows.consecutiveWindowsForCritical
      ? 'WARNING'
      : severity;

  events.push(buildDriftEvent({
    type,
    baselineValue: round(baselineValue),
    observedValue: round(observedValue),
    toleranceBand,
    severity: sustainedSeverity,
    windowStart,
    windowEnd,
    sustainedCount
  }));
}

function evaluateDrift(metrics = {}, options = {}) {
  const windowStart = options.windowStart || metrics.window_start || metrics.windowStart || null;
  const windowEnd = options.windowEnd || metrics.window_end || metrics.windowEnd || null;
  const sustainedCount = Number(options.sustainedCount || metrics.sustained_count || 1);
  const events = [];
  const escalationRate = readMetric(metrics, 'escalation_rate');
  const refusalRate = rateFor(metrics, 3);
  const overrideRate = readMetric(metrics, 'operator_override_rate');
  const state2Latency = getState2Latency(metrics);
  const baselineState2Latency = baseline.latencyProfile.averageReviewSecondsByState.state2;
  const latencyDelta = baselineState2Latency > 0 ? (state2Latency - baselineState2Latency) / baselineState2Latency : 0;

  evaluateMetric({
    events,
    type: 'ESCALATION',
    baselineValue: driftConfig.escalationRate.baseline,
    observedValue: escalationRate,
    toleranceBand: '2.0%-4.0% normal; 1.0%-5.5% bounded',
    severity: classifyEscalation(escalationRate, driftConfig.escalationRate),
    windowStart,
    windowEnd,
    sustainedCount
  });

  evaluateMetric({
    events,
    type: 'REFUSAL',
    baselineValue: driftConfig.refusalRate.baseline,
    observedValue: refusalRate,
    toleranceBand: '0%-1.0% stable; >2.0% critical',
    severity: classifyRefusal(refusalRate, driftConfig.refusalRate),
    windowStart,
    windowEnd,
    sustainedCount
  });

  for (const state of [0, 1, 2, 3]) {
    const key = `state${state}`;
    const observed = rateFor(metrics, state);
    const expected = driftConfig.distributionShift.baseline[key];
    evaluateMetric({
      events,
      type: 'DISTRIBUTION',
      baselineValue: expected,
      observedValue: observed,
      toleranceBand: '+/-5% warning; +/-8% critical',
      severity: classifyDistribution(observed - expected, driftConfig.distributionShift),
      windowStart,
      windowEnd,
      sustainedCount
    });
  }

  evaluateMetric({
    events,
    type: 'OVERRIDE',
    baselineValue: 0,
    observedValue: overrideRate,
    toleranceBand: '0%-10% stable; >30% critical',
    severity: classifyOverride(overrideRate, driftConfig.overrideRate),
    windowStart,
    windowEnd,
    sustainedCount
  });

  evaluateMetric({
    events,
    type: 'LATENCY',
    baselineValue: baselineState2Latency,
    observedValue: state2Latency,
    toleranceBand: '+/-25% info; +/-50% warning; >75% critical',
    severity: classifyLatency(latencyDelta, driftConfig.latencyDrift),
    windowStart,
    windowEnd,
    sustainedCount
  });

  const max = events.reduce((severity, event) => maxSeverity(severity, event.severity), 'NONE');

  return {
    baselineVersion: baseline.baselineVersion,
    configVersion: driftConfig.configVersion,
    ruleSetVersion: driftConfig.ruleSetVersion,
    posture: events.length === 0 ? 'stable' : max === 'CRITICAL' ? 'critical_drift' : 'review_required',
    severity: max,
    driftEvents: events,
    eventCount: events.length,
    observationalOnly: true
  };
}

function evaluateAndAppendDriftEvents(metrics = {}, options = {}) {
  const result = evaluateDrift(metrics, options);
  const ledgerPath = options.ledgerPath;
  result.driftEvents.forEach((event) => appendDriftEvent(event, { ledgerPath }));
  return result;
}

module.exports = {
  buildDriftEvent,
  evaluateAndAppendDriftEvents,
  evaluateDrift
};
