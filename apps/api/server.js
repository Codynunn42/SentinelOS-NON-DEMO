// SentinelOS NON-DEMO API
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../sentinel/src/commands/dispatch');
const { auditLogger } = require('../sentinel/src/audit/auditLogger');
const { ensureSchema, getDatabaseStatus } = require('../sentinel/src/db/client');
const { governanceCheck } = require('../sentinel/src/governance/preflight');
const { getSurfaceRegistry } = require('../sentinel/src/commands/registry');
const { analyzeExecutionHistory } = require('../sentinel/src/learning/engine');
const { evaluateAnalysis } = require('../sentinel/src/analysis/analysis');
const { evaluateDecision } = require('../sentinel/src/decision/decision');
const {
  approveRequest,
  createApprovalRequest,
  getApproval,
  getPendingApprovals,
  rejectRequest
} = require('../sentinel/src/approval/approval');
const { normalizeCommandEnvelope } = require('../sentinel/src/types/command');
const { resolveApiKey } = require('../sentinel/src/security/keyRegistry');
const { buildPolicyContext, evaluatePolicy } = require('../sentinel/src/governance/policyEngine');

const PORT = process.env.PORT || 3000;
const PROOF_PAGE_PATH = path.join(__dirname, 'public', 'proof.html');
const MISSION_CONTROL_PATH = path.join(__dirname, 'public', 'mission-control.html');
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const commandRateLimits = new Map();
const commandIdempotencyCache = new Map();

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

function getAuditChainHead() {
  const entries = auditLogger.getAll();
  const latest = entries.length ? entries[entries.length - 1] : null;
  return latest && latest.auditHash ? latest.auditHash : null;
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
    prevHash: getAuditChainHead(),
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
    prevHash: getAuditChainHead(),
    timestamp: now,
    outcome: {
      message: `Operation ${command.op} accepted for target ${command.target}`,
      simulated: true
    }
  };
}

function auditRoutePolicy(route, principal, policy, policyContext) {
  auditLogger.log({
    tenant: policyContext.tenant || (principal ? principal.tenant : null),
    command: 'policy.route',
    payload: {
      route,
      command: policyContext.command,
      requiredScope: policyContext.requiredScope || null
    },
    result: {
      success: policy.allowed,
      decision: policy.decision,
      state: policy.state,
      riskLevel: policy.riskLevel,
      reason: policy.reason || null,
      approvalRequired: policy.approvalRequired,
      receiptRequired: policy.receiptRequired
    },
    actor: policyContext.actor || (principal ? principal.actor : undefined),
    timestamp: new Date().toISOString()
  }).catch((error) => {
    emitSecurityEvent('policy.audit_failed', {
      route,
      error: error instanceof Error ? error.message : 'Unknown policy audit failure'
    });
  });
}

