const test = require('node:test');
const assert = require('node:assert/strict');
const { runORV2 } = require('../apps/sentinel/src/orv/orv2');
const { buildOutcomeBriefing } = require('../apps/sentinel/src/planes/outcomeBriefing');

test('ORV2 harness produces a passable readiness summary', () => {
  const result = runORV2();

  assert.ok(typeof result.passed === 'boolean');
  assert.ok(result.evidence.percent >= 0);
  assert.ok(typeof result.moduleLayer.passed === 'boolean');
  assert.ok(typeof result.ai.passed === 'boolean');
});

test('Outcome briefing includes the executive readiness summary', () => {
  const briefing = buildOutcomeBriefing();

  assert.strictEqual(briefing.title, 'Phase 2 Evidence Outcome Briefing');
  assert.ok(Array.isArray(briefing.modules));
  assert.ok(Array.isArray(briefing.aiRoutingEvidence));
  assert.ok(['ready-for-declaration', 'not-ready'].includes(briefing.readiness));
});
