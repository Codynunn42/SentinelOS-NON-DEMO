// Drift Fork Engine
// Purpose: Generate governed fork proposals from approved drift recommendations.
// This engine NEVER writes to files, patches branches, or modifies governance.
// It produces structured proposals for human review only.

const { validateForkProposal, IMMUTABLE_TARGETS } = require('./driftPolicies');
const { FORK_STATUSES } = require('./driftSchemas');

function buildForkProposal(recommendation) {
  const fork = recommendation.proposedFork;
  const validation = validateForkProposal(fork);

  if (!validation.valid) {
    return {
      proposalId: `fork_blocked_${Date.now()}`,
      status: 'blocked',
      reason: validation.reason,
      recommendationId: recommendation.recommendationId
    };
  }

  return {
    proposalId: `fork_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: FORK_STATUSES.proposed,
    recommendationId: recommendation.recommendationId,
    branchName: fork.branchName,
    targetFiles: fork.targetFiles,
    rationale: fork.rationale || recommendation.recommendedAction,
    detectedPattern: recommendation.detectedPattern,
    riskAssessment: recommendation.riskAssessment,
    requiresHumanApproval: true,
    approvalId: recommendation.approvalId || null,
    immutableTargets: IMMUTABLE_TARGETS,
    constraints: [
      'Sentinel may not autonomously merge this fork',
      'All target files must be reviewed by a human operator',
      'Governance, authority, and audit files are immutable',
      'Merge requires explicit human authorization and audit record'
    ],
    tenant: recommendation.tenant || null,
    timestamp: new Date().toISOString()
  };
}

function buildForkProposals(recommendations) {
  return recommendations
    .filter((rec) => rec.proposedFork)
    .map(buildForkProposal);
}

module.exports = {
  buildForkProposal,
  buildForkProposals
};
