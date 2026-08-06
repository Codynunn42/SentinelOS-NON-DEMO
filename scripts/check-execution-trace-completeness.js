const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  completeTrace,
  createTrace,
  getTrace,
  recordStage
} = require('../apps/sentinel/src/audit/executionTrace');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');
const { mockHandlers } = require('../apps/sentinel/src/commands/mockHandlers');
const { nunncloudHandlers } = require('../apps/sentinel/src/surface/nunncloud');

const principal = {
  tenant: 'nunncloud',
  actor: 'trace-check@nunncloud.local',
  role: 'platform',
  scopes: ['platform:admin', 'audit:read']
};

function assertComplete(correlationId, reason, executionExpected) {
  const trace = getTrace(correlationId);
  assert.ok(trace, `trace ${correlationId} should exist`);
  assert.ok(trace.completedAt, `trace ${correlationId} should be completed`);
  assert.strictEqual(trace.outcome.reason, reason);
  assert.strictEqual(trace.stages.some((stage) => stage.stage === 'execution'), executionExpected);

  for (let index = 1; index < trace.stages.length; index += 1) {
    assert.ok(trace.stages[index].stageIndex >= trace.stages[index - 1].stageIndex);
  }
}

async function dispatchSigned(correlationId, input, context = {}) {
  return dispatchCommand(signLocalCommand(input), {
    principal,
    source: 'sentinel',
    correlationId,
    ...context
  });
}

async function assertSignatureFailureCompletes() {
  const dispatchPath = require.resolve('../apps/sentinel/src/commands/dispatch');
  const preflightPath = require.resolve('../apps/sentinel/src/governance/preflight');
  const preflightModule = require(preflightPath);
  const originalGovernanceCheck = preflightModule.governanceCheck;
  const originalSigningKey = process.env.SENTINEL_SIGNING_KEY;

  preflightModule.governanceCheck = () => ({
    allowed: true,
    decision: { signature: '0'.repeat(64), decision: 'allow' },
    policy: {
      allowed: true,
      decision: 'allow',
      state: 'clean',
      riskLevel: 'low',
      approvalRequired: false,
      receiptRequired: true
    },
    policyContext: {
      tenant: 'nunncloud',
      actor: principal.actor,
      role: principal.role,
      command: 'repo.control.workflow.diagnose',
      requiredScope: 'platform:admin'
    }
  });
  process.env.SENTINEL_SIGNING_KEY = 'trace-check-signing-key';
  delete require.cache[dispatchPath];

  try {
    const { dispatchCommand: dispatchWithSignedDecision } = require(dispatchPath);
    await dispatchWithSignedDecision(signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.diagnose',
      source: 'sentinel',
      payload: {}
    }), {
      principal,
      source: 'sentinel',
      correlationId: 'trace-signature-failure'
    });
    assertComplete('trace-signature-failure', 'signature_verification_failed', false);
  } finally {
    preflightModule.governanceCheck = originalGovernanceCheck;
    if (originalSigningKey === undefined) {
      delete process.env.SENTINEL_SIGNING_KEY;
    } else {
      process.env.SENTINEL_SIGNING_KEY = originalSigningKey;
    }
    delete require.cache[dispatchPath];
  }
}

async function main() {
  resetLocalPassportState();

  await dispatchCommand(
    { tenant: 'nunncloud', command: 'repo.control.workflow.diagnose', payload: {} },
    { principal, correlationId: 'trace-guard-block' }
  );
  assertComplete('trace-guard-block', 'execution_guard_block', false);

  await dispatchSigned('trace-governance-block', {
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {}
  }, {
    principal: { ...principal, scopes: ['audit:read'] }
  });
  assertComplete('trace-governance-block', 'governance_preflight_block', false);

  await dispatchSigned('trace-approval-required', {
    tenant: 'nunncloud',
    command: 'telemetry.export.external',
    source: 'sentinel',
    payload: {}
  }, {
    principal: { ...principal, scopes: ['telemetry:export'] }
  });
  assertComplete('trace-approval-required', 'approval_required', false);

  const mockRunHandler = mockHandlers['faceplane.mock.run'];
  delete mockHandlers['faceplane.mock.run'];
  await dispatchSigned('trace-unknown-mock', {
    tenant: 'mock',
    command: 'faceplane.mock.run',
    source: 'sentinel',
    payload: {}
  }, {
    principal: { ...principal, tenant: 'platform' }
  });
  mockHandlers['faceplane.mock.run'] = mockRunHandler;
  assertComplete('trace-unknown-mock', 'unknown_mock_command', false);

  await dispatchSigned('trace-unknown-tenant', {
    tenant: 'missing',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {}
  }, {
    principal: { ...principal, tenant: 'platform' }
  });
  assertComplete('trace-unknown-tenant', 'unknown_tenant', false);

  await dispatchSigned('trace-unknown-command', {
    tenant: 'nunncloud',
    command: 'architecture.reconstruction.begin',
    source: 'sentinel',
    payload: {}
  });
  assertComplete('trace-unknown-command', 'unknown_command', false);

  await dispatchSigned('trace-handler-success', {
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {
      repository: 'Codynunn42/nunncorp-global-mono',
      workflowName: 'CI',
      conclusion: 'success',
      jobs: [],
      logsAvailable: true
    }
  });
  assertComplete('trace-handler-success', 'handler_completed', true);

  const diagnoseHandler = nunncloudHandlers['repo.control.workflow.diagnose'];
  nunncloudHandlers['repo.control.workflow.diagnose'] = async () => {
    throw new Error('trace-check-handler-failure');
  };
  await dispatchSigned('trace-handler-failure', {
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {}
  });
  nunncloudHandlers['repo.control.workflow.diagnose'] = diagnoseHandler;
  assertComplete('trace-handler-failure', 'handler_failed', true);

  createTrace('trace-integrity', { tenant: 'nunncloud', command: 'test' });
  assert.strictEqual(recordStage('trace-integrity', 'unknown-stage'), null);
  assert.ok(recordStage('trace-integrity', 'governance'));
  assert.strictEqual(recordStage('trace-integrity', 'security'), null);
  const firstCompletion = completeTrace('trace-integrity', { success: true, reason: 'first' });
  const duplicateCompletion = completeTrace('trace-integrity', { success: false, reason: 'second' });
  assert.strictEqual(firstCompletion.completed, true);
  assert.strictEqual(duplicateCompletion.completed, false);
  assert.strictEqual(getTrace('trace-integrity').outcome.reason, 'first');

  await assertSignatureFailureCompletes();

  console.log('Execution trace completeness check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
