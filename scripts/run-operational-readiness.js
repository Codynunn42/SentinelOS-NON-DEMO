// Operational Readiness Harness
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Executes all five operational readiness campaigns against the live SentinelOS
// sovereign runtime, produces a confidence score, and writes a dated report to docs/.
//
// Usage:
//   node scripts/run-operational-readiness.js
//   npm run check:operational-readiness
//
// Campaigns:
//   1 — Governance   (SPE + SEL + SER end-to-end)
//   2 — Docking      (capability registry + broker + routing)
//   3 — Federation   (envelope + CPRM + FPMR + PFFL + FECS)
//   4 — Failure      (controlled failure scenarios — every failure must produce evidence)
//   5 — Executive    (SNCS surface + compliance panel + provider health)
//
// Confidence score:
//   Baseline suites     40 pts  (passing / total × 40)
//   Failure modes       40 pts  (handled correctly / total failure scenarios × 40)
//   Evidence completeness 20 pts (evidence produced for every action / total actions × 20)
//
// Exit code: 0 = all campaigns passed, 1 = one or more failures

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// ---------------------------------------------------------------------------
// Sovereign modules
// ---------------------------------------------------------------------------

const {
  createSovereignPolicy,
  addComplianceGate,
  blockGate,
  openGate,
  evaluateSovereignPolicy,
  applyDriftEnforcement,
  getPolicyStatus,
  EVAL_DECISION,
  DRIFT_ENFORCEMENT,
  GATE_STATUS
} = require('../apps/sentinel/src/sovereign/policy');

const {
  createSovereignLedger,
  appendEntry,
  sealLedger,
  verifyLedgerIntegrity,
  getLedgerSummary,
  LEDGER_STATUS,
  ENTRY_TYPE,
  DRIFT_CLASS
} = require('../apps/sentinel/src/sovereign/ledger');

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
} = require('../apps/sentinel/src/sovereign/runtime');

const {
  createDemoSurface,
  getSovereignProviderHealth,
  getSovereignDriftClassification,
  getSovereignEvidenceView,
  getSovereignExecutionTimeline,
  getSovereignCompliancePanel,
  assembleSovereignSurface,
  PROVIDER_HEALTH_STATUS
} = require('../apps/sentinel/src/sovereign/controlSurface');

const {
  createEnvelope,
  validateEnvelope,
  ENVELOPE_STATUS
} = require('../apps/sentinel/src/federation/envelope');

const {
  createChain,
  getChainSummary,
  CHAIN_STATUS
} = require('../apps/sentinel/src/federation/evidenceChain');

// ---------------------------------------------------------------------------
// Harness utilities
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const DATE = NOW.slice(0, 10);
const SIGNING_KEY = process.env.SENTINEL_HMAC_SECRET || 'operational-readiness-signing-key';

let totalPassed = 0;
let totalFailed = 0;
const campaignResults = [];
const evidenceLog = [];

function check(label, fn) {
  try {
    fn();
    totalPassed++;
    return true;
  } catch (e) {
    totalFailed++;
    return false;
  }
}

function recordEvidence(type, ref, payload) {
  evidenceLog.push({ type, ref, payload, timestamp: NOW });
}

function runSuiteScript(scriptPath) {
  try {
    const output = execSync(`node ${scriptPath}`, {
      env: { ...process.env, SENTINEL_HMAC_SECRET: SIGNING_KEY },
      stdio: 'pipe',
      timeout: 30000
    }).toString();
    const lastLine = output.trim().split('\n').pop();
    // Extract passed/failed counts if present
    const m = lastLine.match(/(\d+) passed.*?(\d+) failed/);
    if (m) return { passed: Number(m[1]), failed: Number(m[2]), output: lastLine };
    if (lastLine.includes('PASSED') || lastLine.includes('passed')) {
      const ticks = (output.match(/✓/g) || []).length;
      return { passed: ticks || 1, failed: 0, output: lastLine };
    }
    return { passed: 0, failed: 1, output: lastLine };
  } catch (e) {
    const output = ((e.stdout || '') + (e.stderr || '')).toString().trim();
    const lastLine = output.split('\n').pop();
    return { passed: 0, failed: 1, output: lastLine };
  }
}

// Helper: build a full governed execution session and return sealed session
function buildCompleteSession(command, signingKey) {
  let policy = createSovereignPolicy({ command });
  policy = addComplianceGate(policy, { gateId: `GATE-${Date.now()}`, label: 'Operational Gate' });
  policy = openGate(policy, policy.complianceGates[0].gateId);

  let session = createExecutionSession({ command, policy });
  let decision;
  ({ session, decision } = routeUnderPolicy(session, { provider: 'azure-openai', driftSeverity: DRIFT_SEVERITY.NONE }, signingKey));

  let entryId;
  ({ session, entryId } = recordExecutionAttempt(session, {
    provider: 'azure-openai',
    outcome: EXECUTION_OUTCOME.SUCCESS,
    driftSeverity: DRIFT_SEVERITY.NONE
  }, signingKey));

  let receipt;
  ({ session, receipt } = issueExecutionReceipt(session, {
    provider: 'azure-openai',
    decision: EVAL_DECISION.ALLOW,
    outcome: EXECUTION_OUTCOME.SUCCESS,
    attempt: session.attempts
  }, signingKey));

  session = completeSession(session, EXECUTION_OUTCOME.SUCCESS, signingKey);
  return { session, policy, receipt };
}
// Validates SPE → SEL → SER end-to-end path
// ---------------------------------------------------------------------------

