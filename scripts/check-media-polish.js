const assert = require('assert');
const { evaluatePolicy, getRequiredScope } = require('../apps/sentinel/src/governance/policyEngine');
const { PLATFORM_SCOPES, principalHasScope } = require('../apps/sentinel/src/security/keyRegistry');
const { ownerfiHandlers } = require('../apps/sentinel/src/commands/ownerfiHandlers');

const context = {
  tenant: 'ownerfi',
  buildReceipt(command, target, result, tenant) {
    return {
      receiptId: 'receipt_media_polish_check',
      auditId: 'audit_media_polish_check',
      command,
      target,
      result,
      tenant
    };
  },
  emitSecurityEvent(eventType, details) {
    context.lastSecurityEvent = { eventType, details };
  }
};

const payload = {
  sourceVideo: '/Users/codynunn/Downloads/Screen_Recording_20260501_010438_Instagram.mp4',
  referenceFace: '/Users/codynunn/Downloads/Pic (46).jpg',
  instruction:
    'Sentinel read above and fix the facial features that are distorted using Cody logic.',
  targetStills: [
    '/private/tmp/model_v3_stills/still_07_25s.jpg',
    '/private/tmp/model_v3_stills/still_15_50s.jpg',
    '/private/tmp/model_v3_stills/still_23_75s.jpg'
  ],
  targetWindows: [
    { start: 6.8, end: 9.4, reason: 'face turn loses model identity' },
    { start: 14.6, end: 17.2, reason: 'cowgirl segment face/body transition distortion' },
    { start: 20.6, end: 24.9, reason: 'horse segment facial flattening' }
  ]
};

assert.strictEqual(getRequiredScope('media.polish'), 'media:polish');
assert.strictEqual(getRequiredScope('sentinel.media.polish'), 'media:polish');
assert.strictEqual(principalHasScope({ scopes: PLATFORM_SCOPES }, 'media:polish'), true);

const policy = evaluatePolicy({
  tenant: 'ownerfi',
  command: 'sentinel.media.polish',
  actor: 'sentinel.platform@nunncloud.local',
  role: 'approver',
  scopes: ['media:polish']
});

assert.strictEqual(policy.allowed, true);
assert.strictEqual(policy.decision, 'allow');

async function main() {
  const handler = ownerfiHandlers['sentinel.media.polish'];
  const result = await handler(payload, context, { command: 'sentinel.media.polish' });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.statusCode, 200);
  assert.strictEqual(result.data.status, 'manifest_created');
  assert.strictEqual(result.data.result.executionMode, 'operator_assisted');
  assert.strictEqual(result.data.result.targetWindows.length, 3);
  assert.strictEqual(result.data.result.targetStills.length, 3);
  assert.strictEqual(result.data.receipt.command, 'ownerfi.sentinel.media.polish');
  assert.strictEqual(context.lastSecurityEvent.eventType, 'ownerfi.media.polish.manifested');

  console.log('Media polish command check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
