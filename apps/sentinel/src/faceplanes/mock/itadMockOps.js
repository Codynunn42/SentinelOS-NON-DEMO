// ITAD Mock Operations
// Purpose: Simulate compliance-heavy asset disposition workflows for synthetic testing.
// Generates: chain-of-custody transfers, wipe verifications, blocked compliance flows, audit-heavy ops.

const { buildCommandBatch } = require('./mockCommandFactory');
const { buildTelemetryPayload } = require('./mockTelemetryGenerator');
const { buildApprovalScenario, shouldTriggerApproval, shouldBlock } = require('./mockApprovalGenerator');

const FACEPLANE = 'itad';
const TENANT = 'itad-mock';

function buildRun(config = {}) {
  const commandCount = config.commandsPerRun || 4;
  const approvalRate = config.approvalRate ?? 0.6;
  const blockRate = config.blockRate ?? 0.2;

  const commands = buildCommandBatch(FACEPLANE, commandCount);
  const approvals = commands
    .filter(() => shouldTriggerApproval(approvalRate))
    .map(() => buildApprovalScenario(FACEPLANE, { forceType: 'compliance_gate' }));
  const blocked = commands
    .filter(() => shouldBlock(blockRate))
    .map((cmd) => ({
      command: cmd.command,
      tenant: TENANT,
      reason: 'compliance_policy_block',
      source: 'itad_mock_ops'
    }));
  const telemetry = buildTelemetryPayload(FACEPLANE, {
    telemetryState: config.telemetryState || 'LIMITED',
    activityCount: config.telemetryActivityCount || 5
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
