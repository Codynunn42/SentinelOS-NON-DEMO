// SentinelOS NON-DEMO API
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../sentinel/src/commands/dispatch');
const { auditLogger } = require('../sentinel/src/audit/auditLogger');
const { ensureSchema, getDatabaseStatus } = require('../sentinel/src/db/client');

const PORT = process.env.PORT || 3000;
const REQUIRED_API_KEY = process.env.SENTINEL_API_KEY;
const PROOF_PAGE_PATH = path.join(__dirname, 'public', 'proof.html');
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const commandRateLimits = new Map();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendHtmlFile(res, filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (error) {
    sendJson(res, 500, {
      status: 'error',
      error: 'Unable to load proof page'
    });
  }
}

function emitSecurityEvent(eventType, details) {
  const record = {
    source: 'sentinel-api',
    category: 'security',
    eventType,
    timestamp: new Date().toISOString(),
    ...details
  };

  console.log(JSON.stringify(record));
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

function buildWorkflowReceipt(command, entity, outcome, tenantId = 'ownerfi') {
  return {
    receiptId: `rcpt_${crypto.randomUUID()}`,
    auditId: `audit_${crypto.randomUUID()}`,
    comm: 'Sentinel AI by Cody Nunn | Nunn Cloud',
    command,
    tenantId: tenantId,
    status: 'executed',
    verified: true,
    entity,
    outcome,
    timestamp: new Date().toISOString()
  };
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

function authenticateCommand(req, route, res) {
  const apiKey = req.headers['x-api-key'];

  if (!REQUIRED_API_KEY) {
    emitSecurityEvent('command.auth.misconfigured', {
      route,
      method: req.method
    });

    sendJson(res, 500, {
      status: 'error',
      error: 'Server misconfigured: missing API key'
    });

    return false;
  }

  if (!apiKey || apiKey !== REQUIRED_API_KEY) {
    emitSecurityEvent('command.auth.denied', {
      route,
      method: req.method,
      reason: 'invalid_api_key'
    });

    sendJson(res, 401, {
      status: 'blocked',
      error: 'Unauthorized'
    });

    return false;
  }

  return true;
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function enforceRateLimit(req, route, res) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const bucketKey = `${route}:${clientIp}`;
  const current = commandRateLimits.get(bucketKey);

  if (!current || now > current.resetAt) {
    commandRateLimits.set(bucketKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }

  current.count += 1;

  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    emitSecurityEvent('command.rate_limited', {
      route,
      method: req.method,
      clientIp,
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS
    });

    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil((current.resetAt - now) / 1000))
    });
    res.end(JSON.stringify({
      status: 'blocked',
      error: 'Rate limit exceeded',
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000)
    }));

    return false;
  }

  return true;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if ((pathname === '/' || pathname === '/proof') && req.method === 'GET') {
    return sendHtmlFile(res, PROOF_PAGE_PATH);
  }

  if (pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'sentinel-api',
      mode: 'non-demo',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/v1/audit' && req.method === 'GET') {
    if (!authenticateCommand(req, '/v1/audit', res)) {
      return;
    }
    const tenant = requestUrl.searchParams.get('tenant');
    const entries = tenant ? auditLogger.getByTenant(tenant) : auditLogger.getAll();

    return sendJson(res, 200, {
      status: 'ok',
      tenant: tenant || null,
      count: entries.length,
      entries
    });
  }

  if (pathname.startsWith('/v1/audit/') && req.method === 'GET') {
    if (!authenticateCommand(req, '/v1/audit/:applicationId', res)) {
      return;
    }
    const applicationId = decodeURIComponent(pathname.replace('/v1/audit/', '')).trim();
    const tenant = requestUrl.searchParams.get('tenant');
    const entries = auditLogger.getByApplicationId(applicationId, tenant || undefined);

    return sendJson(res, 200, {
      status: 'ok',
      tenant: tenant || null,
      applicationId,
      count: entries.length,
      entries
    });
  }

  if (pathname === '/v1/command' && req.method === 'POST') {
    if (!enforceRateLimit(req, '/v1/command', res)) {
      return;
    }

    if (!authenticateCommand(req, '/v1/command', res)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('command.request.invalid_json', {
          route: '/v1/command',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const result = await dispatchCommand(body, {
        buildReceipt: buildWorkflowReceipt,
        emitSecurityEvent
      });

      if (!result.success) {
        return sendJson(res, result.statusCode || 400, {
          status: 'blocked',
          error: result.error,
          ...(result.details || {}),
          ...(result.data || {})
        });
      }

      return sendJson(res, result.statusCode || 200, {
        status: 'executed',
        ...(result.data || {})
      });
    });
  }

  if (pathname === '/command' && req.method === 'POST') {
    if (!enforceRateLimit(req, '/command', res)) {
      return;
    }

    if (!authenticateCommand(req, '/command', res)) {
      return;
    }

    return readJsonBody(req, (error, body) => {
      if (error) {
        emitSecurityEvent('command.request.invalid_json', {
          route: '/command',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const op = typeof body.op === 'string' ? body.op.trim() : '';
      const target = typeof body.target === 'string' ? body.target.trim() : '';

      if (!op || !target) {
        emitSecurityEvent('command.request.blocked', {
          route: '/command',
          method: req.method,
          reason: 'missing_required_fields'
        });

        return sendJson(res, 400, {
          status: 'blocked',
          error: 'Required fields missing',
          required: ['op', 'target']
        });
      }

      const receipt = buildReceipt(body);

      emitSecurityEvent('command.executed', {
        route: '/command',
        method: req.method,
        receiptId: receipt.receiptId,
        auditId: receipt.auditId,
        op: receipt.op,
        target: receipt.target,
        lane: receipt.lane
      });

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

ensureSchema()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Sentinel API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Database bootstrap failed: ${error.message}`);
    process.exit(1);
  });