function campaign1Governance() {
  const results = [];
  let p = 0;
  let f = 0;

  function c(label, fn) {
    if (check(label, fn)) { p++; results.push(`  ✓ ${label}`); }
    else { f++; results.push(`  ✗ ${label}`); }
  }

  // --- 1.1 SPE: policy lifecycle ---
  let policy;
  c('SPE: create sovereign policy', () => {
    policy = createSovereignPolicy({ command: 'execute', priority: 'sovereign' });
    assert(policy.policyId.startsWith('SPE-'));
    assert(policy.status === 'active');
    recordEvidence('policy', policy.policyId, { command: 'execute', status: 'active' });
  });

  c('SPE: add gate and mark passed via openGate', () => {
    policy = addComplianceGate(policy, { gateId: 'GATE-ORD-001', label: 'Operational Readiness' });
    policy = openGate(policy, 'GATE-ORD-001');
    const status = getPolicyStatus(policy);
    assert(status.gatesClean === true);
    recordEvidence('gate', 'GATE-ORD-001', { status: 'passed', gatesClean: true });
  });

  c('SPE: evaluateSovereignPolicy allows when gates passed', () => {
    const result = evaluateSovereignPolicy(policy, {});
    assert(result.decision === EVAL_DECISION.ALLOW);
    recordEvidence('policy-eval', policy.policyId, { decision: 'allow' });
  });

  c('SPE: evaluateSovereignPolicy blocks when gate blocked', () => {
    let blocked = createSovereignPolicy({ command: 'execute', priority: 'sovereign' });
    blocked = addComplianceGate(blocked, { gateId: 'GATE-BLK-001', label: 'Block Test' });
    blocked = blockGate(blocked, 'GATE-BLK-001', 'operational test block');
    const result = evaluateSovereignPolicy(blocked, {});
    assert(result.decision === EVAL_DECISION.BLOCK);
    recordEvidence('policy-eval-block', blocked.policyId, { decision: 'block', reason: 'operational test block' });
  });

  c('SPE: CRITICAL drift enforcement locks policy', () => {
    let driftPolicy = createSovereignPolicy({ command: 'execute' });
    driftPolicy = applyDriftEnforcement(driftPolicy, DRIFT_SEVERITY.CRITICAL);
    // CRITICAL maps to LOCKED (the highest enforcement level)
    assert(driftPolicy.driftEnforcement === DRIFT_ENFORCEMENT.LOCKED,
      `Expected locked, got ${driftPolicy.driftEnforcement}`);
    recordEvidence('drift-enforcement', driftPolicy.policyId, { driftEnforcement: 'locked' });
  });

  // --- 1.2 SEL: ledger chain ---
  let ledger;
  c('SEL: create and append to sovereign ledger', () => {
    ledger = createSovereignLedger({ envelopeId: null });
    assert(ledger.ledgerId.startsWith('SEL-'));
    assert(ledger.status === LEDGER_STATUS.OPEN);
    const ref = `ORD-POLICY-001-${Date.now()}`;
    // appendEntry returns the updated ledger directly (not {ledger})
    ledger = appendEntry(ledger, {
      provider: 'executive-desk',
      type: ENTRY_TYPE.POLICY,
      ref,
      payload: { test: 'governance-campaign' }
    }, SIGNING_KEY);
    assert(ledger.entries.length === 1);
    recordEvidence('ledger-append', ledger.ledgerId, { entries: 1 });
  });

  c('SEL: ledger seals correctly', () => {
    ledger = sealLedger(ledger);
    assert(ledger.status === LEDGER_STATUS.SEALED);
    assert(ledger.sealedAt !== null);
    recordEvidence('ledger-seal', ledger.ledgerId, { status: 'sealed', headHash: ledger.headHash });
  });

  c('SEL: verifyLedgerIntegrity passes on sealed ledger', () => {
    const result = verifyLedgerIntegrity(ledger, SIGNING_KEY);
    assert(result.valid === true, `Integrity failed: ${result.reason}`);
    assert(result.brokenAt === null || result.corruptEntryId === null);
    recordEvidence('ledger-integrity', ledger.ledgerId, { valid: true });
  });

  c('SEL: getLedgerSummary returns correct shape', () => {
    const summary = getLedgerSummary(ledger);
    assert(typeof summary.totalEntries === 'number');
    assert(typeof summary.byProvider === 'object');
    assert(typeof summary.byType === 'object');
  });

  // --- 1.3 SER: execution session ---
  c('SER: full governed execution session with sealed ledger', () => {
    const { session, receipt } = buildCompleteSession('execute', SIGNING_KEY);
    assert(session.sessionId.startsWith('SER-'));
    assert(session.status === SESSION_STATUS.COMPLETE);
    assert(session.ledger.status === LEDGER_STATUS.SEALED);
    assert(receipt.receiptId.startsWith('SER-RECEIPT-'));

    const integrity = verifyLedgerIntegrity(session.ledger, SIGNING_KEY);
    assert(integrity.valid === true, `Integrity failed: ${integrity.reason}`);

    const summary = getSessionSummary(session);
    assert(summary.receipts === 1);
    assert(summary.ledgerStatus === 'sealed');
    recordEvidence('ser-session', session.sessionId, summary);
  });

  campaignResults.push({
    campaign: '1 — Governance',
    passed: p,
    failed: f,
    checks: results
  });

  return { passed: p, failed: f };
}

