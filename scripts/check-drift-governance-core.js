const assert = require('assert');
const fs = require('fs');
const baseline = require('../apps/sentinel/src/governance/core/containmentBaseline_v1.json');
const { driftConfig } = require('../apps/sentinel/src/governance/core/driftConfig');
const {
  appendDriftAcknowledgement,
  appendDriftConfigUpdate,
  readEntries
} = require('../apps/sentinel/src/governance/core/driftPolicyLedger');
const {
  evaluateAndAppendDriftEvents,
  evaluateDrift
} = require('../apps/sentinel/src/governance/core/driftMonitor');

assert.strictEqual(driftConfig.configVersion, '1.0.0');
assert.strictEqual(driftConfig.baselineVersion, baseline.baselineVersion);
assert.strictEqual(driftConfig.escalationRate.baseline, baseline.escalationRate);
assert.strictEqual(Object.isFrozen(driftConfig), true);

const stableMetrics = {
  case_count: 1000,
  escalation_rate: 0.03,
  nvop_state_distribution: {
    0: 901,
    1: 69,
    2: 24,
    3: 6
  },
  average_latency_seconds_by_state: {
    0: 1,
    1: 3.7,
    2: 19.38,
    3: 60
  },
  operator_override_rate: 0
};
const stable = evaluateDrift(stableMetrics);
assert.strictEqual(stable.posture, 'stable');
assert.strictEqual(stable.severity, 'NONE');
assert.strictEqual(stable.observationalOnly, true);
assert.strictEqual(stable.driftEvents.length, 0);

const warning = evaluateDrift({
  ...stableMetrics,
  escalation_rate: 0.047,
  nvop_state_distribution: {
    0: 870,
    1: 83,
    2: 41,
    3: 6
  }
});
assert.strictEqual(warning.posture, 'review_required');
assert.strictEqual(warning.severity, 'WARNING');
assert(warning.driftEvents.some((event) => event.type === 'ESCALATION'));
assert(warning.driftEvents.every((event) => event.acknowledged === false));

const singleCritical = evaluateDrift({
  ...stableMetrics,
  escalation_rate: 0.07,
  nvop_state_distribution: {
    0: 820,
    1: 80,
    2: 75,
    3: 25
  }
}, { sustainedCount: 1 });
assert.strictEqual(singleCritical.severity, 'WARNING');

const sustainedCritical = evaluateDrift({
  ...stableMetrics,
  escalation_rate: 0.07,
  nvop_state_distribution: {
    0: 820,
    1: 80,
    2: 75,
    3: 25
  }
}, { sustainedCount: 3 });
assert.strictEqual(sustainedCritical.severity, 'CRITICAL');

const ledgerPath = '/private/tmp/sentinel_drift_governance_core_check.jsonl';
fs.rmSync(ledgerPath, { force: true });
const firstUpdate = appendDriftConfigUpdate({
  oldConfigVersion: '1.0.0',
  newConfigVersion: '1.1.0',
  changes: {
    escalationRate: {
      infoUpper: { from: 0.04, to: 0.041 }
    }
  },
  rationale: 'Governance review test update.',
  actorId: 'governance@example.com',
  timestamp: '2026-05-02T12:00:00.000Z'
}, { ledgerPath });
const secondUpdate = appendDriftConfigUpdate({
  oldConfigVersion: '1.1.0',
  newConfigVersion: '1.2.0',
  changes: {
    escalationRate: {
      infoUpper: { from: 0.041, to: 0.042 }
    }
  },
  rationale: 'Second threshold update inside 30 days should become critical.',
  actorId: 'governance@example.com',
  timestamp: '2026-05-03T12:00:00.000Z'
}, { ledgerPath });
assert.strictEqual(firstUpdate.severity, 'WARNING');
assert.strictEqual(secondUpdate.severity, 'CRITICAL');
assert.strictEqual(secondUpdate.previousHash, firstUpdate.hash);

assert.throws(() => appendDriftConfigUpdate({
  oldConfigVersion: '1.2.0',
  newConfigVersion: '1.2.0',
  changes: { noop: true },
  rationale: 'Missing increment.',
  actorId: 'governance@example.com'
}, { ledgerPath }), /DRIFT_CONFIG_VERSION_INCREMENT_REQUIRED/);

const appended = evaluateAndAppendDriftEvents({
  ...stableMetrics,
  operator_override_rate: 0.25
}, { ledgerPath });
assert.strictEqual(appended.driftEvents.length, 1);
const ack = appendDriftAcknowledgement({
  driftId: appended.driftEvents[0].driftId,
  acknowledgedBy: 'governance@example.com',
  acknowledgedAt: '2026-05-04T12:00:00.000Z'
}, { ledgerPath });
const entries = readEntries(ledgerPath);
assert.strictEqual(entries.length, 4);
assert.strictEqual(entries[3].previousHash, entries[2].hash);
assert.strictEqual(entries[3].hash, ack.hash);

console.log('Drift governance core check passed');
