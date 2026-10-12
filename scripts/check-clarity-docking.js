const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    buildSentinelDockingEvent,
    evaluateDocking
} = require('../apps/sentinel/src/integrations/docking/protocol');

// Sandbox dispatch resets in-memory passport replay state and dispatches a
// governed command as a synthetic platform administrator. Keep it opt-in.
const manifestPath = path.join(
    __dirname,
    '..',
    'fixtures',
    'docking',
    'clarity-executive-desk-manifest.json'
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const docking = evaluateDocking(manifest);

assert.strictEqual(docking.status, 'DOCKABLE');
assert.strictEqual(docking.trustTier.granted, 'TIER_0');
assert.strictEqual(docking.riskLevel, 'low');
assert.strictEqual(docking.executionMode, 'read_only');
assert.strictEqual(docking.approvalRequired, false);
assert.deepStrictEqual(docking.capabilitiesDenied, []);

const event = buildSentinelDockingEvent(manifest);

assert.strictEqual(event.type, 'docking.requested');
assert.strictEqual(event.payload.manifest.systemId, 'SYS-CLARITY-MEMORY');
assert.ok(event.evidence.includes('status=DOCKABLE'));

if (process.env.NODE_ENV === 'test' && process.env.SENTINEL_CLARITY_DOCKING_SANDBOX === '1') {
    const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
    const {
        resetLocalPassportState,
        signLocalCommand
    } = require('./lib/sentinelPassport');

    resetLocalPassportState();

    dispatchCommand(signLocalCommand({
        tenant: 'nunncloud',
        command: 'docking.evaluate',
        source: 'sentinel',
        payload: manifest,
        metadata: {
            source: 'sentinel',
            actor: 'executive-desk',
            role: 'operator'
        }
    }), {
        principal: {
            keyId: 'key_local_platform_check',
            tenant: 'nunncloud',
            actor: 'executive-desk',
            role: 'platform',
            scopes: ['platform:admin'],
            status: 'active'
        },
        source: 'sentinel'
    }).then((result) => {
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.integration, 'docking');
        assert.strictEqual(result.data.docking.status, 'DOCKABLE');
        assert.strictEqual(result.data.docking.trustTier.granted, 'TIER_0');
        assert.strictEqual(result.data.executionMode, 'read_only');
        console.log('Clarity sandbox docking dispatch passed');
    }).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
} else {
    console.log('Clarity manifest validation passed; governed dispatch skipped.');
    console.log('Sandbox dispatch requires NODE_ENV=test and SENTINEL_CLARITY_DOCKING_SANDBOX=1.');
}