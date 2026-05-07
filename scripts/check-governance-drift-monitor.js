const assert = require('assert');
const fs = require('fs');
const {
  DEFAULT_BASELINE,
  evaluateContainmentDrift,
  logThresholdChange
} = require('../apps/sentinel/src/governance/vendorOnboarding/driftMonitor');

const stableMetrics = {
  case_count: 1000,
  rule_set_version: 'vendor-onboarding-v1.0',
  escalation_rate: 0.03,
  nvop_state_distribution: {
    0: 901,
    1: 69,
    2: 24,
    3: 6
  },
  operator_queue_peak_depth: 30,
  ledger_integrity_percent: 100,
  risk_index_histogram: {
    '0.0-0.1': 641,
    '0.1-0.2': 99,
    '0.2-0.3': 95,
    '0.5-0.6': 21,
    '1.3-1.4': 1,
    '2.0-2.1': 1,
    '3.1-3.2': 1
  },
  boundary_trigger_frequency: {
    '1.50': 1
  }
};

const stable = evaluateContainmentDrift(stableMetrics);
assert.strictEqual(stable.posture, 'stable');
assert.strictEqual(stable.severity, 'NONE');
assert.strictEqual(stable.breached.length, 0);
assert.strictEqual(stable.histogram.shape, 'smooth_tail');

const info = evaluateContainmentDrift({
  ...stableMetrics,
  escalation_rate: 0.041,
  nvop_state_distribution: {
    0: 890,
    1: 69,
    2: 30,
    3: 6
  }
});
assert.strictEqual(info.severity, 'INFO');
assert(info.breached.some((item) => item.name === 'escalation_rate' && item.severity === 'INFO'));

const overrideSpike = evaluateContainmentDrift({
  ...stableMetrics,
  operator_override_rate: 0.25
});
assert.strictEqual(overrideSpike.severity, 'WARNING');
assert(overrideSpike.breached.some((item) => item.name === 'operator_override_rate'));

const latencyShift = evaluateContainmentDrift({
  ...stableMetrics,
  average_latency_seconds_by_state: {
    0: 1,
    1: 3.7,
    2: 30,
    3: 60
  }
});
assert.strictEqual(latencyShift.severity, 'WARNING');
assert(latencyShift.breached.some((item) => item.name === 'state2_latency_relative_delta'));

const drifted = evaluateContainmentDrift({
  ...stableMetrics,
  escalation_rate: 0.07,
  nvop_state_distribution: {
    0: 820,
    1: 80,
    2: 75,
    3: 25
  },
  operator_queue_peak_depth: 75
});
assert.strictEqual(drifted.posture, 'containment_drift');
assert(drifted.breached.some((item) => item.name === 'escalation_rate'));
assert(drifted.breached.some((item) => item.name === 'refusal_rate'));
assert(drifted.breached.some((item) => item.name === 'state_0_distribution'));

const sustained = evaluateContainmentDrift({
  ...stableMetrics,
  escalation_rate: 0.07,
  nvop_state_distribution: {
    0: 820,
    1: 80,
    2: 75,
    3: 25
  }
}, { sustainedWindows: 3 });
assert.strictEqual(sustained.posture, 'critical_drift');
assert.strictEqual(sustained.severity, 'CRITICAL');

const auditFailure = evaluateContainmentDrift({
  ...stableMetrics,
  ledger_integrity_percent: 99.9
});
assert.strictEqual(auditFailure.posture, 'audit_integrity_failure');
assert.strictEqual(auditFailure.severity, 'CRITICAL');

const ledgerPath = '/private/tmp/sentinel_threshold_change_check_ledger.jsonl';
fs.rmSync(ledgerPath, { force: true });
const first = logThresholdChange({
  actor: 'governance@example.com',
  reason: 'Calibrate State 2 boundary after stress simulation.',
  from: { state2MinExclusive: 1.2 },
  to: { state2MinExclusive: 1.3 },
  approvalReference: 'GOV-BASELINE-001',
  timestamp: '2026-05-01T12:00:00.000Z'
}, { ledgerPath });
const second = logThresholdChange({
  actor: 'governance@example.com',
  reason: 'Record containment baseline lock.',
  from: DEFAULT_BASELINE,
  to: DEFAULT_BASELINE,
  approvalReference: 'GOV-BASELINE-LOCK',
  timestamp: '2026-05-01T12:01:00.000Z'
}, { ledgerPath });
const third = logThresholdChange({
  actor: 'governance@example.com',
  reason: 'Record tolerance framework lock.',
  from: { configVersion: 'draft' },
  to: { configVersion: 'vendor-onboarding-drift-v1.0' },
  capabilityId: 'vendor-onboarding.tolerance-change',
  approvalReference: 'GOV-DRIFT-001',
  timestamp: '2026-05-01T12:02:00.000Z'
}, { ledgerPath });
const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n').map(JSON.parse);
assert.strictEqual(lines.length, 3);
assert.strictEqual(lines[0].hash, first.hash);
assert.strictEqual(lines[1].previousHash, first.hash);
assert.strictEqual(lines[1].hash, second.hash);
assert.strictEqual(lines[2].previousHash, second.hash);
assert.strictEqual(lines[2].hash, third.hash);
assert.throws(() => logThresholdChange({
  actor: 'governance@example.com',
  from: { state2MinExclusive: 1.2 },
  to: { state2MinExclusive: 1.3 }
}, { ledgerPath }), /THRESHOLD_CHANGE_REASON_REQUIRED/);

console.log('Governance drift monitor check passed');
