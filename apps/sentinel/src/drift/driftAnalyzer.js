// Drift Analyzer
// Purpose: Orchestrate the full drift observation pipeline.
// Flow: Audit Log → Signals → Recommendations → Fork Proposals → Approval Routing
// Sentinel observes and proposes. Humans authorize. Nothing executes automatically.

const { detectDriftSignals } = require('./driftSignals');
const { buildRecommendations } = require('./driftRecommendations');
const { buildForkProposals } = require('./driftForkEngine');
const { routeRecommendations } = require('./driftApprovalRouter');
const {
  emitSignalsDetected,
  emitRecommendationsGenerated,
  emitRecommendationRouted
} = require('./driftTelemetry');
const { saveAll } = require('./driftStore');

async function analyzeDrift(auditLog, options = {}) {
  const tenant = options.tenant || null;
  const emitSecurityEvent = options.emitSecurityEvent || null;
  const createApprovalRequest = options.createApprovalRequest || null;
  const routeApprovals = options.routeApprovals !== false && typeof createApprovalRequest === 'function';

  const signals = detectDriftSignals(auditLog, { tenant });

  if (emitSecurityEvent && signals.length) {
    emitSignalsDetected(emitSecurityEvent, signals, tenant);
  }

  if (!signals.length) {
    return {
      status: 'clean',
      tenant,
      signals: [],
      recommendations: [],
      forkProposals: [],
      approvals: [],
      timestamp: new Date().toISOString()
    };
  }

  const recommendations = buildRecommendations(signals);

  if (emitSecurityEvent && recommendations.length) {
    emitRecommendationsGenerated(emitSecurityEvent, recommendations, tenant);
  }

  const forkProposals = buildForkProposals(recommendations);

  // Persist recommendations before routing approvals
  saveAll(recommendations);

  let routedRecommendations = recommendations;
  if (routeApprovals && recommendations.length) {
    routedRecommendations = await routeRecommendations(recommendations, createApprovalRequest);
    if (emitSecurityEvent) {
      routedRecommendations.forEach((rec) => emitRecommendationRouted(emitSecurityEvent, rec));
    }
  }

  return {
    status: signals.length ? 'drift_detected' : 'clean',
    tenant,
    signals,
    recommendations: routedRecommendations,
    forkProposals,
    approvals: routedRecommendations.map((r) => r.approvalId).filter(Boolean),
    summary: {
      signalCount: signals.length,
      recommendationCount: recommendations.length,
      forkProposalCount: forkProposals.length,
      requiresHumanApproval: recommendations.every((r) => r.requiresHumanApproval)
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  analyzeDrift
};
