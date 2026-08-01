const http = require('http');
const https = require('https');

const BASE_URL = process.env.PROOF_REHEARSAL_BASE_URL || 'https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io';
const TIMEOUT_MS = Number(process.env.PROOF_REHEARSAL_TIMEOUT_MS || 15000);

function request(pathname, options = {}) {
  const url = new URL(pathname, BASE_URL);
  const client = url.protocol === 'https:' ? https : http;
  const body = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve) => {
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        ...(body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : {})
      },
      timeout: TIMEOUT_MS
    }, (res) => {
      let text = '';

      res.on('data', (chunk) => {
        text += chunk;
      });

      res.on('end', () => {
        let parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (error) {
          parsed = null;
        }

        resolve({
          ok: true,
          statusCode: res.statusCode,
          text,
          json: parsed
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('request_timeout'));
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        statusCode: null,
        error: error.message
      });
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function controlBody(intent, context, role = 'operator') {
  return {
    intent,
    entity: 'deal',
    action: intent.split('.')[1],
    context,
    actor: {
      role,
      userId: role === 'approver'
        ? 'approval.operator@ownerfi.local'
        : 'deal.operator@ownerfi.local'
    },
    tenantId: 'ownerfi',
    metadata: {
      sessionId: 'clean-no-key-proof-rehearsal',
      source: 'proof-ui'
    }
  };
}

async function runIntent(intent, context, role) {
  const response = await request('/api/control/execute', {
    method: 'POST',
    body: controlBody(intent, context, role)
  });

  return {
    statusCode: response.statusCode,
    body: response.json
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const proof = await request('/proof');
  assert(proof.ok && proof.statusCode === 200, `proof_load_failed:${proof.statusCode || proof.error}`);
  assert(proof.text.includes('/api/control/execute'), 'proof_page_missing_control_execute_reference');

  const submit = await runIntent('deal.submit', {
    name: 'Jordan Lee',
    vehicle: '2022 Ford F-150',
    amount: 42000,
    creditScore: 612
  });
  assert(submit.statusCode === 200, `submit_http_failed:${submit.statusCode}`);
  assert(submit.body && submit.body.result && submit.body.result.status === 'submitted', 'submit_not_submitted');

  const applicationId = submit.body.result.applicationId;
  assert(applicationId, 'application_id_missing');

  const blocked = await runIntent('deal.execute', { applicationId });
  assert(blocked.statusCode === 200, `blocked_http_failed:${blocked.statusCode}`);
  assert(blocked.body && blocked.body.result && blocked.body.result.status === 'blocked', 'execute_not_blocked');
  assert(blocked.body.result.reason === 'approval_required', 'execute_block_reason_not_approval_required');

  const approved = await runIntent('deal.approve', { applicationId }, 'approver');
  assert(approved.statusCode === 200, `approve_http_failed:${approved.statusCode}`);
  assert(approved.body && approved.body.result && approved.body.result.status === 'approved', 'approve_not_approved');

  const executed = await runIntent('deal.execute', { applicationId }, 'approver');
  assert(executed.statusCode === 200, `executed_http_failed:${executed.statusCode}`);
  assert(executed.body && executed.body.result && executed.body.result.status === 'executed', 'execute_not_executed_after_approval');
  assert(executed.body.result.dealId, 'deal_id_missing');

  const auditNoKey = await request('/v1/audit?tenant=ownerfi');
  assert(auditNoKey.statusCode === 401, `audit_no_key_expected_401_got:${auditNoKey.statusCode}`);

  console.log(JSON.stringify({
    status: 'clean-no-key-proof-rehearsal-passed',
    baseUrl: BASE_URL,
    proofLoaded: true,
    noApiKeyHeaderSent: true,
    applicationId,
    blockedStatus: blocked.body.result.status,
    blockedReason: blocked.body.result.reason,
    approvedStatus: approved.body.result.status,
    executedStatus: executed.body.result.status,
    dealId: executed.body.result.dealId,
    auditNoKeyStatus: auditNoKey.statusCode
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'clean-no-key-proof-rehearsal-failed',
    baseUrl: BASE_URL,
    error: error.message
  }, null, 2));
  process.exitCode = 1;
});
