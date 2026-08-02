// Phase 4 — Sovereign Execution Runtime (SER)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Sovereign Execution Runtime is the runtime layer of SentinelOS.
// It unifies the Sovereign Policy Engine (SPE), Sovereign Evidence Ledger (SEL),
// and Cross-Provider Routing Matrix (CPRM) into a single governed execution path.
//
// SER pillars:
//   1. Sovereign routing      — envelopes are routed only when SPE policy allows
//   2. Drift-aware governance — live drift classification gates every attempt
//   3. Ledger-bound execution — every attempt, failover, and receipt is sealed into SEL
//   4. Sovereign failover     — failover and retry decisions are sovereign acts, not system fallbacks
//   5. Execution receipts     — every completed execution emits a tamper-evident SEL receipt
//   6. Immutable session      — the session ledger is sealed on completion; no post-hoc edits
//
// Session structure:
//   {
//     sessionId:    string       — unique session identifier (SER-<hex>)
//     command:      string       — the command being executed
//     status:       string       — pending | routing | executing | complete | failed | blocked | deferred
//     policyId:     string|null  — bound SPE policy ID
//     ledgerId:     string       — bound SEL ledger ID
//     ledger:       object       — live SEL ledger (append-only)
//     receipts:     Receipt[]    — ordered sovereign execution receipts
//     driftClass:   string       — highest drift classification seen this session
//     providers:    string[]     — providers that participated
//     attempts:     number       — total execution attempts (including failovers)
//     startedAt:    string       — ISO timestamp
//     completedAt:  string|null  — ISO timestamp when session ended
//   }
//
// Receipt structure:
//   {
//     receiptId:    string        — SER-RECEIPT-<hex>
//     sessionId:    string        — owning session
//     envelopeId:   string|null   — linked FEM envelope ID (optional)
//     provider:     string        — executing provider
//     command:      string        — command executed
//     policyId:     string|null   — governing SPE policy
//     ledgerId:     string        — SEL ledger where this receipt is recorded
//     ledgerEntryId: string       — SEL entry ID of this receipt
//     decision:     string        — allow | block | defer
//     outcome:      string        — success | failure | failover | aborted
//     driftClass:   string        — drift at execution time
//     attempt:      number        — 1-based attempt number
//     retryOf:      string|null   — receiptId being retried
//     failoverFrom: string|null   — provider that failed (if failover)
//     issuedAt:     string        — ISO timestamp
//   }
//
// Routing decision structure:
//   {
//     sessionId:    string
//     decision:     string       — allow | block | defer
//     allowed:      boolean
//     reason:       string|null
//     policyId:     string|null
//     driftClass:   string
//     gateResults:  object[]
//   }

'use strict';

const crypto = require('crypto');
const {
  createSovereignLedger,
  appendEntry,
  sealLedger,
  LEDGER_STATUS,
  ENTRY_TYPE,
  DRIFT_CLASS
} = require('./ledger');

const {
  evaluateSovereignPolicy,
  applyDriftEnforcement,
  EVAL_DECISION,
  POLICY_STATUS
} = require('./policy');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SER_VERSION = '1.0';

const SESSION_STATUS = {
  PENDING: 'pending',
  ROUTING: 'routing',
  EXECUTING: 'executing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  DEFERRED: 'deferred'
};

const EXECUTION_OUTCOME = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  FAILOVER: 'failover',
  ABORTED: 'aborted'
};

const FAILOVER_REASON = {
  PROVIDER_FAILURE: 'PROVIDER_FAILURE',
  DRIFT_CRITICAL: 'DRIFT_CRITICAL',
  POLICY_BLOCK: 'POLICY_BLOCK',
  TIMEOUT: 'TIMEOUT',
  HEALTH_DEGRADED: 'HEALTH_DEGRADED'
};

const RETRY_REASON = {
  TRANSIENT_FAILURE: 'TRANSIENT_FAILURE',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  DRIFT_RESOLVED: 'DRIFT_RESOLVED'
};

