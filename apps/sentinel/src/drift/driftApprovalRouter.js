// Drift Approval Router
// Purpose: Route drift recommendations into the governed approval system.
// Sentinel never self-approves. Every recommendation requires human authorization.

const { FORK_STATUSES } = require('./driftSchemas');

async function routeRecommendationForApproval(recommendation, createApprovalRequest) {
  if (typeof createApprovalRequest !== 'function') {
    return null;
  }

  const approval = await createApprovalRequest(
    {
      decision: 'review',
      executionMode: 'approval_required',
      approvalRequired: true,
      riskLevel: recommendation.riskAssessment.governanceRisk || 'medium',
      reason: recommendation.detectedPattern
    },
    {
      tenant: recommendation.tenant || null,
      route: '/drift/recommendations',
      approvalType: 'drift_fork_approval',
      recommendationId: recommendation.recommendationId,
      driftType: recommendation.type,
      proposedFork: recommendation.proposedFork,
      recommendedAction: recommendation.recommendedAction,
      riskAssessment: recommendation.riskAssessment
    }
  );

  return {
    ...recommendation,
    status: FORK_STATUSES.pending_approval,
    approvalId: approval ? approval.id : null,
    approvalStatus: approval ? approval.status : null
  };
}

async function routeRecommendations(recommendations, createApprovalRequest) {
  const results = await Promise.all(
    recommendations.map((rec) => routeRecommendationForApproval(rec, createApprovalRequest))
  );
  return results.filter(Boolean);
}

module.exports = {
  routeRecommendations,
  routeRecommendationForApproval
};
