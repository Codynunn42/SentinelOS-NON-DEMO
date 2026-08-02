'use strict';

// Phase 4 — Checkpoint 4.3: Sovereign Execution Runtime (SER) Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 4.3 deliverables:
//   - runtime.js exports all required functions and constants
//   - SER_VERSION is a string
//   - SESSION_STATUS, EXECUTION_OUTCOME, FAILOVER_REASON, RETRY_REASON, DRIFT_SEVERITY constants correct
//   - createExecutionSession: sessionId prefixed SER-, initial state correct
//   - createExecutionSession: allocates a fresh SEL ledger
//   - createExecutionSession: throws on missing command
//   - createExecutionSession: accepts envelopeId and providers
//   - routeUnderPolicy: allows when no policy bound
//   - routeUnderPolicy: allows when policy active and no blocking gates
//   - routeUnderPolicy: blocks when policy suspended
//   - routeUnderPolicy: blocks when policy compliance gate blocked
//   - routeUnderPolicy: defers when compliance gate open
//   - routeUnderPolicy: records routing decision into SEL ledger
//   - routeUnderPolicy: sets session status to executing on allow
//   - routeUnderPolicy: sets session status to blocked on block
//   - routeUnderPolicy: sets session status to deferred on defer
//   - routeUnderPolicy: applies drift enforcement from context
//   - recordExecutionAttempt: increments attempts counter
//   - recordExecutionAttempt: appends EXECUTION entry to ledger
//   - recordExecutionAttempt: throws on missing provider
//   - recordExecutionAttempt: throws on missing outcome
//   - recordExecutionAttempt: throws on invalid outcome
//   - recordExecutionAttempt: adds provider to session.providers if new
//   - recordExecutionAttempt: propagates drift class upward
//   - governFailover: records FAILOVER entry into ledger
//   - governFailover: allows failover when policy allows
//   - governFailover: blocks failover when policy blocks the to-provider
//   - governFailover: adds toProvider to session.providers
//   - governFailover: throws on missing fromProvider / toProvider / reason
//   - governFailover: throws on invalid reason
//   - issueExecutionReceipt: receiptId prefixed SER-RECEIPT-
//   - issueExecutionReceipt: binds ledgerEntryId from RECEIPT entry
//   - issueExecutionReceipt: appended to session.receipts
//   - issueExecutionReceipt: throws on missing provider / decision / outcome
//   - issueExecutionReceipt: throws on invalid decision / outcome
//   - completeSession: terminal status COMPLETE for success outcome
//   - completeSession: terminal status FAILED for failure outcome
//   - completeSession: seals the SEL ledger
//   - completeSession: sets completedAt timestamp
//   - completeSession: throws on missing session
//   - completeSession: throws on invalid outcome
//   - getSessionSummary: returns correct shape with all fields
//   - getSessionSummary: receipts count correct
//   - getSessionSummary: ledgerEntryCount reflects entries
//   - end-to-end: route → attempt → receipt → complete flow

const assert = require('assert');

const {
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
} = require('../apps/sentinel/src/sovereign/runtime');

const {
  createSovereignPolicy,
  addComplianceGate,
  blockGate,
  POLICY_STATUS: SPE_STATUS,
  EVAL_DECISION
} = require('../apps/sentinel/src/sovereign/policy');

const { verifyLedgerIntegrity } = require('../apps/sentinel/src/sovereign/ledger');

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

console.log('\nPhase 4.3 — Sovereign Execution Runtime (SER) Validation\n');

console.log('── Exports ─────────────────────────────────────────────');