// ---------------------------------------------------------------------------
// CAMPAIGN 2 — Docking
// Validates capability registry, broker, multi-provider routing
// ---------------------------------------------------------------------------

function campaign2Docking() {
  const results = [];
  let p = 0;
  let f = 0;

  const scripts = path.join(__dirname, '..');
  const suites = [
    { label: 'Capability Registry suite', script: `${scripts}/scripts/check-capability-registry.js` },
    { label: 'Docking Protocol suite', script: `${scripts}/scripts/check-docking-protocol.js` },
    { label: 'C4 Broker suite', script: `${scripts}/scripts/check-c4-broker.js` },
    { label: 'C4 Providers suite', script: `${scripts}/scripts/check-c4-providers.js` }
  ];

  for (const suite of suites) {
    const r = runSuiteScript(suite.script);
    if (r.failed === 0) {
      p += r.passed;
      totalPassed += r.passed - 1;
      results.push(`  ✓ ${suite.label} — ${r.passed} checks`);
      recordEvidence('suite', suite.label, { passed: r.passed });
    } else {
      f++;
      totalFailed++;
      results.push(`  ✗ ${suite.label}: ${r.output}`);
    }
  }

  campaignResults.push({
    campaign: '2 — Docking',
    passed: p,
    failed: f,
    checks: results
  });

  return { passed: p, failed: f };
}

// ---------------------------------------------------------------------------
// CAMPAIGN 3 — Federation
// Validates FEM + CPRM + FPMR + PFFL + FECS
// ---------------------------------------------------------------------------

function campaign3Federation() {
  const results = [];
  let p = 0;
  let f = 0;

  function c(label, fn) {
    if (check(label, fn)) { p++; results.push(`  ✓ ${label}`); }
    else { f++; results.push(`  ✗ ${label}`); }
  }

  const scripts = path.join(__dirname, '..');
  const suites = [
    { label: 'Federation Envelope (FEM)', script: `${scripts}/scripts/check-federation-envelope.js` },
    { label: 'Cross-Provider Routing (CPRM)', script: `${scripts}/scripts/check-cprm.js` },
    { label: 'Policy Merge Rules (FPMR)', script: `${scripts}/scripts/check-fpmr.js` },
    { label: 'Fallback & Failover (PFFL)', script: `${scripts}/scripts/check-pffl.js` },
    { label: 'Evidence Chain (FECS)', script: `${scripts}/scripts/check-fecs.js` }
  ];

  for (const suite of suites) {
    const r = runSuiteScript(suite.script);
    if (r.failed === 0) {
      p += r.passed;
      totalPassed += r.passed - 1;
      results.push(`  ✓ ${suite.label} — ${r.passed} checks`);
      recordEvidence('suite', suite.label, { passed: r.passed });
    } else {
      f++;
      totalFailed++;
      results.push(`  ✗ ${suite.label}: ${r.output}`);
    }
  }

  // Live federation scenario: envelope validates + evidence chain links
  c('Federation: live envelope creates and chains evidence', () => {
    const providerSet = [
      {
        provider: 'azure-openai',
        capabilityId: 'execute',
        endpoint: 'https://azure-openai.example.com/v1',
        priority: 1,
        authority: 'operator'
      },
      {
        provider: 'openai',
        capabilityId: 'execute',
        endpoint: 'https://api.openai.com/v1',
        priority: 2,
        authority: 'operator'
      }
    ];
    const env = createEnvelope({
      tenant: 'nunn-cloud',
      command: 'execute',
      providerSet,
      capabilityScope: {
        capabilityId: 'execute',
        type: 'llm',
        authority: { minimumRole: 'operator' }
      }
    });
    assert(env.envelopeId.startsWith('FED-'), `Expected FED- prefix, got ${env.envelopeId}`);

    // Build evidence chain linked to this envelope
    const chain = createChain({
      envelopeId: env.envelopeId,
      providers: providerSet.map(p => p.provider)
    });
    assert(chain.chainId.startsWith('CHAIN-'), `Expected CHAIN- prefix, got ${chain.chainId}`);

    const summary = getChainSummary(chain);
    assert(typeof summary.totalEntries === 'number' || typeof summary.entryCount === 'number',
      `Chain summary must have totalEntries or entryCount. Keys: ${Object.keys(summary).join(', ')}`);

    recordEvidence('federation-chain', chain.chainId, { envelopeId: env.envelopeId });
  });

  campaignResults.push({
    campaign: '3 — Federation',
    passed: p,
    failed: f,
    checks: results
  });

  return { passed: p, failed: f };
}