function authenticateCommand(req, route, res) {
  const apiKey = req.headers['x-api-key'];
  const resolved = resolveApiKey(apiKey);

  if (!resolved.ok && resolved.error === 'KEY_REGISTRY_MISSING') {
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

  if (!resolved.ok) {
    emitSecurityEvent('command.auth.denied', {
      route,
      method: req.method,
      reason: resolved.error,
      keyId: resolved.keyId || null
    });

    sendJson(res, 401, {
      status: 'blocked',
      error: 'Unauthorized',
      reason: resolved.error
    });

    return false;
  }

  return resolved.principal;
}

function authorizeRoute(req, res, route, options = {}) {
  const principal = authenticateCommand(req, route, res);

  if (!principal) {
    return null;
  }

  const policyContext = buildPolicyContext({}, principal, {
    tenant: options.tenant || principal.tenant,
    command: options.command || route,
    requiredScope: options.requiredScope,
    signals: options.signals || {}
  });
  const policy = evaluatePolicy(policyContext);

  auditRoutePolicy(route, principal, policy, policyContext);

  if (!policy.allowed) {
    emitSecurityEvent('policy.route.blocked', {
      route,
      method: req.method,
      keyId: principal.keyId,
      tenant: policyContext.tenant,
      actor: policyContext.actor,
      role: policyContext.role,
      requiredScope: policyContext.requiredScope || null,
      reason: policy.reason
    });

    sendJson(res, policy.statusCode || 403, {
      status: 'blocked',
      error: policy.reason,
      policy
    });

    return null;
  }

  return {
    principal,
    policy,
    policyContext
  };
}

function getApprovalTenant(principal, requestUrl) {
  if (principal && principal.tenant === 'platform') {
    return requestUrl.searchParams.get('tenant') || null;
  }

  return principal ? principal.tenant : null;
}

async function auditApprovalViewed(approval, principal, route) {
  await auditLogger.log({
    tenant: approval && approval.context && approval.context.tenant ? approval.context.tenant : null,
    command: 'approval.viewed',
    payload: {
      route,
      approvalId: approval ? approval.id : null
    },
    result: {
      success: true,
      event: 'policy.decision',
      approvalId: approval ? approval.id : null,
      status: approval ? approval.status : null,
      decision: approval && approval.decision ? approval.decision.decision : null,
      reason: approval && approval.decision ? approval.decision.reason : null
    },
    actor: principal ? principal.actor : undefined,
    timestamp: new Date().toISOString()
  });
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function getRateLimitKey(req, route, principal) {
  if (principal) {
    return `${route}:${principal.tenant}:${principal.keyId}`;
  }

  return `${route}:ip:${getClientIp(req)}`;
}

function enforceRateLimit(req, route, res, principal) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const bucketKey = getRateLimitKey(req, route, principal);
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
      tenant: principal ? principal.tenant : null,
      keyId: principal ? principal.keyId : null,
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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function getIdempotencyKey(envelope, principal) {
  const rawKey =
    envelope.commandId ||
    (envelope.metadata && typeof envelope.metadata.idempotencyKey === 'string'
      ? envelope.metadata.idempotencyKey
      : null);

  if (rawKey) {
    return `${envelope.tenant}:${envelope.command}:${principal.keyId}:${rawKey}`;
  }

  return null;
}

function getPayloadHash(envelope) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(envelope.payload || {}))
    .digest('hex');
}

function checkIdempotency(envelope, principal) {
  const idempotencyKey = getIdempotencyKey(envelope, principal);

  if (!idempotencyKey) {
    return {
      duplicate: false,
      idempotencyKey: null,
      payloadHash: getPayloadHash(envelope)
    };
  }

  const payloadHash = getPayloadHash(envelope);
  const existing = commandIdempotencyCache.get(idempotencyKey);

  if (existing && existing.payloadHash === payloadHash) {
    return {
      duplicate: true,
      idempotencyKey,
      payloadHash,
      existing
    };
  }

  if (existing && existing.payloadHash !== payloadHash) {
    return {
      conflict: true,
      idempotencyKey,
      payloadHash,
      existing
    };
  }

  return {
    duplicate: false,
    idempotencyKey,
    payloadHash
  };
}

function rememberIdempotency(check, result) {
  if (!check.idempotencyKey || !result.success) {
    return;
  }

  commandIdempotencyCache.set(check.idempotencyKey, {
    payloadHash: check.payloadHash,
    result,
    timestamp: new Date().toISOString()
  });
}

function resolvePipelineStage(decision) {
  if (decision.approvalRequired) return 'approval';
  if (decision.decision === 'allow') return 'execution';
  if (decision.decision === 'block') return 'decision';
  if (decision.decision === 'restrict') return 'decision';
  return 'analysis';
}

function getSurfaceSummary() {
  const registry = getSurfaceRegistry();

  return Object.keys(registry).map((tenant) => ({
    tenant,
    name: registry[tenant].name,
    commands: Object.keys(registry[tenant].handlers || {})
  }));
}

