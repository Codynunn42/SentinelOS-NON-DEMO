const assert = require('assert');
const {
  buildUrl,
  trimBaseUrl,
  verifyGPTActionConnection
} = require('./verify-gpt-action-connection');

assert.strictEqual(trimBaseUrl('https://sentinel.example.test/'), 'https://sentinel.example.test');
assert.strictEqual(
  buildUrl('https://sentinel.example.test/', '/faceplane/openai/gpt-actions/connection', { tenantId: 'nunn-internal' }).toString(),
  'https://sentinel.example.test/faceplane/openai/gpt-actions/connection?tenantId=nunn-internal'
);

verifyGPTActionConnection({}).then((result) => {
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.status, 'config_required');
  assert.deepStrictEqual(result.missing, ['SENTINEL_GPT_ACTION_BASE_URL']);
  console.log('GPT action runtime verifier check passed');
});
