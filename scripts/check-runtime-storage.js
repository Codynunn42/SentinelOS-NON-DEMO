#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-runtime-storage-'));
process.env.SENTINEL_DATA_DIR = runtimeRoot;

try {
  const { getRuntimeDataRoot } = require('../apps/sentinel/src/runtime/dataPaths');
  const {
    SYSTEM_RELEASE_ANCHOR_PATH,
    buildAnchorRecord,
    buildSystemReleaseState,
    getSystemReleaseAnchor,
    writeAnchorRecord
  } = require('../apps/sentinel/src/verification/stateAnchors');
  const {
    DEFAULT_DRIFT_POLICY_LEDGER_PATH,
    appendDriftEvent
  } = require('../apps/sentinel/src/governance/core/driftPolicyLedger');

  assert.strictEqual(getRuntimeDataRoot(), runtimeRoot);
  assert.ok(SYSTEM_RELEASE_ANCHOR_PATH.startsWith(`${runtimeRoot}${path.sep}`));
  assert.ok(DEFAULT_DRIFT_POLICY_LEDGER_PATH.startsWith(`${runtimeRoot}${path.sep}`));

  const anchor = buildAnchorRecord(buildSystemReleaseState({ version: 'runtime-storage-check' }));
  writeAnchorRecord(anchor);
  assert.strictEqual(getSystemReleaseAnchor().state.version, 'runtime-storage-check');

  appendDriftEvent({
    driftId: 'runtime-storage-check',
    type: 'STORAGE_CHECK',
    severity: 'INFO'
  });
  assert.ok(fs.existsSync(DEFAULT_DRIFT_POLICY_LEDGER_PATH));

  console.log('Runtime storage check passed');
} finally {
  fs.rmSync(runtimeRoot, { recursive: true, force: true });
}