check('SER_VERSION is a string', () => {
  assert(typeof SER_VERSION === 'string');
});
check('SESSION_STATUS exported', () => {
  assert(typeof SESSION_STATUS === 'object');
  assert(SESSION_STATUS.PENDING === 'pending');
  assert(SESSION_STATUS.ROUTING === 'routing');
  assert(SESSION_STATUS.EXECUTING === 'executing');
  assert(SESSION_STATUS.COMPLETE === 'complete');
  assert(SESSION_STATUS.FAILED === 'failed');
  assert(SESSION_STATUS.BLOCKED === 'blocked');
  assert(SESSION_STATUS.DEFERRED === 'deferred');
});
check('EXECUTION_OUTCOME exported', () => {
  assert(typeof EXECUTION_OUTCOME === 'object');
  assert(EXECUTION_OUTCOME.SUCCESS === 'success');
  assert(EXECUTION_OUTCOME.FAILURE === 'failure');
  assert(EXECUTION_OUTCOME.FAILOVER === 'failover');
  assert(EXECUTION_OUTCOME.ABORTED === 'aborted');
});
check('FAILOVER_REASON exported', () => {
  assert(typeof FAILOVER_REASON === 'object');
  assert(FAILOVER_REASON.PROVIDER_FAILURE === 'PROVIDER_FAILURE');
  assert(FAILOVER_REASON.DRIFT_CRITICAL === 'DRIFT_CRITICAL');
  assert(FAILOVER_REASON.POLICY_BLOCK === 'POLICY_BLOCK');
  assert(FAILOVER_REASON.TIMEOUT === 'TIMEOUT');
  assert(FAILOVER_REASON.HEALTH_DEGRADED === 'HEALTH_DEGRADED');
});
check('RETRY_REASON exported', () => {
  assert(typeof RETRY_REASON === 'object');
  assert(RETRY_REASON.TRANSIENT_FAILURE === 'TRANSIENT_FAILURE');
  assert(RETRY_REASON.PROVIDER_TIMEOUT === 'PROVIDER_TIMEOUT');
  assert(RETRY_REASON.DRIFT_RESOLVED === 'DRIFT_RESOLVED');
});
check('DRIFT_SEVERITY exported', () => {
  assert(DRIFT_SEVERITY.NONE === 'NONE');
  assert(DRIFT_SEVERITY.INFO === 'INFO');
  assert(DRIFT_SEVERITY.WARNING === 'WARNING');
  assert(DRIFT_SEVERITY.CRITICAL === 'CRITICAL');
});
check('createExecutionSession is a function', () => {
  assert(typeof createExecutionSession === 'function');
});
check('routeUnderPolicy is a function', () => {
  assert(typeof routeUnderPolicy === 'function');
});
check('recordExecutionAttempt is a function', () => {
  assert(typeof recordExecutionAttempt === 'function');
});
check('governFailover is a function', () => {
  assert(typeof governFailover === 'function');
});
check('issueExecutionReceipt is a function', () => {
  assert(typeof issueExecutionReceipt === 'function');
});
check('completeSession is a function', () => {
  assert(typeof completeSession === 'function');
});
check('getSessionSummary is a function', () => {
  assert(typeof getSessionSummary === 'function');
});

// ---------------------------------------------------------------------------
// createExecutionSession
// ---------------------------------------------------------------------------

console.log('\n── createExecutionSession ──────────────────────────────');

check('sessionId prefixed SER-', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(s.sessionId.startsWith('SER-'), `got: ${s.sessionId}`);
});
check('initial status is pending', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(s.status === SESSION_STATUS.PENDING);
});
check('allocates a fresh SEL ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(s.ledger && s.ledger.ledgerId);
  assert(s.ledgerId === s.ledger.ledgerId);
  assert(s.ledger.entries.length === 0);
});
check('attempts starts at 0', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(s.attempts === 0);
});
check('receipts starts empty', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(Array.isArray(s.receipts) && s.receipts.length === 0);
});
check('throws on missing command', () => {
  assert.throws(() => createExecutionSession({}), /SER_COMMAND_REQUIRED/);
});
check('accepts explicit sessionId', () => {
  const s = createExecutionSession({ command: 'DEPLOY', sessionId: 'SER-TEST' });
  assert(s.sessionId === 'SER-TEST');
});
check('accepts envelopeId', () => {
  const s = createExecutionSession({ command: 'DEPLOY', envelopeId: 'FEM-001' });
  assert(s.envelopeId === 'FEM-001');
  assert(s.ledger.envelopeId === 'FEM-001');
});
check('accepts providers list', () => {
  const s = createExecutionSession({ command: 'DEPLOY', providers: ['openai', 'azure'] });
  assert.deepStrictEqual(s.providers, ['openai', 'azure']);
});
check('policyId null when no policy provided', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert(s.policyId === null);
  assert(s.policy === null);
});
check('policyId set when policy provided', () => {
  const policy = createSovereignPolicy({ command: 'DEPLOY' });
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  assert(s.policyId === policy.policyId);
});

