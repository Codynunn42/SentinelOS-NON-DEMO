'use strict';

// Phase 4 — Checkpoint 4.4: Sovereign Nexus Control Surface (SNCS) Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 4.4 deliverables:
//
//   File existence:
//     - apps/sentinel/src/sovereign/controlSurface.js
//     - apps/nexus/public/nexus-sovereign.html
//
//   controlSurface.js exports:
//     - SNCS_VERSION, PROVIDER_HEALTH_STATUS
//     - getSovereignProviderHealth
//     - getSovereignDriftClassification
//     - getSovereignEvidenceView
//     - getSovereignExecutionTimeline
//     - getSovereignCompliancePanel
//     - assembleSovereignSurface
//     - createDemoSurface
//
//   getSovereignProviderHealth:
//     - returns primary provider correctly
//     - returns failover path
//     - returns per-provider health status
//     - throws on missing session
//
//   getSovereignDriftClassification:
//     - returns overallDriftLabel
//     - reflects drift escalation
//     - returns providerDrift array
//     - throws on missing session
//
//   getSovereignEvidenceView:
//     - returns ledgerId
//     - returns integrity object with valid field
//     - entries have index, type, provider, hash fields
//     - throws on missing ledger
//
//   getSovereignExecutionTimeline:
//     - returns timeline array
//     - timeline steps have step, type, label, provider
//     - returns receipts array
//     - throws on missing session
//
//   getSovereignCompliancePanel:
//     - returns policyId, command, gates
//     - returns gatesClean flag
//     - returns driftEnforcementLabel
//     - throws on missing policy
//
//   assembleSovereignSurface:
//     - snapshotId prefixed SNCS-
//     - all 5 panels present (providerHealth, driftSummary, evidenceView, executionTimeline, compliancePanel)
//     - compliancePanel is null when no policy passed
//     - throws on missing session
//
//   createDemoSurface:
//     - returns sealed ledger
//     - evidenceView.integrity.valid is true
//     - timeline has entries
//     - compliancePanel.gatesClean is true
//     - driftSummary.driftEscalated is true (failover path triggers WARNING)
//     - providerHealth has both primary and failover providers
//
//   nexus-sovereign.html:
//     - All 5 panel divs present (panelProviderHealth, panelDrift, panelEvidence, panelTimeline, panelCompliance)
//     - loadSovereignSurface() function
//     - /api/v1/sovereign/status fetch
//     - sovereign-badge element
//     - sovereignBar element
//
//   server.js routes:
//     - /nexus/sovereign page route registered
//     - NEXUS_SOVEREIGN_PATH constant defined
//     - /api/v1/sovereign/status API route registered
//     - createDemoSurface imported

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

console.log('\nPhase 4.4 — Sovereign Nexus Control Surface (SNCS) Validation\n');

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

console.log('── File existence ──────────────────────────────────────');

const controlSurfacePath = path.join(ROOT, 'apps', 'sentinel', 'src', 'sovereign', 'controlSurface.js');
const sovereignHtmlPath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-sovereign.html');
const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');