// Drift severity strings used at the SER boundary (match SEL/SPE usage)
const DRIFT_SEVERITY = {
  NONE: 'NONE',
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

// Map DRIFT_CLASS back to DRIFT_SEVERITY for SPE calls
const DRIFT_CLASS_TO_SEVERITY = {
  [DRIFT_CLASS.NONE]: DRIFT_SEVERITY.NONE,
  [DRIFT_CLASS.INFO]: DRIFT_SEVERITY.INFO,
  [DRIFT_CLASS.WARNING]: DRIFT_SEVERITY.WARNING,
  [DRIFT_CLASS.CRITICAL]: DRIFT_SEVERITY.CRITICAL
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
 * Resolve the dominant drift class between two DRIFT_CLASS values.
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
function dominantDrift(a, b) {
  const order = [DRIFT_CLASS.NONE, DRIFT_CLASS.INFO, DRIFT_CLASS.WARNING, DRIFT_CLASS.CRITICAL];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

/**
 * Classify a DRIFT_SEVERITY string into a DRIFT_CLASS.
 * @param {string} severity
 * @returns {string}
 */
function severityToDriftClass(severity) {
  const map = {
    NONE: DRIFT_CLASS.NONE,
    INFO: DRIFT_CLASS.INFO,
    WARNING: DRIFT_CLASS.WARNING,
    CRITICAL: DRIFT_CLASS.CRITICAL
  };
  return map[(severity || 'NONE').toUpperCase()] || DRIFT_CLASS.NONE;
}

// ---------------------------------------------------------------------------
// createExecutionSession
// ---------------------------------------------------------------------------

/**
 * Create a new Sovereign Execution Runtime session.
 * A session binds a command to a policy, allocates a fresh SEL ledger,
 * and prepares the execution context.
 *
 * @param {object} options
 * @param {string} options.command        — command being executed (required)
 * @param {object} [options.policy]       — SPE policy node (optional; if omitted, execution is ungoverned)
 * @param {string} [options.sessionId]    — explicit session ID; generated if omitted
 * @param {string} [options.envelopeId]   — linked FEM envelope ID (optional)
 * @param {string[]} [options.providers]  — initial eligible providers
 * @returns {object} session
 */
function createExecutionSession(options = {}) {
  const { command, policy, sessionId, envelopeId, providers } = options;

  if (!command) {
    throw new Error('SER_COMMAND_REQUIRED');
  }

  const id = sessionId || uniqueId('SER-');
  const policyId = (policy && policy.policyId) || null;

  // Allocate a fresh SEL ledger for this session
  const ledger = createSovereignLedger({
    envelopeId: envelopeId || null,
    providers: Array.isArray(providers) ? providers : []
  });

  return {
    sessionId: id,
    version: SER_VERSION,
    command,
    status: SESSION_STATUS.PENDING,
    policyId,
    policy: policy || null,
    envelopeId: envelopeId || null,
    ledgerId: ledger.ledgerId,
    ledger,
    receipts: [],
    driftClass: DRIFT_CLASS.NONE,
    providers: Array.isArray(providers) ? [...providers] : [],
    attempts: 0,
    startedAt: nowIso(),
    completedAt: null
  };
}

// ---------------------------------------------------------------------------
// routeUnderPolicy
// ---------------------------------------------------------------------------

/**
 * Route an execution session under sovereign policy rules.
 * Evaluates the bound SPE policy against the runtime context, applies drift
 * enforcement, and records the routing decision into the session ledger.
 *
 * Returns the updated session along with the routing decision.
 *
 * @param {object} session         — SER execution session
 * @param {object} routingContext  — { provider, actor, role, callerPriority, driftSeverity }
 * @param {string} [signingKey]    — sovereign signing key
 * @returns {{ session: object, decision: object }}
 */
function routeUnderPolicy(session, routingContext = {}, signingKey) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }

  const provider = routingContext.provider || 'unknown';
  const driftSeverity = routingContext.driftSeverity || DRIFT_SEVERITY.NONE;
  const incomingDriftClass = severityToDriftClass(driftSeverity);

  // Update session drift class (never downgrade)
  const newDriftClass = dominantDrift(session.driftClass, incomingDriftClass);

  let updatedSession = {
    ...session,
    status: SESSION_STATUS.ROUTING,
    driftClass: newDriftClass
  };

  // If a policy is bound, evaluate it with drift-awareness
  let evalResult;
  if (updatedSession.policy) {
    // Apply current drift to policy before evaluation
    const driftedPolicy = applyDriftEnforcement(updatedSession.policy, driftSeverity);
    updatedSession = { ...updatedSession, policy: driftedPolicy };

    evalResult = evaluateSovereignPolicy(driftedPolicy, {
      ...routingContext,
      driftSeverity
    });
  } else {
    // No policy bound — ungoverned routing is implicitly allowed
    evalResult = {
      decision: EVAL_DECISION.ALLOW,
      allowed: true,
      reason: 'NO_POLICY_BOUND',
      gateResults: []
    };
  }

  // Record routing decision in ledger
  const routingRef = uniqueId('SER-ROUTE-');
  let { ledger } = updatedSession;

  ledger = appendEntry(ledger, {
    provider,
    type: ENTRY_TYPE.POLICY,
    ref: routingRef,
    payload: {
      sessionId: updatedSession.sessionId,
      command: updatedSession.command,
      routingDecision: evalResult.decision,
      reason: evalResult.reason || null,
      driftSeverity,
      callerPriority: routingContext.callerPriority || null,
      actor: routingContext.actor || null,
      role: routingContext.role || null
    },
    policyId: updatedSession.policyId,
    driftSeverity
  }, signingKey);

  const decision = {
    sessionId: updatedSession.sessionId,
    decision: evalResult.decision,
    allowed: evalResult.allowed,
    reason: evalResult.reason || null,
    policyId: updatedSession.policyId,
    driftClass: newDriftClass,
    gateResults: evalResult.gateResults || []
  };

  // Update session status based on decision
  let newStatus;
  if (evalResult.decision === EVAL_DECISION.ALLOW) {
    newStatus = SESSION_STATUS.EXECUTING;
  } else if (evalResult.decision === EVAL_DECISION.BLOCK) {
    newStatus = SESSION_STATUS.BLOCKED;
  } else {
    newStatus = SESSION_STATUS.DEFERRED;
  }

  updatedSession = {
    ...updatedSession,
    status: newStatus,
    ledger,
    ledgerId: ledger.ledgerId
  };

  return { session: updatedSession, decision };
}

// ---------------------------------------------------------------------------
// recordExecutionAttempt
// ---------------------------------------------------------------------------

/**
 * Record an execution attempt into the session ledger.
 * This is called once per attempt (including retries and failovers).
 * Returns the updated session with the new ledger entry.
 *
 * @param {object} session        — SER execution session
 * @param {object} attemptOptions — { provider, outcome, driftSeverity, envelopeId?, retryOf?, failoverFrom?, payload? }
 * @param {string} [signingKey]
 * @returns {{ session: object, entryId: string }}
 */
function recordExecutionAttempt(session, attemptOptions = {}, signingKey) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }
  if (!attemptOptions.provider) {
    throw new Error('SER_ATTEMPT_PROVIDER_REQUIRED');
  }
  if (!attemptOptions.outcome) {
    throw new Error('SER_ATTEMPT_OUTCOME_REQUIRED');
  }

  const validOutcomes = Object.values(EXECUTION_OUTCOME);
  if (!validOutcomes.includes(attemptOptions.outcome)) {
    throw new Error(`SER_INVALID_OUTCOME: ${attemptOptions.outcome}`);
  }

  const provider = attemptOptions.provider;
  const driftSeverity = attemptOptions.driftSeverity || DRIFT_SEVERITY.NONE;
  const incomingDriftClass = severityToDriftClass(driftSeverity);
  const newDriftClass = dominantDrift(session.driftClass, incomingDriftClass);
  const newAttempts = session.attempts + 1;

  const attemptRef = uniqueId('SER-ATTEMPT-');

  let { ledger } = session;
  ledger = appendEntry(ledger, {
    provider,
    type: ENTRY_TYPE.EXECUTION,
    ref: attemptRef,
    payload: {
      sessionId: session.sessionId,
      command: session.command,
      attempt: newAttempts,
      outcome: attemptOptions.outcome,
      driftSeverity,
      retryOf: attemptOptions.retryOf || null,
      failoverFrom: attemptOptions.failoverFrom || null,
      ...(attemptOptions.payload || {})
    },
    policyId: session.policyId,
    driftSeverity
  }, signingKey);

  // The ledger entry just appended is the last one
  const lastEntry = ledger.entries[ledger.entries.length - 1];

  // Update provider list
  const providers = session.providers.includes(provider)
    ? session.providers
    : [...session.providers, provider];

  const updatedSession = {
    ...session,
    ledger,
    ledgerId: ledger.ledgerId,
    driftClass: newDriftClass,
    providers,
    attempts: newAttempts
  };

  return { session: updatedSession, entryId: lastEntry.entryId };
}