// ---------------------------------------------------------------------------
// routeUnderPolicy
// ---------------------------------------------------------------------------

console.log('\n── routeUnderPolicy ────────────────────────────────────');

check('allows when no policy bound', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2, decision } = routeUnderPolicy(s, { provider: 'openai' });
  assert(decision.decision === EVAL_DECISION.ALLOW);
  assert(decision.allowed === true);
  assert(decision.reason === 'NO_POLICY_BOUND');
  assert(s2.status === SESSION_STATUS.EXECUTING);
});
check('allows when policy active with no blocking gates', () => {
  const policy = createSovereignPolicy({ command: 'DEPLOY' });
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision, session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(decision.allowed === true);
  assert(s2.status === SESSION_STATUS.EXECUTING);
});
check('blocks when policy is suspended', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = { ...policy, status: SPE_STATUS.SUSPENDED };
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision, session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(decision.decision === EVAL_DECISION.BLOCK);
  assert(decision.allowed === false);
  assert(s2.status === SESSION_STATUS.BLOCKED);
});
check('blocks when compliance gate is blocked', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = addComplianceGate(policy, { gateId: 'G1', label: 'Approval' });
  policy = blockGate(policy, 'G1', 'Denied');
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision, session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(decision.decision === EVAL_DECISION.BLOCK);
  assert(s2.status === SESSION_STATUS.BLOCKED);
});
check('defers when compliance gate is open (pending)', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = addComplianceGate(policy, { gateId: 'G1', label: 'Approval' });
  // gate stays OPEN (pending)
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision, session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(decision.decision === EVAL_DECISION.DEFER);
  assert(s2.status === SESSION_STATUS.DEFERRED);
});
check('records routing decision into SEL ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(s2.ledger.entries.length === 1);
  assert(s2.ledger.entries[0].type === 'policy');
});
check('sets session status to executing on allow', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(s2.status === SESSION_STATUS.EXECUTING);
});
check('sets session status to blocked on block', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = { ...policy, status: SPE_STATUS.SUSPENDED };
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(s2.status === SESSION_STATUS.BLOCKED);
});
check('sets session status to deferred on defer', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = addComplianceGate(policy, { gateId: 'G1', label: 'Gate' });
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { session: s2 } = routeUnderPolicy(s, { provider: 'openai' });
  assert(s2.status === SESSION_STATUS.DEFERRED);
});
check('applies drift enforcement from context (CRITICAL → LOCKED blocks non-sovereign)', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision } = routeUnderPolicy(s, {
    provider: 'openai',
    driftSeverity: 'CRITICAL',
    callerPriority: 'capability' // non-sovereign
  });
  assert(decision.decision === EVAL_DECISION.BLOCK);
  assert(decision.allowed === false);
});
check('throws on missing session', () => {
  assert.throws(() => routeUnderPolicy(null, {}), /SER_SESSION_REQUIRED/);
});

// ---------------------------------------------------------------------------
// recordExecutionAttempt
// ---------------------------------------------------------------------------

console.log('\n── recordExecutionAttempt ──────────────────────────────');

check('increments attempts counter', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS }));
  assert(s.attempts === 1);
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.FAILURE }));
  assert(s.attempts === 2);
});
check('appends EXECUTION entry to ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2, entryId } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS });
  assert(s2.ledger.entries.length === 1);
  assert(s2.ledger.entries[0].type === 'execution');
  assert(typeof entryId === 'string' && entryId.length > 0);
});
check('throws on missing provider', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => recordExecutionAttempt(s, { outcome: EXECUTION_OUTCOME.SUCCESS }),
    /SER_ATTEMPT_PROVIDER_REQUIRED/
  );
});
check('throws on missing outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => recordExecutionAttempt(s, { provider: 'openai' }),
    /SER_ATTEMPT_OUTCOME_REQUIRED/
  );
});
check('throws on invalid outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => recordExecutionAttempt(s, { provider: 'openai', outcome: 'NONSENSE' }),
    /SER_INVALID_OUTCOME/
  );
});
check('adds provider to session.providers if new', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS });
  assert(s2.providers.includes('openai'));
});
check('does not duplicate provider if already in list', () => {
  const s = createExecutionSession({ command: 'DEPLOY', providers: ['openai'] });
  const { session: s2 } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS });
  assert(s2.providers.filter((p) => p === 'openai').length === 1);
});
check('propagates drift class upward (never downgrade)', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS, driftSeverity: 'WARNING' }));
  assert(s.driftClass === 'warning');
  // Now lower severity — should NOT downgrade
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS, driftSeverity: 'NONE' }));
  assert(s.driftClass === 'warning');
});

