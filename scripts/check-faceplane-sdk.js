const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  MANIFEST_VERSION,
  buildDockingManifest,
  buildFacePlaneManifest,
  buildFacePlaneRegistrationEvent,
  evaluateFacePlaneManifest,
  validateFacePlaneManifest
} = require('../apps/sentinel/src/faceplanes/sdk/facePlaneSdk');

const fixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'faceplanes',
  'governed-workflow-faceplane.json'
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const manifest = buildFacePlaneManifest(fixture);
assert.strictEqual(manifest.manifestVersion, MANIFEST_VERSION);
assert.strictEqual(manifest.facePlaneId, 'governed-workflow');
assert.strictEqual(manifest.tenantId, 'nunncloud');
assert.ok(manifest.manifestHash);
assert.ok(manifest.requestedCapabilities.includes('FACEPLANE_EXECUTE'));
assert.ok(manifest.requestedCapabilities.includes('GAAS_POLICY_APPLY'));

const validation = validateFacePlaneManifest(manifest);
assert.strictEqual(validation.valid, true);
assert.deepStrictEqual(validation.missing, []);
assert.deepStrictEqual(validation.invalid, []);

const dockingManifest = buildDockingManifest(manifest);
assert.strictEqual(dockingManifest.systemId, 'FACEPLANE-GOVERNED-WORKFLOW');
assert.strictEqual(dockingManifest.adapterId, 'ADAPTER-NUNNCLOUD-GOVERNED-WORKFLOW');
assert.strictEqual(dockingManifest.requestedTrustTier, 'TIER_2');
assert.strictEqual(dockingManifest.metadata.gaasPolicyPack, 'gaas.core.workflow.v1');

const evaluation = evaluateFacePlaneManifest(manifest);
assert.strictEqual(evaluation.valid, true);
assert.strictEqual(evaluation.status, 'PENDING_APPROVAL');
assert.strictEqual(evaluation.approvalRequired, true);
assert.strictEqual(evaluation.executionMode, 'approval_required');
assert.strictEqual(evaluation.docking.riskLevel, 'high');

const event = buildFacePlaneRegistrationEvent(manifest);
assert.strictEqual(event.type, 'faceplane.registration.requested');
assert.strictEqual(event.status, 'PENDING_APPROVAL');
assert.strictEqual(event.approvalRequired, true);
assert.ok(event.evidence.some((item) => item.startsWith('manifestHash=')));
assert.ok(event.payload.dockingEvent);

const invalid = evaluateFacePlaneManifest({ facePlaneId: 'x' });
assert.strictEqual(invalid.valid, false);
assert.strictEqual(invalid.status, 'INVALID');
assert.ok(invalid.validation.missing.includes('tenantId'));
assert.ok(invalid.validation.invalid.includes('FACEPLANE_ID_INVALID'));

console.log('Face Plane SDK check passed');
