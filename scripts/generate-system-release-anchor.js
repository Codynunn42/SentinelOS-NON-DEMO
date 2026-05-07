const {
  buildAnchorRecord,
  buildSystemReleaseState,
  SYSTEM_RELEASE_ANCHOR_PATH,
  writeAnchorRecord
} = require('../apps/sentinel/src/verification/stateAnchors');

const timestamp = process.env.SENTINEL_RELEASE_TIMESTAMP || new Date().toISOString();
const state = buildSystemReleaseState({ timestamp });
const record = buildAnchorRecord(state);

writeAnchorRecord(record, SYSTEM_RELEASE_ANCHOR_PATH);

console.log(JSON.stringify({
  status: 'created',
  type: record.type,
  hash: record.hash,
  file: SYSTEM_RELEASE_ANCHOR_PATH,
  externalStatus: record.status
}, null, 2));