// ---------------------------------------------------------------------------
// governFailover
// ---------------------------------------------------------------------------

console.log('\n── governFailover ──────────────────────────────────────');

check('records FAILOVER entry into ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  });
  const failoverEntries = s2.ledger.entries.filter((e) => e.type === 'failover');
  assert(failoverEntries.length === 1);
});
check('allows failover when policy allows', () => {
  const policy = createSovereignPolicy({ command: 'DEPLOY' });
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  });
  assert(decision.decision === EVAL_DECISION.ALLOW);
  assert(decision.allowed === true);
});
check('blocks failover when policy is suspended', () => {
  let policy = createSovereignPolicy({ command: 'DEPLOY' });
  policy = { ...policy, status: SPE_STATUS.SUSPENDED };
  const s = createExecutionSession({ command: 'DEPLOY', policy });
  const { decision } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  });
  assert(decision.decision === EVAL_DECISION.BLOCK);
  assert(decision.allowed === false);
});
check('adds toProvider to session.providers', () => {
  const s = createExecutionSession({ command: 'DEPLOY', providers: ['openai'] });
  const { session: s2 } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  });
  assert(s2.providers.includes('azure'));
});
check('throws on missing fromProvider', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => governFailover(s, { toProvider: 'azure', reason: FAILOVER_REASON.PROVIDER_FAILURE }),
    /SER_FAILOVER_FROM_PROVIDER_REQUIRED/
  );
});
check('throws on missing toProvider', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => governFailover(s, { fromProvider: 'openai', reason: FAILOVER_REASON.PROVIDER_FAILURE }),
    /SER_FAILOVER_TO_PROVIDER_REQUIRED/
  );
});
check('throws on missing reason', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => governFailover(s, { fromProvider: 'openai', toProvider: 'azure' }),
    /SER_FAILOVER_REASON_REQUIRED/
  );
});
check('throws on invalid failover reason', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => governFailover(s, { fromProvider: 'openai', toProvider: 'azure', reason: 'BOGUS' }),
    /SER_INVALID_FAILOVER_REASON/
  );
});
check('failoverRef included in decision', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { decision } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.DRIFT_CRITICAL
  });
  assert(typeof decision.failoverRef === 'string' && decision.failoverRef.length > 0);
});

// ---------------------------------------------------------------------------
// issueExecutionReceipt
// ---------------------------------------------------------------------------

console.log('\n── issueExecutionReceipt ───────────────────────────────');

check('receiptId prefixed SER-RECEIPT-', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { receipt } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  });
  assert(receipt.receiptId.startsWith('SER-RECEIPT-'), `got: ${receipt.receiptId}`);
});
check('binds ledgerEntryId from RECEIPT entry', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { receipt, session: s2 } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  });
  assert(typeof receipt.ledgerEntryId === 'string');
  const ledgerEntry = s2.ledger.entries.find((e) => e.entryId === receipt.ledgerEntryId);
  assert(ledgerEntry, 'ledger entry with matching entryId must exist');
  assert(ledgerEntry.type === 'receipt');
});
check('receipt appended to session.receipts', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  });
  assert(s2.receipts.length === 1);
});
check('receipt fields correct', () => {
  const policy = createSovereignPolicy({ command: 'DEPLOY' });
  const s = createExecutionSession({ command: 'DEPLOY', policy, envelopeId: 'FEM-001' });
  const { receipt } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS,
    attempt: 1
  });
  assert(receipt.sessionId === s.sessionId);
  assert(receipt.command === 'DEPLOY');
  assert(receipt.policyId === policy.policyId);
  assert(receipt.provider === 'openai');
  assert(receipt.envelopeId === 'FEM-001');
  assert(receipt.decision === EVAL_DECISION.ALLOW);
  assert(receipt.outcome === EXECUTION_OUTCOME.SUCCESS);
});
check('throws on missing provider', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => issueExecutionReceipt(s, { decision: EVAL_DECISION.ALLOW, outcome: EXECUTION_OUTCOME.SUCCESS }),
    /SER_RECEIPT_PROVIDER_REQUIRED/
  );
});
check('throws on missing decision', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => issueExecutionReceipt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS }),
    /SER_RECEIPT_DECISION_REQUIRED/
  );
});
check('throws on missing outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => issueExecutionReceipt(s, { provider: 'openai', decision: EVAL_DECISION.ALLOW }),
    /SER_RECEIPT_OUTCOME_REQUIRED/
  );
});
check('throws on invalid decision', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => issueExecutionReceipt(s, { provider: 'openai', decision: 'BOGUS', outcome: EXECUTION_OUTCOME.SUCCESS }),
    /SER_INVALID_RECEIPT_DECISION/
  );
});
check('throws on invalid outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(
    () => issueExecutionReceipt(s, { provider: 'openai', decision: EVAL_DECISION.ALLOW, outcome: 'BOGUS' }),
    /SER_INVALID_RECEIPT_OUTCOME/
  );
});

