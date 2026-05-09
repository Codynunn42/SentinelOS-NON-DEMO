const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

async function main() {
  resetLocalPassportState();

  const principal = {
    tenant: 'nunncloud',
    actor: 'repo-operator@nunncloud.local',
    role: 'platform',
    scopes: ['platform:admin', 'audit:read']
  };

  const diagnostic = await dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.diagnose',
      source: 'sentinel',
      payload: {
        repository: 'Codynunn42/nunncorp-global-mono',
        workflowName: 'Sentinel Actions Diagnostic',
        runId: '25584768689',
        runUrl: 'https://github.com/Codynunn42/nunncorp-global-mono/actions/runs/25584768689',
        conclusion: 'startup_failure',
        jobs: [],
        logsAvailable: false
      }
    }),
    { principal, source: 'sentinel' }
  );

  assert.strictEqual(diagnostic.success, true);
  assert.strictEqual(diagnostic.status, 'executed');
  assert.strictEqual(diagnostic.result.controlledBoundary, 'repo');
  assert.strictEqual(diagnostic.result.executionMode, 'read_only_diagnosis');
  assert.strictEqual(diagnostic.result.bypassPrevented, true);
  assert.strictEqual(diagnostic.result.approvalRequired, true);
  assert.strictEqual(diagnostic.result.diagnosis.state, 'external_startup_failure');
  assert.strictEqual(diagnostic.result.diagnosis.driftType, 'external_dependency_failure');
  assert.strictEqual(diagnostic.result.diagnosis.confidence, 0.92);
  assert.strictEqual(diagnostic.result.diagnosis.nextAction, 'hold_and_escalate');
  assert.strictEqual(diagnostic.result.diagnosis.action, 'hold_and_escalate');

  const blockedRetry = await dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.retry',
      source: 'sentinel',
      payload: {
        repository: 'Codynunn42/nunncorp-global-mono',
        workflowName: 'Sentinel Actions Diagnostic',
        runId: '25584768689',
        conclusion: 'startup_failure',
        jobs: [],
        logsAvailable: false,
        retryCount: 0,
        maxRetries: 3
      }
    }),
    { principal, source: 'sentinel' }
  );

  assert.strictEqual(blockedRetry.success, true);
  assert.strictEqual(blockedRetry.status, 'blocked');
  assert.strictEqual(blockedRetry.result.executionMode, 'retry_blocked');
  assert.strictEqual(blockedRetry.result.retry.allowed, false);
  assert.strictEqual(blockedRetry.result.diagnosis.driftType, 'external_dependency_failure');

  const allowedRetry = await dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.retry',
      source: 'sentinel',
      payload: {
        repository: 'Codynunn42/nunncorp-global-mono',
        workflowName: 'CI',
        runId: 'example-transient-run',
        conclusion: 'failure',
        jobs: [{ name: 'build', conclusion: 'failure' }],
        logsAvailable: true,
        transient: true,
        retryCount: 1,
        maxRetries: 3
      }
    }),
    { principal, source: 'sentinel' }
  );

  assert.strictEqual(allowedRetry.success, true);
  assert.strictEqual(allowedRetry.status, 'executed');
  assert.strictEqual(allowedRetry.result.executionMode, 'retry_allowed');
  assert.strictEqual(allowedRetry.result.retry.allowed, true);
  assert.strictEqual(allowedRetry.result.diagnosis.driftType, 'transient_failure');

  const overLimitRetry = await dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.retry',
      source: 'sentinel',
      payload: {
        repository: 'Codynunn42/nunncorp-global-mono',
        workflowName: 'CI',
        runId: 'example-over-limit-run',
        conclusion: 'failure',
        jobs: [{ name: 'build', conclusion: 'failure' }],
        logsAvailable: true,
        transient: true,
        retryCount: 3,
        maxRetries: 3
      }
    }),
    { principal, source: 'sentinel' }
  );

  assert.strictEqual(overLimitRetry.success, true);
  assert.strictEqual(overLimitRetry.status, 'blocked');
  assert.strictEqual(overLimitRetry.result.executionMode, 'retry_blocked');
  assert.strictEqual(overLimitRetry.result.retry.allowed, false);

  const bypass = await dispatchCommand(
    {
      tenant: 'nunncloud',
      command: 'repo.control.workflow.diagnose',
      payload: {}
    },
    { principal }
  );

  assert.strictEqual(bypass.success, false);
  assert.strictEqual(bypass.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(bypass.details.reason, 'unauthorized_execution');
  assert.strictEqual(bypass.details.source, 'unknown');

  const spoof = await dispatchCommand(
    {
      tenant: 'nunncloud',
      command: 'repo.control.workflow.diagnose',
      source: 'sentinel',
      payload: {}
    },
    { principal, source: 'sentinel' }
  );

  assert.strictEqual(spoof.success, false);
  assert.strictEqual(spoof.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(spoof.details.reason, 'unauthorized_execution:missing_signature');

  const signedReplay = signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {
      repository: 'Codynunn42/nunncorp-global-mono',
      workflowName: 'CI',
      runId: 'replay-check',
      conclusion: 'success',
      jobs: [],
      logsAvailable: true
    }
  });
  const firstReplayAttempt = await dispatchCommand(signedReplay, { principal, source: 'sentinel' });
  const secondReplayAttempt = await dispatchCommand(signedReplay, { principal, source: 'sentinel' });

  assert.strictEqual(firstReplayAttempt.success, true);
  assert.strictEqual(secondReplayAttempt.success, false);
  assert.strictEqual(secondReplayAttempt.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(secondReplayAttempt.details.reason, 'unauthorized_execution:replay');

  const forged = signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: { repository: 'Codynunn42/nunncorp-global-mono' }
  });
  forged.payload.repository = 'tampered/repo';

  const badSignature = await dispatchCommand(forged, { principal, source: 'sentinel' });
  assert.strictEqual(badSignature.success, false);
  assert.strictEqual(badSignature.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(badSignature.details.reason, 'unauthorized_execution:bad_signature');

  const wrongScope = signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    payload: {},
    meta: {
      tenantId: 'nunncloud',
      surface: 'unauthorized-plane'
    }
  });

  const scopeViolation = await dispatchCommand(wrongScope, { principal, source: 'sentinel' });
  assert.strictEqual(scopeViolation.success, false);
  assert.strictEqual(scopeViolation.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(scopeViolation.details.reason, 'unauthorized_execution:scope_violation');

  const stalePassport = signLocalCommand({
    tenant: 'nunncloud',
    command: 'repo.control.workflow.diagnose',
    source: 'sentinel',
    timestamp: Date.now() - (10 * 60 * 1000),
    payload: {}
  });

  const staleAttempt = await dispatchCommand(stalePassport, { principal, source: 'sentinel' });
  assert.strictEqual(staleAttempt.success, false);
  assert.strictEqual(staleAttempt.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(staleAttempt.details.reason, 'unauthorized_execution:stale');

  const blocked = await dispatchCommand(
    signLocalCommand({
      tenant: 'nunncloud',
      command: 'repo.control.workflow.diagnose',
      source: 'sentinel',
      payload: {}
    }),
    {
      principal: {
        ...principal,
        scopes: ['audit:read']
      },
      source: 'sentinel'
    }
  );

  assert.strictEqual(blocked.success, false);
  assert.strictEqual(blocked.error, 'SCOPE_REQUIRED');

  console.log('Repo control layer check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
