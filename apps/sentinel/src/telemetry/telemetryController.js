const {
  handleTelemetryState,
  normalizeActivity,
  runTelemetryHarmonizer
} = require('./telemetryHarmonizer');

function handleTelemetryCommand(payload = {}, principal = {}) {
  const telemetryState = typeof payload.telemetryState === 'string'
    ? payload.telemetryState
    : typeof payload.state === 'string'
      ? payload.state
      : 'LIMITED';

  return {
    command: 'telemetry.harmonize',
    payload,
    policy: {
      requiresApproval: false
    },
    result: handleTelemetryState(telemetryState, {
      ...payload,
      principal,
      tenant: payload.tenant || principal.tenant || 'ownerfi'
    })
  };
}

module.exports = {
  handleTelemetryCommand,
  handleTelemetryState,
  normalizeActivity,
  runTelemetryHarmonizer
};
