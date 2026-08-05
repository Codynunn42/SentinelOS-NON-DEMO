const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAutonomousOutcomeBriefing } = require('../apps/sentinel/src/planes/autonomousBriefing');
const { buildExecutivePlane } = require('../apps/sentinel/src/planes/executive');

test('autonomous briefing generates a sovereign briefing with ORV-5 readiness', () => {
  const briefing = buildAutonomousOutcomeBriefing();

  assert.strictEqual(briefing.title, 'Phase 3.5 Autonomous Outcome Briefing');
  assert.ok(briefing.sections.identity);
  assert.ok(briefing.sections.routing);
  assert.ok(briefing.sections.governance);
  assert.ok(typeof briefing.orv5.finalScore === 'number');
  assert.ok(briefing.orv5.finalScore >= 0 && briefing.orv5.finalScore <= 100);
  assert.ok(['ready-for-declaration', 'not-ready'].includes(briefing.readiness));
  assert.ok(briefing.performance.meetsLatencyTarget);
  assert.ok(briefing.performance.generationMs <= 200);
});

test('executive plane exposes the autonomous briefing in autonomy mode', () => {
  const plane = buildExecutivePlane({ autonomyMode: true });

  assert.ok(plane.autonomousBriefing);
  assert.strictEqual(plane.autonomousBriefing.title, 'Phase 3.5 Autonomous Outcome Briefing');
});