function sendAuditEvents(req, res, route, requestUrl) {
  const tenant = requestUrl.searchParams.get('tenant');
  const access = authorizeRoute(req, res, route, {
    tenant: tenant || undefined,
    command: 'audit.read',
    requiredScope: 'audit:read'
  });

  if (!access) {
    return;
  }

  const entries = tenant ? auditLogger.getByTenant(tenant) : auditLogger.getAll();

  return sendJson(res, 200, {
    status: 'ok',
    tenant: tenant || null,
    count: entries.length,
    entries
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if ((pathname === '/' || pathname === '/proof') && req.method === 'GET') {
    return sendHtmlFile(res, PROOF_PAGE_PATH);
  }

  if (pathname === '/mission-control' && req.method === 'GET') {
    return sendHtmlFile(res, MISSION_CONTROL_PATH);
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

  if (pathname === '/system/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'sentinel-api',
      mode: 'non-demo',
      database: getDatabaseStatus(),
      surfaces: getSurfaceSummary(),
      routes: {
        health: '/health',
        command: '/v1/command',
        policy: '/policy/evaluate',
        audit: '/audit/events',
        receipts: '/v1/receipts/:receiptId',
        agent: '/agent/run',
        approvals: '/approvals',
        learning: '/learning/suggestions',
        analysis: '/learning/suggestions'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/v1/audit' && req.method === 'GET') {
    return sendAuditEvents(req, res, '/v1/audit', requestUrl);
  }

  if (pathname === '/audit/events' && req.method === 'GET') {
    return sendAuditEvents(req, res, '/audit/events', requestUrl);
  }

  if (pathname.startsWith('/v1/audit/') && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/v1/audit/:applicationId', {
      tenant: tenant || undefined,
      command: 'audit.read',
      requiredScope: 'audit:read'
    });

    if (!access) {
      return;
    }
    const applicationId = decodeURIComponent(pathname.replace('/v1/audit/', '')).trim();
    const entries = auditLogger.getByApplicationId(applicationId, tenant || undefined);

    return sendJson(res, 200, {
      status: 'ok',
      tenant: tenant || null,
      applicationId,
      count: entries.length,
      entries
    });
  }

  if (pathname.startsWith('/v1/receipts/') && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/v1/receipts/:receiptId', {
      tenant: tenant || undefined,
      command: 'receipt.read',
      requiredScope: 'receipt:read'
    });

    if (!access) {
      return;
    }

    const receiptId = decodeURIComponent(pathname.replace('/v1/receipts/', '')).trim();

    if (!receiptId) {
      return sendJson(res, 400, {
        status: 'error',
        error: 'Receipt ID is required'
      });
    }

    return auditLogger.getByReceiptId(receiptId, tenant || undefined)
      .then((match) => {
        if (!match) {
          return sendJson(res, 404, {
            status: 'error',
            error: 'Receipt not found',
            receiptId,
            tenant: tenant || null
          });
        }

        return sendJson(res, 200, {
          status: 'ok',
          tenant: tenant || match.entry.tenant || null,
          receiptId,
          source: match.source,
          receipt: match.receipt,
          entry: match.entry
        });
      })
      .catch((error) => sendJson(res, 500, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Receipt lookup failed'
      }));
  }

  if (pathname === '/v1/command' && req.method === 'POST') {
    const principal = authenticateCommand(req, '/v1/command', res);

    if (!principal) {
      return;
    }

    if (!enforceRateLimit(req, '/v1/command', res, principal)) {
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

      const requestBody = {
        ...body,
        tenant: body.tenant || principal.tenant,
        metadata: {
          ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
          actor: principal.actor,
          role: principal.role,
          keyId: principal.keyId,
          scopes: principal.scopes
        }
      };
      const envelope = normalizeCommandEnvelope(requestBody);
      const idempotency = checkIdempotency(envelope, principal);

      if (idempotency.conflict) {
        return sendJson(res, 409, {
          status: 'blocked',
          error: 'IDEMPOTENCY_CONFLICT',
          idempotencyKey: idempotency.idempotencyKey
        });
      }

      if (idempotency.duplicate) {
        return sendJson(res, idempotency.existing.result.statusCode || 200, {
          status: idempotency.existing.result.success ? 'executed' : 'blocked',
          idempotentReplay: true,
          idempotencyKey: idempotency.idempotencyKey,
          ...(idempotency.existing.result.data || {}),
          ...(idempotency.existing.result.error ? { error: idempotency.existing.result.error } : {})
        });
      }

      const result = await dispatchCommand(requestBody, {
        buildReceipt: buildWorkflowReceipt,
        emitSecurityEvent,
        principal
      });
      rememberIdempotency(idempotency, result);

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
    const access = authorizeRoute(req, res, '/command', {
      command: 'platform.admin',
      requiredScope: 'platform:admin'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/command', res, access.principal)) {
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

  if (pathname === '/policy/evaluate' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/policy/evaluate', {
      command: 'policy.evaluate',
      requiredScope: 'policy:evaluate'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/policy/evaluate', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('policy.request.invalid_json', {
          route: '/policy/evaluate',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const envelope = normalizeCommandEnvelope({
        ...body,
        tenant: body.tenant || access.principal.tenant,
        metadata: {
          ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
          actor: access.principal.actor,
          role: access.principal.role,
          keyId: access.principal.keyId,
          scopes: access.principal.scopes
        }
      });
      const decision = governanceCheck(envelope, {}, access.principal);
      const payload = {
        status: 'ok',
        decision: decision.allowed ? 'allowed' : 'blocked',
        tenant: envelope.tenant || null,
        command: envelope.command || envelope.legacyCommand || null,
        policy: 'governance-preflight',
        ...(decision.allowed
          ? {}
          : {
              error: decision.error,
              details: decision.details
            })
      };

      await auditLogger.log({
        tenant: envelope.tenant || null,
        command: envelope.command || envelope.legacyCommand || 'policy.evaluate',
        payload: envelope.payload,
        result: {
          route: '/policy/evaluate',
          decision: payload.decision,
          error: payload.error || null,
          details: payload.details || null
        },
        actor: access.principal.actor,
        timestamp: new Date().toISOString()
      });

      emitSecurityEvent('policy.evaluated', {
        route: '/policy/evaluate',
        method: req.method,
        tenant: payload.tenant,
        command: payload.command,
        decision: payload.decision
      });

      return sendJson(res, decision.allowed ? 200 : decision.statusCode || 400, payload);
    });
  }

  if (pathname === '/agent/run' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/agent/run', {
      command: 'platform.admin',
      requiredScope: 'platform:admin'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/agent/run', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('agent.request.invalid_json', {
          route: '/agent/run',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const actor = access.principal.actor;

      await auditLogger.log({
        tenant: body && typeof body.tenant === 'string' ? body.tenant : null,
        command: 'agent.run',
        payload: body || {},
        result: {
          success: false,
          decision: 'blocked',
          reason: 'agent_controller_not_enabled'
        },
        actor,
        timestamp: new Date().toISOString()
      });

      emitSecurityEvent('agent.run.blocked', {
        route: '/agent/run',
        method: req.method,
        actor,
        reason: 'agent_controller_not_enabled'
      });

      return sendJson(res, 501, {
        status: 'blocked',
        error: 'Agent execution controller is not enabled',
        required: ['tool registry', 'approval policy', 'execution sandbox', 'audit sink']
      });
    });
  }

  if (pathname === '/learning/suggestions' && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/learning/suggestions', {
      tenant: tenant || undefined,
      command: 'learning.read',
      requiredScope: 'learning:read'
    });

    if (!access) {
      return;
    }

    const shouldCreateApproval = requestUrl.searchParams.get('createApproval') !== 'false';
    const learning = analyzeExecutionHistory(auditLogger.getAll(), { tenant });
    const analysis = evaluateAnalysis(learning, {
      systemGoal: requestUrl.searchParams.get('goal') || undefined
    });
    const decision = evaluateDecision({
      learning,
      analysis,
      actor: 'system'
    });
    return Promise.resolve()
      .then(async () => {
        const approval = decision.approvalRequired && shouldCreateApproval
          ? await createApprovalRequest(decision, {
              tenant,
              route: '/learning/suggestions',
              learningState: learning.summary.learningState,
              analysis,
              suggestions: learning.suggestions
            })
          : null;

        if (approval) {
          auditLogger.log({
            tenant: tenant || null,
            command: 'approval.requested',
            payload: {
              route: '/learning/suggestions',
              learningState: learning.summary.learningState.state
            },
            result: {
              success: true,
              approvalId: approval.id,
              status: approval.status,
              decision
            },
            actor: 'system',
            timestamp: new Date().toISOString()
          }).catch((error) => {
            emitSecurityEvent('approval.audit_failed', {
              route: '/learning/suggestions',
              method: req.method,
              approvalId: approval.id,
              error: error instanceof Error ? error.message : 'Unknown approval audit failure'
            });
          });
        }

        emitSecurityEvent('learning.suggestions.generated', {
          route: '/learning/suggestions',
          method: req.method,
          tenant: learning.tenant,
          windowSize: learning.windowSize,
          suggestionCount: learning.suggestions.length,
          learningState: learning.summary.learningState.state,
          riskLevel: learning.summary.learningState.riskLevel,
          decision: decision.decision,
          executionMode: decision.executionMode,
          approvalId: approval ? approval.id : null
        });

        return sendJson(res, 200, {
          status: 'ok',
          state: {
            learning,
            analysis
          },
          learning,
          analysis,
          decision,
          approval,
          pipeline: {
            currentStage: resolvePipelineStage(decision)
          }
        });
      })
      .catch((error) => sendJson(res, 500, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Approval workflow failed'
      }));
  }

  if (pathname === '/approvals' && req.method === 'GET') {
    const access = authorizeRoute(req, res, '/approvals', {
      command: 'approval.read',
      requiredScope: 'approval:read'
    });

    if (!access) {
      return;
    }

    const tenant = getApprovalTenant(access.principal, requestUrl);

    return getPendingApprovals(tenant)
      .then(async (approvals) => {
        await auditLogger.log({
          tenant,
          command: 'approval.viewed',
          payload: {
            route: '/approvals',
            status: 'pending'
          },
          result: {
            success: true,
            event: 'policy.decision',
            count: approvals.length
          },
          actor: access.principal.actor,
          timestamp: new Date().toISOString()
        });

        return sendJson(res, 200, {
          status: 'ok',
          count: approvals.length,
          approvals
        });
      })
      .catch((error) => sendJson(res, 500, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to list approvals'
      }));
  }

  if (pathname.startsWith('/approvals/') && req.method === 'GET') {
    const approvalPath = pathname.split('/').filter(Boolean);
    const id = approvalPath[1];

    if (!id || approvalPath.length !== 2) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, '/approvals/:id', {
      command: 'approval.read',
      requiredScope: 'approval:read'
    });

    if (!access) {
      return;
    }

    const tenant = getApprovalTenant(access.principal, requestUrl);

    return getApproval(id, tenant)
      .then(async (approval) => {
        if (!approval) {
          return sendJson(res, 404, {
            status: 'error',
            error: 'Approval not found'
          });
        }

        await auditApprovalViewed(approval, access.principal, '/approvals/:id');

        return sendJson(res, 200, {
          status: 'ok',
          approval
        });
      })
      .catch((error) => sendJson(res, 500, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to read approval'
      }));
  }

  if (pathname.startsWith('/approvals/') && req.method === 'POST') {
    const approvalPath = pathname.split('/').filter(Boolean);
    const id = approvalPath[1];
    const action = approvalPath[2];

    if (!id || !['approve', 'reject'].includes(action)) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, `/approvals/:id/${action}`, {
      command: 'approval.review',
      requiredScope: 'approval:review'
    });

    if (!access) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const metadata = {
        actor: access.principal.actor,
        reason: body && typeof body.reason === 'string' ? body.reason : undefined
      };
      const tenant = getApprovalTenant(access.principal, requestUrl);
      const approval =
        action === 'approve'
          ? await approveRequest(id, metadata, tenant)
          : await rejectRequest(id, metadata, tenant);

      if (!approval) {
        return sendJson(res, 404, {
          status: 'error',
          error: 'Approval not found'
        });
      }

      const resolvedCommand = action === 'approve' ? 'approval.approved' : 'approval.rejected';

      await auditLogger.log({
        tenant: approval.context && approval.context.tenant ? approval.context.tenant : null,
        command: resolvedCommand,
        payload: {
          approvalId: approval.id,
          reason: metadata.reason || null
        },
        result: {
          success: true,
          approvalId: approval.id,
          status: approval.status
        },
        actor: metadata.actor,
        timestamp: new Date().toISOString()
      });

      emitSecurityEvent(resolvedCommand, {
        route: `/approvals/:id/${action}`,
        method: req.method,
        approvalId: approval.id,
        actor: metadata.actor
      });

      return sendJson(res, 200, {
        status: 'ok',
        approval
      });
    });
  }

  if (pathname === '/events/security' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/events/security', {
      command: 'security.write',
      requiredScope: 'security:write'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/events/security', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('security.event.invalid_json', {
          route: '/events/security',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const eventType =
        typeof body.type === 'string' && body.type.trim()
          ? body.type.trim()
          : typeof body.event === 'string' && body.event.trim()
            ? body.event.trim()
            : '';
      const allowedTypes = ['identity_risk_event', 'app_consent_event', 'access_anomaly_event'];
      const riskLevel =
        typeof body.riskLevel === 'string' && ['low', 'medium', 'high'].includes(body.riskLevel)
          ? body.riskLevel
          : 'medium';
      const actor = access.principal.actor;

      if (!allowedTypes.includes(eventType)) {
        return sendJson(res, 400, {
          status: 'blocked',
          error: 'Unsupported security event type',
          allowedTypes
        });
      }

      const payload = {
        type: eventType,
        riskLevel,
        user: typeof body.user === 'string' ? body.user : null,
        application: typeof body.application === 'string' ? body.application : null,
        appId: typeof body.appId === 'string' ? body.appId : null,
        publisher: typeof body.publisher === 'string' ? body.publisher : null,
        scopes: Array.isArray(body.scopes) ? body.scopes : [],
        reason: typeof body.reason === 'string' ? body.reason : null,
        source: typeof body.source === 'string' ? body.source : 'manual',
        raw: body.payload || {}
      };

      await auditLogger.log({
        tenant: typeof body.tenant === 'string' ? body.tenant : null,
        command: `security.${eventType}`,
        payload,
        result: {
          success: riskLevel !== 'high',
          source: 'security-events',
          securityEvent: eventType,
          riskLevel,
          reason: payload.reason,
          status: riskLevel === 'high' ? 'review_required' : 'recorded'
        },
        actor,
        timestamp: new Date().toISOString()
      });

      const tenant = typeof body.tenant === 'string' ? body.tenant : null;
      const learning = analyzeExecutionHistory(auditLogger.getAll(), { tenant });
      const analysis = evaluateAnalysis(learning, {
        systemGoal: 'identity and access governance'
      });
      const decision = evaluateDecision({
        learning,
        analysis,
        actor
      });
      const approval = decision.approvalRequired
        ? await createApprovalRequest(decision, {
            tenant,
            route: '/events/security',
            approvalType: eventType === 'app_consent_event' ? 'integration_approval' : 'security_approval',
            securityEvent: payload,
            learningState: learning.summary.learningState,
            analysis
          })
        : null;

      emitSecurityEvent('security.event.recorded', {
        route: '/events/security',
        method: req.method,
        event: eventType,
        riskLevel,
        tenant,
        actor,
        approvalId: approval ? approval.id : null
      });

      return sendJson(res, 202, {
        status: 'accepted',
        event: eventType,
        riskLevel,
        action: riskLevel === 'high' ? 'review_required' : 'recorded',
        decision,
        approval
      });
    });
  }

  if (pathname === '/learning/events' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/learning/events', {
      command: 'learning.write',
      requiredScope: 'learning:write'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/learning/events', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('learning.event.invalid_json', {
          route: '/learning/events',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const eventType = typeof body.event === 'string' && body.event.trim() ? body.event.trim() : '';
      const actor = access.principal.actor;

      if (!eventType) {
        return sendJson(res, 400, {
          status: 'blocked',
          error: 'Required fields missing',
          required: ['event']
        });
      }

      await auditLogger.log({
        tenant: typeof body.tenant === 'string' ? body.tenant : null,
        command: `system.${eventType}`,
        payload: body.payload || {},
        result: {
          success: body.status !== 'failed',
          source: 'learning-events',
          status: body.status || 'recorded'
        },
        actor,
        timestamp: new Date().toISOString()
      });

      emitSecurityEvent('learning.event.recorded', {
        route: '/learning/events',
        method: req.method,
        event: eventType,
        actor
      });

      return sendJson(res, 202, {
        status: 'accepted',
        event: eventType
      });
    });
  }

  return sendJson(res, 404, {
    status: 'error',
    error: 'Not Found'
  });
});

if (require.main === module) {
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
}

module.exports = {
  server
};
