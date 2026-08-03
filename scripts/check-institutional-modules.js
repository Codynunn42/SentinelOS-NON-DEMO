// check-institutional-modules.js
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates that the institutional module resolver returns a well-formed
// module inventory and that the AI Operations module is present and
// carries at least one capability.

'use strict';

const assert = require('assert');
const { listModules } = require('../apps/sentinel/src/modules/resolver');

const modules = listModules();

assert(Array.isArray(modules), 'listModules() must return an array');
assert(modules.length > 0, 'Module inventory must not be empty');

const REQUIRED_MODULE_IDS = [
  'executive-operations',
  'governance',
  'evidence',
  'operations',
  'workflow',
  'ai-operations',
  'communications',
  'development',
  'capability-registry',
  'docking'
];

REQUIRED_MODULE_IDS.forEach((id) => {
  const found = modules.find((m) => m.moduleId === id);
  assert(found, `Module "${id}" must be present in the registry`);
});

modules.forEach((m) => {
  assert(typeof m.moduleId === 'string' && m.moduleId, `Module must have a moduleId string`);
  assert(typeof m.displayName === 'string' && m.displayName, `Module "${m.moduleId}" must have a displayName`);
  assert(
    ['healthy', 'degraded', 'unknown'].includes(m.healthStatus),
    `Module "${m.moduleId}" healthStatus must be healthy|degraded|unknown, got "${m.healthStatus}"`
  );
  assert(typeof m.capabilityCount === 'number', `Module "${m.moduleId}" must have a numeric capabilityCount`);
});

const aiOps = modules.find((m) => m.moduleId === 'ai-operations');
assert(aiOps, 'ai-operations module must be present');
assert(aiOps.capabilityCount > 0, 'ai-operations must declare at least one capability');

// Communications is the known empty module; it should surface as unknown
const comms = modules.find((m) => m.moduleId === 'communications');
assert(comms, 'communications module must be present');
assert(comms.healthStatus === 'unknown', 'communications module must report unknown health (no components yet)');

const html = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'apps', 'api', 'public', 'mission-control.html'),
  'utf8'
);
assert(html.includes('institutional-modules-panel') || html.includes('modulesList'), 'mission-control.html must include the Institutional Modules panel');
assert(html.includes('/api/v1/modules'), 'mission-control.html must reference the /api/v1/modules endpoint');
assert(html.includes('Infrastructure'), 'mission-control.html must include the Infrastructure section (demoted Provider Health)');

console.log(JSON.stringify({
  status: 'pass',
  modulesVerified: modules.length,
  aiOpsCapabilities: aiOps.capabilityCount,
  aiOpsHealth: aiOps.healthStatus,
  modules: modules.map((m) => ({ moduleId: m.moduleId, healthStatus: m.healthStatus, capabilityCount: m.capabilityCount }))
}, null, 2));
