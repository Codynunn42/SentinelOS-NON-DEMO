function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getCommand(approval = {}) {
  return (
    toText(approval.command) ||
    toText(approval.context && approval.context.command) ||
    toText(approval.context && approval.context.originalCommand && approval.context.originalCommand.command) ||
    'unknown'
  );
}

function getTenant(approval = {}) {
  return (
    toText(approval.tenant) ||
    toText(approval.tenantId) ||
    toText(approval.context && approval.context.tenant) ||
    'unknown'
  );
}

function getActor(approval = {}) {
  return (
    toText(approval.actor) ||
    toText(approval.context && approval.context.actor) ||
    toText(approval.context && approval.context.originalCommand && approval.context.originalCommand.metadata && approval.context.originalCommand.metadata.actor) ||
    'unknown'
  );
}

function getRisk(approval = {}) {
  return (
    toText(approval.riskLevel) ||
    toText(approval.decision && approval.decision.riskLevel) ||
    toText(approval.context && approval.context.policy && approval.context.policy.riskLevel) ||
    'unknown'
  ).toLowerCase();
}

function getReason(approval = {}) {
  return (
    toText(approval.reason) ||
    toText(approval.decision && approval.decision.reason) ||
    toText(approval.context && approval.context.policy && approval.context.policy.reason) ||
    'approval_required'
  );
}

function getEntityKey(approval = {}) {
  const original = approval.context && approval.context.originalCommand;
  const payload = original && original.payload && typeof original.payload === 'object'
    ? original.payload
    : approval.payload && typeof approval.payload === 'object'
      ? approval.payload
      : {};

  const entity =
    payload.applicationId ||
    payload.customerId ||
    payload.ticketId ||
    payload.refundRequestId ||
    payload.dealId ||
    payload.propertyId ||
    payload.assetId ||
    approval.id ||
    'unknown';

  return `${getTenant(approval)}:${getCommand(approval)}:${getActor(approval)}:${entity}`;
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function groupDuplicates(approvals) {
  const groups = new Map();
  approvals.forEach((approval) => {
    const key = getEntityKey(approval);
    const group = groups.get(key) || [];
    group.push(approval);
    groups.set(key, group);
  });

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      count: group.length,
      approvalIds: group.map((approval) => approval.id).filter(Boolean),
      command: getCommand(group[0]),
      tenant: getTenant(group[0]),
      actor: getActor(group[0])
    }));
}

function normalizeApproval(approval = {}, now, staleAfterMinutes) {
  const createdAt = toDate(approval.createdAt || approval.created_at || approval.timestamp);
  const updatedAt = toDate(approval.updatedAt || approval.updated_at || approval.createdAt || approval.created_at);
  const ageMinutes = createdAt ? Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000)) : null;

  return {
    ...approval,
    id: approval.id || null,
    status: toText(approval.status).toLowerCase() || 'unknown',
    command: getCommand(approval),
    tenant: getTenant(approval),
    actor: getActor(approval),
    riskLevel: getRisk(approval),
    reason: getReason(approval),
    createdAt: createdAt ? createdAt.toISOString() : null,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
    ageMinutes,
    stale: Number.isFinite(ageMinutes) ? ageMinutes >= staleAfterMinutes : false,
    duplicateKey: getEntityKey(approval)
  };
}

function classify({ duplicateGroups, staleApprovals, highRiskApprovals, pendingApprovals }) {
  const labels = [];
  if (duplicateGroups.length) labels.push('duplicate_pending_approvals');
  if (staleApprovals.length) labels.push('stale_pending_approvals');
  if (highRiskApprovals.length) labels.push('legitimate_risk_concentration');
  if (!labels.length && pendingApprovals.length) labels.push('normal_pending_review');
  if (!labels.length) labels.push('no_pending_approval_bottleneck');

  return labels;
}

function buildRecommendations(classifications) {
  const recommendations = [];

  if (classifications.includes('duplicate_pending_approvals')) {
    recommendations.push({
      action: 'collapse_duplicate_pending_requests',
      concept: 'approval_continuity',
      policyChangeRecommended: false,
      rationale: 'Repeated pending approvals for the same command should reuse or reference the active approval instead of creating threshold exceptions.'
    });
  }

  if (classifications.includes('stale_pending_approvals')) {
    recommendations.push({
      action: 'surface_stale_approvals_for_operator_review',
      concept: 'human_in_the_loop_governance',
      policyChangeRecommended: false,
      rationale: 'Aging approvals are an operator workflow issue before they are a policy issue.'
    });
  }

  if (classifications.includes('legitimate_risk_concentration')) {
    recommendations.push({
      action: 'preserve_high_risk_approval_gate',
      concept: 'execution_integrity',
      policyChangeRecommended: false,
      rationale: 'High-risk approval volume is evidence to improve routing and visibility, not to lower the gate.'
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      action: 'continue_monitoring',
      concept: 'operational_hardening',
      policyChangeRecommended: false,
      rationale: 'No approval bottleneck pattern was strong enough to justify fork execution.'
    });
  }

  return recommendations;
}

function analyzeApprovalBottleneck(input = {}) {
  const staleAfterMinutes = Number.isFinite(Number(input.staleAfterMinutes))
    ? Math.max(1, Number(input.staleAfterMinutes))
    : 60;
  const now = toDate(input.now) || new Date();
  const normalized = (Array.isArray(input.approvals) ? input.approvals : [])
    .map((approval) => normalizeApproval(approval, now, staleAfterMinutes));
  const pendingApprovals = normalized.filter((approval) => approval.status === 'pending');
  const duplicateGroups = groupDuplicates(pendingApprovals);
  const staleApprovals = pendingApprovals.filter((approval) => approval.stale);
  const highRiskApprovals = pendingApprovals.filter((approval) => (
    approval.riskLevel === 'high' ||
    approval.riskLevel === 'critical' ||
    approval.reason.includes('security') ||
    approval.reason.includes('compliance')
  ));
  const classifications = classify({
    duplicateGroups,
    staleApprovals,
    highRiskApprovals,
    pendingApprovals
  });

  return {
    status: 'analysis_complete',
    executionMode: 'analysis_only',
    policyChangeRecommended: false,
    safeToAdjustPolicy: false,
    nextAction: duplicateGroups.length || staleApprovals.length
      ? 'clear_duplicates_and_stale_before_policy_adjustment'
      : 'continue_monitoring_before_policy_adjustment',
    analyzedAt: now.toISOString(),
    staleAfterMinutes,
    summary: {
      totalApprovals: normalized.length,
      pendingApprovals: pendingApprovals.length,
      stalePendingApprovals: staleApprovals.length,
      duplicatePendingGroups: duplicateGroups.length,
      highRiskPendingApprovals: highRiskApprovals.length,
      commandCounts: countBy(pendingApprovals, (approval) => approval.command),
      actorCounts: countBy(pendingApprovals, (approval) => approval.actor)
    },
    classifications,
    duplicateGroups,
    staleApprovals: staleApprovals.map((approval) => ({
      id: approval.id,
      command: approval.command,
      tenant: approval.tenant,
      actor: approval.actor,
      ageMinutes: approval.ageMinutes,
      reason: approval.reason
    })),
    highRiskApprovals: highRiskApprovals.map((approval) => ({
      id: approval.id,
      command: approval.command,
      tenant: approval.tenant,
      actor: approval.actor,
      riskLevel: approval.riskLevel,
      reason: approval.reason
    })),
    recommendations: buildRecommendations(classifications)
  };
}

module.exports = {
  analyzeApprovalBottleneck,
  normalizeApproval
};
