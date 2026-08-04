// Phase 4 — Sovereign Nexus Control Surface (SNCS)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Sovereign Nexus Control Surface is the visibility layer of SentinelOS.
// It reads live sovereign state from SPE (policy), SEL (ledger), and SER (runtime)
// and assembles it into structured snapshots that the Executive Desk can display.
//
// SNCS pillars:
//   1. Sovereign provider health    — provider status through the SER governance lens
//   2. Sovereign drift classification — drift path per provider per session
//   3. Sovereign evidence view       — SEL ledger entries formatted for inspection
//   4. Sovereign execution timeline  — ordered session receipts + attempts
//   5. Sovereign compliance panel    — SPE gate status per policy
//
// Surface snapshot structure:
//   {
//     snapshotId:    string       — SNCS-<hex>
//     version:       string       — SNCS schema version
//     assembledAt:   string       — ISO timestamp
//     providerHealth: object      — getSovereignProviderHealth output
//     driftSummary:   object      — getSovereignDriftClassification output
//     evidenceView:   object      — getSovereignEvidenceView output
//     executionTimeline: object   — getSovereignExecutionTimeline output
//     compliancePanel:  object    — getSovereignCompliancePanel output (or null)
//     sessionId:     string|null  — source SER session
//     ledgerId:      string|null  — source SEL ledger
//     policyId:      string|null  — source SPE policy
//   }

'use strict';

const crypto = require('crypto');

const {
  createExecutionSession,
  routeUnderPolicy,
  recordExecutionAttempt,
  governFailover,
  issueExecutionReceipt,
  completeSession,
  getSessionSummary,
  EXECUTION_OUTCOME,
  FAILOVER_REASON,
  SESSION_STATUS,
  DRIFT_SEVERITY
} = require('./runtime');

const {
  createSovereignPolicy,
  addComplianceGate,
  openGate,
  evaluateSovereignPolicy,
  getPolicyStatus,
  EVAL_DECISION,
  DRIFT_ENFORCEMENT,
  GATE_STATUS
} = require('./policy');

const {
  verifyLedgerIntegrity,
  getLedgerSummary,
  LEDGER_STATUS,
  ENTRY_TYPE,
  DRIFT_CLASS
} = require('./ledger');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SNCS_VERSION = '1.0';

