// Mock Drift Scenarios
// Purpose: Inject specific drift conditions to test Sentinel's detection and recommendation system.
// These are controlled, observable, sandboxed conditions — not real failures.

const DRIFT_SCENARIOS = Object.freeze({
  APPROVAL_BOTTLENECK: 'approval_bottleneck',
  REPEATED_OVERRIDE: 'repeated_override',
  BLOCKED_PATH_SPIKE: 'blocked_path_spike',
  TELEMETRY_SATURATION: 'telemetry_saturation',
  TRUST_DEGRADATION: 'trust_degradation',
  RETRY_LOOP: 'retry_loop'
});

const SCENARIO_DEFINITIONS = {
  [DRIFT_SCENARIOS.APPROVAL_BOTTLENECK]: {
    description: 'Inject repeated approval requests to simulate governance bottleneck',
    commandOverride: { approvalRate: 0.9, blockRate: 0.0 },
    expectedDriftType: 'governance',
    commandCount: 8
  },
  [DRIFT_SCENARIOS.REPEATED_OVERRIDE]: {
    description: 'Inject repeated operator overrides on the same command type',
    commandOverride: { approvalRate: 0.8, blockRate: 0.0, forceCommand: 'booking.override' },
    expectedDriftType: 'operator',
    commandCount: 6
  },
  [DRIFT_SCENARIOS.BLOCKED_PATH_SPIKE]: {
    description: 'Inject high block rate to simulate telemetry drift spike',
    commandOverride: { approvalRate: 0.2, blockRate: 0.7 },
    expectedDriftType: 'telemetry',
    commandCount: 10
  },
  [DRIFT_SCENARIOS.TELEMETRY_SATURATION]: {
    description: 'Inject high-volume telemetry activities to test harmonizer saturation',
    commandOverride: { approvalRate: 0.1, blockRate: 0.1 },
    telemetryOverride: { activityCount: 12, telemetryState: 'LIMITED' },
    expectedDriftType: 'telemetry',
    commandCount: 5
  },
  [DRIFT_SCENARIOS.TRUST_DEGRADATION]: {
    description: 'Inject security events to degrade trust score and trigger drift',
    injectSecurityEvents: true,
    securityEventType: 'identity_risk_event',
    securityRiskLevel: 'high',
    expectedDriftType: 'governance',
    commandCount: 3
  },
  [DRIFT_SCENARIOS.RETRY_LOOP]: {
    description: 'Inject repeated failed commands to simulate workflow retry loop',
    commandOverride: { approvalRate: 0.0, blockRate: 0.8 },
    expectedDriftType: 'workflow',
    commandCount: 8
  }
};

function normalizeScenarioKey(scenarioKey) {
  if (!scenarioKey) return null;

  const normalized = String(scenarioKey).trim();
  if (!normalized) return null;

  if (DRIFT_SCENARIOS[normalized]) {
    return DRIFT_SCENARIOS[normalized];
  }

  if (SCENARIO_DEFINITIONS[normalized]) {
    return normalized;
  }

  const matchedEntry = Object.entries(DRIFT_SCENARIOS).find(([, value]) => value === normalized);
  return matchedEntry ? matchedEntry[0] : null;
}

function validateScenario(scenarioKey) {
  const normalizedKey = normalizeScenarioKey(scenarioKey);
  if (!normalizedKey) {
    return { valid: false, error: 'Unknown scenario' };
  }

  const scenario = SCENARIO_DEFINITIONS[normalizedKey];
  const commandOverride = scenario.commandOverride || {};
  const approvalRate = Number.isFinite(Number(commandOverride.approvalRate))
    ? Number(commandOverride.approvalRate)
    : 0;
  const blockRate = Number.isFinite(Number(commandOverride.blockRate))
    ? Number(commandOverride.blockRate)
    : 0;

  if (approvalRate + blockRate > 1) {
    return { valid: false, error: 'Approval and block rates exceed 100 percent' };
  }

  return { valid: true, key: normalizedKey, scenario };
}

function getScenario(scenarioKey) {
  const result = validateScenario(scenarioKey);
  return result.valid ? result.scenario : null;
}

function getAllScenarios() {
  return Object.entries(SCENARIO_DEFINITIONS).map(([key, def]) => ({
    key,
    ...def
  }));
}

module.exports = {
  DRIFT_SCENARIOS,
  SCENARIO_DEFINITIONS,
  getAllScenarios,
  getScenario,
  normalizeScenarioKey,
  validateScenario
};
