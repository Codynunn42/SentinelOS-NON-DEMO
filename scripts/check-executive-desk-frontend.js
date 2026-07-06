#!/usr/bin/env node

const { spawn } = require('node:child_process');

const host = '127.0.0.1';
const port = process.env.EXECUTIVE_DESK_FRONTEND_CHECK_PORT || '3147';
const baseUrl = `http://${host}:${port}`;
const principal = 'user@example.com';

const requiredHtmlMarkers = [
  'Executive Desk',
  'Daily Briefing',
  'Controlled Access',
  'Risk + Infrastructure',
  'Receipt Ledger',
  '/executive/app.js',
  '/executive/styles.css',
];

const requiredJsMarkers = [
  '/api/executive/risk/status',
  '/api/executive/receipts/stats?window=24h',
  '/api/executive/receipts',
  '/api/executive/delegations',
  '/api/executive/receipts/export',
  'X-Principal-Id',
];

const requiredCssMarkers = [
  '.panel-grid',
  '.summary-band',
  '.status-chip',
  '.service-list',
  '.toast',
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  return { response, text };
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const { response } = await fetchText('/health');
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await wait(250);
  }

  throw new Error(`Executive Desk server did not become ready: ${lastError?.message || 'timeout'}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertMarkers(label, text, markers) {
  for (const marker of markers) {
    assert(text.includes(marker), `${label} missing marker: ${marker}`);
  }
}

async function assertJsonEndpoint(path, validate) {
  const { response, text } = await fetchText(path, {
    headers: { 'X-Principal-Id': principal },
  });
  assert(response.status === 200, `${path} returned ${response.status}: ${text}`);
  const payload = JSON.parse(text);
  validate(payload);
  return payload;
}

async function runChecks() {
  const html = await fetchText('/executive');
  assert(html.response.status === 200, `/executive returned ${html.response.status}`);
  assert(html.response.headers.get('content-type')?.includes('text/html'), '/executive did not return HTML');
  assertMarkers('Executive cockpit HTML', html.text, requiredHtmlMarkers);

  const js = await fetchText('/executive/app.js');
  assert(js.response.status === 200, `/executive/app.js returned ${js.response.status}`);
  assertMarkers('Executive cockpit JavaScript', js.text, requiredJsMarkers);

  const css = await fetchText('/executive/styles.css');
  assert(css.response.status === 200, `/executive/styles.css returned ${css.response.status}`);
  assertMarkers('Executive cockpit CSS', css.text, requiredCssMarkers);

  await assertJsonEndpoint('/api/executive/risk/status', (payload) => {
    assert(typeof payload.decision === 'string', 'risk status missing decision');
    assert(typeof payload.overallScore === 'number', 'risk status missing overallScore');
    assert(Array.isArray(payload.services), 'risk status missing services array');
    assert(payload.factors && typeof payload.factors === 'object', 'risk status missing factors');
  });

  await assertJsonEndpoint('/api/executive/receipts/stats?window=24h', (payload) => {
    assert(typeof payload.executedCount === 'number', 'receipt stats missing executedCount');
    assert(typeof payload.blockedCount === 'number', 'receipt stats missing blockedCount');
    assert(typeof payload.issuedCount === 'number', 'receipt stats missing issuedCount');
    assert(typeof payload.rejectedCount === 'number', 'receipt stats missing rejectedCount');
  });

  await assertJsonEndpoint('/api/executive/receipts?limit=25', (payload) => {
    assert(Array.isArray(payload.data), 'receipt list missing data array');
    assert(typeof payload.total === 'number', 'receipt list missing total');
  });

  await assertJsonEndpoint('/api/executive/delegations', (payload) => {
    assert(Array.isArray(payload.data), 'delegation list missing data array');
    assert(typeof payload.total === 'number', 'delegation list missing total');
  });

  const csv = await fetchText('/api/executive/receipts/export?format=csv', {
    headers: { 'X-Principal-Id': principal },
  });
  assert(csv.response.status === 200, `CSV export returned ${csv.response.status}`);
  assert(csv.response.headers.get('content-type')?.includes('text/csv'), 'CSV export did not return text/csv');

  console.log('Executive Desk frontend smoke passed');
  console.log(`Verified surface: ${baseUrl}/executive`);
}

async function main() {
  const child = spawn('pnpm', ['exec', 'tsx', 'apps/executive-desk/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_HOST: host,
      API_PORT: port,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    await runChecks();
  } finally {
    child.kill('SIGTERM');
  }

  child.on('error', (error) => {
    throw error;
  });

  if (stderr.trim()) {
    console.error(stderr.trim());
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