const PROVIDER_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNKNOWN: 'unknown',
  FAILOVER: 'failover'
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function uniqueId(prefix) {
  return `${prefix}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Map a DRIFT_CLASS value to a display label.
 * @param {string} driftClass
 * @returns {string}
 */
function driftLabel(driftClass) {
  const map = {
    [DRIFT_CLASS.NONE]: 'NONE',
    [DRIFT_CLASS.INFO]: 'INFO',
    [DRIFT_CLASS.WARNING]: 'WARNING',
    [DRIFT_CLASS.CRITICAL]: 'CRITICAL'
  };
  return map[driftClass] || 'UNKNOWN';
}

/**
 * Derive the drift class for a set of ledger entries for a given provider.
 * @param {object[]} entries
 * @param {string} provider
 * @returns {string} DRIFT_CLASS
 */
function providerDriftClass(entries, provider) {
  const order = [DRIFT_CLASS.NONE, DRIFT_CLASS.INFO, DRIFT_CLASS.WARNING, DRIFT_CLASS.CRITICAL];
  let max = DRIFT_CLASS.NONE;
  for (const entry of entries) {
    if (entry.provider === provider) {
      const idx = order.indexOf(entry.driftClass);
      if (idx > order.indexOf(max)) max = entry.driftClass;
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// getSovereignProviderHealth
// ---------------------------------------------------------------------------

/**
 * Assemble a sovereign provider health view from a SER session.
 * Each provider that participated in the session is assessed for health status
 * based on the session ledger entries and receipt outcomes.
 *
 * @param {object} session — SER execution session
 * @returns {object} providerHealth snapshot
 */
function getSovereignProviderHealth(session) {
  if (!session || !session.sessionId) {
    throw new Error('SNCS_SESSION_REQUIRED');
  }

  const { ledger, receipts, providers } = session;
  const entries = (ledger && ledger.entries) || [];

  // Derive per-provider health from receipts + entries
  const providerMap = {};
  for (const provider of providers) {
    const providerEntries = entries.filter((e) => e.provider === provider);
    const providerReceipts = receipts.filter((r) => r.provider === provider);
    const failoverEntries = providerEntries.filter((e) => e.type === ENTRY_TYPE.FAILOVER);
    const execEntries = providerEntries.filter((e) => e.type === ENTRY_TYPE.EXECUTION);

    // Check if this provider had a failure receipt
    const hasFailure = providerReceipts.some((r) => r.outcome === EXECUTION_OUTCOME.FAILURE || r.outcome === EXECUTION_OUTCOME.ABORTED);
    const hasSuccess = providerReceipts.some((r) => r.outcome === EXECUTION_OUTCOME.SUCCESS || r.outcome === EXECUTION_OUTCOME.FAILOVER);
    const wasFailoverSource = entries.some(
      (e) => e.type === ENTRY_TYPE.FAILOVER && e.payload && e.payload.fromProvider === provider
    );
    const wasFailoverTarget = entries.some(
      (e) => e.type === ENTRY_TYPE.FAILOVER && e.payload && e.payload.toProvider === provider
    );

    let healthStatus;
    if (wasFailoverSource) {
      healthStatus = PROVIDER_HEALTH_STATUS.FAILOVER;
    } else if (hasFailure && !hasSuccess) {
      healthStatus = PROVIDER_HEALTH_STATUS.DEGRADED;
    } else if (hasSuccess) {
      healthStatus = PROVIDER_HEALTH_STATUS.HEALTHY;
    } else {
      healthStatus = PROVIDER_HEALTH_STATUS.UNKNOWN;
    }

    const driftClass = providerDriftClass(entries, provider);

    providerMap[provider] = {
      provider,
      healthStatus,
      driftClass,
      driftLabel: driftLabel(driftClass),
      executionAttempts: execEntries.length,
      receipts: providerReceipts.length,
      wasFailoverSource,
      wasFailoverTarget,
      failoverCount: failoverEntries.length,
      lastActivity: providerEntries.length > 0
        ? providerEntries[providerEntries.length - 1].timestamp
        : null
    };
  }

  // Determine primary provider (first attempt in execution entries)
  const firstExecEntry = entries.find((e) => e.type === ENTRY_TYPE.EXECUTION);
  const primaryProvider = firstExecEntry ? firstExecEntry.provider : (providers[0] || null);

  // Build failover path (providers in order after primary)
  const failoverPath = providers.filter((p) => p !== primaryProvider).map((p) => ({
    provider: p,
    role: providerMap[p] && providerMap[p].wasFailoverTarget ? 'failover-active' : 'failover-eligible',
    healthStatus: providerMap[p] ? providerMap[p].healthStatus : PROVIDER_HEALTH_STATUS.UNKNOWN
  }));

  return {
    sessionId: session.sessionId,
    total: providers.length,
    primaryProvider,
    providers: Object.values(providerMap),
    failoverPath,
    sessionDriftClass: session.driftClass,
    assessedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// getSovereignDriftClassification
// ---------------------------------------------------------------------------

/**
 * Assemble a sovereign drift classification view from a SER session.
 * Returns the per-provider drift path and overall session drift class.
 *
 * @param {object} session — SER execution session
 * @returns {object} driftSummary snapshot
 */
function getSovereignDriftClassification(session) {
  if (!session || !session.sessionId) {
    throw new Error('SNCS_SESSION_REQUIRED');
  }

  const { ledger, providers } = session;
  const entries = (ledger && ledger.entries) || [];

  // Per-provider drift — chronological
  const providerDrift = providers.map((provider) => {
    const provEntries = entries
      .filter((e) => e.provider === provider)
      .map((e) => ({
        entryId: e.entryId,
        type: e.type,
        driftClass: e.driftClass,
        driftLabel: driftLabel(e.driftClass),
        timestamp: e.timestamp
      }));

    const worstDrift = providerDriftClass(entries, provider);

    return {
      provider,
      worstDriftClass: worstDrift,
      worstDriftLabel: driftLabel(worstDrift),
      entryCount: provEntries.length,
      driftTimeline: provEntries
    };
  });

  // Chronological drift timeline across all providers
  const driftTimeline = entries
    .filter((e) => e.driftClass !== DRIFT_CLASS.NONE)
    .map((e) => ({
      entryId: e.entryId,
      provider: e.provider,
      type: e.type,
      driftClass: e.driftClass,
      driftLabel: driftLabel(e.driftClass),
      timestamp: e.timestamp
    }));

  return {
    sessionId: session.sessionId,
    overallDriftClass: session.driftClass,
    overallDriftLabel: driftLabel(session.driftClass),
    driftEscalated: session.driftClass !== DRIFT_CLASS.NONE,
    providerDrift,
    driftTimeline,
    totalDriftEvents: driftTimeline.length,
    assessedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// getSovereignEvidenceView
// ---------------------------------------------------------------------------

/**
 * Assemble a sovereign evidence view from a SEL ledger.
 * Formats entries for inspection with integrity status.
 *
 * @param {object} ledger — SEL ledger
 * @param {string} [signingKey] — signing key for integrity check
 * @returns {object} evidenceView snapshot
 */
function getSovereignEvidenceView(ledger, signingKey) {
  if (!ledger || !ledger.ledgerId) {
    throw new Error('SNCS_LEDGER_REQUIRED');
  }

  const integrity = verifyLedgerIntegrity(ledger, signingKey);
  const summary = getLedgerSummary(ledger);

  const entries = ledger.entries.map((entry, idx) => ({
    index: idx + 1,
    entryId: entry.entryId,
    provider: entry.provider,
    type: entry.type,
    ref: entry.ref,
    driftClass: entry.driftClass,
    driftLabel: driftLabel(entry.driftClass),
    policyId: entry.policyId,
    chainId: entry.chainId,
    prevHash: entry.prevHash ? `${entry.prevHash.slice(0, 12)}…` : null,
    hash: entry.hash ? `${entry.hash.slice(0, 12)}…` : null,
    timestamp: entry.timestamp,
    payloadKeys: entry.payload ? Object.keys(entry.payload) : []
  }));

  return {
    ledgerId: ledger.ledgerId,
    envelopeId: ledger.envelopeId,
    status: ledger.status,
    version: ledger.version,
    driftClass: ledger.driftClass,
    totalEntries: entries.length,
    entries,
    headHash: ledger.headHash ? `${ledger.headHash.slice(0, 12)}…` : null,
    sealedAt: ledger.sealedAt,
    createdAt: ledger.createdAt,
    integrity: {
      valid: integrity.valid,
      reason: integrity.reason,
      corruptEntryId: integrity.corruptEntryId
    },
    summary: {
      byProvider: summary.byProvider,
      byType: summary.byType
    }
  };
}

// ---------------------------------------------------------------------------
// getSovereignExecutionTimeline
// ---------------------------------------------------------------------------

/**
 * Assemble a sovereign execution timeline from a SER session.
 * Returns ordered events (routing, attempts, failovers, receipts) with metadata.
 *
 * @param {object} session — SER execution session
 * @returns {object} executionTimeline snapshot
 */
function getSovereignExecutionTimeline(session) {
  if (!session || !session.sessionId) {
    throw new Error('SNCS_SESSION_REQUIRED');
  }

  const { ledger, receipts } = session;
  const entries = (ledger && ledger.entries) || [];

  // Build ordered timeline from ledger entries
  const timeline = entries.map((entry, idx) => {
    let label;
    switch (entry.type) {
      case ENTRY_TYPE.POLICY:
        label = `Policy routing — ${entry.payload && entry.payload.routingDecision ? entry.payload.routingDecision.toUpperCase() : 'EVALUATED'}`;
        break;
      case ENTRY_TYPE.EXECUTION:
        label = `Execution attempt #${entry.payload && entry.payload.attempt ? entry.payload.attempt : idx + 1} — ${entry.provider} — ${entry.payload && entry.payload.outcome ? entry.payload.outcome.toUpperCase() : ''}`;
        break;
      case ENTRY_TYPE.FAILOVER:
        label = `Failover — ${entry.payload && entry.payload.fromProvider ? entry.payload.fromProvider : '?'} → ${entry.payload && entry.payload.toProvider ? entry.payload.toProvider : '?'} (${entry.payload && entry.payload.failoverReason ? entry.payload.failoverReason : ''})`;
        break;
      case ENTRY_TYPE.RECEIPT:
        label = `Receipt issued — ${entry.provider} — ${entry.payload && entry.payload.outcome ? entry.payload.outcome.toUpperCase() : ''}`;
        break;
      case ENTRY_TYPE.DRIFT:
        label = `Drift event — ${entry.provider} — ${driftLabel(entry.driftClass)}`;
        break;
      default:
        label = `${entry.type} — ${entry.provider}`;
    }

    return {
      step: idx + 1,
      entryId: entry.entryId,
      type: entry.type,
      provider: entry.provider,
      label,
      driftClass: entry.driftClass,
      driftLabel: driftLabel(entry.driftClass),
      timestamp: entry.timestamp
    };
  });

  // Attach receipt data to matching timeline entries
  const receiptSummary = receipts.map((r) => ({
    receiptId: r.receiptId,
    provider: r.provider,
    decision: r.decision,
    outcome: r.outcome,
    attempt: r.attempt,
    failoverFrom: r.failoverFrom,
    driftClass: r.driftClass,
    issuedAt: r.issuedAt
  }));

  return {
    sessionId: session.sessionId,
    command: session.command,
    status: session.status,
    policyId: session.policyId,
    envelopeId: session.envelopeId,
    driftClass: session.driftClass,
    driftLabel: driftLabel(session.driftClass),
    attempts: session.attempts,
    totalSteps: timeline.length,
    timeline,
    receipts: receiptSummary,
    receiptCount: receiptSummary.length,
    startedAt: session.startedAt,
    completedAt: session.completedAt
  };
}

