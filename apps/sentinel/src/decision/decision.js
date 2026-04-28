// Sentinel Decision Engine
// Purpose: Convert learning + analysis + security trust into actionable decisions.

const { evaluateTrust } = require('../security/security');
const { signDecision, verifyDecision } = require('../security/signing');

function getLearningState(learning) {
  if (learning && learning.learningState) {
    return learning.learningState;
  }

  if (learning && learning.summary && learning.summary.learningState) {
    return learning.summary.learningState;
  }

  return {
    state: 'unknown',
    actionGate: 'observe_only'
  };
}

function evaluateDecision({ learning, analysis, forethought, actor, signingKey = process.env.BILLING_SIGN_KEY }) {
  const analysisOutput = analysis || forethought || {};
  const learningState = getLearningState(learning);
  const security =
    learning && learning.summary && learning.summary.security
      ? learning.summary.security
      : analysisOutput && analysisOutput.security
        ? analysisOutput.security
        : null;
  const riskLevel = analysisOutput && analysisOutput.riskLevel ? analysisOutput.riskLevel : 'medium';
  const requiresHumanReview = Boolean(
    analysisOutput && (analysisOutput.requiresHumanReview || analysisOutput.requiresApproval)
  );
  const alignmentScore =
    analysisOutput && typeof analysisOutput.alignmentScore === 'number'
      ? analysisOutput.alignmentScore
      : 0.5;
  const trust = evaluateTrust({ learning, actor });

  let decision = 'allow';
  let approvalRequired = false;
  let executionMode = 'auto';
  let reason = 'System stable. Actions allowed within policy.';

  if (learningState.state === 'unknown') {
    decision = 'restrict';
    executionMode = 'restricted';
    approvalRequired = true;
    reason = 'System unknown. Observation required before action.';
  }

  if (learningState.state === 'drift') {
    decision = 'block';
    executionMode = 'blocked';
    approvalRequired = true;
    reason = 'System drift detected. Human review required.';
  }

  if (riskLevel === 'high' || requiresHumanReview) {
    decision = 'block';
    executionMode = 'blocked';
    approvalRequired = true;
    reason = 'High risk detected by Sentinel Analysis.';
  }

  if (security && security.highRiskEvents > 0) {
    decision = 'block';
    executionMode = 'blocked';
    approvalRequired = true;
    reason = 'High-risk identity or app access signal requires human review.';
  }

  if (trust.trustScore < 0.5) {
    decision = 'block';
    executionMode = 'blocked';
    approvalRequired = true;
    reason = 'Low Sentinel Security trust score requires human review.';
  } else if (trust.trustScore < 0.8 && decision === 'allow') {
    decision = 'restrict';
    executionMode = 'restricted';
    approvalRequired = true;
    reason = 'Moderate Sentinel Security trust score requires restricted execution.';
  }

  const decisionOutput = {
    decision,
    executionMode,
    approvalRequired,
    alignmentScore,
    riskLevel,
    trustScore: trust.trustScore,
    trustBand: trust.trustBand,
    trustContext: trust.context,
    actionGate: learningState.actionGate || 'observe_only',
    security,
    reason
  };

  return signDecision(decisionOutput, signingKey);
}

module.exports = {
  evaluateDecision,
  verifyDecision
};
