const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { handleRepoRead } = require('../apps/sentinel/src/commands/repo/read');
const { scanRepository } = require('../apps/sentinel/src/repo/organizationScan');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');
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
let receiptSequence = 0;

function buildReceipt(command, entity, outcome, tenantId) {
  receiptSequence += 1;
  return {
    receiptId: `rcpt_repo_read_check_${receiptSequence}`,
    auditId: `audit_repo_read_check_${receiptSequence}`,
    command,
    tenantId,
    status: 'executed',
    verified: true,
    entity,
    outcome,
    timestamp: new Date().toISOString()
  };
}

function dispatchContext(overrides = {}) {
  return {
    principal,
    source: 'sentinel',
    buildReceipt,
    ...overrides
  };
}

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

  const missingBuilder = await handleRepoRead(PAYLOAD, {}, { correlationId: 'corr_missing_builder' });
  assert.strictEqual(missingBuilder.error, 'RECEIPT_BUILDER_UNAVAILABLE');

  const missingCorrelation = await handleRepoRead(PAYLOAD, { buildReceipt });
  assert.strictEqual(missingCorrelation.error, 'RECEIPT_CORRELATION_UNAVAILABLE');

  const directCorrelationId = 'corr_repo_read_direct_check';
  const direct = await handleRepoRead(
    PAYLOAD,
    { tenant: 'nunncloud', buildReceipt },
    { tenant: 'nunncloud', command: COMMAND, correlationId: directCorrelationId }
  );
  assert.strictEqual(direct.success, true);
  assert.strictEqual(direct.statusCode, 200);
  assert.strictEqual(direct.data.result.capabilityId, 'repo-read');
  assert.strictEqual(direct.data.result.operation, 'organization_scan');
  assert.strictEqual(direct.data.result.executionMode, 'read_only');
  assert.strictEqual(direct.data.result.rootPolicy, 'server_controlled');
  assert.ok(Array.isArray(direct.data.result.findings));
  assert.strictEqual(direct.data.receipt.correlationId, directCorrelationId);
  assert.strictEqual(direct.data.receipt.entity.id, directCorrelationId);
  assert.strictEqual(direct.data.receipt.outcome.correlationId, directCorrelationId);
  assert.strictEqual(direct.data.receipt.outcome.capabilityId, 'repo-read');

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

  const governed = await dispatchCommand(signedCommand(), dispatchContext());
  assert.strictEqual(governed.success, true);
  assert.strictEqual(governed.data.result.capabilityId, 'repo-read');
  assert.strictEqual(governed.data.result.executionMode, 'read_only');
  assert.ok(governed.data.evidence);
  assert.ok(governed.data.receipt.receiptId);
  assert.strictEqual(governed.data.receipt.correlationId, governed.data.evidence.sessionId);
  assert.strictEqual(governed.data.receipt.entity.id, governed.data.evidence.sessionId);
  assert.strictEqual(governed.data.receipt.outcome.correlationId, governed.data.evidence.sessionId);

  const receiptMatch = await auditLogger.getByReceiptId(
    governed.data.receipt.receiptId,
    'nunncloud'
  );
  assert.ok(receiptMatch);
  assert.strictEqual(receiptMatch.source, 'memory');
  assert.strictEqual(receiptMatch.receipt.receiptId, governed.data.receipt.receiptId);
  assert.strictEqual(receiptMatch.receipt.correlationId, governed.data.evidence.sessionId);
  assert.strictEqual(receiptMatch.entry.correlationId, governed.data.evidence.sessionId);
  assert.strictEqual(receiptMatch.entry.command, COMMAND);

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
  const firstReplayAttempt = await dispatchCommand(replayed, dispatchContext());
  const secondReplayAttempt = await dispatchCommand(replayed, dispatchContext());
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
    ...dispatchContext(),
    principal: { ...principal, scopes: ['audit:read'] }
  });
  assert.strictEqual(wrongScope.error, 'SCOPE_REQUIRED');

  console.log('Repo read boundary check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});