// Drift Schemas
// Purpose: Define canonical shapes for drift signals, recommendations, and fork proposals.

const DRIFT_TYPES = Object.freeze({
  governance: 'governance',
  operator: 'operator',
  workflow: 'workflow',
  telemetry: 'telemetry',
  infrastructure: 'infrastructure'
});

const DRIFT_SEVERITIES = Object.freeze({
  info: 'info',
  warning: 'warning',
  elevated: 'elevated',
  critical: 'critical'
});

const FORK_STATUSES = Object.freeze({
  proposed: 'proposed',
  pending_approval: 'pending_approval',
  approved: 'approved',
  rejected: 'rejected',
  merged: 'merged'
});

function createDriftSignal({ type, severity, tenant, source, pattern, evidence = [], correlationId = null }) {
  return {
    signalId: `dsig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: DRIFT_TYPES[type] || type,
    severity: DRIFT_SEVERITIES[severity] || 'warning',
    tenant: tenant || null,
    source: source || 'drift_analyzer',
    pattern,
    evidence,
    correlationId,
    timestamp: new Date().toISOString()
  };
}

function createDriftRecommendation({
  recommendationId,
  type,
  severity,
  source,
  detectedPattern,
  recommendedAction,
  riskAssessment = {},
  proposedFork = null,
  tenant = null,
  correlationId = null
}) {
  return {
    recommendationId: recommendationId || `drift_rec_${Date.now()}`,
    type,
    severity: DRIFT_SEVERITIES[severity] || 'warning',
    source,
    detectedPattern,
    recommendedAction,
    riskAssessment: {
      governanceRisk: riskAssessment.governanceRisk || 'medium',
      operationalImpact: riskAssessment.operationalImpact || 'neutral',
      ...riskAssessment
    },
    requiresHumanApproval: true,
    proposedFork: proposedFork || null,
    tenant,
    correlationId,
    status: FORK_STATUSES.proposed,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  DRIFT_TYPES,
  DRIFT_SEVERITIES,
  FORK_STATUSES,
  createDriftRecommendation,
  createDriftSignal
};
