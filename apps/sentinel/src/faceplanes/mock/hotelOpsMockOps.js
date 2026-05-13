// HotelOps Mock Operations
// Purpose: Simulate high-frequency operational routing for synthetic testing.
// Generates: maintenance escalations, occupancy spikes, booking failures, staff overrides.

const { buildCommandBatch } = require('./mockCommandFactory');
const { buildTelemetryPayload } = require('./mockTelemetryGenerator');
const { buildApprovalScenario, shouldTriggerApproval, shouldBlock } = require('./mockApprovalGenerator');

const FACEPLANE = 'hotelops';
const TENANT = 'hotelops-mock';

function buildRun(config = {}) {
  const commandCount = config.commandsPerRun || 8;
  const approvalRate = config.approvalRate ?? 0.2;
  const blockRate = config.blockRate ?? 0.15;

  const commands = buildCommandBatch(FACEPLANE, commandCount);
  const approvals = commands
    .filter(() => shouldTriggerApproval(approvalRate))
    .map(() => buildApprovalScenario(FACEPLANE));
  const blocked = commands
    .filter(() => shouldBlock(blockRate))
    .map((cmd) => ({
      command: cmd.command,
      tenant: TENANT,
      reason: 'mock_policy_block',
      source: 'hotelops_mock_ops'
    }));
  const telemetry = buildTelemetryPayload(FACEPLANE, {
    telemetryState: config.telemetryState || 'LIMITED',
    activityCount: config.telemetryActivityCount || 6
  });

  return {
    faceplane: FACEPLANE,
    tenant: TENANT,
    commands,
    approvals,
    blocked,
    telemetry,
    summary: {
      commandCount: commands.length,
      approvalCount: approvals.length,
      blockedCount: blocked.length
    }
  };
}

module.exports = {
  FACEPLANE,
  TENANT,
  buildRun
};
