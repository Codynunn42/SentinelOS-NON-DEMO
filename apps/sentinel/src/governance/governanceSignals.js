const crypto = require('crypto');
const {
  getGovernanceSignalCounts,
  getRecentGovernanceSignals,
  saveGovernanceSignals
} = require('./governanceSignalsStore');
const { escalateGovernanceSignals } = require('./signalEscalation');

const signals = [];
const MAX_SIGNALS = 50;
const subscribers = new Set();

function getResult(entry) {
  return entry && entry.result && typeof entry.result === 'object' ? entry.result : {};
}

function getTrustScore(entry) {
  const result = getResult(entry);
  const data = result.data && typeof result.data === 'object' ? result.data : {};

  if (typeof result.trustScore === 'number') {
    return result.trustScore;
  }

  if (typeof data.trustScore === 'number') {
    return data.trustScore;
  }

  return null;
}

function getReasons(entry) {
  const result = getResult(entry);
  const data = result.data && typeof result.data === 'object' ? result.data : {};

  if (Array.isArray(result.reasons)) {
    return result.reasons;
  }

  if (Array.isArray(data.reasons)) {
    return data.reasons;
  }

  return [];
}

function isBlocked(entry) {
  const result = getResult(entry);
  const status = String(result.status || result.decision || '').toLowerCase();

  return (
    result.success === false ||
    status.includes('block') ||
    status === 'deny' ||
    Boolean(result.error)
  );
}

function createSignal(entry, type, severity, message, details = {}) {
  return {
    id: crypto.randomUUID(),
    eventId: entry.eventId || null,
    type,
    severity,
    message,
    tenant: entry.tenant || null,
    command: entry.command || 'unknown',
    actor: entry.actor || null,
    details,
    timestamp: new Date().toISOString()
  };
}

function publishGovernanceSignal(signal) {
  for (const subscriber of subscribers) {
    try {
      subscriber(signal);
    } catch (_) {
      subscribers.delete(subscriber);
    }
  }
}

function subscribeGovernanceSignals(callback) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

function evaluateGovernanceSignals(entry) {
  const newSignals = [];
  const trustScore = getTrustScore(entry);
  const reasons = getReasons(entry);
  const result = getResult(entry);

  if (typeof trustScore === 'number' && trustScore < 40) {
    newSignals.push(createSignal(
      entry,
      'low_trust_score',
      'high',
      `Low trust score detected: ${trustScore}`,
      { trustScore, reasons }
    ));
  }

  if (isBlocked(entry)) {
    newSignals.push(createSignal(
      entry,
      'blocked_action',
      result.error ? 'high' : 'medium',
      `Blocked action: ${entry.command || 'unknown'}`,
      { trustScore, reasons, error: result.error || null }
    ));
  }

  if (result.approvalRequired === true || (result.policy && result.policy.approvalRequired === true)) {
    newSignals.push(createSignal(
      entry,
      'approval_required',
      'medium',
      `Approval required: ${entry.command || 'unknown'}`,
      { trustScore, reasons }
    ));
  }

  if (entry.command === 'system.audit.persist_failed') {
    newSignals.push(createSignal(
      entry,
      'audit_persistence_failure',
      'high',
      'Audit persistence failure detected',
      { error: result.error || null }
    ));
  }

  if (newSignals.length) {
    signals.unshift(...newSignals);
    signals.splice(MAX_SIGNALS);
    saveGovernanceSignals(newSignals).catch(() => {});
    escalateGovernanceSignals(newSignals).catch(() => {});
    newSignals.forEach(publishGovernanceSignal);
  }

  return newSignals;
}

async function getGovernanceSignals(options = {}) {
  const tenant = options.tenant || null;
  const recent = await getRecentGovernanceSignals({
    tenant,
    limit: options.limit || MAX_SIGNALS
  });

  if (recent.length) {
    return recent;
  }

  return tenant
    ? signals.filter((signal) => signal.tenant === tenant)
    : signals.slice();
}

async function buildGovernanceSignalMetrics(options = {}) {
  const bySeverity = await getGovernanceSignalCounts(options);

  return {
    totalSignals: (bySeverity.high || 0) + (bySeverity.medium || 0) + (bySeverity.low || 0),
    high: bySeverity.high || 0,
    medium: bySeverity.medium || 0,
    low: bySeverity.low || 0,
    bySeverity: {
      high: bySeverity.high || 0,
      medium: bySeverity.medium || 0,
      low: bySeverity.low || 0
    }
  };
}

module.exports = {
  buildGovernanceSignalMetrics,
  evaluateGovernanceSignals,
  getGovernanceSignals,
  subscribeGovernanceSignals
};