// ---------------------------------------------------------------------------
// getSovereignCompliancePanel
// ---------------------------------------------------------------------------

/**
 * Assemble a sovereign compliance panel from a SPE policy.
 * Returns gate status, drift enforcement, and override state.
 *
 * @param {object} policy — SPE policy node
 * @returns {object} compliancePanel snapshot
 */
function getSovereignCompliancePanel(policy) {
  if (!policy || !policy.policyId) {
    throw new Error('SNCS_POLICY_REQUIRED');
  }

  const status = getPolicyStatus(policy);

  const gates = policy.complianceGates.map((gate) => ({
    gateId: gate.gateId,
    label: gate.label,
    status: gate.status,
    reason: gate.reason,
    resolvedAt: gate.resolvedAt
  }));

  const driftEnforcementLabel = {
    [DRIFT_ENFORCEMENT.NONE]: 'None',
    [DRIFT_ENFORCEMENT.ADVISORY]: 'Advisory',
    [DRIFT_ENFORCEMENT.ENFORCED]: 'Enforced',
    [DRIFT_ENFORCEMENT.LOCKED]: 'LOCKED'
  }[policy.driftEnforcement] || policy.driftEnforcement;

  return {
    policyId: policy.policyId,
    command: policy.command,
    policyStatus: policy.status,
    priority: policy.priority,
    version: policy.version,
    driftEnforcement: policy.driftEnforcement,
    driftEnforcementLabel,
    driftEnforcementElevated: policy.driftEnforcement !== DRIFT_ENFORCEMENT.NONE,
    hasOverride: status.hasOverride,
    overrideDecision: status.overrideDecision,
    inheritedFrom: policy.inheritedFrom,
    providers: policy.providers,
    evidenceCount: policy.evidenceRefs.length,
    gates,
    gatesSummary: {
      total: status.gates.total,
      passed: status.gates.passed,
      blocked: status.gates.blocked,
      open: status.gates.open,
      deferred: status.gates.deferred
    },
    gatesClean: status.gatesClean,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt
  };
}

