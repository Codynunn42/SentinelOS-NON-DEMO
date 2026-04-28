function isBlocked(entry) {
  const result = entry && entry.result ? entry.result : {};
  return (
    result.success === false ||
    result.decision === 'blocked' ||
    result.allowed === false ||
    Boolean(result.error)
  );
}

function getEntryType(entry) {
  if (!entry || typeof entry.command !== 'string') {
    return 'unknown';
  }

  if (entry.command.startsWith('security.')) {
    return 'security';
  }

  if (entry.command.startsWith('system.')) {
    return 'system';
  }

  if (entry.command.startsWith('agent.')) {
    return 'agent';
  }

  if (entry.result && entry.result.route === '/policy/evaluate') {
    return 'policy';
  }

  return 'command';
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function roundConfidence(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function summarizeEntry(entry) {
  const command = entry && entry.command ? entry.command : 'unknown';
  const result = entry && entry.result ? entry.result : {};

  if (result.error) {
    return `${command} reported error: ${result.error}`;
  }

  if (result.reason) {
    return `${command} recorded reason: ${result.reason}`;
  }

  if (result.status) {
    return `${command} recorded status: ${result.status}`;
  }

  if (result.decision) {
    return `${command} decision: ${result.decision}`;
  }

  return `${command} recorded`;
}

function buildEvidence(recentEntries, blockedEntries) {
  if (recentEntries.length === 0) {
    return ['no execution events recorded in the current learning window'];
  }

  if (blockedEntries.length > 0) {
    return blockedEntries.slice(-5).map(summarizeEntry);
  }

  return recentEntries.slice(-5).map(summarizeEntry);
}

function getRiskLevel(state) {
  if (state === 'stable') {
    return 'low';
  }

  if (state === 'drift') {
    return 'high';
  }

  return 'medium';
}

function isHighRiskSecurityEntry(entry) {
  const result = entry && entry.result ? entry.result : {};
  const payload = entry && entry.payload ? entry.payload : {};
  return (
    entry &&
    typeof entry.command === 'string' &&
    entry.command.startsWith('security.') &&
    (result.riskLevel === 'high' || payload.riskLevel === 'high')
  );
}

function summarizeSecurityEntries(entries) {
  const securityEntries = entries.filter((entry) => (
    entry && typeof entry.command === 'string' && entry.command.startsWith('security.')
  ));
  const highRiskEntries = securityEntries.filter(isHighRiskSecurityEntry);
  const consentEntries = securityEntries.filter((entry) => entry.command === 'security.app_consent_event');
  const identityRiskEntries = securityEntries.filter((entry) => entry.command === 'security.identity_risk_event');
  const latestEvent = securityEntries.length ? securityEntries[securityEntries.length - 1] : null;

  return {
    totalEvents: securityEntries.length,
    highRiskEvents: highRiskEntries.length,
    appConsentEvents: consentEntries.length,
    identityRiskEvents: identityRiskEntries.length,
    latestEvent: latestEvent
      ? {
          type: latestEvent.result && latestEvent.result.securityEvent
            ? latestEvent.result.securityEvent
            : latestEvent.command.replace('security.', ''),
          riskLevel:
            latestEvent.result && latestEvent.result.riskLevel
              ? latestEvent.result.riskLevel
              : latestEvent.payload && latestEvent.payload.riskLevel
                ? latestEvent.payload.riskLevel
                : 'unknown',
          subject:
            latestEvent.payload && (latestEvent.payload.user || latestEvent.payload.application || latestEvent.payload.appId)
              ? latestEvent.payload.user || latestEvent.payload.application || latestEvent.payload.appId
              : null,
          reason:
            latestEvent.result && latestEvent.result.reason
              ? latestEvent.result.reason
              : latestEvent.payload && latestEvent.payload.reason
                ? latestEvent.payload.reason
                : null
        }
      : null
  };
}

function classifyLearningState(recentEntries, blockedEntries) {
  if (recentEntries.length === 0) {
    const state = 'unknown';
    return {
      state,
      confidence: 0.2,
      riskLevel: getRiskLevel(state),
      requiresApproval: false,
      actionGate: 'observe_only',
      reason: 'No execution history is available for this scope.',
      evidence: buildEvidence(recentEntries, blockedEntries)
    };
  }

  const blockedRatio = blockedEntries.length / recentEntries.length;
  const recentTail = recentEntries.slice(-5);
  const recentBlocked = recentTail.filter(isBlocked).length;
  const highRiskSecurityEntries = recentEntries.filter(isHighRiskSecurityEntry);

  if (highRiskSecurityEntries.length > 0) {
    const state = 'drift';
    return {
      state,
      confidence: 0.95,
      riskLevel: getRiskLevel(state),
      requiresApproval: true,
      actionGate: 'human_review_required',
      reason: 'High-risk identity or app consent signal detected.',
      evidence: buildEvidence(recentEntries, highRiskSecurityEntries)
    };
  }

  if (recentBlocked >= 2 || blockedRatio >= 0.3) {
    const state = 'drift';
    return {
      state,
      confidence: roundConfidence(Math.min(0.95, 0.55 + blockedRatio)),
      riskLevel: getRiskLevel(state),
      requiresApproval: true,
      actionGate: 'human_review_required',
      reason: 'Recent execution history shows repeated blocked or failed outcomes.',
      evidence: buildEvidence(recentEntries, blockedEntries)
    };
  }

  if (recentEntries.length < 3) {
    const state = 'unknown';
    return {
      state,
      confidence: 0.45,
      riskLevel: getRiskLevel(state),
      requiresApproval: false,
      actionGate: 'observe_only',
      reason: 'Execution history is too small to trust automated recommendations.',
      evidence: buildEvidence(recentEntries, blockedEntries)
    };
  }

  const state = 'stable';
  return {
    state,
    confidence: roundConfidence(0.7 + Math.min(0.25, recentEntries.length / 100)),
    riskLevel: getRiskLevel(state),
    requiresApproval: false,
    actionGate: 'policy_allowed_actions_only',
    reason: 'Recent execution history has enough successful outcomes without drift signals.',
    evidence: buildEvidence(recentEntries, blockedEntries)
  };
}

function buildSuggestion(id, priority, title, detail, action, policy, confidence = 0.5) {
  return {
    id,
    priority,
    title,
    detail,
    recommendedAction: action,
    policy,
    confidence: roundConfidence(confidence)
  };
}

function analyzeExecutionHistory(entries, options = {}) {
  const tenant = typeof options.tenant === 'string' && options.tenant.trim() ? options.tenant.trim() : null;
  const sourceEntries = Array.isArray(entries) ? entries : [];
  const scopedEntries = tenant
    ? sourceEntries.filter((entry) => entry && entry.tenant === tenant)
    : sourceEntries;
  const recentEntries = scopedEntries.slice(-50);
  const blockedEntries = recentEntries.filter(isBlocked);
  const successfulEntries = recentEntries.filter((entry) => !isBlocked(entry));
  const commandCounts = countBy(recentEntries, (entry) => entry.command || 'unknown');
  const typeCounts = countBy(recentEntries, getEntryType);
  const security = summarizeSecurityEntries(recentEntries);
  const learningState = classifyLearningState(recentEntries, blockedEntries);
  const suggestions = [];

  if (recentEntries.length === 0) {
    suggestions.push(
      buildSuggestion(
        'learning.capture-first-events',
        'medium',
        'Capture execution history',
        'No execution history is available for this scope yet.',
        'Run a governed command or record a deployment event before asking Sentinel to recommend actions.',
        'observe_only',
        learningState.confidence
      )
    );
  }

  if (learningState.state === 'drift') {
    suggestions.push(
      buildSuggestion(
        'learning.pause-and-review-drift',
        'high',
        'Pause automation and review drift',
        learningState.reason,
        'Stop automatic execution for this scope, inspect audit events, and require human approval before retrying.',
        'human_review_required',
        learningState.confidence
      )
    );
  }

  if (security.highRiskEvents > 0) {
    suggestions.push(
      buildSuggestion(
        'security.review-high-risk-signal',
        'high',
        'Review high-risk security signal',
        'Identity or application consent risk was detected in the current learning window.',
        'Keep access-changing actions blocked until an operator reviews the event and records an approval outcome.',
        'human_review_required',
        learningState.confidence
      )
    );
  }

  if (security.appConsentEvents > 0) {
    suggestions.push(
      buildSuggestion(
        'security.review-app-consent',
        'high',
        'Review application consent request',
        'A new application consent event was recorded.',
        'Verify publisher trust, requested scopes, and tenant impact before allowing the integration.',
        'approval_required',
        learningState.confidence
      )
    );
  }

  if (typeCounts.system > 0 && learningState.state === 'stable') {
    suggestions.push(
      buildSuggestion(
        'learning.promote-stable-system-change',
        'medium',
        'Promote stable system change',
        'Recent system events show no blocked outcomes in the current learning window.',
        'Keep the health-gated deployment lane active and record the revision outcome as evidence.',
        'allowed_with_audit',
        learningState.confidence
      )
    );
  }

  if (successfulEntries.length >= 3 && learningState.state === 'stable') {
    suggestions.push(
      buildSuggestion(
        'learning.expand-readonly-integrations',
        'low',
        'Expand read-only integrations',
        'Recent governed execution is stable.',
        'Add read-only Azure or GitHub adapters next so Sentinel can compare live state with repo intent.',
        'read_only',
        learningState.confidence
      )
    );
  }

  return {
    status: 'ok',
    tenant,
    windowSize: recentEntries.length,
    summary: {
      totalEvents: recentEntries.length,
      successfulEvents: successfulEntries.length,
      blockedEvents: blockedEntries.length,
      commandCounts,
      typeCounts,
      security,
      learningState
    },
    suggestions
  };
}

module.exports = {
  analyzeExecutionHistory,
  classifyLearningState
};