// ---------------------------------------------------------------------------
// governFailover
// ---------------------------------------------------------------------------

/**
 * Govern a failover decision as a sovereign act.
 * Records the failover into the session ledger and re-evaluates the bound
 * policy against the new provider context before allowing failover execution.
 *
 * @param {object} session          — SER execution session
 * @param {object} failoverOptions  — { fromProvider, toProvider, reason, driftSeverity?, actor?, role?, callerPriority? }
 * @param {string} [signingKey]
 * @returns {{ session: object, decision: object }}
 */
function governFailover(session, failoverOptions = {}, signingKey) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }
  if (!failoverOptions.fromProvider) {
    throw new Error('SER_FAILOVER_FROM_PROVIDER_REQUIRED');
  }
  if (!failoverOptions.toProvider) {
    throw new Error('SER_FAILOVER_TO_PROVIDER_REQUIRED');
  }
  if (!failoverOptions.reason) {
    throw new Error('SER_FAILOVER_REASON_REQUIRED');
  }

  const validReasons = Object.values(FAILOVER_REASON);
  if (!validReasons.includes(failoverOptions.reason)) {
    throw new Error(`SER_INVALID_FAILOVER_REASON: ${failoverOptions.reason}`);
  }

  const driftSeverity = failoverOptions.driftSeverity || DRIFT_SEVERITY.NONE;
  const incomingDriftClass = severityToDriftClass(driftSeverity);
  const newDriftClass = dominantDrift(session.driftClass, incomingDriftClass);

  // Record failover event in ledger (under FAILOVER entry type)
  const failoverRef = uniqueId('SER-FAILOVER-');
  let { ledger } = session;

  ledger = appendEntry(ledger, {
    provider: failoverOptions.fromProvider,
    type: ENTRY_TYPE.FAILOVER,
    ref: failoverRef,
    payload: {
      sessionId: session.sessionId,
      command: session.command,
      fromProvider: failoverOptions.fromProvider,
      toProvider: failoverOptions.toProvider,
      failoverReason: failoverOptions.reason,
      driftSeverity,
      actor: failoverOptions.actor || null,
      role: failoverOptions.role || null
    },
    policyId: session.policyId,
    driftSeverity
  }, signingKey);

  // Re-evaluate policy for the failover target provider
  let evalResult;
  if (session.policy) {
    const driftedPolicy = applyDriftEnforcement(session.policy, driftSeverity);
    evalResult = evaluateSovereignPolicy(driftedPolicy, {
      provider: failoverOptions.toProvider,
      actor: failoverOptions.actor || null,
      role: failoverOptions.role || null,
      callerPriority: failoverOptions.callerPriority || null,
      driftSeverity
    });
  } else {
    evalResult = {
      decision: EVAL_DECISION.ALLOW,
      allowed: true,
      reason: 'NO_POLICY_BOUND',
      gateResults: []
    };
  }

  const decision = {
    sessionId: session.sessionId,
    decision: evalResult.decision,
    allowed: evalResult.allowed,
    reason: evalResult.reason || null,
    failoverRef,
    fromProvider: failoverOptions.fromProvider,
    toProvider: failoverOptions.toProvider,
    failoverReason: failoverOptions.reason,
    driftClass: newDriftClass,
    gateResults: evalResult.gateResults || []
  };

  // Update provider list to include the failover target
  const providers = session.providers.includes(failoverOptions.toProvider)
    ? session.providers
    : [...session.providers, failoverOptions.toProvider];

  const updatedSession = {
    ...session,
    ledger,
    ledgerId: ledger.ledgerId,
    driftClass: newDriftClass,
    providers
  };

  return { session: updatedSession, decision };
}

