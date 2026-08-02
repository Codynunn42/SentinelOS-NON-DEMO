'use strict';

// C3.4 + C3.5 — Executive Desk Capability Surface + AI Capability Broker Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates C3.4 and C3.5 deliverables:
//   C3.4:
//     - executive.ts has capability awareness (capabilityAware, import of resolver)
//     - nexus-executive.html has Capability Registry panel
//     - nexus-executive.html has loadCapabilities() function
//     - /api/v1/capabilities route registered in server.js
//   C3.5:
//     - capabilities/broker.js exists and exports required functions
//     - brokerCommand routes nexus.status.read to READ capability
//     - brokerCommand blocks operator from nexus.command.execute
//     - brokerPlanningRequest returns capabilityRouting in proposedExecution
//     - /api/v1/planning includes capabilityRouting in server.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// --- File existence ---

const execTsPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'planes', 'executive.ts');
const execHtmlPath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-executive.html');
const brokerPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'capabilities', 'broker.js');
const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');

assert(fs.existsSync(execTsPath), 'executive.ts missing');
assert(fs.existsSync(execHtmlPath), 'nexus-executive.html missing');
assert(fs.existsSync(brokerPath), 'capabilities/broker.js missing');

console.log('  - executive.ts present ✓');
console.log('  - nexus-executive.html present ✓');
console.log('  - capabilities/broker.js present ✓');

// --- C3.4 executive.ts capability awareness ---

const execTs = fs.readFileSync(execTsPath, 'utf8');

[
  'capabilityAware',
  'capabilities/resolver',
  'getCapabilitySummary',
  'listCapabilities',
  'registeredProviders',
  'evidenceRequired',
  'executive.oversight'
].forEach((needle) => {
  assert(execTs.includes(needle), `executive.ts missing: ${needle}`);
});

console.log('  - executive.ts capability awareness fields confirmed ✓');

// --- C3.4 nexus-executive.html capability panel ---

const execHtml = fs.readFileSync(execHtmlPath, 'utf8');

[
  'Registered Capabilities',
  'capabilityRegistry',
  'loadCapabilities',
  '/api/v1/capabilities',
  'capabilityId',
  'evidenceRequired',
  'Load Capabilities',
  'executive.oversight'
].forEach((needle) => {
  assert(execHtml.includes(needle), `nexus-executive.html missing: ${needle}`);
});

console.log('  - nexus-executive.html Capability Registry panel confirmed ✓');
console.log('  - nexus-executive.html loadCapabilities() function confirmed ✓');

// --- C3.4 /api/v1/capabilities route in server.js ---

const server = fs.readFileSync(serverPath, 'utf8');
assert(
  server.includes("pathname === '/api/v1/capabilities'"),
  'server.js missing /api/v1/capabilities route'
);
assert(
  server.includes('getCapabilitySummary'),
  'server.js /api/v1/capabilities must call getCapabilitySummary'
);

console.log('  - /api/v1/capabilities route registered in server.js ✓');

// --- C3.5 broker.js exports ---

const {
  brokerCommand,
  brokerPlanningRequest,
  getCapabilityManifest
} = require('../apps/sentinel/src/capabilities/broker');

assert(typeof brokerCommand === 'function', 'broker must export brokerCommand');
assert(typeof brokerPlanningRequest === 'function', 'broker must export brokerPlanningRequest');
assert(typeof getCapabilityManifest === 'function', 'broker must export getCapabilityManifest');

console.log('  - broker.js exports verified ✓');

// --- C3.5 brokerCommand: read command routes to READ capability ---

const readDecision = brokerCommand({ command: 'nexus.status.read', tenant: 'nexus', role: 'operator' });
assert.strictEqual(readDecision.routed, true, 'nexus.status.read should route');
assert.strictEqual(readDecision.provider, 'nexus', 'nexus.status.read should route to nexus provider');
assert(readDecision.endpoint, 'nexus.status.read routing should include an endpoint');

console.log('  - brokerCommand routes nexus.status.read to nexus provider ✓');

// --- C3.5 brokerCommand: execute command blocked for operator ---

const execDecision = brokerCommand({ command: 'nexus.command.execute', tenant: 'nexus', role: 'operator' });
assert.strictEqual(execDecision.routed, false, 'operator should be blocked from nexus.command.execute');
assert.strictEqual(execDecision.reason, 'INSUFFICIENT_ROLE', `Expected INSUFFICIENT_ROLE, got ${execDecision.reason}`);

console.log('  - brokerCommand blocks operator from nexus.command.execute with INSUFFICIENT_ROLE ✓');

// --- C3.5 brokerCommand: execute command allowed for executive ---

const execDecisionExec = brokerCommand({ command: 'nexus.command.execute', tenant: 'nexus', role: 'executive' });
assert.strictEqual(execDecisionExec.routed, true, 'executive should be allowed nexus.command.execute');
assert.strictEqual(execDecisionExec.endpoint, '/api/v1/execution');

console.log('  - brokerCommand routes nexus.command.execute to /api/v1/execution for executive ✓');

// --- C3.5 brokerCommand: unknown command returns BROKER_NO_ROUTE ---

const unknownDecision = brokerCommand({ command: 'unknown.future.command', tenant: 'nexus', role: 'operator' });
assert.strictEqual(unknownDecision.routed, false);
assert.ok(
  unknownDecision.reason === 'BROKER_NO_ROUTE' || unknownDecision.reason === 'NO_CAPABILITY_REGISTERED',
  `Expected BROKER_NO_ROUTE or NO_CAPABILITY_REGISTERED, got ${unknownDecision.reason}`
);

console.log('  - brokerCommand returns BROKER_NO_ROUTE for unknown command ✓');

// --- C3.5 brokerPlanningRequest ---

const planResult = brokerPlanningRequest({
  intent: { command: 'nexus.status.read' },
  tenant: 'nexus',
  role: 'operator'
});

assert.strictEqual(planResult.routed, true);
assert(planResult.brokerDecision, 'brokerPlanningRequest should return brokerDecision');
assert(planResult.proposedEndpoint, 'brokerPlanningRequest should return proposedEndpoint');

console.log('  - brokerPlanningRequest resolves nexus.status.read with proposedEndpoint ✓');

// --- C3.5 server.js /api/v1/planning includes capabilityRouting ---

const planningStart = server.indexOf("pathname === '/api/v1/planning'");
const planningBlock = server.slice(planningStart, planningStart + 4000);
assert(planningBlock.includes('brokerPlanningRequest'), '/api/v1/planning must call brokerPlanningRequest');
assert(planningBlock.includes('capabilityRouting'), '/api/v1/planning must include capabilityRouting in response');

console.log('  - /api/v1/planning response includes capabilityRouting from broker ✓');

// --- getCapabilityManifest ---

const manifest = getCapabilityManifest('nexus');
assert(manifest, 'getCapabilityManifest should return a result');
assert.strictEqual(manifest.provider, 'nexus');
assert(manifest.total >= 4, `Expected at least 4 NEXUS capabilities in manifest, got ${manifest.total}`);

console.log('  - getCapabilityManifest returns NEXUS manifest ✓');

console.log('\nALL C3.4 + C3.5 PHASE 3 CHECKS PASSED ✓');
