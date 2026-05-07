function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeTrustScore(input = {}) {
  let score = 100;

  if (input.roleMatched === false) score -= 30;
  if (input.policyPassed === false) score -= 25;

  if (input.riskLevel === 'medium') score -= 10;
  if (input.riskLevel === 'high') score -= 25;

  const retries = Number(input.retries || 0);
  if (retries > 0) score -= Math.min(10, retries * 2);

  const latencyMs = Number(input.latencyMs || 0);
  if (latencyMs > 500) score -= 5;

  if (input.manualOverride === true) score -= 10;

  return clampScore(score);
}

function explainTrustScore(input = {}) {
  const reasons = [];

  if (input.roleMatched === false) reasons.push('role_mismatch');
  if (input.policyPassed === false) reasons.push('policy_blocked');
  if (input.riskLevel === 'medium') reasons.push('medium_risk');
  if (input.riskLevel === 'high') reasons.push('high_risk');
  if (Number(input.retries || 0) > 0) reasons.push('retry_penalty');
  if (Number(input.latencyMs || 0) > 500) reasons.push('latency_penalty');
  if (input.manualOverride === true) reasons.push('manual_override');

  return reasons;
}

function buildCommandTrustInput({
  envelope = {},
  policy = {},
  policyContext = {},
  latencyMs = 0,
  result = null
} = {}) {
  const metadata = envelope.metadata && typeof envelope.metadata === 'object'
    ? envelope.metadata
    : {};
  const requiredRole =
    policy.details && policy.details.requiredRole
      ? policy.details.requiredRole
      : envelope.command === 'deal.execute'
        ? 'approver'
        : null;
  const role = policyContext.role || metadata.role || null;
  const roleMatched = requiredRole
    ? role === requiredRole || role === 'platform'
    : true;

  return {
    roleMatched,
    policyPassed: policy.allowed !== false && (!result || result.success !== false),
    riskLevel: policy.riskLevel || 'low',
    retries: metadata.retries || 0,
    latencyMs,
    manualOverride: metadata.override === true || metadata.manualOverride === true
  };
}

function buildTrustScoreResult(input = {}) {
  return {
    trustScore: computeTrustScore(input),
    reasons: explainTrustScore(input)
  };
}

module.exports = {
  buildCommandTrustInput,
  buildTrustScoreResult,
  computeTrustScore,
  explainTrustScore
};
