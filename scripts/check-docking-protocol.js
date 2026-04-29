const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  buildSentinelDockingEvent,
  evaluateDocking
} = require('../apps/sentinel/src/integrations/docking/protocol');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');

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

dispatchCommand({
  tenant: 'nunncloud',
  command: 'docking.evaluate',
  payload: manifest,
  metadata: {
    actor: 'local-check',
    role: 'operator'
  }
}, {
  principal: {
    keyId: 'key_local_platform_check',
    tenant: 'nunncloud',
    actor: 'local-check',
    role: 'platform',
    scopes: ['platform:admin'],
    status: 'active'
  }
}).then((result) => {
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.integration, 'docking');
  assert.strictEqual(result.data.approvalRequired, true);
  console.log('Sentinel docking command surface passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
