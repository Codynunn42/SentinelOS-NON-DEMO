const assert = require('assert');
const http = require('http');

const PORT = 3201;
const OPERATOR_KEY = 'approval-operator-secret';
const APPROVER_KEY = 'approval-approver-secret';
const previousKeys = process.env.SENTINEL_API_KEYS;
const previousKey = process.env.SENTINEL_API_KEY;
const previousHmacSecret = process.env.SENTINEL_HMAC_SECRET;

process.env.SENTINEL_API_KEY = '';
process.env.SENTINEL_HMAC_SECRET = 'approval-access-passport-secret';
process.env.SENTINEL_API_KEYS = JSON.stringify([
  {
    keyId: 'key_ownerfi_operator_approval_read',
    secret: OPERATOR_KEY,
    tenant: 'ownerfi',
    actor: 'operator@ownerfi.test',
    role: 'operator',
    scopes: ['approval:read', 'audit:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  },
  {
    keyId: 'key_ownerfi_agent_command_unlock',
    secret: 'approval-command-unlock-secret',
    tenant: 'ownerfi',
    actor: 'agent@ownerfi.test',
    role: 'agent',
    scopes: ['application:submit', 'application:evaluate', 'deal:execute', 'audit:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  },
  {
    keyId: 'key_ownerfi_approver_approval_review',
    secret: APPROVER_KEY,
    tenant: 'ownerfi',
    actor: 'approver@ownerfi.test',
    role: 'approver',
    scopes: ['approval:read', 'approval:review', 'audit:read'],
    status: 'active',
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
]);

const { server } = require('../apps/api/server');
const { auditLogger } = require('../apps/sentinel/src/audit/auditLogger');
const { createApprovalRequest } = require('../apps/sentinel/src/approval/approval');

function request(method, path, apiKey, payload = null) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
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
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
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

function restoreEnv() {
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

  if (previousHmacSecret === undefined) {
    delete process.env.SENTINEL_HMAC_SECRET;
  } else {
    process.env.SENTINEL_HMAC_SECRET = previousHmacSecret;
  }
}

(async () => {
  await listen();

  const approval = await createApprovalRequest({
    decision: 'block',
    executionMode: 'blocked',
    approvalRequired: true,
    riskLevel: 'high',
    reason: 'IMPOSSIBLE_TRAVEL'
  }, {
    tenant: 'ownerfi',
    route: '/learning/suggestions'
  });

  const readList = await request('GET', '/approvals', OPERATOR_KEY);
  assert.strictEqual(readList.statusCode, 200);
  assert.strictEqual(readList.body.status, 'ok');
  assert.ok(readList.body.approvals.some((item) => item.id === approval.id));

  const readOne = await request('GET', `/approvals/${approval.id}`, OPERATOR_KEY);
  assert.strictEqual(readOne.statusCode, 200);
  assert.strictEqual(readOne.body.approval.id, approval.id);
  assert.ok(readOne.body.approval.events.some((event) => event.type === 'viewed'));

  const blockedReview = await request('POST', `/approvals/${approval.id}/approve`, OPERATOR_KEY, {
    reason: 'operator should not resolve approvals'
  });
  assert.strictEqual(blockedReview.statusCode, 403);
  assert.strictEqual(blockedReview.body.error, 'SCOPE_REQUIRED');

  const approverApproval = await createApprovalRequest({
    decision: 'block',
    executionMode: 'blocked',
    approvalRequired: true,
    riskLevel: 'high',
    reason: 'IMPOSSIBLE_TRAVEL'
  }, {
    tenant: 'ownerfi',
    route: '/learning/suggestions'
  });

  const approved = await request('POST', `/approvals/${approverApproval.id}/approve`, APPROVER_KEY, {
    reason: 'local access smoke only'
  });
  assert.strictEqual(approved.statusCode, 200);
  assert.strictEqual(approved.body.approval.status, 'approved');
  assert.ok(approved.body.approval.events.some((event) => event.type === 'approved'));

  const submitted = await request('POST', '/v1/command', 'approval-command-unlock-secret', {
    commandId: 'approval_unlock_submit',
    command: 'application.submit',
    payload: {
      name: 'Approval Unlock Test',
      vehicle: '2026 Fleet Unit',
      amount: 15000,
      creditScore: 720
    }
  });
  assert.strictEqual(submitted.statusCode, 200);
  const applicationId = submitted.body.applicationId;

  const evaluated = await request('POST', '/v1/command', 'approval-command-unlock-secret', {
    commandId: 'approval_unlock_evaluate',
    command: 'application.evaluate',
    payload: { applicationId }
  });
  assert.strictEqual(evaluated.statusCode, 200);
  assert.strictEqual(evaluated.body.applicationStatus, 'approved');

  const blockedExecute = await request('POST', '/v1/command', 'approval-command-unlock-secret', {
    commandId: 'approval_unlock_execute_blocked',
    command: 'deal.execute',
    payload: { applicationId }
  });
  assert.strictEqual(blockedExecute.statusCode, 423);
  assert.strictEqual(blockedExecute.body.error, 'APPROVAL_REQUIRED');
  assert.strictEqual(blockedExecute.body.approvalRequired, true);
  assert.strictEqual(blockedExecute.body.unlockOnApproval, true);
  assert.ok(blockedExecute.body.approvalId);

  const commandApproval = await request('POST', `/approvals/${blockedExecute.body.approvalId}/approve`, APPROVER_KEY, {
    reason: 'approve command unlock smoke'
  });
  assert.strictEqual(commandApproval.statusCode, 200);
  assert.strictEqual(commandApproval.body.approval.status, 'approved');

  const executed = await request('POST', '/v1/command', 'approval-command-unlock-secret', {
    commandId: 'approval_unlock_execute_allowed',
    command: 'deal.execute',
    payload: {
      applicationId,
      approvalId: blockedExecute.body.approvalId
    }
  });
  assert.strictEqual(executed.statusCode, 200);
  assert.strictEqual(executed.body.status, 'executed');
  assert.strictEqual(executed.body.dealStatus, 'active');

  const viewed = auditLogger.getAll().filter((entry) => entry.command === 'approval.viewed');
  assert.ok(viewed.length >= 2);

  await close();
  restoreEnv();

  console.log('Approval access check passed');
})().catch(async (error) => {
  await close().catch(() => {});
  restoreEnv();
  console.error(error);
  process.exitCode = 1;
});
