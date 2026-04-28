// Sentinel Analysis Module
// Purpose: Interpret Sentinel learning output and frame risk, alignment, and rationale.

function getLearningState(input) {
  if (input && input.learningState) {
    return input.learningState;
  }

  if (input && input.summary && input.summary.learningState) {
    return input.summary.learningState;
  }

  return {
    state: 'unknown',
    confidence: 0,
    actionGate: 'observe_only',
    riskLevel: 'medium',
    requiresApproval: false,
    reason: 'Learning state was not provided.',
    evidence: []
  };
}

function getDirective(learningState) {
  if (learningState.security && learningState.security.highRiskEvents > 0) {
    return 'Restrict access-changing actions, preserve the security signal, and require human review before proceeding.';
  }

  if (learningState.state === 'drift') {
    return 'Pause automation, preserve evidence, and route the next action through human review.';
  }

  if (learningState.state === 'stable') {
    return 'Proceed only with policy-approved actions and continue recording outcomes.';
  }

  return 'Observe, collect more history, and avoid automation until confidence improves.';
}

function getFramedSuggestion(learningState) {
  if (learningState.security && learningState.security.highRiskEvents > 0) {
    return 'High-risk identity or app access behavior detected. Access-affecting actions are paused pending review.';
  }

  if (learningState.security && learningState.security.appConsentEvents > 0) {
    return 'Application consent activity detected. Verify publisher trust and requested scopes before granting access.';
  }

  if (learningState.state === 'stable') {
    return 'System behavior is stable. Recommended actions can proceed within policy limits.';
  }

  if (learningState.state === 'drift') {
    return 'System drift detected. Automation is paused and human review is required.';
  }

  return 'System state is not fully understood. Observation is recommended before taking action.';
}

function getAlignmentScore(learningState) {
  if (learningState.state === 'stable') {
    return 0.9;
  }

  if (learningState.state === 'drift') {
    return 0.2;
  }

  return 0.5;
}

function evaluateAnalysis(input, options = {}) {
  const learningState = getLearningState(input);
  const security =
    input && input.summary && input.summary.security
      ? input.summary.security
      : learningState.security || null;
  if (security) {
    learningState.security = security;
  }
  const confidence =
    typeof input?.confidence === 'number'
      ? input.confidence
      : typeof learningState.confidence === 'number'
        ? learningState.confidence
        : 0;
  const suggestions = Array.isArray(input?.suggestions) ? input.suggestions : [];
  const systemGoal =
    typeof options.systemGoal === 'string' && options.systemGoal.trim()
      ? options.systemGoal.trim()
      : 'stability-first governed execution';
  const reason = learningState.reason || 'No reason provided.';
  const normalizedReason = reason.endsWith('.') ? reason.slice(0, -1) : reason;

  return {
    name: 'Sentinel Analysis',
    systemGoal,
    alignmentScore: getAlignmentScore(learningState),
    riskLevel: learningState.riskLevel || 'medium',
    requiresHumanReview: Boolean(learningState.requiresApproval),
    requiresApproval: Boolean(learningState.requiresApproval),
    actionGate: learningState.actionGate || 'observe_only',
    framedSuggestion: getFramedSuggestion(learningState),
    explanation: `State: ${learningState.state}. Reason: ${normalizedReason}. Confidence: ${confidence}.`,
    interpretation: `System state is ${learningState.state} with ${learningState.riskLevel || 'medium'} risk. ${reason}`,
    directive: getDirective(learningState),
    confidence,
    evidence: learningState.evidence || [],
    security,
    originalSuggestions: suggestions
  };
}

module.exports = {
  evaluateAnalysis
};