// ---------------------------------------------------------------------------
// issueExecutionReceipt
// ---------------------------------------------------------------------------

/**
 * Issue a sovereign execution receipt for a completed attempt.
 * The receipt is bound into the SEL ledger as a RECEIPT entry.
 * Returns the updated session and the receipt object.
 *
 * @param {object} session         — SER execution session
 * @param {object} receiptOptions  — { provider, decision, outcome, attempt, retryOf?, failoverFrom?, driftSeverity?, envelopeId? }
 * @param {string} [signingKey]
 * @returns {{ session: object, receipt: object }}
 */
function issueExecutionReceipt(session, receiptOptions = {}, signingKey) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }
  if (!receiptOptions.provider) {
    throw new Error('SER_RECEIPT_PROVIDER_REQUIRED');
  }
  if (!receiptOptions.decision) {
    throw new Error('SER_RECEIPT_DECISION_REQUIRED');
  }
  if (!receiptOptions.outcome) {
    throw new Error('SER_RECEIPT_OUTCOME_REQUIRED');
  }

  const validDecisions = Object.values(EVAL_DECISION);
  if (!validDecisions.includes(receiptOptions.decision)) {
    throw new Error(`SER_INVALID_RECEIPT_DECISION: ${receiptOptions.decision}`);
  }

  const validOutcomes = Object.values(EXECUTION_OUTCOME);
  if (!validOutcomes.includes(receiptOptions.outcome)) {
    throw new Error(`SER_INVALID_RECEIPT_OUTCOME: ${receiptOptions.outcome}`);
  }

  const receiptId = uniqueId('SER-RECEIPT-');
  const driftSeverity = receiptOptions.driftSeverity || DRIFT_SEVERITY.NONE;
  const driftClass = severityToDriftClass(driftSeverity);

  const receiptRef = uniqueId('SER-REC-');
  let { ledger } = session;

  ledger = appendEntry(ledger, {
    provider: receiptOptions.provider,
    type: ENTRY_TYPE.RECEIPT,
    ref: receiptRef,
    payload: {
      receiptId,
      sessionId: session.sessionId,
      command: session.command,
      provider: receiptOptions.provider,
      policyId: session.policyId,
      decision: receiptOptions.decision,
      outcome: receiptOptions.outcome,
      attempt: receiptOptions.attempt || session.attempts,
      retryOf: receiptOptions.retryOf || null,
      failoverFrom: receiptOptions.failoverFrom || null,
      driftClass,
      envelopeId: receiptOptions.envelopeId || session.envelopeId || null
    },
    policyId: session.policyId,
    driftSeverity
  }, signingKey);

  const lastEntry = ledger.entries[ledger.entries.length - 1];

  const receipt = {
    receiptId,
    sessionId: session.sessionId,
    envelopeId: receiptOptions.envelopeId || session.envelopeId || null,
    provider: receiptOptions.provider,
    command: session.command,
    policyId: session.policyId,
    ledgerId: ledger.ledgerId,
    ledgerEntryId: lastEntry.entryId,
    decision: receiptOptions.decision,
    outcome: receiptOptions.outcome,
    driftClass,
    attempt: receiptOptions.attempt || session.attempts,
    retryOf: receiptOptions.retryOf || null,
    failoverFrom: receiptOptions.failoverFrom || null,
    issuedAt: nowIso()
  };

  const updatedSession = {
    ...session,
    ledger,
    ledgerId: ledger.ledgerId,
    receipts: [...session.receipts, receipt]
  };

  return { session: updatedSession, receipt };
}

