import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_RUNS = 25;
const RUN_FIELDS = [
  'id',
  'runId',
  'tenant',
  'workflowId',
  'templateId',
  'status',
  'createdAt',
  'updatedAt',
  'startedAt',
  'completedAt'
];

function getConfig(env = process.env) {
  const baseUrl = env.SENTINELOS_BASE_URL;
  const apiKey = env.SENTINELOS_API_KEY;
  const tenantId = env.SENTINELOS_TENANT_ID;

  if (!baseUrl || !apiKey || !tenantId) {
    throw new Error('SENTINELOS_BASE_URL, SENTINELOS_API_KEY, and SENTINELOS_TENANT_ID are required.');
  }

  const parsedUrl = new URL(baseUrl);
  const localHost = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  if ((parsedUrl.protocol !== 'https:' && !(localHost && parsedUrl.protocol === 'http:'))
      || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash
      || parsedUrl.pathname !== '/') {
    throw new Error('SENTINELOS_BASE_URL must be an HTTPS origin (HTTP is allowed only for localhost).');
  }

  if (apiKey === 'REPLACE_WITH_SCOPED_KEY' || tenantId === 'REPLACE_WITH_APPROVED_TENANT') {
    throw new Error('Replace the SentinelOS key and tenant placeholders before starting the MCP server.');
  }

  return { baseUrl: parsedUrl.origin, apiKey, tenantId };
}

function summarizeRun(run) {
  const summary = {};
  for (const field of RUN_FIELDS) {
    if (run && Object.hasOwn(run, field)) {
      summary[field] = run[field];
    }
  }

  const tasks = Array.isArray(run?.tasks) ? run.tasks : [];
  summary.taskCount = tasks.length;
  summary.tasks = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    status: task.status,
    type: task.type
  }));
  return summary;
}

function jsonToolResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

export function createSentinelMcpServer(config, fetchImpl = fetch) {
  const server = new McpServer({
    name: 'sentinelos-read-only',
    version: '1.0.0'
  });

  async function getJson(path) {
    const url = new URL(path, config.baseUrl);
    if (path.startsWith('/v1/metrics') || path.startsWith('/task-templates/runs')
        || path.startsWith('/faceplane/openai/')) {
      url.searchParams.set(path.startsWith('/faceplane/openai/') ? 'tenantId' : 'tenant', config.tenantId);
    }

    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': config.apiKey
      },
      signal: AbortSignal.timeout(10_000)
    });
    const text = await response.text();

    if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) {
      throw new Error(`SentinelOS returned an oversized response for ${url.pathname}.`);
    }

    if (!response.ok) {
      throw new Error(`SentinelOS request ${url.pathname} failed with HTTP ${response.status}.`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`SentinelOS returned invalid JSON for ${url.pathname}.`);
    }
  }

  const readOnly = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  };

  server.registerTool('get_service_health', {
    title: 'Get SentinelOS service health',
    description: 'Read the public health status of the SentinelOS API.',
    inputSchema: {},
    annotations: readOnly
  }, async () => jsonToolResult(await getJson('/health')));

  server.registerTool('get_governance_status', {
    title: 'Get SentinelOS governance status',
    description: 'Read readiness and governance status for the configured tenant.',
    inputSchema: {},
    annotations: readOnly
  }, async () => jsonToolResult(await getJson('/governance/status')));

  server.registerTool('get_plugin_status', {
    title: 'Get SentinelOS plug-in status',
    description: 'Read the OpenAI faceplane plug-in status for the configured tenant.',
    inputSchema: {},
    annotations: readOnly
  }, async () => jsonToolResult(await getJson('/faceplane/openai/status')));

  server.registerTool('get_audit_metrics', {
    title: 'Get SentinelOS audit metrics',
    description: 'Read aggregate audit metrics for the configured tenant; does not return individual audit payloads.',
    inputSchema: {},
    annotations: readOnly
  }, async () => jsonToolResult(await getJson('/v1/metrics')));

  server.registerTool('list_workflow_runs', {
    title: 'List SentinelOS workflow runs',
    description: `List up to ${MAX_RUNS} recent workflow-run summaries for the configured tenant.`,
    inputSchema: {},
    annotations: readOnly
  }, async () => {
    const result = await getJson('/task-templates/runs');
    const runs = Array.isArray(result.runs) ? result.runs : [];
    return jsonToolResult({
      status: result.status,
      tenant: result.tenant,
      count: result.count,
      runs: runs.slice(-MAX_RUNS).map(summarizeRun)
    });
  });

  server.registerTool('get_workflow_run', {
    title: 'Get a SentinelOS workflow run',
    description: 'Read a sanitized workflow-run summary by run ID for the configured tenant.',
    inputSchema: {
      runId: z.string().trim().min(1).max(200)
    },
    annotations: readOnly
  }, async ({ runId }) => {
    const result = await getJson(`/task-templates/runs/${encodeURIComponent(runId)}`);
    return jsonToolResult({
      status: result.status,
      run: summarizeRun(result.run)
    });
  });

  return server;
}

async function main() {
  const config = getConfig();
  const server = createSentinelMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
  main().catch((error) => {
    process.stderr.write(`SentinelOS MCP server failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
