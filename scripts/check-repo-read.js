const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { handleRepoRead } = require('../apps/sentinel/src/commands/repo/read');
const { scanRepository } = require('../apps/sentinel/src/repo/organizationScan');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

const COMMAND = 'repo.read';
const PAYLOAD = {
  capabilityId: 'repo-read',
  operation: 'organization_scan'
};
const principal = {
  tenant: 'nunncloud',
  actor: 'repo-reader@nunncloud.local',
  role: 'platform',
  scopes: ['repo:read', 'audit:read']
};

function signedCommand(overrides = {}) {
  return signLocalCommand({
    tenant: 'nunncloud',
    command: COMMAND,
    source: 'sentinel',
    payload: PAYLOAD,
    ...overrides
  });
}

function assertNoProhibitedServiceEffects() {
  const servicePath = path.join(__dirname, '..', 'apps', 'sentinel', 'src', 'repo', 'organizationScan.js');
  const source = fs.readFileSync(servicePath, 'utf8');
  assert.doesNotMatch(source, /child_process|execSync|execFile|spawnSync|spawn\s*\(/);
  assert.doesNotMatch(source, /writeFile|appendFile|rename|unlink|rmSync|rmdir|mkdir|chmod/);

  const writeMethods = ['writeFileSync', 'appendFileSync', 'renameSync', 'unlinkSync', 'rmSync', 'rmdirSync', 'mkdirSync', 'chmodSync'];
  const originals = new Map();
  let writeCalls = 0;

  try {
    for (const method of writeMethods) {
      originals.set(method, fs[method]);
      fs[method] = () => {
        writeCalls += 1;
        throw new Error(`PROHIBITED_FILESYSTEM_EFFECT:${method}`);
      };
    }

    const result = scanRepository();
    assert.strictEqual(result.executionMode, 'read_only');
    assert.strictEqual(result.rootPolicy, 'server_controlled');
    assert.strictEqual(writeCalls, 0);
  } finally {
    for (const [method, original] of originals.entries()) fs[method] = original;
  }
}

async function main() {
  resetLocalPassportState();
  assertNoProhibitedServiceEffects();

  const direct = await handleRepoRead(PAYLOAD);
  assert.strictEqual(direct.success, true);
  assert.strictEqual(direct.statusCode, 200);
  assert.strictEqual(direct.data.result.capabilityId, 'repo-read');
  assert.strictEqual(direct.data.result.operation, 'organization_scan');
  assert.strictEqual(direct.data.result.executionMode, 'read_only');
  assert.strictEqual(direct.data.result.rootPolicy, 'server_controlled');
  assert.ok(Array.isArray(direct.data.result.findings));

  for (const forbiddenField of ['root', 'path', 'cwd', 'command', 'reportPath']) {
    const rejected = await handleRepoRead({ ...PAYLOAD, [forbiddenField]: '..\\outside' });
    assert.strictEqual(rejected.success, false);
    assert.strictEqual(rejected.error, 'UNSUPPORTED_PAYLOAD_FIELDS');
    assert.deepStrictEqual(rejected.details.fields, [forbiddenField]);
  }

  const wrongCapability = await handleRepoRead({ ...PAYLOAD, capabilityId: 'repo-write' });
  assert.strictEqual(wrongCapability.error, 'INVALID_CAPABILITY');

  const wrongOperation = await handleRepoRead({ ...PAYLOAD, operation: '../organization_scan' });
  assert.strictEqual(wrongOperation.error, 'UNSUPPORTED_OPERATION');

  const governed = await dispatchCommand(signedCommand(), { principal, source: 'sentinel' });
  assert.strictEqual(governed.success, true);
  assert.strictEqual(governed.data.result.capabilityId, 'repo-read');
  assert.strictEqual(governed.data.result.executionMode, 'read_only');
  assert.ok(governed.data.evidence);

  const unsigned = await dispatchCommand(
    { tenant: 'nunncloud', command: COMMAND, payload: PAYLOAD },
    { principal }
  );
  assert.strictEqual(unsigned.error, 'UNAUTHORIZED_EXECUTION');

  const spoofed = await dispatchCommand(
    { tenant: 'nunncloud', command: COMMAND, source: 'sentinel', payload: PAYLOAD },
    { principal, source: 'sentinel' }
  );
  assert.strictEqual(spoofed.details.reason, 'unauthorized_execution:missing_signature');

  const replayed = signedCommand();
  const firstReplayAttempt = await dispatchCommand(replayed, { principal, source: 'sentinel' });
  const secondReplayAttempt = await dispatchCommand(replayed, { principal, source: 'sentinel' });
  assert.strictEqual(firstReplayAttempt.success, true);
  assert.strictEqual(secondReplayAttempt.details.reason, 'unauthorized_execution:replay');

  const tampered = signedCommand();
  tampered.payload.operation = 'tampered';
  const badSignature = await dispatchCommand(tampered, { principal, source: 'sentinel' });
  assert.strictEqual(badSignature.details.reason, 'unauthorized_execution:bad_signature');

  const stale = signedCommand({ timestamp: Date.now() - (10 * 60 * 1000) });
  const staleResult = await dispatchCommand(stale, { principal, source: 'sentinel' });
  assert.strictEqual(staleResult.details.reason, 'unauthorized_execution:stale');

  const wrongSurface = signedCommand({
    meta: { tenantId: 'nunncloud', surface: 'unauthorized-plane' }
  });
  const wrongSurfaceResult = await dispatchCommand(wrongSurface, { principal, source: 'sentinel' });
  assert.strictEqual(wrongSurfaceResult.details.reason, 'unauthorized_execution:scope_violation');

  const wrongScope = await dispatchCommand(signedCommand(), {
    principal: { ...principal, scopes: ['audit:read'] },
    source: 'sentinel'
  });
  assert.strictEqual(wrongScope.error, 'SCOPE_REQUIRED');

  console.log('Repo read boundary check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});