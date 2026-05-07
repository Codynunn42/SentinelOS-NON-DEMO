const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const baseline = require('./containmentBaseline_v1.json');
const { driftConfig } = require('./driftConfig');
const { DEFAULT_DRIFT_POLICY_LEDGER_PATH, readEntries, stableStringify } = require('./driftPolicyLedger');

const BASELINE_PATH = path.join(__dirname, 'containmentBaseline_v1.json');
const EXPECTED_BASELINE_CHECKSUM = 'sha256:0c7a4f1f4b2c03cfbf7c94505d80ce0b20da75733a8b50c1de5b6df597471462';
const SCHEDULER_HEARTBEAT_PATH = process.env.SENTINEL_SCHEDULER_HEARTBEAT_PATH || '/private/tmp/sentinel_scheduler_heartbeat.json';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function checkBaselineChecksum(expectedChecksum = EXPECTED_BASELINE_CHECKSUM) {
  const raw = fs.readFileSync(BASELINE_PATH, 'utf8');
  const actualChecksum = `sha256:${sha256(raw)}`;

  return {
    name: 'baseline_checksum',
    ok: actualChecksum === expectedChecksum,
    expected: expectedChecksum,
    actual: actualChecksum,
    baselineVersion: baseline.baselineVersion
  };
}

function recomputeLedgerHash(entry) {
  const { hash, ...withoutHash } = entry;
  return sha256(stableStringify(withoutHash));
}

function verifyLedgerChain(ledgerPath = DEFAULT_DRIFT_POLICY_LEDGER_PATH) {
  const entries = readEntries(ledgerPath);
  const failures = [];

  entries.forEach((entry, index) => {
    const expectedPrevious = index === 0 ? null : entries[index - 1].hash;
    const actualHash = recomputeLedgerHash(entry);

    if (entry.previousHash !== expectedPrevious) {
      failures.push({
        index,
        reason: 'previous_hash_mismatch',
        expectedPrevious,
        actualPrevious: entry.previousHash
      });
    }

    if (entry.hash !== actualHash) {
      failures.push({
        index,
        reason: 'entry_hash_mismatch',
        expectedHash: actualHash,
        actualHash: entry.hash
      });
    }
  });

  return {
    name: 'drift_policy_ledger_chain',
    ok: failures.length === 0,
    ledgerPath,
    entryCount: entries.length,
    failures
  };
}

function readSchedulerHeartbeat(heartbeatPath = SCHEDULER_HEARTBEAT_PATH) {
  if (!fs.existsSync(heartbeatPath)) {
    return {
      name: 'scheduler_heartbeat',
      ok: false,
      heartbeatPath,
      timestamp: null,
      ageSeconds: null,
      reason: 'heartbeat_missing'
    };
  }

  try {
    const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
    const timestamp = heartbeat.timestamp || null;
    const ageSeconds = timestamp ? Math.round((Date.now() - new Date(timestamp).getTime()) / 1000) : null;
    const maxAgeSeconds = Number(heartbeat.maxAgeSeconds || process.env.SENTINEL_SCHEDULER_MAX_AGE_SECONDS || 3600);
    const fresh = typeof ageSeconds === 'number' && Number.isFinite(ageSeconds) && ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;

    return {
      name: 'scheduler_heartbeat',
      ok: fresh,
      heartbeatPath,
      timestamp,
      ageSeconds,
      maxAgeSeconds,
      lastJob: heartbeat.lastJob || null,
      result: heartbeat.result || null,
      reason: fresh ? null : 'heartbeat_stale'
    };
  } catch (error) {
    return {
      name: 'scheduler_heartbeat',
      ok: false,
      heartbeatPath,
      timestamp: null,
      ageSeconds: null,
      reason: 'heartbeat_invalid_json'
    };
  }
}

function checkTenantIsolationConfig(surfaceRegistry = {}) {
  const tenants = Object.keys(surfaceRegistry);
  const duplicates = tenants.filter((tenant, index) => tenants.indexOf(tenant) !== index);
  const missingHandlers = tenants.filter((tenant) => {
    return !surfaceRegistry[tenant] || typeof surfaceRegistry[tenant].handlers !== 'object';
  });

  return {
    name: 'tenant_isolation_config',
    ok: tenants.length > 0 && duplicates.length === 0 && missingHandlers.length === 0,
    tenants,
    tenantCount: tenants.length,
    duplicates,
    missingHandlers
  };
}

function checkDriftMonitorActive() {
  return {
    name: 'drift_monitor_config',
    ok:
      driftConfig &&
      driftConfig.configVersion === '1.0.0' &&
      driftConfig.baselineVersion === baseline.baselineVersion,
    configVersion: driftConfig.configVersion,
    baselineVersion: driftConfig.baselineVersion
  };
}

function buildGovernanceStatus({
  databaseStatus = 'unknown',
  surfaceRegistry = {},
  includeScheduler = true,
  activeFaceplanes = []
} = {}) {
  const checks = [
    checkDriftMonitorActive(),
    checkBaselineChecksum(),
    verifyLedgerChain(),
    checkTenantIsolationConfig(surfaceRegistry)
  ];

  if (includeScheduler) {
    checks.push(readSchedulerHeartbeat());
  }

  const failed = checks.filter((check) => !check.ok);
  const ready = failed.length === 0 && databaseStatus !== 'disabled';

  return {
    status: ready ? 'ok' : 'degraded',
    ready,
    service: 'sentinel-governance',
    database: databaseStatus,
    activeFaceplanes,
    checks,
    failedChecks: failed.map((check) => check.name),
    timestamp: new Date().toISOString()
  };
}

function writeSchedulerHeartbeat({
  heartbeatPath = SCHEDULER_HEARTBEAT_PATH,
  lastJob = 'manual',
  result = 'ok',
  maxAgeSeconds = 3600
} = {}) {
  fs.mkdirSync(path.dirname(heartbeatPath), { recursive: true });
  const heartbeat = {
    timestamp: new Date().toISOString(),
    lastJob,
    result,
    maxAgeSeconds
  };
  fs.writeFileSync(heartbeatPath, `${JSON.stringify(heartbeat, null, 2)}\n`, 'utf8');
  return heartbeat;
}

module.exports = {
  EXPECTED_BASELINE_CHECKSUM,
  SCHEDULER_HEARTBEAT_PATH,
  buildGovernanceStatus,
  checkBaselineChecksum,
  readSchedulerHeartbeat,
  verifyLedgerChain,
  writeSchedulerHeartbeat
};
