const test = require('node:test');
const assert = require('node:assert/strict');
const { clearModuleEvidence, getModuleEvidence, emitModuleEvidence } = require('../apps/sentinel/src/evidence/module');
const { resolveCapabilityToModule } = require('../apps/sentinel/src/modules/resolver');
const { emitModuleHealthEvidence } = require('../apps/sentinel/src/modules/health');
const { emitModuleGovernanceDenialEvidence } = require('../apps/sentinel/src/modules/governance');
const { buildExecutivePlane } = require('../apps/sentinel/src/planes/executive');

test('module-resolution emits sovereign module evidence', () => {
  clearModuleEvidence();
  resolveCapabilityToModule('calendar-read');

  const evidence = getModuleEvidence();
  assert.ok(evidence.some((entry) => entry.type === 'module-resolution'));
});

test('module-health emits sovereign module evidence', () => {
  clearModuleEvidence();
  emitModuleHealthEvidence('ai-operations', 'healthy');

  const evidence = getModuleEvidence();
  assert.ok(evidence.some((entry) => entry.type === 'module-health'));
});

test('module-governance-denial emits sovereign module evidence', () => {
  clearModuleEvidence();
  emitModuleGovernanceDenialEvidence('ai-operations', 'calendar-read', 'capability-not-in-module');

  const evidence = getModuleEvidence();
  assert.ok(evidence.some((entry) => entry.type === 'module-governance-denial'));
});

test('executive plane includes module evidence for each institutional module', () => {
  clearModuleEvidence();
  emitModuleEvidence({ type: 'module-resolution', moduleId: 'ai-operations', capabilityId: 'calendar-read' });

  const plane = buildExecutivePlane();
  const moduleView = plane.institutionalModules.find((module) => module.moduleId === 'ai-operations');

  assert.ok(moduleView);
  assert.ok(Array.isArray(moduleView.evidence));
});
