const assert = require('assert');
const http = require('http');
const { server } = require('../apps/api/server');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');

const TEST_KEY = 'audit-stream-test-secret';
const TEST_TENANT = 'ownerfi';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_API_KEY_TENANT = TEST_TENANT;
process.env.SENTINEL_API_KEY_ACTOR = 'audit-stream-check@sentinel.test';
process.env.SENTINEL_API_KEY_ROLE = 'approver';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function openAuditStream(base) {
  return new Promise((resolve, reject) => {
    const events = [];
    let buffer = '';

    const request = http.get(
      `${base}/v1/audit/stream?tenant=${encodeURIComponent(TEST_TENANT)}`,
      {
        headers: {
          authorization: `Bearer ${TEST_KEY}`
        }
      },
      (response) => {
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.headers['content-type'], 'text/event-stream');

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          buffer += chunk;

          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            const line = message
              .split('\n')
              .find((candidate) => candidate.startsWith('data: '));

            if (!line) {
              continue;
            }

            const event = JSON.parse(line.slice('data: '.length));
            events.push(event);

            if (event.command === 'audit.stream.check' && event.trustScore === 88) {
              request.destroy();
              resolve({ events, event });
            }
          }
        });
      }
    );

    request.on('error', reject);

    setTimeout(() => {
      request.destroy();
      reject(new Error('Timed out waiting for streamed audit event'));
    }, 3000);
  });
}

function openSignalStream(base) {
  return new Promise((resolve, reject) => {
    const events = [];
    let buffer = '';

    const request = http.get(
      `${base}/v1/signals/stream?tenant=${encodeURIComponent(TEST_TENANT)}`,
      {
        headers: {
          authorization: `Bearer ${TEST_KEY}`
        }
      },
      (response) => {
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.headers['content-type'], 'text/event-stream');

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          buffer += chunk;

          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            const line = message
              .split('\n')
              .find((candidate) => candidate.startsWith('data: '));

            if (!line) {
              continue;
            }

            const event = JSON.parse(line.slice('data: '.length));
            events.push(event);

            if (
              event.type === 'governance.signal' &&
              event.signal &&
              event.signal.type === 'low_trust_score'
            ) {
              request.destroy();
              resolve({ events, event });
            }
          }
        });
      }
    );

    request.on('error', reject);

    setTimeout(() => {
      request.destroy();
      reject(new Error('Timed out waiting for streamed governance signal'));
    }, 3000);
  });
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const body = await response.json();
  return { response, body };
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;
  const headers = {
    authorization: `Bearer ${TEST_KEY}`
  };

  try {
    const streamPromise = openAuditStream(base);

    await new Promise((resolve) => setTimeout(resolve, 100));
    await auditLogger.log({
      tenant: TEST_TENANT,
      command: 'audit.stream.check',
      payload: { source: 'check:audit-stream' },
      result: {
        status: 'SUCCESS',
        trustScore: 88,
        reasons: []
      },
      actor: 'audit-stream-check@sentinel.test'
    });

    const streamed = await streamPromise;
    assert(streamed.events.some((event) => event.type === 'stream.connected'));
    assert.strictEqual(streamed.event.command, 'audit.stream.check');
    assert.strictEqual(streamed.event.tenant, TEST_TENANT);
    assert.strictEqual(streamed.event.trustScore, 88);
    assert.strictEqual(streamed.event.result.status, 'SUCCESS');

    const signalStreamPromise = openSignalStream(base);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const blockedEntry = await auditLogger.log({
      tenant: TEST_TENANT,
      command: 'audit.stream.blocked_check',
      payload: { source: 'check:audit-stream' },
      result: {
        success: false,
        status: 'BLOCKED',
        trustScore: 25,
        reasons: ['policy_violation']
      },
      actor: 'audit-stream-check@sentinel.test'
    });

    const streamedSignal = await signalStreamPromise;
    assert(streamedSignal.events.some((event) => event.type === 'signals.connected'));
    assert.strictEqual(streamedSignal.event.signal.severity, 'high');
    assert(streamedSignal.event.signal.id);
    assert.strictEqual(streamedSignal.event.signal.eventId, blockedEntry.eventId);
    assert.strictEqual(streamedSignal.event.signal.command, 'audit.stream.blocked_check');

    const metrics = await fetchJson(`${base}/v1/metrics?tenant=${TEST_TENANT}`, headers);
    assert.strictEqual(metrics.response.status, 200);
    assert.strictEqual(metrics.body.status, 'ok');
    assert.strictEqual(metrics.body.tenant, TEST_TENANT);
    assert(metrics.body.metrics.totalEvents >= 1);
    assert(metrics.body.metrics.approved >= 1);
    assert(metrics.body.metrics.blocked >= 1);
    assert(metrics.body.metrics.avgTrustScore >= 50);
    assert.strictEqual(metrics.body.metrics.events.blocked >= 1, true);
    assert.strictEqual(metrics.body.metrics.trust.samples >= 2, true);
    assert(metrics.body.metrics.governanceSignals.totalSignals >= 2);
    assert(metrics.body.metrics.governanceSignals.bySeverity);
    assert(metrics.body.metrics.governanceSignals.high >= 1);
    assert(metrics.body.timestamp);

    const signals = await fetchJson(`${base}/v1/alerts?tenant=${TEST_TENANT}`, headers);
    assert.strictEqual(signals.response.status, 200);
    assert.strictEqual(signals.body.status, 'ok');
    assert.strictEqual(signals.body.tenant, TEST_TENANT);
    assert(signals.body.signals.some((signal) => signal.type === 'low_trust_score'));
    assert(signals.body.signals.some((signal) => signal.type === 'blocked_action'));
    assert(signals.body.signals.some((signal) => (
      signal.type === 'low_trust_score' &&
      signal.id &&
      signal.eventId === blockedEntry.eventId
    )));
    assert.strictEqual(signals.body.metrics.high >= 1, true);

    console.log('Audit stream and metrics check passed');
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