// ---------------------------------------------------------------------------
// completeSession
// ---------------------------------------------------------------------------

/**
 * Complete a sovereign execution session.
 * Sets the terminal status, seals the SEL ledger, and records the final
 * outcome as a RECEIPT entry if one is not already present.
 *
 * @param {object} session           — SER execution session
 * @param {string} outcome           — EXECUTION_OUTCOME value
 * @param {string} [signingKey]
 * @returns {object} completed session (ledger sealed)
 */
function completeSession(session, outcome, signingKey) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }

  const validOutcomes = Object.values(EXECUTION_OUTCOME);
  if (!outcome || !validOutcomes.includes(outcome)) {
    throw new Error(`SER_INVALID_OUTCOME: ${outcome}`);
  }

  // Determine terminal status from outcome
  let terminalStatus;
  if (outcome === EXECUTION_OUTCOME.SUCCESS || outcome === EXECUTION_OUTCOME.FAILOVER) {
    terminalStatus = SESSION_STATUS.COMPLETE;
  } else if (outcome === EXECUTION_OUTCOME.ABORTED) {
    terminalStatus = SESSION_STATUS.FAILED;
  } else {
    terminalStatus = SESSION_STATUS.FAILED;
  }

  // Seal the ledger — no further entries after this point
  const sealedLedger = sealLedger(session.ledger);

  return {
    ...session,
    status: terminalStatus,
    ledger: sealedLedger,
    ledgerId: sealedLedger.ledgerId,
    completedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// getSessionSummary
// ---------------------------------------------------------------------------

/**
 * Return a human-readable summary of a sovereign execution session.
 *
 * @param {object} session
 * @returns {object} summary
 */
function getSessionSummary(session) {
  if (!session || !session.sessionId) {
    throw new Error('SER_SESSION_REQUIRED');
  }

  const receiptsByOutcome = {};
  for (const r of session.receipts) {
    receiptsByOutcome[r.outcome] = (receiptsByOutcome[r.outcome] || 0) + 1;
  }

  const lastReceipt = session.receipts.length > 0
    ? session.receipts[session.receipts.length - 1]
    : null;

  return {
    sessionId: session.sessionId,
    version: session.version,
    command: session.command,
    status: session.status,
    policyId: session.policyId,
    ledgerId: session.ledgerId,
    ledgerStatus: session.ledger.status,
    ledgerEntryCount: session.ledger.entries.length,
    driftClass: session.driftClass,
    providers: session.providers,
    attempts: session.attempts,
    receipts: session.receipts.length,
    receiptsByOutcome,
    lastReceiptId: lastReceipt ? lastReceipt.receiptId : null,
    lastOutcome: lastReceipt ? lastReceipt.outcome : null,
    envelopeId: session.envelopeId,
    startedAt: session.startedAt,
    completedAt: session.completedAt
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  SER_VERSION,
  SESSION_STATUS,
  EXECUTION_OUTCOME,
  FAILOVER_REASON,
  RETRY_REASON,
  DRIFT_SEVERITY,
  createExecutionSession,
  routeUnderPolicy,
  recordExecutionAttempt,
  governFailover,
  issueExecutionReceipt,
  completeSession,
  getSessionSummary
};