// ---------------------------------------------------------------------------
// completeSession
// ---------------------------------------------------------------------------

console.log('\n── completeSession ─────────────────────────────────────');

check('terminal status COMPLETE for success outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.SUCCESS);
  assert(completed.status === SESSION_STATUS.COMPLETE);
});
check('terminal status COMPLETE for failover outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.FAILOVER);
  assert(completed.status === SESSION_STATUS.COMPLETE);
});
check('terminal status FAILED for failure outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.FAILURE);
  assert(completed.status === SESSION_STATUS.FAILED);
});
check('terminal status FAILED for aborted outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.ABORTED);
  assert(completed.status === SESSION_STATUS.FAILED);
});
check('seals the SEL ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.SUCCESS);
  assert(completed.ledger.status === 'sealed');
});
check('sets completedAt timestamp', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const completed = completeSession(s, EXECUTION_OUTCOME.SUCCESS);
  assert(typeof completed.completedAt === 'string');
  assert(new Date(completed.completedAt).getTime() > 0);
});
check('throws on missing session', () => {
  assert.throws(() => completeSession(null, EXECUTION_OUTCOME.SUCCESS), /SER_SESSION_REQUIRED/);
});
check('throws on invalid outcome', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  assert.throws(() => completeSession(s, 'NONSENSE'), /SER_INVALID_OUTCOME/);
});
check('idempotent on already-sealed ledger', () => {
  const s = createExecutionSession({ command: 'DEPLOY' });
  const c1 = completeSession(s, EXECUTION_OUTCOME.SUCCESS);
  const c2 = completeSession(c1, EXECUTION_OUTCOME.SUCCESS);
  assert(c2.ledger.status === 'sealed');
});

// ---------------------------------------------------------------------------
// getSessionSummary
// ---------------------------------------------------------------------------

console.log('\n── getSessionSummary ───────────────────────────────────');

check('returns correct shape with all fields', () => {
  const s = createExecutionSession({ command: 'DEPLOY', providers: ['openai'] });
  const summary = getSessionSummary(s);
  assert(summary.sessionId === s.sessionId);
  assert(summary.command === 'DEPLOY');
  assert(summary.status === SESSION_STATUS.PENDING);
  assert(summary.ledgerId === s.ledgerId);
  assert(typeof summary.attempts === 'number');
  assert(typeof summary.receipts === 'number');
  assert(typeof summary.ledgerEntryCount === 'number');
  assert(Array.isArray(summary.providers));
});
check('receipts count matches session.receipts.length', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  const summary0 = getSessionSummary(s);
  assert(summary0.receipts === 0);

  const { session: s2 } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  });
  const summary1 = getSessionSummary(s2);
  assert(summary1.receipts === 1);
});
check('ledgerEntryCount reflects entries', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  assert(getSessionSummary(s).ledgerEntryCount === 0);
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS }));
  assert(getSessionSummary(s).ledgerEntryCount === 1);
});
check('lastOutcome reflects most recent receipt', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  const { session: s2 } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  });
  assert(getSessionSummary(s2).lastOutcome === EXECUTION_OUTCOME.SUCCESS);
});
check('throws on missing session', () => {
  assert.throws(() => getSessionSummary(null), /SER_SESSION_REQUIRED/);
});

