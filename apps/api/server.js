// SentinelOS NON-DEMO API
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, callback) {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    if (!body) {
      return callback(null, {});
    }

    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (error) {
      callback(error);
    }
  });
}

function buildReceipt(command) {
  const receiptId = `rcpt_${crypto.randomUUID()}`;
  const auditId = `audit_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  return {
    receiptId,
    auditId,
    comm: 'Sentinel AI by Cody Nunn | Nunn Cloud',
    lane: command.lane || 'command',
    op: command.op,
    target: command.target,
    status: 'executed',
    verified: true,
    timestamp: now,
    outcome: {
      message: `Operation ${command.op} accepted for target ${command.target}`,
      simulated: true
    }
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'sentinel-api',
      mode: 'non-demo',
      timestamp: new Date().toISOString()
    });
  }

  if (req.url === '/command' && req.method === 'POST') {
    return readJsonBody(req, (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const op = typeof body.op === 'string' ? body.op.trim() : '';
      const target = typeof body.target === 'string' ? body.target.trim() : '';

      if (!op || !target) {
        return sendJson(res, 400, {
          status: 'blocked',
          error: 'Required fields missing',
          required: ['op', 'target']
        });
      }

      const receipt = buildReceipt(body);

      return sendJson(res, 200, {
        status: 'executed',
        receipt
      });
    });
  }

  return sendJson(res, 404, {
    status: 'error',
    error: 'Not Found'
  });
});

server.listen(PORT, () => {
  console.log(`Sentinel API running on port ${PORT}`);
});
