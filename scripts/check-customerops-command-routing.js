const assert = require('assert');
const { server } = require('../apps/api/server');

const TEST_KEY = 'customerops-command-test-secret';

process.env.SENTINEL_API_KEY = TEST_KEY;
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'customerops-passport-secret';
process.env.SENTINEL_API_KEY_TENANT = 'ownerfi';
process.env.SENTINEL_API_KEY_ACTOR = 'support-agent@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'agent';

function listen() {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function postCommand(base, body) {
  const response = await fetch(`${base}/v1/command`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': TEST_KEY
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

async function main() {
  const port = await listen();
  const base = `http://127.0.0.1:${port}`;

  try {
    const ticket = await postCommand(base, {
      commandId: 'customerops_ticket_test_1',
      sessionId: 'customerops_session_1',
      command: 'support.ticket.create',
      payload: {
        customerId: 'cust_123',
        channel: 'web',
        subject: 'Test Ticket',
        description: 'Testing customer ops'
      },
      metadata: {
        actor: 'local_test',
        role: 'agent'
      }
    });

    assert.strictEqual(ticket.response.status, 201);
    assert.strictEqual(ticket.payload.status, 'executed');
    assert.strictEqual(ticket.payload.result.status, 'created');
    assert(ticket.payload.receipt.receiptId);

    const refund = await postCommand(base, {
      commandId: 'customerops_refund_test_1',
      sessionId: 'customerops_session_1',
      command: 'support.refund.request',
      payload: {
        ticketId: 't_100',
        amount: 50,
        reason: 'test'
      },
      metadata: {
        actor: 'local_test',
        role: 'agent'
      }
    });

    assert.strictEqual(refund.response.status, 403);
    assert.strictEqual(refund.payload.status, 'blocked');
    assert.strictEqual(refund.payload.error, 'APPROVAL_REQUIRED');
    assert.strictEqual(refund.payload.approvalRequired, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
