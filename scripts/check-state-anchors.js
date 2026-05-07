const assert = require('assert');
const {
  ANCHOR_TYPES,
  buildAnchorRecord,
  buildSystemReleaseState,
  getSystemReleaseAnchor,
  listAnchors,
  stableStringify
} = require('../apps/sentinel/src/verification/stateAnchors');

const state = buildSystemReleaseState({
  timestamp: '2026-05-05T00:00:00.000Z'
});
const first = buildAnchorRecord(state);
const second = buildAnchorRecord(JSON.parse(JSON.stringify(state)));

assert.strictEqual(first.type, ANCHOR_TYPES.SYSTEM_RELEASE);
assert.strictEqual(first.hash, second.hash);
assert.strictEqual(first.status, 'PENDING_EXTERNAL_ANCHOR');
assert(first.nextAnchors.includes(ANCHOR_TYPES.PILOT_START));
assert(first.nextAnchors.includes(ANCHOR_TYPES.EXECUTION_APPROVED));
assert(first.nextAnchors.includes(ANCHOR_TYPES.BILLING_ACTIVATED));
assert(first.clientLanguage.includes('verifiable records of key system states'));
assert(stableStringify({ b: 1, a: 2 }).startsWith('{"a":2,"b":1}'));

const current = getSystemReleaseAnchor();
assert.strictEqual(current.type, ANCHOR_TYPES.SYSTEM_RELEASE);
assert.strictEqual(Array.isArray(listAnchors()), true);

console.log('State anchors check passed');
