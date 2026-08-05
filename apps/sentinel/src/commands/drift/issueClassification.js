const { isForkTargetAllowed } = require('../../drift/driftPolicies');

const CATEGORY_ORDER = Object.freeze([
  'execution_integrity',
  'approval_continuity',
  'workflow_control',
  'telemetry_normalization',
  'faceplane_continuity',
  'deployment_stability',
  'policy_boundary'
]);

const APPROVAL_POSTURE = Object.freeze({
  implemented: 'approved_for_monitoring',
  analysis_only: 'approval_required_before_execution',
  pending_approval: 'approval_required_before_execution',
  proposed: 'approval_required_before_execution',
  blocked: 'blocked',
  observe: 'observe_only'
});

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStatus(value) {
  const status = text(value).toLowerCase();
  return status || 'proposed';
}

function approvalPostureFor(issue) {
  const status = normalizeStatus(issue.status);
  if (issue.approvalPosture) {
    return issue.approvalPosture;
  }

  if (issue.requiresHumanApproval === true) {
    return 'approval_required_before_execution';
  }

  return APPROVAL_POSTURE[status] || 'approval_required_before_execution';
}

function normalizeFork(issue) {
  const proposedFork = issue.proposedFork && typeof issue.proposedFork === 'object'
    ? issue.proposedFork
    : null;

  if (!proposedFork) {
    return null;
  }

  const targetFiles = Array.isArray(proposedFork.targetFiles) ? proposedFork.targetFiles : [];
  const blockedTargets = targetFiles.filter((target) => !isForkTargetAllowed(target));

  return {
    branchName: text(proposedFork.branchName) || null,
    targetFiles,
    blockedTargets,
    allowed: blockedTargets.length === 0 && targetFiles.length > 0,
    rationale: text(proposedFork.rationale) || text(issue.rationale)
  };
}

function xeStepFor(issue, posture, fork) {
  if (posture === 'blocked') {
    return 'Do not execute. Return to human operator with blocked target or unsafe scope.';
  }

  if (posture === 'observe_only') {
    return 'Observe and retain evidence. Do not open a fork yet.';
  }

  if (posture === 'approved_for_monitoring') {
    return 'Keep verification in the hardening loop and compare future drift against this result.';
  }

  if (fork && fork.allowed) {
    return `Prepare XE branch ${fork.branchName || 'approved fork'} after human approval; run required verification before merge.`;
  }

  return 'Prepare analysis package only. Human approval and allowed fork target are required before execution.';
}

function classifyIssue(issue = {}, index = 0) {
  const category = text(issue.category) || text(issue.concept) || 'policy_boundary';
  const status = normalizeStatus(issue.status);
  const fork = normalizeFork(issue);
  const posture = fork && fork.blockedTargets.length
    ? 'blocked'
    : approvalPostureFor({ ...issue, status });

  return {
    id: text(issue.id) || `issue_${index + 1}`,
    title: text(issue.title) || text(issue.type) || `Issue ${index + 1}`,
    category,
    status,
    severity: text(issue.severity) || 'medium',
    concept: text(issue.concept) || category,
    sourceArtifact: text(issue.sourceArtifact) || null,
    evidence: Array.isArray(issue.evidence) ? issue.evidence : [],
    approvalPosture: posture,
    proposedFork: fork,
    xeStep: text(issue.xeStep) || xeStepFor(issue, posture, fork),
    verification: Array.isArray(issue.verification) ? issue.verification : [],
    ownerDecision: posture === 'approval_required_before_execution' ? 'human_approval_required' : posture
  };
}

function groupByCategory(issues) {
  const grouped = {};
  issues.forEach((issue) => {
    grouped[issue.category] = grouped[issue.category] || [];
    grouped[issue.category].push(issue);
  });

  return Object.fromEntries(
    Object.entries(grouped).sort(([left], [right]) => {
      const leftIndex = CATEGORY_ORDER.indexOf(left);
      const rightIndex = CATEGORY_ORDER.indexOf(right);
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    })
  );
}

function summarize(issues) {
  return {
    totalIssues: issues.length,
    approvalRequired: issues.filter((issue) => issue.approvalPosture === 'approval_required_before_execution').length,
    approvedForMonitoring: issues.filter((issue) => issue.approvalPosture === 'approved_for_monitoring').length,
    blocked: issues.filter((issue) => issue.approvalPosture === 'blocked').length,
    observeOnly: issues.filter((issue) => issue.approvalPosture === 'observe_only').length,
    xeReady: issues.filter((issue) => (
      issue.approvalPosture === 'approval_required_before_execution' &&
      issue.proposedFork &&
      issue.proposedFork.allowed
    )).length
  };
}

function classifyIssues(input = {}) {
  const issues = (Array.isArray(input.issues) ? input.issues : []).map(classifyIssue);
  const grouped = groupByCategory(issues);

  return {
    status: 'classified',
    executionMode: 'classification_only',
    tenant: text(input.tenant) || 'nunncloud',
    classifiedAt: input.now || new Date().toISOString(),
    summary: summarize(issues),
    categories: grouped,
    approvalRule: 'No XE implementation starts until its category has human approval and allowed fork targets.',
    xeRule: 'XE prepares steps, verifies signatures/policy/drift checks, and returns results before merge.'
  };
}

async function handleDriftIssuesClassify(payload = {}) {
  return {
    success: true,
    statusCode: 200,
    data: {
      result: classifyIssues(payload)
    }
  };
}

module.exports = {
  classifyIssues,
  handleDriftIssuesClassify
};
