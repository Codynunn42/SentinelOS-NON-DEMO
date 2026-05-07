const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageDoc = read('docs/SENTINELOS_DEMO_PACKAGE_V2.md');
const scriptDoc = read('docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md');
const proofSheet = read('docs/SENTINELOS_PROOF_SHEET_V2.md');
const proofCase = read('docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md');
const architecture = read('docs/diagrams/sentinelos_architecture_v2.mmd');
const governance = read('docs/diagrams/governance_pipeline_v2.mmd');
const docking = read('docs/diagrams/faceplane_docking_v2.mmd');

[
  packageDoc,
  scriptDoc,
  proofSheet,
  proofCase
].forEach((doc) => {
  assert.ok(doc.includes('We do not replace your system'));
  assert.ok(doc.includes('control what your system is allowed to do'));
});

assert.ok(packageDoc.includes('SentinelOS = Execution OS'));
assert.ok(packageDoc.includes('Governed Deal Execution - Reference Implementation'));
assert.ok(packageDoc.includes('SENTINELOS_PROOF_SHEET_V2.md'));

assert.ok(scriptDoc.includes('Two-Minute Narration'));
assert.ok(scriptDoc.includes('SentinelOS decides before execution'));

assert.ok(proofSheet.includes('/health'));
assert.ok(proofSheet.includes('/v1/command'));
assert.ok(proofSheet.includes('/v1/audit'));

assert.ok(proofCase.includes('application.submit'));
assert.ok(proofCase.includes('deal.execute'));
assert.ok(proofCase.includes('BLOCKED until approval'));

assert.ok(architecture.includes('User Action'));
assert.ok(architecture.includes('/v1/command'));
assert.ok(architecture.includes('/v1/audit'));

assert.ok(governance.includes('Decision Gate'));
assert.ok(governance.includes('BLOCK'));
assert.ok(governance.includes('Human Approval Required'));

assert.ok(docking.includes('UI / Entry'));
assert.ok(docking.includes('Validation Layer'));
assert.ok(docking.includes('API + RBAC Boundary'));

console.log('SentinelOS demo assets v2 check passed');
