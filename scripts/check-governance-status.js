const assert = require('assert');
const fs = require('fs');
const heartbeatPath = '/private/tmp/sentinel_governance_status_check_heartbeat.json';
process.env.SENTINEL_SCHEDULER_HEARTBEAT_PATH = heartbeatPath;
const {
  buildGovernanceStatus,
  checkBaselineChecksum,
  verifyLedgerChain,
  writeSchedulerHeartbeat
} = require('../apps/sentinel/src/governance/core/governanceStatus');
const { appendDriftConfigUpdate } = require('../apps/sentinel/src/governance/core/driftPolicyLedger');

const ledgerPath = '/private/tmp/sentinel_governance_status_check_ledger.jsonl';
fs.rmSync(heartbeatPath, { force: true });
fs.rmSync(ledgerPath, { force: true });

const baseline = checkBaselineChecksum();
assert.strictEqual(baseline.ok, true);

const emptyLedger = verifyLedgerChain(ledgerPath);
assert.strictEqual(emptyLedger.ok, true);
assert.strictEqual(emptyLedger.entryCount, 0);

appendDriftConfigUpdate({
  oldConfigVersion: '1.0.0',
  newConfigVersion: '1.1.0',
  changes: { escalationRate: { infoUpper: { from: 0.04, to: 0.041 } } },
  rationale: 'Governance status check fixture.',
  actorId: 'governance@example.com',
  timestamp: '2026-05-02T12:00:00.000Z'
}, { ledgerPath });
const validLedger = verifyLedgerChain(ledgerPath);
assert.strictEqual(validLedger.ok, true);
assert.strictEqual(validLedger.entryCount, 1);

const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
const tampered = JSON.parse(lines[0]);
tampered.actorId = 'tampered@example.com';
fs.writeFileSync(ledgerPath, `${JSON.stringify(tampered)}\n`, 'utf8');
const invalidLedger = verifyLedgerChain(ledgerPath);
assert.strictEqual(invalidLedger.ok, false);
assert.strictEqual(invalidLedger.failures[0].reason, 'entry_hash_mismatch');

writeSchedulerHeartbeat({
  heartbeatPath,
  lastJob: 'governance.status.check',
  result: 'ok',
  maxAgeSeconds: 3600
});
const status = buildGovernanceStatus({
  databaseStatus: 'enabled',
  surfaceRegistry: {
    ownerfi: { handlers: {} },
    nunncloud: { handlers: {} }
  }
});
assert.strictEqual(status.ready, true);
assert.strictEqual(status.status, 'ok');

fs.rmSync(heartbeatPath, { force: true });
const degraded = buildGovernanceStatus({
  databaseStatus: 'enabled',
  surfaceRegistry: {
    ownerfi: { handlers: {} }
  }
});
assert.strictEqual(degraded.ready, false);
assert(degraded.failedChecks.includes('scheduler_heartbeat'));

console.log('Governance status check passed');
