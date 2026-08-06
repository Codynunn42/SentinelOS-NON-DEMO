const assert = require('assert');
const { buildSentinelGPTActionOpenAPI } = require('../apps/sentinel/src/faceplanes/openai/gptActionManifest');

const spec = buildSentinelGPTActionOpenAPI({ baseUrl: 'https://sentinel.example.test/' });

assert.strictEqual(spec.openapi, '3.1.0');
assert.strictEqual(spec.servers[0].url, 'https://sentinel.example.test');
assert.strictEqual(spec.components.securitySchemes.SentinelApiKey.name, 'x-api-key');
assert.strictEqual(spec.paths['/faceplane/openai/gpt-actions/connection'].get.operationId, 'getSentinelGPTConnectionStatus');
assert.strictEqual(spec.paths['/faceplane/openai/gpt-actions/connection'].get.parameters[0].name, 'tenantId');
assert.strictEqual(spec.paths['/health'].get.operationId, 'getSentinelHealth');
assert.strictEqual(spec.paths['/ready'].get.operationId, 'getSentinelReadiness');
assert.strictEqual(spec.paths['/faceplane/openai/execute'].post.operationId, 'executeOpenAIGovernedWorkflow');
assert.strictEqual(spec.paths['/faceplane/openai/status'].get.operationId, 'getOpenAIFaceplaneStatus');
assert.strictEqual(spec.paths['/faceplane/openai/config'].get.parameters[0].required, true);
assert.deepStrictEqual(spec.security, [{ SentinelApiKey: [] }]);

console.log('GPT action connector check passed');
