// Sentinel Security Module
// Purpose: Normalize trust context and score whether a decision can safely proceed.

function clampScore(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function calculateTrustScore(context = {}) {
  let score = 0.7;

  if (context.identityRisk === 'high') score -= 0.5;
  if (context.identityRisk === 'medium') score -= 0.2;
  if (context.appConsentRisk === 'high') score -= 0.3;
  if (context.unknownActor) score -= 0.2;
  if (context.drift) score -= 0.3;
  if (context.failedOrBlockedEvents) score -= 0.2;

  if (context.stableHistory) score += 0.15;
  if (context.knownActor) score += 0.1;
  if (context.approvedPriorAction) score += 0.1;

  return clampScore(score);
}

function getTrustBand(trustScore) {
  if (trustScore >= 0.8) {
    return 'trusted';
  }

  if (trustScore >= 0.5) {
    return 'cautious';
  }

  return 'untrusted';
}

function buildTrustContext({ learning, actor } = {}) {
  const learningState = learning && learning.summary ? learning.summary.learningState : null;
  const security = learning && learning.summary ? learning.summary.security : null;
  const blockedEvents = learning && learning.summary ? learning.summary.blockedEvents || 0 : 0;
  const identityRisk =
    security && security.highRiskEvents > 0
      ? 'high'
      : security && security.identityRiskEvents > 0
        ? 'medium'
        : 'low';
  const appConsentRisk =
    security && security.highRiskEvents > 0 && security.appConsentEvents > 0
      ? 'high'
      : security && security.appConsentEvents > 0
        ? 'medium'
        : 'low';

  return {
    identityRisk,
    appConsentRisk,
    unknownActor: !actor || actor === 'unknown',
    knownActor: Boolean(actor && actor !== 'unknown'),
    drift: Boolean(learningState && learningState.state === 'drift'),
    stableHistory: Boolean(learningState && learningState.state === 'stable'),
    failedOrBlockedEvents: blockedEvents > 0,
    securityEvents: security ? security.totalEvents : 0
  };
}

function evaluateTrust(input = {}) {
  const context = input.context || buildTrustContext(input);
  const trustScore = calculateTrustScore(context);

  return {
    trustScore,
    trustBand: getTrustBand(trustScore),
    context
  };
}

module.exports = {
  buildTrustContext,
  calculateTrustScore,
  evaluateTrust,
  getTrustBand
};
