const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  buildSentinelDockingEvent,
  evaluateDocking
} = require('../apps/sentinel/src/integrations/docking/protocol');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');
const {
  validateDockManifest,
  normalizeDockManifest
} = require('../apps/sentinel/src/integrations/docking/manifest-schema');

resetLocalPassportState();

const manifestPath = path.join(__dirname, '..', 'fixtures', 'docking', 'udp-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const docking = evaluateDocking(manifest);

assert.strictEqual(docking.protocol, 'universal-docking-protocol');
assert.strictEqual(docking.manifest.systemId, 'SYS-CDNLUX-UTILITY');
assert.strictEqual(docking.riskLevel, 'high');
assert.strictEqual(docking.approvalRequired, true);
assert.ok(docking.capabilitiesDenied.includes('REQUEST_CDLUX_TRANSFER'));

const event = buildSentinelDockingEvent(manifest);

assert.strictEqual(event.type, 'docking.requested');
assert.strictEqual(event.source, 'universal-docking-protocol');
assert.strictEqual(event.riskLevel, 'high');
assert.ok(event.evidence.includes('systemId=SYS-CDNLUX-UTILITY'));

console.log('Sentinel docking protocol scaffold passed');

// --- C3.3 — Dock Manifest Standard ---

// nexus-faceplane.json must contain a valid dockManifest block
const nexusFacePlanePath = path.join(__dirname, '..', 'fixtures', 'faceplanes', 'nexus-faceplane.json');
assert(fs.existsSync(nexusFacePlanePath), 'nexus-faceplane.json missing');

const nexusFacePlane = JSON.parse(fs.readFileSync(nexusFacePlanePath, 'utf8'));
assert(nexusFacePlane.dockManifest, 'nexus-faceplane.json missing dockManifest block');

const nexusManifestResult = validateDockManifest(nexusFacePlane.dockManifest);
assert(
  nexusManifestResult.valid,
  `nexus dockManifest failed schema validation: ${JSON.stringify(nexusManifestResult.errors)}`
);

console.log('  - nexus-faceplane.json dockManifest validates against schema ✓');

// dock-manifest.schema.json must exist
const schemaPath = path.join(__dirname, '..', 'fixtures', 'faceplanes', 'dock-manifest.schema.json');
assert(fs.existsSync(schemaPath), 'dock-manifest.schema.json missing');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
assert.strictEqual(schema.title, 'SentinelOS Dock Manifest');
assert(Array.isArray(schema.required) && schema.required.includes('system'));
assert(Array.isArray(schema.required) && schema.required.includes('apis'));
assert(Array.isArray(schema.required) && schema.required.includes('governance'));

console.log('  - dock-manifest.schema.json is a valid schema artifact ✓');

// manifest-schema.js must be importable and validate/reject correctly
const validManifest = {
  system: { name: 'TILDA', version: '1.0' },
  provides: ['Workflow Routing'],
  apis: ['planning', 'execution'],
  security: { authentication: 'JWT' },
  governance: { evidence: 'required' },
  runtime: { healthEndpoint: '/health' }
};

const validResult = validateDockManifest(validManifest);
assert(validResult.valid, 'Valid manifest should pass validation');

const invalidManifest = { system: { name: 'X' } };
const invalidResult = validateDockManifest(invalidManifest);
assert(!invalidResult.valid, 'Invalid manifest should fail validation');
assert(Array.isArray(invalidResult.errors) && invalidResult.errors.length > 0);

const normalized = normalizeDockManifest(validManifest);
assert(normalized.lifecycle && normalized.lifecycle.status, 'normalizeDockManifest must set lifecycle.status');

console.log('  - manifest-schema.js validates and rejects manifests correctly ✓');
console.log('  - normalizeDockManifest sets lifecycle defaults ✓');

console.log('Sentinel docking manifest standard passed');

dispatchCommand(signLocalCommand({
  tenant: 'nunncloud',
  command: 'docking.evaluate',
  source: 'sentinel',
  payload: manifest,
  metadata: {
    source: 'sentinel',
    actor: 'local-check',
    role: 'operator'
  }
}), {
  principal: {
    keyId: 'key_local_platform_check',
    tenant: 'nunncloud',
    actor: 'local-check',
    role: 'platform',
    scopes: ['platform:admin'],
    status: 'active'
  },
  source: 'sentinel'
}).then((result) => {
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.integration, 'docking');
  assert.strictEqual(result.data.approvalRequired, true);
  console.log('Sentinel docking command surface passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
