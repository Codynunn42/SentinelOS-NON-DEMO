function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function classifyWorkflowFailure(payload = {}) {
  const conclusion = payload.conclusion || payload.status || 'unknown';
  const jobs = asArray(payload.jobs);
  const logsAvailable = payload.logsAvailable === true;
  const workflowName = payload.workflowName || payload.workflow || 'unknown';
  const runId = payload.runId || null;
  const runUrl = payload.runUrl || null;
  const repo = payload.repository || payload.repo || 'unknown';

  if (conclusion === 'startup_failure' && jobs.length === 0 && !logsAvailable) {
    return {
      state: 'external_startup_failure',
      driftType: 'external_dependency_failure',
      confidence: 0.92,
      riskLevel: 'medium',
      action: 'hold_and_escalate',
      nextAction: 'hold_and_escalate',
      retryAllowed: false,
      reason:
        'Workflow failed before job creation. Treat as external GitHub/account-side startup failure until provider confirms otherwise.',
      evidence: {
        repo,
        workflowName,
        runId,
        runUrl,
        conclusion,
        jobCount: jobs.length,
        logsAvailable
      }
    };
  }

  if (conclusion === 'failure' && jobs.length > 0) {
    return {
      state: 'workflow_job_failure',
      driftType: payload.transient === true ? 'transient_failure' : 'internal_workflow_failure',
      confidence: payload.transient === true ? 0.78 : 0.82,
      riskLevel: 'low',
      action: payload.transient === true ? 'retry_with_limit' : 'inspect_job_logs',
      nextAction: payload.transient === true ? 'retry_with_limit' : 'inspect_job_logs',
      retryAllowed: true,
      reason: 'Workflow reached a runner and failed inside a job. Logs should drive the next scoped patch.',
      evidence: {
        repo,
        workflowName,
        runId,
        runUrl,
        conclusion,
        jobCount: jobs.length,
        logsAvailable
      }
    };
  }

  if (conclusion === 'success') {
    return {
      state: 'healthy',
      driftType: 'none',
      confidence: 0.98,
      riskLevel: 'low',
      action: 'continue',
      nextAction: 'continue',
      retryAllowed: false,
      reason: 'Workflow completed successfully.',
      evidence: {
        repo,
        workflowName,
        runId,
        runUrl,
        conclusion,
        jobCount: jobs.length,
        logsAvailable
      }
    };
  }

  return {
    state: 'unknown',
    driftType: 'unknown',
    confidence: 0.35,
    riskLevel: 'medium',
    action: 'observe_and_collect_evidence',
    nextAction: 'observe_and_collect_evidence',
    retryAllowed: false,
    reason: 'Workflow state is not specific enough for automated repair.',
    evidence: {
      repo,
      workflowName,
      runId,
      runUrl,
      conclusion,
      jobCount: jobs.length,
      logsAvailable
    }
  };
}

async function handleRepoWorkflowDiagnose(payload = {}) {
  const diagnosis = classifyWorkflowFailure(payload);

  return {
    success: true,
    status: 'executed',
    command: 'repo.control.workflow.diagnose',
    result: {
      controlledBoundary: 'repo',
      executionMode: 'read_only_diagnosis',
      approvalRequired: diagnosis.action === 'hold_and_escalate',
      bypassPrevented: true,
      diagnosis
    }
  };
}

async function handleRepoWorkflowRetry(payload = {}) {
  const diagnosis = classifyWorkflowFailure(payload);
  const retryCount = Number.isInteger(payload.retryCount) ? payload.retryCount : 0;
  const maxRetries = Number.isInteger(payload.maxRetries) ? payload.maxRetries : 3;
  const allowed = diagnosis.driftType === 'transient_failure' && retryCount < maxRetries;

  return {
    success: true,
    status: allowed ? 'executed' : 'blocked',
    command: 'repo.control.workflow.retry',
    result: {
      controlledBoundary: 'repo',
      executionMode: allowed ? 'retry_allowed' : 'retry_blocked',
      approvalRequired: !allowed,
      bypassPrevented: true,
      retry: {
        allowed,
        retryCount,
        maxRetries,
        reason: allowed
          ? 'Transient workflow failure is within retry policy.'
          : 'Retry blocked by repo control policy.'
      },
      diagnosis
    }
  };
}

module.exports = {
  classifyWorkflowFailure,
  handleRepoWorkflowDiagnose,
  handleRepoWorkflowRetry
};
