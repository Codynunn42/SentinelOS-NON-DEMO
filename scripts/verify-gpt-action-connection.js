const assert = require('assert');

const DEFAULT_TIMEOUT_MS = 10000;

function trimBaseUrl(value) {
  return String(value || '').replace(/\/$/, '');
}

function buildUrl(baseUrl, pathname, params = {}) {
  const url = new URL(pathname, `${trimBaseUrl(baseUrl)}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function fetchJson(url, { apiKey, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
      signal: controller.signal
    });
    const text = await response.text();
    let body = null;

    if (text) {
      body = JSON.parse(text);
    }

    return {
      ok: response.ok,
      status: response.status,
      body
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyGPTActionConnection({ baseUrl, apiKey, tenantId, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!baseUrl) {
    return {
      ok: false,
      status: 'config_required',
      missing: ['SENTINEL_GPT_ACTION_BASE_URL'],
      message: 'Set SENTINEL_GPT_ACTION_BASE_URL to verify a deployed SentinelOS GPT action connection.'
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      status: 'config_required',
      missing: ['SENTINEL_GPT_ACTION_API_KEY'],
      message: 'Set SENTINEL_GPT_ACTION_API_KEY to verify the governed connection endpoint.'
    };
  }

  const checks = {
    openapi: await fetchJson(buildUrl(baseUrl, '/faceplane/openai/gpt-actions/openapi.json'), { timeoutMs }),
    health: await fetchJson(buildUrl(baseUrl, '/health'), { timeoutMs }),
    ready: await fetchJson(buildUrl(baseUrl, '/ready'), { timeoutMs }),
    connection: await fetchJson(buildUrl(baseUrl, '/faceplane/openai/gpt-actions/connection', { tenantId }), {
      apiKey,
      timeoutMs
    })
  };

  const openapiPaths = checks.openapi.body && checks.openapi.body.paths ? checks.openapi.body.paths : {};
  const requiredOperations = {
    getSentinelGPTConnectionStatus: openapiPaths['/faceplane/openai/gpt-actions/connection']?.get?.operationId,
    getSentinelHealth: openapiPaths['/health']?.get?.operationId,
    getSentinelReadiness: openapiPaths['/ready']?.get?.operationId
  };

  const operationChecks = {
    getSentinelGPTConnectionStatus: requiredOperations.getSentinelGPTConnectionStatus === 'getSentinelGPTConnectionStatus',
    getSentinelHealth: requiredOperations.getSentinelHealth === 'getSentinelHealth',
    getSentinelReadiness: requiredOperations.getSentinelReadiness === 'getSentinelReadiness'
  };

  const ok = checks.openapi.ok
    && checks.health.ok
    && checks.ready.ok
    && checks.connection.ok
    && Object.values(operationChecks).every(Boolean)
    && checks.connection.body?.gptAction === 'connected';

  return {
    ok,
    status: ok ? 'verified' : 'failed',
    baseUrl: trimBaseUrl(baseUrl),
    tenantId: tenantId || null,
    checks: {
      openapi: { ok: checks.openapi.ok, status: checks.openapi.status, operations: operationChecks },
      health: { ok: checks.health.ok, status: checks.health.status },
      ready: { ok: checks.ready.ok, status: checks.ready.status, ready: checks.ready.body?.ready ?? null },
      connection: {
        ok: checks.connection.ok,
        status: checks.connection.status,
        gptAction: checks.connection.body?.gptAction || null,
        sentinelReady: checks.connection.body?.sentinel?.ready ?? null,
        faceplane: checks.connection.body?.faceplane?.name || null
      }
    }
  };
}

async function main() {
  const result = await verifyGPTActionConnection({
    baseUrl: process.env.SENTINEL_GPT_ACTION_BASE_URL,
    apiKey: process.env.SENTINEL_GPT_ACTION_API_KEY,
    tenantId: process.env.SENTINEL_GPT_ACTION_TENANT_ID,
    timeoutMs: Number(process.env.SENTINEL_GPT_ACTION_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = result.status === 'config_required' ? 2 : 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildUrl,
  trimBaseUrl,
  verifyGPTActionConnection
};
