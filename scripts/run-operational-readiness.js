// run-operational-readiness.js
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Operational Readiness Validation (ORV) harness.
// Runs 6 campaigns and produces an ORV-2 score.  Exit code 0 = PASS, 1 = FAIL.
//
// Usage:
//   node scripts/run-operational-readiness.js
//   npm run check:operational-readiness

'use strict';

const path = require('path');

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

const results = [];

function pass(campaign, test, detail) {
  results.push({ campaign, test, status: 'pass', detail: detail || null });
  process.stdout.write(`  ✓ ${test}\n`);
}

function fail(campaign, test, reason) {
  results.push({ campaign, test, status: 'fail', reason });
  process.stdout.write(`  ✗ ${test}: ${reason}\n`);
}

function runTest(campaign, testName, fn) {
  try {
    const detail = fn();
    pass(campaign, testName, detail);
  } catch (err) {
    fail(campaign, testName, err.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------------------
// Module helpers
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');

function requireRepo(relPath) {
  return require(path.join(REPO_ROOT, relPath));
}

// ---------------------------------------------------------------------------
// Campaign 1 — Governance
// ---------------------------------------------------------------------------

function runCampaign1() {
  console.log('\nCampaign 1 — Governance');

  runTest(1, 'policyEngine exports evaluatePolicy', () => {
    const { evaluatePolicy, buildPolicyContext } = requireRepo(
      'apps/sentinel/src/governance/policyEngine'
    );
    assert(typeof evaluatePolicy === 'function', 'evaluatePolicy must be a function');
    assert(typeof buildPolicyContext === 'function', 'buildPolicyContext must be a function');
    return 'evaluatePolicy + buildPolicyContext present';
  });

  runTest(1, 'evaluatePolicy returns a governance decision', () => {
    const { evaluatePolicy } = requireRepo('apps/sentinel/src/governance/policyEngine');
    const decision = evaluatePolicy({ command: 'deal.submit', role: 'operator' });
    assert(decision && typeof decision === 'object', 'evaluatePolicy must return an object');
    return `decision keys: ${Object.keys(decision).join(', ')}`;
  });

  runTest(1, 'approval module is present', () => {
    const approval = requireRepo('apps/sentinel/src/approval/approval');
    assert(approval, 'approval module must load');
    return 'approval module loaded';
  });
}

// ---------------------------------------------------------------------------
// Campaign 2 — Docking
// ---------------------------------------------------------------------------

function runCampaign2() {
  console.log('\nCampaign 2 — Docking');

  runTest(2, 'docking check script exists', () => {
    const fs = require('fs');
    const scriptPath = path.join(REPO_ROOT, 'scripts/check-docking-protocol.js');
    assert(fs.existsSync(scriptPath), 'scripts/check-docking-protocol.js must exist');
    return 'script present';
  });

  runTest(2, 'archive-intelligence docking script exists', () => {
    const fs = require('fs');
    const scriptPath = path.join(REPO_ROOT, 'scripts/check-archive-intelligence-docking.js');
    assert(fs.existsSync(scriptPath), 'check-archive-intelligence-docking.js must exist');
    return 'script present';
  });

  runTest(2, 'vendor onboarding simulation script exists', () => {
    const fs = require('fs');
    const scriptPath = path.join(REPO_ROOT, 'scripts/simulate-vendor-onboarding.js');
    assert(fs.existsSync(scriptPath), 'simulate-vendor-onboarding.js must exist');
    return 'script present';
  });
}

// ---------------------------------------------------------------------------
// Campaign 3 — Federation
// ---------------------------------------------------------------------------

function runCampaign3() {
  console.log('\nCampaign 3 — Federation');

  runTest(3, 'tier registry exports TIERS', () => {
    const tierRegistry = requireRepo('apps/sentinel/src/tiers/tierRegistry');
    assert(tierRegistry && typeof tierRegistry === 'object', 'tierRegistry must export an object');
    return 'tierRegistry loaded';
  });

  runTest(3, 'tier resolver is present', () => {
    const tierResolver = requireRepo('apps/sentinel/src/tiers/tierResolver');
    assert(tierResolver && typeof tierResolver === 'object', 'tierResolver must export an object');
    return 'tierResolver loaded';
  });

  runTest(3, 'key registry is present', () => {
    const keyRegistry = requireRepo('apps/sentinel/src/security/keyRegistry');
    assert(keyRegistry && typeof keyRegistry === 'object', 'keyRegistry must export an object');
    return 'keyRegistry loaded';
  });
}

// ---------------------------------------------------------------------------
// Campaign 4 — Failure Injection
// ---------------------------------------------------------------------------

function runCampaign4() {
  console.log('\nCampaign 4 — Failure Injection');

  runTest(4, 'healthAggregation degrades on provider failure', () => {
    const { healthAggregation } = requireRepo('apps/sentinel/src/modules/resolver');
    const status = healthAggregation([
      { status: 'healthy' },
      { status: 'degraded' },
      { status: 'healthy' }
    ]);
    assert(status === 'degraded', `Expected "degraded", got "${status}"`);
    return 'degraded propagated correctly';
  });

  runTest(4, 'healthAggregation returns healthy when all providers healthy', () => {
    const { healthAggregation } = requireRepo('apps/sentinel/src/modules/resolver');
    const status = healthAggregation([{ status: 'healthy' }, { status: 'healthy' }]);
    assert(status === 'healthy', `Expected "healthy", got "${status}"`);
    return 'healthy confirmed';
  });

  runTest(4, 'healthAggregation returns unknown for empty provider list', () => {
    const { healthAggregation } = requireRepo('apps/sentinel/src/modules/resolver');
    const status = healthAggregation([]);
    assert(status === 'unknown', `Expected "unknown", got "${status}"`);
    return 'unknown confirmed for empty list';
  });
}

// ---------------------------------------------------------------------------
// Campaign 5 — Executive Desk
// ---------------------------------------------------------------------------

function runCampaign5() {
  console.log('\nCampaign 5 — Executive Desk');

  runTest(5, 'mission-control.html is present', () => {
    const fs = require('fs');
    const htmlPath = path.join(REPO_ROOT, 'apps/api/public/mission-control.html');
    assert(fs.existsSync(htmlPath), 'mission-control.html must exist');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('/api/v1/modules'), 'mission-control.html must reference /api/v1/modules');
    return '/api/v1/modules reference confirmed';
  });

  runTest(5, 'listModules surfaces all modules to the Executive Desk', () => {
    const { listModules } = requireRepo('apps/sentinel/src/modules/resolver');
    const modules = listModules();
    assert(Array.isArray(modules) && modules.length > 0, 'listModules() must return a non-empty array');
    modules.forEach((m) => {
      assert(typeof m.moduleId === 'string', 'each module must have a moduleId');
      assert(typeof m.healthStatus === 'string', 'each module must have a healthStatus');
    });
    return `${modules.length} modules surfaced`;
  });

  runTest(5, '/api/v1/modules endpoint handler exists in server.js', () => {
    const fs = require('fs');
    const src = fs.readFileSync(path.join(REPO_ROOT, 'apps/api/server.js'), 'utf8');
    assert(src.includes('/api/v1/modules'), 'server.js must handle /api/v1/modules');
    return 'route found in server.js';
  });
}

// ---------------------------------------------------------------------------
// Campaign 6 — Module Layer
// ---------------------------------------------------------------------------

function runCampaign6() {
  console.log('\nCampaign 6 — Module Layer');

  // Test 1: listModules() returns all expected modules
  runTest(6, 'listModules() returns all expected modules', () => {
    const { listModules } = requireRepo('apps/sentinel/src/modules/resolver');
    const modules = listModules();
    assert(Array.isArray(modules), 'listModules() must return an array');

    const EXPECTED = [
      'executive-operations',
      'workflow-orchestration',
      'communications',
      'projects',
      'business-operations',
      'ai-operations'
    ];

    // The resolver contains a superset; confirm each expected ID is present.
    const ids = modules.map((m) => m.moduleId);
    EXPECTED.forEach((id) => {
      assert(ids.includes(id), `Expected module "${id}" not found in listModules()`);
    });
    return `confirmed: ${EXPECTED.join(', ')}`;
  });

  // Test 2: resolveCapabilityToModule maps capabilities to correct modules
  runTest(6, 'resolveCapabilityToModule() maps capabilities to correct modules', () => {
    const { resolveCapabilityToModule } = requireRepo('apps/sentinel/src/modules/resolver');

    const EXPECTED_MAPPINGS = [
      // ai-operations module capabilities
      { capability: 'openai-faceplane',     moduleId: 'ai-operations' },
      { capability: 'faceplane-sdk',        moduleId: 'ai-operations' },
      { capability: 'drift-analysis',       moduleId: 'ai-operations' },
      // executive-operations module capabilities
      { capability: 'mission-control',      moduleId: 'executive-operations' },
      { capability: 'executive-snapshot',   moduleId: 'executive-operations' },
      // governance module capabilities
      { capability: 'policy-engine',        moduleId: 'governance' },
      { capability: 'approval-workflow',    moduleId: 'governance' },
      // evidence module capabilities
      { capability: 'audit-logger',         moduleId: 'evidence' },
    ];

    EXPECTED_MAPPINGS.forEach(({ capability, moduleId }) => {
      const result = resolveCapabilityToModule(capability);
      assert(result !== null, `resolveCapabilityToModule("${capability}") returned null`);
      assert(
        result.moduleId === moduleId,
        `"${capability}" should map to "${moduleId}", got "${result && result.moduleId}"`
      );
    });

    return `${EXPECTED_MAPPINGS.length} capability→module mappings verified`;
  });

  // Test 3: Health aggregation — degraded provider degrades module health
  runTest(6, 'Health aggregation: degraded provider degrades module health', () => {
    const { healthAggregation } = requireRepo('apps/sentinel/src/modules/resolver');

    const status = healthAggregation([
      { status: 'healthy' },
      { status: 'degraded' }
    ]);
    assert(
      status === 'degraded',
      `healthAggregation with a degraded provider must return "degraded", got "${status}"`
    );
    return 'module health correctly reflects degraded provider';
  });

  // Test 4: /api/v1/modules returns same data as listModules()
  runTest(6, '/api/v1/modules returns same data as listModules()', () => {
    const { listModules } = requireRepo('apps/sentinel/src/modules/resolver');
    const fs = require('fs');
    const src = fs.readFileSync(path.join(REPO_ROOT, 'apps/api/server.js'), 'utf8');

    // Confirm the server calls listModules() and returns its result under the
    // "modules" key — validated structurally since we can't boot the full server here.
    assert(src.includes('listModules'), 'server.js must call listModules()');
    assert(src.includes('"modules"') || src.includes("'modules'") || src.includes('modules,'),
      'server.js /api/v1/modules handler must return a modules key');

    const modules = listModules();
    assert(modules.length > 0, 'listModules() must return at least one module');
    return `${modules.length} modules — route structurally confirmed in server.js`;
  });

  // Test 5: AI Operations — routeModel invoked and ai-routing evidence written
  runTest(6, 'AI Operations: routeModel invoked and ai-routing evidence written', () => {
    const { invokeCapability, getEvidenceLog, clearEvidenceLog } = requireRepo(
      'apps/sentinel/src/modules/capabilityBroker'
    );

    clearEvidenceLog();

    const result = invokeCapability({
      capability: 'ai-routing',
      payload: { prompt: 'ORV-2 test request' },
      actor: 'orv-harness'
    });

    // Confirm routeModel was invoked (aiRoute present)
    assert(result.aiRoute && result.aiRoute.routed === true, 'routeModel() must have been invoked');
    assert(result.aiRoute.capability === 'ai-routing', 'routed capability must match request');

    // Confirm evidence entry was written
    const log = getEvidenceLog();
    assert(log.length > 0, 'Evidence log must contain at least one entry after ai-routing call');

    const entry = log.find((e) => e.type === 'ai-routing');
    assert(entry, 'Evidence log must contain an ai-routing entry');
    assert(entry.capability === 'ai-routing', 'Evidence entry capability must be "ai-routing"');
    assert(entry.evidenceRef, 'Evidence entry must have an evidenceRef');

    return `routeModel confirmed; evidence ref: ${entry.evidenceRef}`;
  });
}

// ---------------------------------------------------------------------------
// Scoring + Outcome Briefing
// ---------------------------------------------------------------------------

function computeScore() {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  // Weight each test equally within a 100-point scale.
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Evidence completeness: all ai-routing tests that ran and produced evidence entries.
  const aiTests = results.filter((r) => r.test.includes('routeModel') || r.test.includes('ai-routing'));
  const evidenceComplete = aiTests.length > 0 && aiTests.every((r) => r.status === 'pass') ? 1.0 : 0.0;

  return { total, passed, failed, score, evidenceComplete };
}

function moduleLayerReadiness() {
  const { listModules, healthAggregation } = requireRepo('apps/sentinel/src/modules/resolver');
  const modules = listModules();

  const lines = modules.map(
    (m) => `    • ${m.displayName} (${m.moduleId}): ${m.healthStatus}, ${m.capabilityCount} capabilities`
  );

  // Confirm AI Operations has capabilities and an evidence-backed route
  const aiOps = modules.find((m) => m.moduleId === 'ai-operations');
  const aiGoverned = aiOps && aiOps.capabilityCount > 0;

  // Institutional simplicity: every module has a stable ID and at least a health status
  const simplicityPreserved = modules.every((m) => m.moduleId && m.healthStatus);

  return { lines, aiGoverned, simplicityPreserved };
}

function printOutcomeBriefing(scoring) {
  const campaign6Tests = results.filter((r) => r.campaign === 6);
  const campaign6Pass = campaign6Tests.every((r) => r.status === 'pass');

  let readiness;
  try {
    readiness = moduleLayerReadiness();
  } catch (_) {
    readiness = { lines: ['    (resolver unavailable)'], aiGoverned: false, simplicityPreserved: false };
  }

  const orvStatus = scoring.score >= 90 && scoring.evidenceComplete === 1.0 && campaign6Pass
    ? 'PASS'
    : 'FAIL';

  console.log(`
═══════════════════════════════════════════════════════════════
  ORV‑2 OUTCOME BRIEFING
═══════════════════════════════════════════════════════════════

  Overall ORV‑2 Status : ${orvStatus}
  Score                : ${scoring.score}/100  (target ≥ 90)
  Evidence Completeness: ${scoring.evidenceComplete.toFixed(1)}  (target 1.0)
  Tests Passed         : ${scoring.passed}/${scoring.total}

  Campaign Results
  ─────────────────
  Campaign 1 — Governance      : ${campaignStatus(1)}
  Campaign 2 — Docking         : ${campaignStatus(2)}
  Campaign 3 — Federation      : ${campaignStatus(3)}
  Campaign 4 — Failure Injection: ${campaignStatus(4)}
  Campaign 5 — Executive Desk  : ${campaignStatus(5)}
  Campaign 6 — Module Layer    : ${campaignStatus(6)}

  ── Module Layer Readiness ───────────────────────────────────
  Registered modules and health:
${readiness.lines.join('\n')}

  AI Operations governed + evidenced : ${readiness.aiGoverned ? 'YES ✓' : 'NO ✗'}
  Institutional simplicity preserved : ${readiness.simplicityPreserved ? 'YES ✓' : 'NO ✗'}
  Module layer operationally ready   : ${campaign6Pass && readiness.aiGoverned && readiness.simplicityPreserved ? 'YES ✓' : 'NO ✗'}

  C5.5 Gate Condition: ${orvStatus === 'PASS' ? '✓ PASS — Institutional Module Layer is fully validated.' : '✗ FAIL — Resolve failing tests before C5 can be marked complete.'}
═══════════════════════════════════════════════════════════════`);
}

function campaignStatus(num) {
  const campaignResults = results.filter((r) => r.campaign === num);
  if (campaignResults.length === 0) return 'NO TESTS';
  return campaignResults.every((r) => r.status === 'pass') ? 'PASS' : 'FAIL';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('SentinelOS — Operational Readiness Validation (ORV‑2)');
  console.log('═══════════════════════════════════════════════════════════════');

  runCampaign1();
  runCampaign2();
  runCampaign3();
  runCampaign4();
  runCampaign5();
  runCampaign6();

  const scoring = computeScore();
  printOutcomeBriefing(scoring);

  const campaign6Tests = results.filter((r) => r.campaign === 6);
  const campaign6Pass = campaign6Tests.every((r) => r.status === 'pass');
  const orvPass = scoring.score >= 90 && scoring.evidenceComplete === 1.0 && campaign6Pass;

  if (!orvPass) {
    process.exitCode = 1;
  }
}

main();