check('controlSurface.js exists', () => {
  assert(fs.existsSync(controlSurfacePath), 'controlSurface.js missing');
});
check('nexus-sovereign.html exists', () => {
  assert(fs.existsSync(sovereignHtmlPath), 'nexus-sovereign.html missing');
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

console.log('\n── controlSurface.js exports ───────────────────────────');

const {
  SNCS_VERSION,
  PROVIDER_HEALTH_STATUS,
  getSovereignProviderHealth,
  getSovereignDriftClassification,
  getSovereignEvidenceView,
  getSovereignExecutionTimeline,
  getSovereignCompliancePanel,
  assembleSovereignSurface,
  createDemoSurface
} = require('../apps/sentinel/src/sovereign/controlSurface');

check('SNCS_VERSION is a string', () => {
  assert(typeof SNCS_VERSION === 'string');
});
check('PROVIDER_HEALTH_STATUS exported', () => {
  assert(typeof PROVIDER_HEALTH_STATUS === 'object');
  assert(PROVIDER_HEALTH_STATUS.HEALTHY === 'healthy');
  assert(PROVIDER_HEALTH_STATUS.DEGRADED === 'degraded');
  assert(PROVIDER_HEALTH_STATUS.FAILOVER === 'failover');
  assert(PROVIDER_HEALTH_STATUS.UNKNOWN === 'unknown');
});
check('getSovereignProviderHealth is a function', () => assert(typeof getSovereignProviderHealth === 'function'));
check('getSovereignDriftClassification is a function', () => assert(typeof getSovereignDriftClassification === 'function'));
check('getSovereignEvidenceView is a function', () => assert(typeof getSovereignEvidenceView === 'function'));
check('getSovereignExecutionTimeline is a function', () => assert(typeof getSovereignExecutionTimeline === 'function'));
check('getSovereignCompliancePanel is a function', () => assert(typeof getSovereignCompliancePanel === 'function'));
check('assembleSovereignSurface is a function', () => assert(typeof assembleSovereignSurface === 'function'));
check('createDemoSurface is a function', () => assert(typeof createDemoSurface === 'function'));

// ---------------------------------------------------------------------------
// Build a live demo surface for functional tests
// ---------------------------------------------------------------------------

const demo = createDemoSurface();
const { ENTRY_TYPE } = require('../apps/sentinel/src/sovereign/ledger');
const {
  createSovereignPolicy,
  addComplianceGate,
  openGate
} = require('../apps/sentinel/src/sovereign/policy');
const {
  createExecutionSession,
  routeUnderPolicy,
  recordExecutionAttempt,
  issueExecutionReceipt,
  completeSession,
  EXECUTION_OUTCOME,
  DRIFT_SEVERITY
} = require('../apps/sentinel/src/sovereign/runtime');

// ---------------------------------------------------------------------------
// getSovereignProviderHealth
// ---------------------------------------------------------------------------

console.log('\n── getSovereignProviderHealth ──────────────────────────');

check('returns primary provider', () => {
  assert(typeof demo.providerHealth.primaryProvider === 'string');
});
check('returns failover path array', () => {
  assert(Array.isArray(demo.providerHealth.failoverPath));
  assert(demo.providerHealth.failoverPath.length >= 1);
});
check('returns per-provider health entries', () => {
  assert(Array.isArray(demo.providerHealth.providers));
  assert(demo.providerHealth.providers.length >= 2);
  for (const p of demo.providerHealth.providers) {
    assert(typeof p.provider === 'string');
    assert(typeof p.healthStatus === 'string');
    assert(typeof p.driftClass === 'string');
  }
});
check('primary provider is failover-source (expected: failover health)', () => {
  const primary = demo.providerHealth.providers.find(
    (p) => p.provider === demo.providerHealth.primaryProvider
  );
  assert(primary, 'primary provider not found in providers list');
  assert(primary.wasFailoverSource, 'primary should be flagged as failover source');
});
check('failover provider is healthy', () => {
  const fp = demo.providerHealth.providers.find((p) => p.wasFailoverTarget);
  assert(fp, 'no provider flagged as failover target');
  assert(fp.healthStatus === PROVIDER_HEALTH_STATUS.HEALTHY);
});
check('sessionDriftClass present', () => {
  assert(typeof demo.providerHealth.sessionDriftClass === 'string');
});
check('throws on missing session', () => {
  assert.throws(() => getSovereignProviderHealth(null), /SNCS_SESSION_REQUIRED/);
});

// ---------------------------------------------------------------------------
// getSovereignDriftClassification
// ---------------------------------------------------------------------------

console.log('\n── getSovereignDriftClassification ─────────────────────');

check('returns overallDriftLabel', () => {
  assert(typeof demo.driftSummary.overallDriftLabel === 'string');
  assert(['NONE', 'INFO', 'WARNING', 'CRITICAL'].includes(demo.driftSummary.overallDriftLabel));
});
check('driftEscalated true (demo has WARNING drift)', () => {
  assert(demo.driftSummary.driftEscalated === true);
});
check('providerDrift is an array', () => {
  assert(Array.isArray(demo.driftSummary.providerDrift));
  assert(demo.driftSummary.providerDrift.length >= 1);
});
check('providerDrift entries have correct shape', () => {
  for (const pd of demo.driftSummary.providerDrift) {
    assert(typeof pd.provider === 'string');
    assert(typeof pd.worstDriftLabel === 'string');
    assert(typeof pd.entryCount === 'number');
  }
});
check('driftTimeline is an array', () => {
  assert(Array.isArray(demo.driftSummary.driftTimeline));
});
check('totalDriftEvents is a number', () => {
  assert(typeof demo.driftSummary.totalDriftEvents === 'number');
});
check('throws on missing session', () => {
  assert.throws(() => getSovereignDriftClassification(null), /SNCS_SESSION_REQUIRED/);
});

// ---------------------------------------------------------------------------
// getSovereignEvidenceView
// ---------------------------------------------------------------------------

console.log('\n── getSovereignEvidenceView ────────────────────────────');

check('returns ledgerId', () => {
  assert(typeof demo.evidenceView.ledgerId === 'string');
});
check('integrity.valid is true for demo', () => {
  assert(demo.evidenceView.integrity.valid === true, `integrity reason: ${demo.evidenceView.integrity.reason}`);
});
check('entries array present', () => {
  assert(Array.isArray(demo.evidenceView.entries));
  assert(demo.evidenceView.entries.length > 0);
});
check('each entry has index, type, provider, hash', () => {
  for (const entry of demo.evidenceView.entries) {
    assert(typeof entry.index === 'number');
    assert(typeof entry.type === 'string');
    assert(typeof entry.provider === 'string');
    assert(typeof entry.hash === 'string');
  }
});
check('summary has byProvider and byType', () => {
  assert(demo.evidenceView.summary.byProvider);
  assert(demo.evidenceView.summary.byType);
});
check('status is sealed for demo', () => {
  assert(demo.evidenceView.status === 'sealed');
});
check('throws on missing ledger', () => {
  assert.throws(() => getSovereignEvidenceView(null), /SNCS_LEDGER_REQUIRED/);
});

// ---------------------------------------------------------------------------
// getSovereignExecutionTimeline
// ---------------------------------------------------------------------------

console.log('\n── getSovereignExecutionTimeline ───────────────────────');

check('returns timeline array', () => {
  assert(Array.isArray(demo.executionTimeline.timeline));
  assert(demo.executionTimeline.timeline.length > 0);
});
check('timeline steps have step, type, label, provider', () => {
  for (const step of demo.executionTimeline.timeline) {
    assert(typeof step.step === 'number');
    assert(typeof step.type === 'string');
    assert(typeof step.label === 'string');
    assert(typeof step.provider === 'string');
  }
});
check('receipts array present', () => {
  assert(Array.isArray(demo.executionTimeline.receipts));
  assert(demo.executionTimeline.receiptCount >= 1);
});
check('attempts count correct', () => {
  assert(demo.executionTimeline.attempts >= 2);
});
check('sessionId and command present', () => {
  assert(typeof demo.executionTimeline.sessionId === 'string');
  assert(typeof demo.executionTimeline.command === 'string');
});
check('throws on missing session', () => {
  assert.throws(() => getSovereignExecutionTimeline(null), /SNCS_SESSION_REQUIRED/);
});

// ---------------------------------------------------------------------------
// getSovereignCompliancePanel
// ---------------------------------------------------------------------------

console.log('\n── getSovereignCompliancePanel ─────────────────────────');

check('returns policyId, command, gates', () => {
  assert(typeof demo.compliancePanel.policyId === 'string');
  assert(typeof demo.compliancePanel.command === 'string');
  assert(Array.isArray(demo.compliancePanel.gates));
});
check('gatesClean true (demo gates all passed)', () => {
  assert(demo.compliancePanel.gatesClean === true);
});
check('driftEnforcementLabel present', () => {
  assert(typeof demo.compliancePanel.driftEnforcementLabel === 'string');
});
check('gates have gateId, label, status', () => {
  for (const gate of demo.compliancePanel.gates) {
    assert(typeof gate.gateId === 'string');
    assert(typeof gate.label === 'string');
    assert(typeof gate.status === 'string');
  }
});
check('gatesSummary has passed/blocked/open counts', () => {
  assert(typeof demo.compliancePanel.gatesSummary.total === 'number');
  assert(typeof demo.compliancePanel.gatesSummary.passed === 'number');
  assert(typeof demo.compliancePanel.gatesSummary.blocked === 'number');
});
check('throws on missing policy', () => {
  assert.throws(() => getSovereignCompliancePanel(null), /SNCS_POLICY_REQUIRED/);
});

// ---------------------------------------------------------------------------
// assembleSovereignSurface
// ---------------------------------------------------------------------------

console.log('\n── assembleSovereignSurface ────────────────────────────');

check('snapshotId prefixed SNCS-', () => {
  assert(demo.snapshotId.startsWith('SNCS-'), `got: ${demo.snapshotId}`);
});
check('all 5 panels present', () => {
  assert(demo.providerHealth, 'providerHealth missing');
  assert(demo.driftSummary, 'driftSummary missing');
  assert(demo.evidenceView, 'evidenceView missing');
  assert(demo.executionTimeline, 'executionTimeline missing');
  // compliancePanel is non-null when policy is provided
});
check('compliancePanel is non-null when policy provided', () => {
  assert(demo.compliancePanel !== null);
});
check('compliancePanel is null when no policy', () => {
  // Build a minimal session with no policy
  let s = createExecutionSession({ command: 'TEST' });
  s = completeSession(s, EXECUTION_OUTCOME.SUCCESS);
  const snap = assembleSovereignSurface({ session: s });
  assert(snap.compliancePanel === null);
});
check('throws on missing session', () => {
  assert.throws(() => assembleSovereignSurface({}), /SNCS_SESSION_REQUIRED/);
});
check('assembledAt is an ISO timestamp', () => {
  assert(typeof demo.assembledAt === 'string');
  assert(!isNaN(new Date(demo.assembledAt).getTime()));
});
check('sessionId, ledgerId, policyId, command present in snapshot', () => {
  assert(typeof demo.sessionId === 'string');
  assert(typeof demo.ledgerId === 'string');
  assert(typeof demo.command === 'string');
});

// ---------------------------------------------------------------------------
// createDemoSurface
// ---------------------------------------------------------------------------

console.log('\n── createDemoSurface ───────────────────────────────────');

check('sealed ledger in demo', () => {
  assert(demo.evidenceView.status === 'sealed');
});
check('ledger chain integrity valid', () => {
  assert(demo.evidenceView.integrity.valid === true);
});
check('demo has both providers', () => {
  const providerNames = demo.providerHealth.providers.map((p) => p.provider);
  assert(providerNames.includes('openai'), 'openai not in providers');
  assert(providerNames.includes('azure'), 'azure not in providers');
});
check('demo drift escalated to WARNING', () => {
  assert(demo.driftSummary.overallDriftLabel === 'WARNING');
});
check('demo compliance gates clean', () => {
  assert(demo.compliancePanel.gatesClean === true);
  assert(demo.compliancePanel.gatesSummary.passed === 2);
});
check('demo has receipt in timeline', () => {
  assert(demo.executionTimeline.receiptCount >= 1);
});
check('demo accepts custom command', () => {
  const custom = createDemoSurface({ command: 'custom.op', primaryProvider: 'tilda', failoverProvider: 'github' });
  assert(custom.command === 'custom.op');
  const names = custom.providerHealth.providers.map((p) => p.provider);
  assert(names.includes('tilda'));
  assert(names.includes('github'));
});

// ---------------------------------------------------------------------------
// nexus-sovereign.html
// ---------------------------------------------------------------------------

console.log('\n── nexus-sovereign.html ────────────────────────────────');

const html = fs.readFileSync(sovereignHtmlPath, 'utf8');

check('panelProviderHealth panel present', () => {
  assert(html.includes('panelProviderHealth'), 'panelProviderHealth missing');
});
check('panelDrift panel present', () => {
  assert(html.includes('panelDrift'), 'panelDrift missing');
});
check('panelEvidence panel present', () => {
  assert(html.includes('panelEvidence'), 'panelEvidence missing');
});
check('panelTimeline panel present', () => {
  assert(html.includes('panelTimeline'), 'panelTimeline missing');
});
check('panelCompliance panel present', () => {
  assert(html.includes('panelCompliance'), 'panelCompliance missing');
});
check('loadSovereignSurface() function present', () => {
  assert(html.includes('async function loadSovereignSurface'), 'loadSovereignSurface missing');
});
check('/api/v1/sovereign/status fetch present', () => {
  assert(html.includes('/api/v1/sovereign/status'), '/api/v1/sovereign/status fetch missing');
});
check('sovereign-badge element present', () => {
  assert(html.includes('sovereign-badge'), 'sovereign-badge missing');
});
check('sovereignBar element present', () => {
  assert(html.includes('sovereignBar'), 'sovereignBar element missing');
});
check('renderProviderHealth function present', () => {
  assert(html.includes('function renderProviderHealth'), 'renderProviderHealth missing');
});
check('renderDrift function present', () => {
  assert(html.includes('function renderDrift'), 'renderDrift missing');
});
check('renderEvidence function present', () => {
  assert(html.includes('function renderEvidence'), 'renderEvidence missing');
});
check('renderTimeline function present', () => {
  assert(html.includes('function renderTimeline'), 'renderTimeline missing');
});
check('renderCompliance function present', () => {
  assert(html.includes('function renderCompliance'), 'renderCompliance missing');
});
check('auto-load DOMContentLoaded present', () => {
  assert(html.includes('DOMContentLoaded'), 'auto-load DOMContentLoaded missing');
});
check('back-link to executive desk present', () => {
  assert(html.includes('/nexus/executive'), 'back-link to executive desk missing');
});

// ---------------------------------------------------------------------------
// server.js routes
// ---------------------------------------------------------------------------

console.log('\n── server.js routes ────────────────────────────────────');

const server = fs.readFileSync(serverPath, 'utf8');

check('/nexus/sovereign page route registered', () => {
  assert(server.includes("pathname === '/nexus/sovereign'"), '/nexus/sovereign route missing');
});
check('NEXUS_SOVEREIGN_PATH constant defined', () => {
  assert(server.includes('NEXUS_SOVEREIGN_PATH'), 'NEXUS_SOVEREIGN_PATH constant missing');
});
check('nexus-sovereign.html served from NEXUS_SOVEREIGN_PATH', () => {
  assert(server.includes("'nexus-sovereign.html'"), 'nexus-sovereign.html path missing');
});
check('/api/v1/sovereign/status API route registered', () => {
  assert(server.includes("pathname === '/api/v1/sovereign/status'"), '/api/v1/sovereign/status route missing');
});
check('createDemoSurface imported in server.js', () => {
  assert(server.includes('createDemoSurface'), 'createDemoSurface not imported in server.js');
});
check('createDemoSurface called in sovereign/status handler', () => {
  const handlerStart = server.indexOf("pathname === '/api/v1/sovereign/status'");
  const handlerBlock = server.slice(handlerStart, handlerStart + 500);
  assert(handlerBlock.includes('createDemoSurface'), 'createDemoSurface not called in sovereign/status handler');
});
check('SNCS_SURFACE_ERROR error code present', () => {
  assert(server.includes('SNCS_SURFACE_ERROR'), 'SNCS_SURFACE_ERROR error code missing');
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(55)}`);
console.log(`Phase 4.4 — SNCS: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
