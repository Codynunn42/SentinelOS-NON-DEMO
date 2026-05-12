// Drift Telemetry
// Purpose: Emit structured telemetry for drift detection and recommendation lifecycle.

function emitDriftEvent(emitSecurityEvent, eventType, details = {}) {
  if (typeof emitSecurityEvent !== 'function') {
    return;
  }

  emitSecurityEvent(`drift.${eventType}`, {
    source: 'drift-analyzer',
    category: 'drift',
    ...details
  });
}

function emitSignalsDetected(emitSecurityEvent, signals, tenant) {
  emitDriftEvent(emitSecurityEvent, 'signals.detected', {
    tenant: tenant || null,
    count: signals.length,
    types: signals.map((s) => s.type),
    severities: signals.map((s) => s.severity)
  });
}

function emitRecommendationsGenerated(emitSecurityEvent, recommendations, tenant) {
  emitDriftEvent(emitSecurityEvent, 'recommendations.generated', {
    tenant: tenant || null,
    count: recommendations.length,
    types: recommendations.map((r) => r.type),
    requiresHumanApproval: recommendations.every((r) => r.requiresHumanApproval)
  });
}

function emitRecommendationRouted(emitSecurityEvent, recommendation) {
  emitDriftEvent(emitSecurityEvent, 'recommendation.routed', {
    recommendationId: recommendation.recommendationId,
    type: recommendation.type,
    tenant: recommendation.tenant || null,
    approvalId: recommendation.approvalId || null,
    status: recommendation.status
  });
}

module.exports = {
  emitDriftEvent,
  emitRecommendationsGenerated,
  emitRecommendationRouted,
  emitSignalsDetected
};