// ---------------------------------------------------------------------------
// assembleSovereignSurface
// ---------------------------------------------------------------------------

/**
 * Assemble the full sovereign control surface snapshot from available state.
 *
 * @param {object} options
 * @param {object} options.session   — SER execution session (required)
 * @param {object} [options.policy]  — SPE policy (optional; uses session.policy if omitted)
 * @param {string} [options.signingKey] — for ledger integrity check
 * @returns {object} surface snapshot
 */
function assembleSovereignSurface(options = {}) {
  const { session, signingKey } = options;
  const policy = options.policy || (session && session.policy) || null;

  if (!session || !session.sessionId) {
    throw new Error('SNCS_SESSION_REQUIRED');
  }

  const snapshotId = uniqueId('SNCS-');

  const providerHealth = getSovereignProviderHealth(session);
  const driftSummary = getSovereignDriftClassification(session);
  const evidenceView = getSovereignEvidenceView(session.ledger, signingKey);
  const executionTimeline = getSovereignExecutionTimeline(session);
  const compliancePanel = policy ? getSovereignCompliancePanel(policy) : null;

  return {
    snapshotId,
    version: SNCS_VERSION,
    sessionId: session.sessionId,
    ledgerId: session.ledgerId,
    policyId: session.policyId,
    command: session.command,
    sessionStatus: session.status,
    assembledAt: nowIso(),
    providerHealth,
    driftSummary,
    evidenceView,
    executionTimeline,
    compliancePanel
  };
}

