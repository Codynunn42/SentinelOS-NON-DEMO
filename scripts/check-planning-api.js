const assert = require('assert');
const http = require('http');

const dispatchModulePath = require.resolve('../apps/sentinel/src/commands/dispatch');
const openAiRoutesModulePath = require.resolve('../apps/sentinel/src/faceplanes/openai/openaiRoutes');

const runtimeInvocationCounts = {
  dispatch: 0,
  openai: 0
};

const dispatchModule = require(dispatchModulePath);
dispatchModule.dispatchCommand = async () => {
  runtimeInvocationCounts.dispatch += 1;
  throw new Error('dispatch should not be called during planning');
};

const openAiRoutesModule = require(openAiRoutesModulePath);
openAiRoutesModule.executeOpenAIWorkflow = async () => {
  runtimeInvocationCounts.openai += 1;
  throw new Error('openai execution should not be called during planning');
};

const { server } = require('../apps/api/server');

const PORT = 3201;
const API_KEY = 'planning-secret';
const LIMITED_API_KEY = 'planning-limited-secret';
const previousKeys = process.env.SENTINEL_API_KEYS;
const previousKey = process.env.SENTINEL_API_KEY;
const previousHmac = process.env.SENTINEL_HMAC_SECRET;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'planning-passport-secret';
process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_ownerfi_approver_planning',
    secret: API_KEY,
    tenant: 'ownerfi',
    actor: 'planner@ownerfi.test',
    role: 'approver',
    scopes: ['application:submit', 'receipt:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  },
  {
    keyId: 'key_ownerfi_reader_planning',
    secret: LIMITED_API_KEY,
    tenant: 'ownerfi',
    actor: 'reader@ownerfi.test',
    role: 'operator',
    scopes: ['receipt:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
]);

function request(path, payload, apiKey = API_KEY) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-api-key': apiKey
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function listen() {
  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', resolve);
  });
}

function close() {
  return new Promise((resolve) => {
    server.close(resolve);
  });
}

function buildPayload(overrides = {}) {
  return {
    commandId: 'cmd-planning-check-001',
    tenant: 'ownerfi',
    command: 'application.submit',
    payload: {
      name: 'Planning Applicant',
      vehicle: '2024 Honda Accord',
      amount: 27000,
      creditScore: 720,
      governance: {
        evidenceLinks: ['https://evidence.example.local/plans/cmd-planning-check-001']
      }
    },
    metadata: {
      idempotencyKey: 'idem-planning-check-001'
    },
    ...overrides,
    payload: {
      name: 'Planning Applicant',
      vehicle: '2024 Honda Accord',
      amount: 27000,
      creditScore: 720,
      governance: {
        evidenceLinks: ['https://evidence.example.local/plans/cmd-planning-check-001']
      },
      ...(overrides.payload || {})
    },
    metadata: {
      idempotencyKey: 'idem-planning-check-001',
      ...(overrides.metadata || {})
    }
  };
}

(async () => {
  await listen();

  const accepted = await request('/api/v1/planning', buildPayload());
  assert.strictEqual(accepted.statusCode, 202);
  assert.strictEqual(accepted.body.status, 'accepted');
  assert.strictEqual(accepted.body.state, 'AWAITING_APPROVAL');
  assert.strictEqual(accepted.body.nextAction, 'HUMAN_APPROVAL_REQUIRED');
  assert.strictEqual(accepted.body.policyDecision.decision, 'ALLOW_WITH_APPROVAL');
  assert.ok(accepted.body.planningId);
  assert.ok(accepted.body.traceId);
  assert.ok(accepted.body.approvalId);

  const replay = await request('/api/v1/planning', buildPayload());
  assert.strictEqual(replay.statusCode, 202);
  assert.strictEqual(replay.body.idempotentReplay, true);
  assert.strictEqual(replay.body.planningId, accepted.body.planningId);
  assert.strictEqual(replay.body.traceId, accepted.body.traceId);

  const duplicateCommandConflict = await request('/api/v1/planning', buildPayload({
    payload: {
      amount: 28000
    }
  }));
  assert.strictEqual(duplicateCommandConflict.statusCode, 409);
  assert.strictEqual(duplicateCommandConflict.body.error, 'COMMAND_ID_CONFLICT');

  const invalidEnvelope = await request('/api/v1/planning', buildPayload({
    commandId: 'cmd-planning-check-invalid',
    metadata: {
      idempotencyKey: 'idem-planning-check-invalid'
    },
    payload: {
      governance: {
        evidenceLinks: []
      }
    }
  }));
  assert.strictEqual(invalidEnvelope.statusCode, 400);
  assert.strictEqual(invalidEnvelope.body.error, 'INVALID_PLANNING_REQUEST');

  const denied = await request('/api/v1/planning', buildPayload({
    commandId: 'cmd-planning-check-denied',
    metadata: {
      idempotencyKey: 'idem-planning-check-denied'
    }
  }), LIMITED_API_KEY);
  assert.strictEqual(denied.statusCode, 403);
  assert.strictEqual(denied.body.status, 'rejected');
  assert.strictEqual(denied.body.state, 'REJECTED');
  assert.strictEqual(denied.body.nextAction, 'REQUEST_DENIED');
  assert.strictEqual(denied.body.policyDecision.decision, 'DENY');

  assert.strictEqual(runtimeInvocationCounts.dispatch, 0);
  assert.strictEqual(runtimeInvocationCounts.openai, 0);

  await close();

  if (previousKeys === undefined) {
    delete process.env.SENTINEL_API_KEYS;
  } else {
    process.env.SENTINEL_API_KEYS = previousKeys;
  }

  if (previousKey === undefined) {
    delete process.env.SENTINEL_API_KEY;
  } else {
    process.env.SENTINEL_API_KEY = previousKey;
  }

  if (previousHmac === undefined) {
    delete process.env.SENTINEL_HMAC_SECRET;
  } else {
    process.env.SENTINEL_HMAC_SECRET = previousHmac;
  }

  console.log('Planning API check passed');
})().catch(async (error) => {
  await close().catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
