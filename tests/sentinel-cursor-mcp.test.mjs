import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const calls = [];
let api;
let baseUrl;

before(async () => {
  api = createServer((req, res) => {
    calls.push({
      method: req.method,
      url: req.url,
      apiKey: req.headers['x-api-key']
    });
    res.setHeader('content-type', 'application/json');
    if (req.url === '/health') {
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (req.url === '/governance/status') {
      res.end(JSON.stringify({ status: 'ready', tenant: 'tenant-test' }));
      return;
    }
    if (req.url === '/faceplane/openai/status?tenantId=tenant-test') {
      res.end(JSON.stringify({ status: 'connected', name: 'OpenAI faceplane' }));
      return;
    }
    if (req.url === '/v1/metrics?tenant=tenant-test') {
      res.end(JSON.stringify({ status: 'ok', metrics: { total: 2 } }));
      return;
    }
    if (req.url === '/task-templates/runs?tenant=tenant-test') {
      res.end(JSON.stringify({
        status: 'ok',
        tenant: 'tenant-test',
        count: 1,
        runs: [{
          runId: 'run-1',
          tenant: 'tenant-test',
          status: 'completed',
          payload: { sensitive: 'must not be returned' },
          tasks: [{ id: 'step-1', name: 'Review', status: 'completed', secret: 'omit' }]
        }]
      }));
      return;
    }
    if (req.url === '/task-templates/runs/run-1?tenant=tenant-test') {
      res.end(JSON.stringify({
        status: 'ok',
        run: {
          runId: 'run-1',
          tenant: 'tenant-test',
          status: 'completed',
          payload: { sensitive: 'must not be returned' },
          tasks: [{ id: 'step-1', name: 'Review', status: 'completed', secret: 'omit' }]
        },
        boundary: { sensitive: 'must not be returned' }
      }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  baseUrl = `http://127.0.0.1:${api.address().port}`;
});

after(async () => {
  api.close();
  await once(api, 'close');
});

test('Cursor MCP exposes only read-only tenant-scoped inspection tools', async () => {
  const client = new Client({ name: 'sentinel-mcp-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(root, 'tools/sentinel-cursor-mcp.mjs')],
    cwd: root,
    env: {
      ...process.env,
      SENTINELOS_BASE_URL: baseUrl,
      SENTINELOS_API_KEY: 'test-scoped-key',
      SENTINELOS_TENANT_ID: 'tenant-test'
    },
    stderr: 'pipe'
  });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    const toolNames = tools.map((tool) => tool.name).sort();
    assert.deepEqual(toolNames, [
      'get_audit_metrics',
      'get_governance_status',
      'get_plugin_status',
      'get_service_health',
      'get_workflow_run',
      'list_workflow_runs'
    ]);
    assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true));
    assert.ok(tools.every((tool) => tool.annotations?.destructiveHint === false));

    const listed = await client.callTool({ name: 'list_workflow_runs', arguments: {} });
    const listedOutput = listed.content[0].text;
    assert.match(listedOutput, /"runId": "run-1"/);
    assert.doesNotMatch(listedOutput, /sensitive|secret/);

    const detail = await client.callTool({
      name: 'get_workflow_run',
      arguments: { runId: 'run-1' }
    });
    assert.match(detail.content[0].text, /"runId": "run-1"/);
    assert.doesNotMatch(detail.content[0].text, /sensitive|secret/);

    await client.callTool({ name: 'get_governance_status', arguments: {} });
    await client.callTool({ name: 'get_plugin_status', arguments: {} });
    await client.callTool({ name: 'get_audit_metrics', arguments: {} });
    await client.callTool({ name: 'get_service_health', arguments: {} });

    assert.equal(calls.length, 6);
    assert.ok(calls.every((call) => call.method === 'GET'));
    assert.ok(calls.every((call) => call.apiKey === 'test-scoped-key'));
    assert.ok(calls.some((call) => call.url === '/task-templates/runs?tenant=tenant-test'));
    assert.ok(calls.some((call) => call.url === '/v1/metrics?tenant=tenant-test'));
  } finally {
    await client.close();
  }
});