// ---------------------------------------------------------------------------
// createDemoSurface
// ---------------------------------------------------------------------------

/**
 * Create a demo sovereign surface by running a full SPE+SEL+SER session.
 * Exercises: policy gate, routing, execution attempt, failover, receipt, completion.
 * Returns the assembled SNCS snapshot.
 *
 * @param {object} [options]
 * @param {string} [options.command]
 * @param {string} [options.primaryProvider]
 * @param {string} [options.failoverProvider]
 * @param {string} [options.envelopeId]
 * @returns {object} surface snapshot
 */
function createDemoSurface(options = {}) {
  const command = options.command || 'sentinel.deploy';
  const primaryProvider = options.primaryProvider || 'openai';
  const failoverProvider = options.failoverProvider || 'azure';
  const envelopeId = options.envelopeId || `FEM-DEMO-${Date.now()}`;

  // --- Build SPE policy with a pre-passed gate ---
  let policy = createSovereignPolicy({ command, providers: [primaryProvider, failoverProvider] });
  policy = addComplianceGate(policy, { gateId: 'OPERATOR_APPROVAL', label: 'Operator Approval' });
  policy = addComplianceGate(policy, { gateId: 'DRIFT_GATE', label: 'Drift Clearance' });
  policy = openGate(policy, 'OPERATOR_APPROVAL');
  policy = openGate(policy, 'DRIFT_GATE');

  // --- Create SER session ---
  let session = createExecutionSession({
    command,
    policy,
    envelopeId,
    providers: [primaryProvider]
  });

  // --- Route under policy (allow) ---
  let decision;
  ({ session, decision } = routeUnderPolicy(session, {
    provider: primaryProvider,
    driftSeverity: DRIFT_SEVERITY.INFO,
    actor: 'sentinel-runtime',
    role: 'sovereign'
  }));

  // --- First attempt: failure on primary ---
  ({ session } = recordExecutionAttempt(session, {
    provider: primaryProvider,
    outcome: EXECUTION_OUTCOME.FAILURE,
    driftSeverity: DRIFT_SEVERITY.WARNING,
    payload: { reason: 'provider_timeout', latencyMs: 5000 }
  }));

  // --- Govern failover to secondary ---
  let failoverDecision;
  ({ session, decision: failoverDecision } = governFailover(session, {
    fromProvider: primaryProvider,
    toProvider: failoverProvider,
    reason: FAILOVER_REASON.PROVIDER_FAILURE,
    driftSeverity: DRIFT_SEVERITY.WARNING,
    actor: 'sentinel-runtime',
    role: 'sovereign'
  }));

  // --- Second attempt: success on failover provider ---
  ({ session } = recordExecutionAttempt(session, {
    provider: failoverProvider,
    outcome: EXECUTION_OUTCOME.SUCCESS,
    driftSeverity: DRIFT_SEVERITY.NONE,
    payload: { reason: null, latencyMs: 320 }
  }));

  // --- Issue sovereign receipt ---
  let receipt;
  ({ session, receipt } = issueExecutionReceipt(session, {
    provider: failoverProvider,
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.FAILOVER,
    failoverFrom: primaryProvider,
    driftSeverity: DRIFT_SEVERITY.NONE,
    attempt: session.attempts
  }));

  // --- Complete session ---
  session = completeSession(session, EXECUTION_OUTCOME.FAILOVER);

  // --- Assemble surface ---
  return assembleSovereignSurface({ session, policy });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  SNCS_VERSION,
  PROVIDER_HEALTH_STATUS,
  getSovereignProviderHealth,
  getSovereignDriftClassification,
  getSovereignEvidenceView,
  getSovereignExecutionTimeline,
  getSovereignCompliancePanel,
  assembleSovereignSurface,
  createDemoSurface
};