// ---------------------------------------------------------------------------
// Ledger integrity after operations
// ---------------------------------------------------------------------------

console.log('\n── Ledger integrity ────────────────────────────────────');

check('ledger chain integrity valid after route + attempt + receipt', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  ({ session: s } = routeUnderPolicy(s, { provider: 'openai' }));
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.SUCCESS }));
  ({ session: s } = issueExecutionReceipt(s, {
    provider: 'openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS
  }));
  const integrity = verifyLedgerIntegrity(s.ledger);
  assert(integrity.valid, `chain invalid: ${integrity.reason}`);
});
check('ledger chain integrity valid after failover + attempt', () => {
  let s = createExecutionSession({ command: 'DEPLOY' });
  ({ session: s } = recordExecutionAttempt(s, { provider: 'openai', outcome: EXECUTION_OUTCOME.FAILURE }));
  ({ session: s } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  }));
  ({ session: s } = recordExecutionAttempt(s, { provider: 'azure', outcome: EXECUTION_OUTCOME.SUCCESS }));
  const integrity = verifyLedgerIntegrity(s.ledger);
  assert(integrity.valid, `chain invalid: ${integrity.reason}`);
});

// ---------------------------------------------------------------------------
// End-to-end flow
// ---------------------------------------------------------------------------

console.log('\n── End-to-end: route → attempt → failover → receipt → complete ──');

check('full sovereign execution flow produces sealed ledger with receipt', () => {
  // Create policy with a passing gate
  let policy = createSovereignPolicy({ command: 'PROVISION' });
  policy = addComplianceGate(policy, { gateId: 'APPROVAL', label: 'Operator Approval' });
  const { openGate } = require('../apps/sentinel/src/sovereign/policy');
  policy = openGate(policy, 'APPROVAL');

  // Session
  let s = createExecutionSession({
    command: 'PROVISION',
    policy,
    envelopeId: 'FEM-E2E-001',
    providers: ['openai']
  });

  // Route under policy
  let decision;
  ({ session: s, decision } = routeUnderPolicy(s, { provider: 'openai', driftSeverity: 'INFO' }));
  assert(decision.allowed, 'route should allow');

  // Record first attempt (failure)
  let entryId;
  ({ session: s, entryId } = recordExecutionAttempt(s, {
    provider: 'openai',
    outcome: EXECUTION_OUTCOME.FAILURE,
    driftSeverity: 'WARNING'
  }));
  assert(typeof entryId === 'string');

  // Govern failover
  let failoverDecision;
  ({ session: s, decision: failoverDecision } = governFailover(s, {
    fromProvider: 'openai',
    toProvider: 'azure',
    reason: FAILOVER_REASON.PROVIDER_FAILURE
  }));
  assert(failoverDecision.allowed, 'failover should be allowed');

  // Record failover attempt (success)
  ({ session: s } = recordExecutionAttempt(s, {
    provider: 'azure',
    outcome: EXECUTION_OUTCOME.SUCCESS
  }));

  // Issue receipt
  let receipt;
  ({ session: s, receipt } = issueExecutionReceipt(s, {
    provider: 'azure',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.FAILOVER,
    failoverFrom: 'openai',
    attempt: s.attempts
  }));
  assert(receipt.receiptId.startsWith('SER-RECEIPT-'));
  assert(receipt.failoverFrom === 'openai');

  // Complete session
  s = completeSession(s, EXECUTION_OUTCOME.FAILOVER);
  assert(s.status === SESSION_STATUS.COMPLETE);
  assert(s.ledger.status === 'sealed');

  // Verify ledger integrity
  const integrity = verifyLedgerIntegrity(s.ledger);
  assert(integrity.valid, `integrity check failed: ${integrity.reason}`);

  // Verify summary
  const summary = getSessionSummary(s);
  assert(summary.receipts === 1);
  assert(summary.attempts === 2);
  assert(summary.providers.includes('openai'));
  assert(summary.providers.includes('azure'));
  assert(summary.lastOutcome === EXECUTION_OUTCOME.FAILOVER);
  assert(summary.ledgerStatus === 'sealed');
  assert(summary.driftClass === 'warning');
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(55)}`);
console.log(`Phase 4.3 — SER: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