// ---------------------------------------------------------------------------
// CAMPAIGN 4 — Failure Scenarios
// Every failure must produce evidence of WHY it failed — not just that it failed.
// ---------------------------------------------------------------------------

function campaign4Failures() {
  const results = [];
  let p = 0;
  let f = 0;
  let evidenceProduced = 0;
  const totalFailureScenarios = 7;

  function c(label, fn) {
    if (check(label, fn)) { p++; results.push(`  ✓ ${label}`); }
    else { f++; results.push(`  ✗ ${label}`); }
  }

  // Scenario 1: Policy blocks command — evidence must record block reason in ledger
  c('FAILURE-1: Blocked policy produces ledger evidence with reason', () => {
    let policy = createSovereignPolicy({ command: 'execute' });
    policy = addComplianceGate(policy, { gateId: 'GATE-FAIL-001', label: 'Client Auth' });
    policy = blockGate(policy, 'GATE-FAIL-001', 'client authorization not verified');

    const evalResult = evaluateSovereignPolicy(policy, {});
    assert(evalResult.decision === EVAL_DECISION.BLOCK, `Expected BLOCK, got ${evalResult.decision}`);
    assert(evalResult.reason !== null && evalResult.reason !== undefined, 'Block reason must not be null');

    // Route through SER — the ledger must record the block decision
    let session = createExecutionSession({ command: 'execute', policy });
    let decision;
    ({ session, decision } = routeUnderPolicy(session, { provider: 'azure-openai', driftSeverity: DRIFT_SEVERITY.NONE }, SIGNING_KEY));
    assert(session.status === SESSION_STATUS.BLOCKED, `Expected BLOCKED, got ${session.status}`);

    // Evidence: SEL must record the policy decision entry
    const policyEntry = session.ledger.entries.find(e => e.type === ENTRY_TYPE.POLICY);
    assert(policyEntry !== undefined, 'No policy entry in ledger for block event');
    assert(policyEntry.payload.routingDecision === EVAL_DECISION.BLOCK, 'Ledger entry must record BLOCK decision');

    evidenceProduced++;
    recordEvidence('failure-block', 'FAILURE-1', {
      reason: decision.reason,
      ledgerEntry: policyEntry.entryId,
      decision: EVAL_DECISION.BLOCK
    });
  });

  // Scenario 2: Open gate defers execution cleanly
  c('FAILURE-2: Open gate defers execution and records in ledger', () => {
    let policy = createSovereignPolicy({ command: 'execute' });
    policy = addComplianceGate(policy, { gateId: 'GATE-DEFER-001', label: 'Async Approval' });
    // Gate remains open (not passed/blocked) → defer

    const evalResult = evaluateSovereignPolicy(policy, {});
    assert(evalResult.decision === EVAL_DECISION.DEFER, `Expected DEFER, got ${evalResult.decision}`);

    let session = createExecutionSession({ command: 'execute', policy });
    let decision;
    ({ session, decision } = routeUnderPolicy(session, { provider: 'azure-openai', driftSeverity: DRIFT_SEVERITY.NONE }, SIGNING_KEY));
    assert(session.status === SESSION_STATUS.DEFERRED, `Expected DEFERRED, got ${session.status}`);

    const policyEntry = session.ledger.entries.find(e => e.type === ENTRY_TYPE.POLICY);
    assert(policyEntry !== undefined, 'No ledger entry for defer event');
    assert(policyEntry.payload.routingDecision === EVAL_DECISION.DEFER, 'Ledger entry must record DEFER decision');

    evidenceProduced++;
    recordEvidence('failure-defer', 'FAILURE-2', { decision: 'defer', ledgerEntry: policyEntry.entryId });
  });

  // Scenario 3: Corrupt ledger detected — verifyLedgerIntegrity returns brokenAt
  c('FAILURE-3: Tampered ledger detected with corruption evidence', () => {
    let ledger = createSovereignLedger({});
    const ref = `TAMPER-TEST-${Date.now()}`;
    // appendEntry returns the updated ledger directly
    ledger = appendEntry(ledger, {
      provider: 'azure-openai',
      type: ENTRY_TYPE.EXECUTION,
      ref,
      payload: { test: true }
    }, SIGNING_KEY);

    // Mutate the entry to simulate tampering
    const mutated = JSON.parse(JSON.stringify(ledger));
    mutated.entries[0].payload = { tampered: true };

    const result = verifyLedgerIntegrity(mutated, SIGNING_KEY);
    assert(result.valid === false, 'Tampered ledger should not verify as valid');
    // The integrity check returns either brokenAt or corruptEntryId depending on version
    const corruptionMarker = result.brokenAt || result.corruptEntryId || result.reason;
    assert(corruptionMarker !== null && corruptionMarker !== undefined, 'Corruption must be identified');

    evidenceProduced++;
    recordEvidence('failure-tamper', 'FAILURE-3', {
      valid: false,
      corruptionMarker,
      reason: result.reason
    });
  });

  // Scenario 4: CRITICAL drift locks policy
  c('FAILURE-4: CRITICAL drift locks policy enforcement', () => {
    let policy = createSovereignPolicy({ command: 'execute' });
    policy = applyDriftEnforcement(policy, DRIFT_SEVERITY.CRITICAL);
    // CRITICAL maps to LOCKED (highest enforcement)
    assert(policy.driftEnforcement === DRIFT_ENFORCEMENT.LOCKED,
      `Expected locked, got ${policy.driftEnforcement}`);

    evidenceProduced++;
    recordEvidence('failure-drift', 'FAILURE-4', { driftEnforcement: 'locked' });
  });

  // Scenario 5: Sealed ledger rejects append
  c('FAILURE-5: Sealed ledger rejects further appends', () => {
    let ledger = createSovereignLedger({});
    // appendEntry returns the updated ledger directly
    ledger = appendEntry(ledger, {
      provider: 'openai',
      type: ENTRY_TYPE.EVIDENCE,
      ref: `SEAL-TEST-${Date.now()}`,
      payload: {}
    }, SIGNING_KEY);
    ledger = sealLedger(ledger);
    assert(ledger.status === LEDGER_STATUS.SEALED);

    let threw = false;
    try {
      appendEntry(ledger, {
        provider: 'openai',
        type: ENTRY_TYPE.EVIDENCE,
        ref: `POST-SEAL-${Date.now()}`,
        payload: {}
      }, SIGNING_KEY);
    } catch (e) {
      threw = true;
    }
    assert(threw === true, 'Sealed ledger must reject appends');

    evidenceProduced++;
    recordEvidence('failure-sealed', 'FAILURE-5', { status: 'sealed', appendRejected: true });
  });

  // Scenario 6: Missing command throws, not silently fails
  c('FAILURE-6: Missing session command throws descriptively', () => {
    let threw = false;
    let errorMessage = null;
    try {
      createExecutionSession({ command: '' });
    } catch (e) {
      threw = true;
      errorMessage = e.message;
    }
    assert(threw === true, 'Empty command must throw');
    assert(errorMessage !== null, 'Error must have a message');

    evidenceProduced++;
    recordEvidence('failure-missing-command', 'FAILURE-6', { threw: true, message: errorMessage });
  });

  // Scenario 7: Sovereign failover appends evidence — not silent reroute
  c('FAILURE-7: Sovereign failover appends failover entry to ledger', () => {
    let policy = createSovereignPolicy({ command: 'execute' });
    policy = addComplianceGate(policy, { gateId: 'GATE-FO-001', label: 'Failover Test' });
    policy = openGate(policy, 'GATE-FO-001');

    let session = createExecutionSession({ command: 'execute', policy });
    ({ session } = routeUnderPolicy(session, { provider: 'azure-openai', driftSeverity: DRIFT_SEVERITY.NONE }, SIGNING_KEY));

    // Attempt (failure) before failover
    ({ session } = recordExecutionAttempt(session, {
      provider: 'azure-openai',
      outcome: EXECUTION_OUTCOME.FAILURE,
      driftSeverity: DRIFT_SEVERITY.NONE
    }, SIGNING_KEY));

    const entriesBefore = session.ledger.entries.length;
    ({ session } = governFailover(session, {
      fromProvider: 'azure-openai',
      toProvider: 'openai',
      reason: FAILOVER_REASON.PROVIDER_FAILURE
    }, SIGNING_KEY));

    assert(session.ledger.entries.length > entriesBefore, 'Failover must append ledger entries');
    const failoverEntry = session.ledger.entries.find(e => e.type === ENTRY_TYPE.FAILOVER);
    assert(failoverEntry !== undefined, 'Failover entry must exist in ledger');

    evidenceProduced++;
    recordEvidence('failure-failover', 'FAILURE-7', {
      entriesAdded: session.ledger.entries.length - entriesBefore,
      failoverEntry: failoverEntry.entryId
    });
  });

  const evidenceCompleteness = evidenceProduced / totalFailureScenarios;

  campaignResults.push({
    campaign: '4 — Failure Scenarios',
    passed: p,
    failed: f,
    evidenceProduced,
    totalFailureScenarios,
    evidenceCompleteness,
    checks: results
  });

  return { passed: p, failed: f, evidenceProduced, totalFailureScenarios };
}

