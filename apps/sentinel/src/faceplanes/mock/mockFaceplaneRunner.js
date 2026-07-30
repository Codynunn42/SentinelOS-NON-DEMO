// Mock Faceplane Runner
// Purpose: Orchestrate a controlled synthetic run across one or more faceplanes.
// Produces a structured observation report for drift, telemetry, and governance analysis.
// SANDBOXED — no real external calls. All operations are synthetic and observable.

const { buildRun: buildOwnerfiRun } = require('./ownerfiMockOps');
const { buildRun: buildHotelOpsRun } = require('./hotelOpsMockOps');
const { buildRun: buildItadRun } = require('./itadMockOps');
const { validateScenario } = require('./mockDriftScenarios');

const RUNNERS = {
  ownerfi: buildOwnerfiRun,
  hotelops: buildHotelOpsRun,
  itad: buildItadRun
};

function buildRunConfig(faceplane, config = {}) {
  const base = {
    commandsPerRun: config.commandsPerRun || 5,
    approvalRate: config.approvalRate ?? 0.3,
    blockRate: config.blockRate ?? 0.1,
    telemetryState: config.telemetryState || 'LIMITED',
    telemetryActivityCount: config.telemetryActivityCount || 4
  };

  const scenarioResult = config.driftScenario ? validateScenario(config.driftScenario) : null;
  if (scenarioResult && !scenarioResult.valid) {
    console.warn(`Unknown or invalid drift scenario "${config.driftScenario}". Running default mock configuration.`);
    return base;
  }

  const scenario = scenarioResult ? scenarioResult.scenario : null;

  if (scenario) {
    const telemetryActivityCount = Number.isFinite(Number(scenario.telemetryOverride && scenario.telemetryOverride.activityCount))
      ? Number(scenario.telemetryOverride.activityCount)
      : base.telemetryActivityCount;

    return {
      ...base,
      commandsPerRun: Number.isFinite(Number(scenario.commandCount)) ? Number(scenario.commandCount) : base.commandsPerRun,
      ...(scenario.commandOverride || {}),
      telemetryState: (scenario.telemetryOverride && scenario.telemetryOverride.telemetryState) || base.telemetryState,
      telemetryActivityCount,
      driftScenario: config.driftScenario,
      scenarioDescription: scenario.description,
      expectedDriftType: scenario.expectedDriftType,
      injectSecurityEvents: scenario.injectSecurityEvents || false,
      securityEventType: scenario.securityEventType || null,
      securityRiskLevel: scenario.securityRiskLevel || null
    };
  }

  return base;
}

function runFaceplane(faceplane, config = {}) {
  const runner = RUNNERS[faceplane];
  if (!runner) {
    return { error: `Unknown faceplane: ${faceplane}`, faceplane };
  }

  const runConfig = buildRunConfig(faceplane, config);
  const run = runner(runConfig);

  return {
    ...run,
    runConfig,
    runId: `mock_run_${faceplane}_${Date.now()}`,
    startedAt: new Date().toISOString()
  };
}

function runAll(config = {}) {
  const faceplanes = config.faceplanes || ['ownerfi', 'hotelops', 'itad'];
  const results = faceplanes.map((fp) => runFaceplane(fp, config[fp] || config));

  const totals = results.reduce((acc, run) => {
    if (run.error) return acc;
    const summary = run.summary || {};
    acc.commandCount += Number.isFinite(Number(summary.commandCount)) ? Number(summary.commandCount) : 0;
    acc.approvalCount += Number.isFinite(Number(summary.approvalCount)) ? Number(summary.approvalCount) : 0;
    acc.blockedCount += Number.isFinite(Number(summary.blockedCount)) ? Number(summary.blockedCount) : 0;
    return acc;
  }, { commandCount: 0, approvalCount: 0, blockedCount: 0 });

  return {
    runId: `mock_run_all_${Date.now()}`,
    startedAt: new Date().toISOString(),
    faceplanes,
    results,
    totals,
    observationNotes: [
      `${totals.commandCount} synthetic commands generated across ${faceplanes.length} faceplanes`,
      `${totals.approvalCount} approval scenarios triggered`,
      `${totals.blockedCount} commands blocked by mock policy`,
      'Run drift analysis at /drift/analyze to observe detection results',
      'Check /v1/traces for execution trace completeness'
    ]
  };
}

module.exports = {
  runAll,
  runFaceplane,
  RUNNERS
};
