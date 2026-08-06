const test = require('node:test');
const assert = require('node:assert/strict');
const { clearAIRoutingEvidence, getAIRoutingEvidence } = require('../apps/sentinel/src/evidence/ai');
const { routeAIRequest } = require('../apps/sentinel/src/modules/ai-operations/modelBroker');
const { buildExecutivePlane } = require('../apps/sentinel/src/planes/executive');

test('routeAIRequest emits sovereign AI routing evidence', () => {
  clearAIRoutingEvidence();

  const result = routeAIRequest({
    capabilityId: 'ai-planning',
    sessionId: 'session-ai-1',
    dataClassification: 'internal'
  });

  assert.ok(result && result.model);
  assert.ok(result.provider);

  const evidence = getAIRoutingEvidence();
  assert.ok(evidence.some((entry) => entry.type === 'ai-routing'));
});

test('executive plane exposes AI routing evidence per capability', () => {
  clearAIRoutingEvidence();
  routeAIRequest({
    capabilityId: 'ai-planning',
    sessionId: 'session-ai-2',
    dataClassification: 'confidential'
  });

  const plane = buildExecutivePlane();
  const moduleView = plane.institutionalModules.find((module) => module.moduleId === 'ai-operations');
  const capabilityView = moduleView && moduleView.capabilities.find((cap) => cap.capabilityId === 'ai-planning');

  assert.ok(moduleView);
  assert.ok(capabilityView);
  assert.ok(Array.isArray(capabilityView.aiRoutingEvidence));
});