// ---------------------------------------------------------------------------
// CAMPAIGN 5 — Executive Desk (SNCS)
// ---------------------------------------------------------------------------

function campaign5Executive() {
  const results = [];
  let p = 0;
  let f = 0;

  function c(label, fn) {
    if (check(label, fn)) { p++; results.push(`  ✓ ${label}`); }
    else { f++; results.push(`  ✗ ${label}`); }
  }

  // Run the sovereign surface suite
  const surfaceResult = runSuiteScript(path.join(__dirname, '..', 'scripts', 'check-sovereign-surface.js'));
  if (surfaceResult.failed === 0) {
    p += surfaceResult.passed;
    totalPassed += surfaceResult.passed - 1;
    results.push(`  ✓ SNCS suite — ${surfaceResult.passed} checks`);
    recordEvidence('suite', 'SNCS surface', { passed: surfaceResult.passed });
  } else {
    f++;
    totalFailed++;
    results.push(`  ✗ SNCS suite: ${surfaceResult.output}`);
  }

  // Live SNCS: demo surface produces complete snapshot
  c('SNCS: createDemoSurface returns complete snapshot', () => {
    const snapshot = createDemoSurface();
    assert(snapshot.snapshotId.startsWith('SNCS-'), `Expected SNCS- prefix, got ${snapshot.snapshotId}`);
    assert(typeof snapshot.providerHealth === 'object', 'providerHealth must be an object');
    assert(typeof snapshot.driftSummary === 'object', 'driftSummary must be an object');
    assert(typeof snapshot.evidenceView === 'object', 'evidenceView must be an object');
    assert(typeof snapshot.executionTimeline === 'object', 'executionTimeline must be an object');
    assert(typeof snapshot.compliancePanel === 'object', 'compliancePanel must be an object');
    recordEvidence('sncs-snapshot', snapshot.snapshotId, { keys: Object.keys(snapshot) });
  });

  c('SNCS: compliancePanel.gatesClean is a boolean', () => {
    const snapshot = createDemoSurface();
    assert(typeof snapshot.compliancePanel.gatesClean === 'boolean',
      `gatesClean is ${typeof snapshot.compliancePanel.gatesClean}, expected boolean`);
  });

  c('SNCS: driftSummary has a drift class field', () => {
    const snapshot = createDemoSurface();
    // The key may be highestClass or overallDriftClass depending on version
    const driftClass = snapshot.driftSummary.highestClass !== undefined
      ? snapshot.driftSummary.highestClass
      : snapshot.driftSummary.overallDriftClass;
    assert(driftClass !== undefined, `driftSummary must have a drift class field. Keys: ${Object.keys(snapshot.driftSummary).join(', ')}`);
    assert(['none', 'info', 'warning', 'critical'].includes(driftClass),
      `driftClass value "${driftClass}" not in expected set`);
  });

  c('SNCS: evidenceView.entries is an array', () => {
    const snapshot = createDemoSurface();
    assert(Array.isArray(snapshot.evidenceView.entries),
      `evidenceView.entries must be an array. Got: ${typeof snapshot.evidenceView.entries}`);
  });

  c('SNCS: getSovereignProviderHealth returns provider data from session', () => {
    const { session } = buildCompleteSession('execute', SIGNING_KEY);
    const health = getSovereignProviderHealth(session);
    assert(typeof health === 'object', `Health must be an object, got ${typeof health}`);
    recordEvidence('sncs-health', 'provider-health', { keys: Object.keys(health) });
  });

  campaignResults.push({
    campaign: '5 — Executive Desk',
    passed: p,
    failed: f,
    checks: results
  });

  return { passed: p, failed: f };
}

