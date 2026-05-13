// OwnerFi Mock Operations
// Purpose: Simulate financial governance pressure for synthetic testing.
// Generates: refund requests, approval escalation, fraud flags, policy blocks, overrides.

const { buildCommandBatch } = require('./mockCommandFactory');
const { buildTelemetryPayload } = require('./mockTelemetryGenerator');
const { buildApprovalScenario, shouldTriggerApproval, shouldBlock } = require('./mockApprovalGenerator');

const FACEPLANE = 'ownerfi';
const TENANT = 'ownerfi-mock';

function buildRun(config = {}) {
  const commandCount = config.commandsPerRun || 5;
  const approvalRate = config.approvalRate ?? 0.3;
  const blockRate = config.blockRate ?? 0.1;

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
      source: 'ownerfi_mock_ops'
    }));
  const telemetry = buildTelemetryPayload(FACEPLANE, {
    telemetryState: config.telemetryState || 'LIMITED',
    activityCount: config.telemetryActivityCount || 4
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
