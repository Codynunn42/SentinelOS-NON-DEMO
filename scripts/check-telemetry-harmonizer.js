const assert = require('assert');
const {
  handleTelemetryCommand,
  handleTelemetryState,
  normalizeActivity,
  runTelemetryHarmonizer
} = require('../apps/sentinel/src/telemetry/telemetryController');
const { evaluatePolicy } = require('../apps/sentinel/src/governance/policyEngine');
const { orchestrateTaskTemplates } = require('../apps/sentinel/src/orchestration/taskTemplates');

async function main() {
  const principal = {
    tenant: 'ownerfi',
    actor: 'sentinel.telemetry@nunn.local',
    role: 'observer',
    scopes: ['telemetry:write', 'audit:read', 'approval:read']
  };

  const normalized = normalizeActivity({
    type: 'external.export',
    payload: { target: 'external-system' }
  });
  assert.strictEqual(normalized.action, 'telemetry.export.external');
  assert.strictEqual(normalized.forceBlock, true);

  const harmonized = runTelemetryHarmonizer({
    telemetryState: 'OFF',
    tenant: 'ownerfi',
    principal,
    activities: [
      { type: 'workflow.metrics', payload: { count: 3 } },
      { type: 'deal.execution', payload: { dealId: 'deal_test' } },
      { type: 'external.export', payload: { target: 'external-system' } },
      { type: 'sensitive.payload', payload: { ssn: 'redacted' } }
    ]
  });

  assert.strictEqual(harmonized.status, 'HARMONIZED');
  assert.strictEqual(harmonized.mode, 'GUARDED_VISIBILITY');
  assert.strictEqual(harmonized.summary.safe, 1);
  assert.strictEqual(harmonized.summary.requiresApproval, 1);
  assert.strictEqual(harmonized.summary.blocked, 2);
  assert.strictEqual(harmonized.details[0].status, 'SAFE_TO_SEND');
  assert.strictEqual(harmonized.details[1].status, 'APPROVAL_REQUIRED');
  assert.strictEqual(harmonized.details[2].status, 'BLOCKED');
  assert(harmonized.details.every((detail) => detail.timestamp));
  assert.strictEqual(harmonized.safeToSend[0].type, 'SAFE_TO_SEND');
  assert.strictEqual(harmonized.requiresApproval[0].item, 'deal.execution');
  assert(harmonized.blocked.some((finding) => finding.item === 'external.export'));
  assert.strictEqual(harmonized.auditArtifact.artifactType, 'governed_telemetry_harmonization');
  assert.strictEqual(harmonized.auditArtifact.summary.blocked, 2);
  assert(harmonized.auditHash && harmonized.auditHash.length === 64);

  const normal = handleTelemetryState('ON', {
    tenant: 'ownerfi',
    principal,
    activities: [{ type: 'workflow.metrics' }]
  });
  assert.strictEqual(normal.status, 'NORMAL');
  assert.strictEqual(normal.mode, 'DIRECT_TELEMETRY');
  assert.strictEqual(normal.details.length, 0);

  const limited = handleTelemetryState('LIMITED', {
    tenant: 'ownerfi',
    principal,
    activities: [{ type: 'workflow.metrics' }]
  });
  assert.strictEqual(limited.status, 'HARMONIZED');
  assert.strictEqual(limited.mode, 'GUARDED_VISIBILITY');
  assert.strictEqual(limited.summary.safe, 1);

  const exportPolicy = evaluatePolicy({
    tenant: 'ownerfi',
    actor: 'sentinel.telemetry@nunn.local',
    role: 'observer',
    scopes: ['telemetry:write'],
    command: 'telemetry.export.external'
  });
  assert.strictEqual(exportPolicy.allowed, false);
  assert.strictEqual(exportPolicy.approvalRequired, true);
  assert.strictEqual(exportPolicy.reason, 'Telemetry export requires approval');

  const command = handleTelemetryCommand({
    telemetryState: 'OFF',
    tenant: 'ownerfi',
    activities: [{ type: 'workflow.metrics' }]
  }, principal);
  assert.strictEqual(command.command, 'telemetry.harmonize');
  assert.strictEqual(command.policy.requiresApproval, false);
  assert.strictEqual(command.result.status, 'HARMONIZED');

  const run = await orchestrateTaskTemplates({
    tenant: 'ownerfi',
    runId: 'telemetry_harmonizer_task_run',
    createApprovals: false,
    telemetryState: 'OFF',
    tasks: [
      {
        id: 'task_collect_evidence',
        title: 'Collect approval evidence',
        category: 'mapping',
        xeRequired: true,
        approvalRequired: false
      },
      {
        id: 'task_finalize_financial',
        title: 'Finalize financial approval',
        category: 'conditional',
        xeRequired: true
      }
    ]
  }, { principal });

  assert.strictEqual(run.telemetryReview.status, 'HARMONIZED');
  assert.strictEqual(run.telemetryReview.mode, 'GUARDED_VISIBILITY');
  assert(run.telemetryReview.summary.safe >= 2);
  assert(run.telemetryReview.summary.requiresApproval >= 1);

  console.log('Telemetry harmonizer check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