// ---------------------------------------------------------------------------
// BASELINE SUITES
// Run all sovereign + phase3 suites and tally
// ---------------------------------------------------------------------------

function runBaseline() {
  const scriptRoot = path.join(__dirname, '..');
  const suites = [
    { label: 'SPE (4.1)', script: `${scriptRoot}/scripts/check-sovereign-policy.js` },
    { label: 'SEL (4.2)', script: `${scriptRoot}/scripts/check-sovereign-ledger.js` },
    { label: 'SER (4.3)', script: `${scriptRoot}/scripts/check-sovereign-runtime.js` },
    { label: 'SNCS (4.4)', script: `${scriptRoot}/scripts/check-sovereign-surface.js` },
    { label: 'FEM (3.1)', script: `${scriptRoot}/scripts/check-federation-envelope.js` },
    { label: 'CPRM (3.2)', script: `${scriptRoot}/scripts/check-cprm.js` },
    { label: 'FPMR (3.3)', script: `${scriptRoot}/scripts/check-fpmr.js` },
    { label: 'PFFL (3.4)', script: `${scriptRoot}/scripts/check-pffl.js` },
    { label: 'FECS (3.5)', script: `${scriptRoot}/scripts/check-fecs.js` },
    { label: 'Planning API', script: `${scriptRoot}/scripts/check-planning-api.js` }
  ];

  let baselinePassed = 0;
  let baselineFailed = 0;
  const rows = [];

  for (const suite of suites) {
    const r = runSuiteScript(suite.script);
    if (r.failed === 0) {
      baselinePassed += r.passed;
      rows.push(`  ✓ ${suite.label.padEnd(16)} ${r.passed} passed`);
    } else {
      baselineFailed += r.failed;
      rows.push(`  ✗ ${suite.label.padEnd(16)} FAILED — ${r.output}`);
    }
  }

  return { passed: baselinePassed, failed: baselineFailed, rows };
}

