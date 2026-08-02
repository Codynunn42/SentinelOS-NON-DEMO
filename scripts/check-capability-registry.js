'use strict';

// C3.2 — Capability Registry Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all C3.2 deliverables:
//   - capabilities/registry.js exists and exports required functions
//   - capabilities/resolver.js exists and exports required functions
//   - NEXUS capabilities registered (READ, WRITE, EXECUTE, EXECUTIVE)
//   - OwnerFi capability registered
//   - Resolution returns correct results for known commands
//   - Insufficient role returns correct block
//   - Missing command returns correct block
//   - listCapabilities filtering by provider and lifecycle works

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// --- File existence ---

const registryPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'capabilities', 'registry.js');
const resolverPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'capabilities', 'resolver.js');

assert(fs.existsSync(registryPath), 'capabilities/registry.js missing');
assert(fs.existsSync(resolverPath), 'capabilities/resolver.js missing');

console.log('  - capabilities/registry.js present ✓');
console.log('  - capabilities/resolver.js present ✓');

// --- Registry exports ---

const {
  registerCapability,
  getCapability,
  listCapabilities,
  resolveCapabilityForCommand,
  LIFECYCLE,
  CAPABILITY_TYPE
} = require('../apps/sentinel/src/capabilities/registry');

assert(typeof registerCapability === 'function', 'registry must export registerCapability');
assert(typeof getCapability === 'function', 'registry must export getCapability');
assert(typeof listCapabilities === 'function', 'registry must export listCapabilities');
assert(typeof resolveCapabilityForCommand === 'function', 'registry must export resolveCapabilityForCommand');
assert(LIFECYCLE, 'registry must export LIFECYCLE');
assert(CAPABILITY_TYPE, 'registry must export CAPABILITY_TYPE');

console.log('  - registry.js exports verified ✓');

// --- Resolver exports ---

const {
  resolveEnvelope,
  getCapabilitySummary
} = require('../apps/sentinel/src/capabilities/resolver');

assert(typeof resolveEnvelope === 'function', 'resolver must export resolveEnvelope');
assert(typeof getCapabilitySummary === 'function', 'resolver must export getCapabilitySummary');

console.log('  - resolver.js exports verified ✓');

// --- NEXUS capabilities registered ---

const nexusCaps = listCapabilities({ provider: 'nexus' });
assert(nexusCaps.length >= 4, `Expected at least 4 NEXUS capabilities, got ${nexusCaps.length}`);

const nexusTypes = nexusCaps.map((c) => c.type);
assert(nexusTypes.includes(CAPABILITY_TYPE.READ), 'NEXUS missing READ capability');
assert(nexusTypes.includes(CAPABILITY_TYPE.WRITE), 'NEXUS missing WRITE capability');
assert(nexusTypes.includes(CAPABILITY_TYPE.EXECUTE), 'NEXUS missing EXECUTE capability');
assert(nexusTypes.includes(CAPABILITY_TYPE.EXECUTIVE), 'NEXUS missing EXECUTIVE capability');

console.log('  - NEXUS capabilities registered (READ, WRITE, EXECUTE, EXECUTIVE) ✓');

// --- OwnerFi capability registered ---

const ownerfiCaps = listCapabilities({ provider: 'ownerfi' });
assert(ownerfiCaps.length >= 1, 'Expected at least 1 OwnerFi capability');

console.log('  - OwnerFi capability registered ✓');

// --- All active capabilities have required fields ---

const allCaps = listCapabilities({ lifecycle: LIFECYCLE.ACTIVE });
allCaps.forEach((cap) => {
  assert(cap.capabilityId, `Capability missing capabilityId: ${JSON.stringify(cap)}`);
  assert(cap.provider, `Capability missing provider: ${cap.capabilityId}`);
  assert(cap.type, `Capability missing type: ${cap.capabilityId}`);
  assert(cap.endpoint, `Capability missing endpoint: ${cap.capabilityId}`);
  assert(cap.authority && cap.authority.minimumRole, `Capability missing authority.minimumRole: ${cap.capabilityId}`);
  assert(cap.governance && typeof cap.governance.evidenceRequired === 'boolean', `Capability missing governance.evidenceRequired: ${cap.capabilityId}`);
  assert(cap.healthEndpoint, `Capability missing healthEndpoint: ${cap.capabilityId}`);
  assert(cap.version, `Capability missing version: ${cap.capabilityId}`);
});

console.log(`  - All ${allCaps.length} active capabilities have required fields ✓`);

// --- Resolution: known command resolves ---

const nexusRead = resolveCapabilityForCommand({ command: 'nexus.status.read', tenant: 'nexus' });
assert(nexusRead, 'nexus.status.read should resolve to a capability');
assert.strictEqual(nexusRead.type, CAPABILITY_TYPE.READ, 'nexus.status.read should resolve to READ type');

const nexusExec = resolveCapabilityForCommand({ command: 'nexus.command.execute', tenant: 'nexus' });
assert(nexusExec, 'nexus.command.execute should resolve to a capability');
assert.strictEqual(nexusExec.type, CAPABILITY_TYPE.EXECUTE, 'nexus.command.execute should resolve to EXECUTE type');

console.log('  - Command resolution for nexus.status.read and nexus.command.execute ✓');

// --- resolveEnvelope: insufficient role blocked ---

const blockedResult = resolveEnvelope({ command: 'nexus.command.execute', tenant: 'nexus', role: 'operator' });
assert.strictEqual(blockedResult.resolved, false, 'operator should be blocked from nexus.command.execute');
assert.strictEqual(blockedResult.reason, 'INSUFFICIENT_ROLE', `Expected INSUFFICIENT_ROLE, got ${blockedResult.reason}`);

console.log('  - operator blocked from nexus.command.execute with INSUFFICIENT_ROLE ✓');

// --- resolveEnvelope: executive allowed ---

const allowedResult = resolveEnvelope({ command: 'nexus.command.execute', tenant: 'nexus', role: 'executive' });
assert.strictEqual(allowedResult.resolved, true, 'executive should be allowed nexus.command.execute');
assert(allowedResult.routingAdvice, 'resolveEnvelope should return routingAdvice on success');
assert.strictEqual(allowedResult.routingAdvice.endpoint, '/api/v1/execution');

console.log('  - executive allowed nexus.command.execute, routed to /api/v1/execution ✓');

// --- resolveEnvelope: unknown command returns NO_CAPABILITY_REGISTERED ---

const unknownResult = resolveEnvelope({ command: 'unknown.command', tenant: 'nexus', role: 'operator' });
assert.strictEqual(unknownResult.resolved, false);
assert.strictEqual(unknownResult.reason, 'NO_CAPABILITY_REGISTERED');

console.log('  - unknown command returns NO_CAPABILITY_REGISTERED ✓');

// --- resolveEnvelope: missing command ---

const missingCmd = resolveEnvelope({ command: '', tenant: 'nexus' });
assert.strictEqual(missingCmd.resolved, false);
assert.strictEqual(missingCmd.reason, 'COMMAND_REQUIRED');

console.log('  - missing command returns COMMAND_REQUIRED ✓');

// --- getCapabilitySummary ---

const nexusSummary = getCapabilitySummary('nexus');
assert.strictEqual(nexusSummary.provider, 'nexus');
assert(nexusSummary.total >= 4, `Expected at least 4 NEXUS capabilities in summary, got ${nexusSummary.total}`);
assert(Array.isArray(nexusSummary.capabilities));

console.log('  - getCapabilitySummary returns correct NEXUS summary ✓');

console.log('\nALL C3.2 CAPABILITY REGISTRY CHECKS PASSED ✓');