// ---------------------------------------------------------------------------
// CONFIDENCE SCORE
// ---------------------------------------------------------------------------

function computeConfidence(baseline, failure) {
  const baselineTotal = baseline.passed + baseline.failed;
  const baselineScore = baselineTotal > 0
    ? (baseline.passed / baselineTotal) * 40
    : 0;

  const failureScore = failure.totalFailureScenarios > 0
    ? (failure.passed / failure.totalFailureScenarios) * 40
    : 0;

  const evidenceScore = failure.totalFailureScenarios > 0
    ? (failure.evidenceProduced / failure.totalFailureScenarios) * 20
    : 0;

  const total = Math.round(baselineScore + failureScore + evidenceScore);

  return {
    total,
    baselineScore: Math.round(baselineScore),
    failureScore: Math.round(failureScore),
    evidenceScore: Math.round(evidenceScore),
    grade: total >= 95 ? 'SOVEREIGN' : total >= 85 ? 'OPERATIONAL' : total >= 70 ? 'PROVISIONAL' : 'DEFICIENT'
  };
}

// ---------------------------------------------------------------------------
// REPORT WRITER
// ---------------------------------------------------------------------------

function writeReport(opts) {
  const { date, baseline, c1, c2, c3, c4, c5, confidence, durationMs } = opts;

  const allCampaignsFailed = [c1, c2, c3, c4, c5].reduce((s, c) => s + c.failed, 0);
  const overallStatus = allCampaignsFailed === 0 && baseline.failed === 0
    ? '🟢 READY' : '🔴 DEFECTS PRESENT';

  const lines = [];

  lines.push(`# Operational Readiness Report`);
  lines.push(``);
  lines.push(`**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud`);
  lines.push(`**Date:** ${date}`);
  lines.push(`**Run Duration:** ${(durationMs / 1000).toFixed(1)}s`);
  lines.push(`**Status:** ${overallStatus}`);
  lines.push(`**Confidence Score:** ${confidence.total}/100 — ${confidence.grade}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Question Answered`);
  lines.push(``);
  lines.push(`> *"If a client engaged Nunn Corporation tomorrow, would we be confident running SentinelOS on their behalf?"*`);
  lines.push(``);

  if (allCampaignsFailed === 0 && baseline.failed === 0) {
    lines.push(`**Yes.** All five operational campaigns passed. All baseline suites passed. The sovereign runtime behaves correctly under real-world conditions.`);
  } else {
    lines.push(`**Not yet.** ${allCampaignsFailed + baseline.failed} defect(s) identified. See campaign results below.`);
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Confidence Score Breakdown`);
  lines.push(``);
  lines.push(`| Component | Score | Weight |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Baseline suites (${baseline.passed} passed, ${baseline.failed} failed) | ${confidence.baselineScore}/40 | 40% |`);
  lines.push(`| Failure scenarios (${c4.passed}/${c4.totalFailureScenarios} handled correctly) | ${confidence.failureScore}/40 | 40% |`);
  lines.push(`| Evidence completeness (${c4.evidenceProduced}/${c4.totalFailureScenarios} failures evidenced) | ${confidence.evidenceScore}/20 | 20% |`);
  lines.push(`| **Total** | **${confidence.total}/100** | |`);
  lines.push(`| **Grade** | **${confidence.grade}** | |`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Baseline Suites`);
  lines.push(``);
  lines.push(`\`\`\``);
  baseline.rows.forEach(r => lines.push(r));
  lines.push(`\`\`\``);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Campaign Results`);
  lines.push(``);

  for (const campaign of campaignResults) {
    const status = campaign.failed === 0 ? '✅' : '❌';
    lines.push(`### ${status} Campaign ${campaign.campaign}`);
    lines.push(``);
    lines.push(`**${campaign.passed} passed, ${campaign.failed} failed**`);
    lines.push(``);
    campaign.checks.forEach(c => lines.push(c));
    if (campaign.evidenceProduced !== undefined) {
      lines.push(``);
      lines.push(`Evidence produced: ${campaign.evidenceProduced}/${campaign.totalFailureScenarios} failure scenarios`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`## Evidence Log`);
  lines.push(``);
  lines.push(`${evidenceLog.length} evidence records produced during this run:`);
  lines.push(``);
  lines.push(`| Type | Reference | Timestamp |`);
  lines.push(`|---|---|---|`);
  evidenceLog.forEach(e => {
    lines.push(`| ${e.type} | ${e.ref} | ${e.timestamp} |`);
  });
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Operational Readiness Verdict`);
  lines.push(``);
  lines.push(`| Campaign | Result |`);
  lines.push(`|---|---|`);
  lines.push(`| Baseline suites | ${baseline.failed === 0 ? '✅ All passed' : `❌ ${baseline.failed} failed`} |`);
  lines.push(`| Campaign 1 — Governance | ${c1.failed === 0 ? '✅ Pass' : `❌ ${c1.failed} failed`} |`);
  lines.push(`| Campaign 2 — Docking | ${c2.failed === 0 ? '✅ Pass' : `❌ ${c2.failed} failed`} |`);
  lines.push(`| Campaign 3 — Federation | ${c3.failed === 0 ? '✅ Pass' : `❌ ${c3.failed} failed`} |`);
  lines.push(`| Campaign 4 — Failure Scenarios | ${c4.failed === 0 ? '✅ Pass' : `❌ ${c4.failed} failed`} |`);
  lines.push(`| Campaign 5 — Executive Desk | ${c5.failed === 0 ? '✅ Pass' : `❌ ${c5.failed} failed`} |`);
  lines.push(``);
  lines.push(`**Overall: ${overallStatus}**`);
  lines.push(`**Confidence: ${confidence.total}/100 — ${confidence.grade}**`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Generated by \`scripts/run-operational-readiness.js\` — Sentinel AI by Cody Nunn | Nunn Cloud*`);

  const reportPath = path.join(__dirname, '..', 'docs', `OPERATIONAL_READINESS_REPORT_${date}.md`);
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return reportPath;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function main() {
  const startMs = Date.now();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SentinelOS — Operational Readiness Harness`);
  console.log(`  ${NOW}`);
  console.log(`${'═'.repeat(60)}`);

  // Baseline
  console.log(`\n[Baseline] Running sovereign + federation suites...`);
  const baseline = runBaseline();
  baseline.rows.forEach(r => console.log(r));
  console.log(`  Baseline: ${baseline.passed} passed, ${baseline.failed} failed`);

  // Campaign 1
  console.log(`\n[Campaign 1] Governance...`);
  const c1 = campaign1Governance();
  campaignResults[campaignResults.length - 1].checks.forEach(r => console.log(r));
  console.log(`  Result: ${c1.passed} passed, ${c1.failed} failed`);

  // Campaign 2
  console.log(`\n[Campaign 2] Docking...`);
  const c2 = campaign2Docking();
  campaignResults[campaignResults.length - 1].checks.forEach(r => console.log(r));
  console.log(`  Result: ${c2.passed} passed, ${c2.failed} failed`);

  // Campaign 3
  console.log(`\n[Campaign 3] Federation...`);
  const c3 = campaign3Federation();
  campaignResults[campaignResults.length - 1].checks.forEach(r => console.log(r));
  console.log(`  Result: ${c3.passed} passed, ${c3.failed} failed`);

  // Campaign 4
  console.log(`\n[Campaign 4] Failure Scenarios...`);
  const c4 = campaign4Failures();
  campaignResults[campaignResults.length - 1].checks.forEach(r => console.log(r));
  console.log(`  Result: ${c4.passed} passed, ${c4.failed} failed`);
  console.log(`  Evidence: ${c4.evidenceProduced}/${c4.totalFailureScenarios} failure scenarios evidenced`);

  // Campaign 5
  console.log(`\n[Campaign 5] Executive Desk...`);
  const c5 = campaign5Executive();
  campaignResults[campaignResults.length - 1].checks.forEach(r => console.log(r));
  console.log(`  Result: ${c5.passed} passed, ${c5.failed} failed`);

  // Confidence
  const confidence = computeConfidence(baseline, c4);
  const durationMs = Date.now() - startMs;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Confidence Score: ${confidence.total}/100 — ${confidence.grade}`);
  console.log(`    Baseline:  ${confidence.baselineScore}/40`);
  console.log(`    Failures:  ${confidence.failureScore}/40`);
  console.log(`    Evidence:  ${confidence.evidenceScore}/20`);
  console.log(`${'─'.repeat(60)}`);

  // Write report
  const reportPath = writeReport({ date: DATE, baseline, c1, c2, c3, c4, c5, confidence, durationMs });
  console.log(`\n  Report: ${path.relative(path.join(__dirname, '..'), reportPath)}`);

  const totalFail = baseline.failed + c1.failed + c2.failed + c3.failed + c4.failed + c5.failed;

  if (totalFail === 0) {
    console.log(`\n  ✅ ALL CAMPAIGNS PASSED — SentinelOS is operationally ready`);
  } else {
    console.log(`\n  ❌ ${totalFail} FAILURE(S) — review report for details`);
  }

  console.log(`\n  Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main();
