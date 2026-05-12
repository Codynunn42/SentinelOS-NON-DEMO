// SentinelOS NON-DEMO API
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { dispatchCommand } = require('../sentinel/src/commands/dispatch');
const { auditLogger, subscribeAuditEvents } = require('../sentinel/src/audit/auditLogger');
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
const { executeIntent } = require('../sentinel/src/controlPlane');
const {
  DEFAULT_SURFACE,
  signExecutionPassport
} = require('../sentinel/src/governance/executionPassport');
const { resolveApiKey } = require('../sentinel/src/security/keyRegistry');
const { buildPolicyContext, evaluatePolicy } = require('../sentinel/src/governance/policyEngine');
const {
  buildGovernanceSignalMetrics,
  getGovernanceSignals,
  subscribeGovernanceSignals
} = require('../sentinel/src/governance/governanceSignals');
const { getAuthorityStatus } = require('../sentinel/src/governance/authorityState');
const {
  getOperatorCase,
  listOperatorCases,
  submitOperatorDecision
} = require('../sentinel/src/governance/vendorOnboarding/operatorEscalation');
const {
  buildGovernanceStatus
} = require('../sentinel/src/governance/core/governanceStatus');
const {
  executeOpenAIWorkflow,
  getOpenAIConfigForTenant,
  getOpenAIFaceplaneStatus
} = require('../sentinel/src/faceplanes/openai/openaiRoutes');
const {
  buildBoundaryOutput,
  executeTaskStep,
  getTaskTemplateRun,
  listTaskTemplateRuns,
  orchestrateTaskTemplates,
  updateTaskApprovalStatus
} = require('../sentinel/src/orchestration/taskTemplates');
const {
  handleTelemetryState,
  runTelemetryHarmonizer
} = require('../sentinel/src/telemetry/telemetryController');
const {
  getSystemReleaseAnchor,
  listAnchors,
  updateExternalAnchor
} = require('../sentinel/src/verification/stateAnchors');
const { analyzeDrift } = require('../sentinel/src/drift/driftAnalyzer');
const { enforceSovereignBoot } = require('../sentinel/src/sovereign/sovereignBoot');
const { resolveTier, classifyOperation } = require('../sentinel/src/tiers/tierResolver');
const { TIERS } = require('../sentinel/src/tiers/tierRegistry');

const PORT = process.env.PORT || 3000;
const LANDING_PAGE_PATH = path.join(__dirname, 'public', 'index.html');
const PROOF_PAGE_PATH = path.join(__dirname, 'public', 'proof.html');
const MISSION_CONTROL_PATH = path.join(__dirname, 'public', 'mission-control.html');
const OPERATOR_ESCALATIONS_PATH = path.join(__dirname, 'public', 'operator-escalations.html');
const STRIPE_CHECKOUT_PAGE_PATH = path.join(__dirname, 'public', 'stripe-checkout.html');
const STRIPE_COMPLETE_PAGE_PATH = path.join(__dirname, 'public', 'stripe-complete.html');
const STRIPE_CHECKOUT_JS_PATH = path.join(__dirname, 'public', 'stripe-checkout.js');
const STRIPE_COMPLETE_JS_PATH = path.join(__dirname, 'public', 'stripe-complete.js');
const STRIPE_CHECKOUT_CSS_PATH = path.join(__dirname, 'public', 'stripe-checkout.css');
const STRIPE_COMPLETE_CSS_PATH = path.join(__dirname, 'public', 'stripe-complete.css');
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const commandRateLimits = new Map();
const commandIdempotencyCache = new Map();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function requireAuthoritySecret() {
  if (!process.env.SENTINEL_HMAC_SECRET) {
    console.error('FATAL: SENTINEL_HMAC_SECRET missing');
    process.exit(1);
  }
}

function enforceProductionBoundary() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const authMode = process.env.SENTINEL_AUTH_MODE || '';
  const smokeAuth = process.env.SENTINEL_SMOKE_AUTH || '';
  const isProduction = nodeEnv === 'production';

  if (isProduction && (authMode === 'smoke' || smokeAuth === '1' || smokeAuth === 'true')) {
    emitSecurityEvent('startup.boundary.violation', {
      reason: 'smoke_auth_in_production',
      NODE_ENV: nodeEnv,
      SENTINEL_AUTH_MODE: authMode,
      SENTINEL_SMOKE_AUTH: smokeAuth
    });
    console.error('FATAL: Smoke auth mode is not permitted in production');
    process.exit(1);
  }
}

function sendSse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
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

function sendStaticFile(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    sendJson(res, 500, {
      status: 'error',
      error: 'Unable to load static asset'
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

function getRequestOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

function getAuditChainHead() {
  const entries = auditLogger.getAll();
  const latest = entries.length ? entries[entries.length - 1] : null;
  return latest && latest.auditHash ? latest.auditHash : null;
}

function getControlDecisionScore(result, fallback = 80) {
  if (result && typeof result.decisionScore === 'number') return result.decisionScore;
  if (result && typeof result.trustScore === 'number') return result.trustScore;
  if (result && result.data && typeof result.data.trustScore === 'number') return result.data.trustScore;
  return fallback;
}

function normalizeDemoControlResult(result = {}) {
  const rawStatus = result.status || 'blocked';
  const applicationStatus = result.applicationStatus || (result.result && result.result.status);
  const isBlocked = rawStatus === 'blocked';
  const status = isBlocked
    ? 'blocked'
    : applicationStatus === 'submitted'
      ? 'submitted'
      : applicationStatus === 'approved'
        ? 'approved'
        : 'executed';
  const reason = isBlocked
    ? 'approval_required'
    : status === 'submitted'
      ? 'submitted'
      : status === 'approved'
        ? 'approval_recorded'
        : 'executed';
  const alerts = isBlocked
    ? ['approval_required']
    : status === 'submitted'
      ? ['review_needed']
      : status === 'approved'
        ? ['approval_recorded']
        : [];

  return {
    status,
    reason,
    decisionScore: getControlDecisionScore(result, isBlocked ? 40 : 92),
    alerts,
    applicationId: result.applicationId || (result.result && result.result.applicationId) || null,
    dealId: result.dealId || (result.result && result.result.dealId) || null,
    raw: result
  };
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
  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const bearerPrefix = 'Bearer ';
  const bearerToken = authorization.startsWith(bearerPrefix)
    ? authorization.slice(bearerPrefix.length).trim()
    : null;
  const apiKey = req.headers['x-api-key'] || bearerToken;
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

function hashClientIp(req) {
  return crypto
    .createHash('sha256')
    .update(getClientIp(req))
    .digest('hex')
    .slice(0, 16);
}

function getSurfaceTenant(requestUrl, defaultTenant = 'ownerfi') {
  const explicitTenant = requestUrl.searchParams.get('tenant');
  const pilot = requestUrl.searchParams.get('pilot');
  const source = requestUrl.searchParams.get('utm_source');
  const campaign = requestUrl.searchParams.get('utm_campaign');
  const candidates = [explicitTenant, pilot, source, campaign]
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase());

  if (candidates.some((value) => value === 'ownerfi' || value === 'owner-fi')) {
    return 'ownerfi';
  }

  if (explicitTenant && /^[a-z0-9_-]{1,64}$/i.test(explicitTenant)) {
    return explicitTenant.toLowerCase();
  }

  return defaultTenant;
}

function auditSurfaceView(req, requestUrl, route, surface, defaultTenant = 'ownerfi') {
  const tenant = getSurfaceTenant(requestUrl, defaultTenant);
  const userAgent = typeof req.headers['user-agent'] === 'string'
    ? req.headers['user-agent'].slice(0, 240)
    : null;
  const referrer = typeof req.headers.referer === 'string'
    ? req.headers.referer.slice(0, 240)
    : null;
  const host = typeof req.headers.host === 'string' ? req.headers.host : null;
  const payload = {
    route,
    surface,
    host,
    referrer,
    userAgent,
    ipHash: hashClientIp(req),
    trackedQuery: {
      tenant: requestUrl.searchParams.get('tenant') || null,
      pilot: requestUrl.searchParams.get('pilot') || null,
      utm_source: requestUrl.searchParams.get('utm_source') || null,
      utm_campaign: requestUrl.searchParams.get('utm_campaign') || null
    }
  };

  emitSecurityEvent('surface.viewed', {
    route,
    method: req.method,
    tenant,
    surface,
    host,
    referrer,
    userAgent,
    ipHash: payload.ipHash
  });

  auditLogger.log({
    tenant,
    command: 'surface.viewed',
    payload,
    result: {
      success: true,
      event: 'public_surface_view'
    },
    actor: 'public.visitor',
    timestamp: new Date().toISOString()
  }).catch((error) => {
    emitSecurityEvent('surface.audit_failed', {
      route,
      surface,
      tenant,
      error: error instanceof Error ? error.message : 'Unknown surface audit failure'
    });
  });
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

function getActiveFaceplaneSummary() {
  return [
    getOpenAIFaceplaneStatus()
  ];
}

function isEnabled(value) {
  return value === '1' || value === 'true' || value === 'TRUE' || value === true;
}

function getPublicBaseUrl(req) {
  if (process.env.SENTINEL_PUBLIC_BASE_URL) {
    return process.env.SENTINEL_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

function getStripeCheckoutConfig() {
  const enabled = isEnabled(process.env.SENTINEL_STRIPE_CHECKOUT_ENABLED);
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const priceId = process.env.STRIPE_PRICE_ID || process.env.SENTINEL_STRIPE_PRICE_ID || '';
  const apiVersion = process.env.STRIPE_API_VERSION || '2026-04-22.dahlia';
  const missing = [];

  if (!publishableKey) missing.push('STRIPE_PUBLISHABLE_KEY');
  if (!secretKey) missing.push('STRIPE_SECRET_KEY');
  if (!priceId) missing.push('STRIPE_PRICE_ID');

  return {
    enabled,
    publishableKey,
    secretKey,
    priceId,
    apiVersion,
    missing
  };
}

function getStripeReadiness() {
  const config = getStripeCheckoutConfig();
  return {
    status: config.enabled && config.missing.length === 0 ? 'ready' : 'not_ready',
    enabled: config.enabled,
    missing: config.missing,
    routes: {
      checkout: '/billing/checkout',
      complete: '/billing/complete',
      config: '/billing/checkout/config',
      createSession: '/billing/checkout/session',
      sessionStatus: '/billing/session-status'
    },
    safeguards: [
      'Secret key stays server-side',
      'Price is fixed by environment configuration',
      'Checkout session creation is feature-flagged',
      'Session creation and status checks are audit logged',
      'No raw card data touches SentinelOS'
    ]
  };
}

function getStripeRequiredConfig(config = getStripeCheckoutConfig()) {
  const required = [];

  if (!config.enabled) {
    required.push('SENTINEL_STRIPE_CHECKOUT_ENABLED');
  }

  for (const key of config.missing) {
    if (!required.includes(key)) {
      required.push(key);
    }
  }

  return required;
}

function encodeStripeForm(params) {
  const body = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    body.append(key, String(value));
  });

  return body;
}

async function stripeRequest(method, endpoint, params = {}, config = getStripeCheckoutConfig()) {
  const isGet = method === 'GET';
  const form = encodeStripeForm(params);
  const url = new URL(`https://api.stripe.com${endpoint}`);

  if (isGet) {
    for (const [key, value] of form.entries()) {
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      'Stripe-Version': config.apiVersion,
      ...(isGet ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' })
    },
    body: isGet ? undefined : form
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result && result.error && result.error.message
      ? result.error.message
      : `Stripe request failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.stripeError = result.error || result;
    throw error;
  }

  return result;
}

async function createStripeCheckoutSession(req, body = {}) {
  const config = getStripeCheckoutConfig();
  const requiredConfig = getStripeRequiredConfig(config);

  if (!config.enabled) {
    return {
      statusCode: 503,
      payload: {
        status: 'BLOCKED',
        reason: 'Checkout not enabled',
        error: 'Checkout not enabled',
        requiredConfig,
        requiredApproval: 'Stripe checkout requires configuration approval before payment execution.'
      }
    };
  }

  if (config.missing.length) {
    return {
      statusCode: 503,
      payload: {
        status: 'BLOCKED',
        reason: 'Checkout configuration incomplete',
        error: 'Checkout configuration incomplete',
        requiredConfig,
        missing: config.missing,
        requiredApproval: 'Stripe checkout requires configuration approval before payment execution.'
      }
    };
  }

  const baseUrl = getPublicBaseUrl(req);
  const email = body && typeof body.email === 'string' && body.email.includes('@')
    ? body.email.trim()
    : '';
  const checkoutSession = await stripeRequest('POST', '/v1/checkout/sessions', {
    ui_mode: 'elements',
    mode: 'payment',
    'line_items[0][price]': config.priceId,
    'line_items[0][quantity]': 1,
    return_url: `${baseUrl}/billing/complete?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: email,
    'metadata[source]': 'sentinelos-billing-checkout',
    'metadata[tenant]': body && typeof body.tenant === 'string' ? body.tenant : 'public',
    'metadata[approval_boundary]': 'fixed-price-checkout-session'
  }, config);

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      clientSecret: checkoutSession.client_secret,
      checkoutSessionId: checkoutSession.id,
      mode: checkoutSession.mode,
      livemode: checkoutSession.livemode
    }
  };
}

async function retrieveStripeCheckoutSession(sessionId) {
  const config = getStripeCheckoutConfig();

  if (!config.enabled || config.missing.includes('STRIPE_SECRET_KEY')) {
    return {
      statusCode: 503,
      payload: {
        status: 'blocked',
        error: 'Stripe session status is not configured',
        missing: config.missing
      }
    };
  }

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return {
      statusCode: 400,
      payload: {
        status: 'error',
        error: 'Valid checkout session_id required'
      }
    };
  }

  const session = await stripeRequest('GET', `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    'expand[0]': 'payment_intent',
    'expand[1]': 'subscription'
  }, config);

  return {
    statusCode: 200,
    payload: {
      status: session.status,
      payment_status: session.payment_status,
      payment_intent_id: session.payment_intent && session.payment_intent.id ? session.payment_intent.id : null,
      payment_intent_status: session.payment_intent && session.payment_intent.status ? session.payment_intent.status : null,
      subscription_id: session.subscription && session.subscription.id ? session.subscription.id : null,
      subscription_status: session.subscription && session.subscription.status ? session.subscription.status : null,
      livemode: session.livemode
    }
  };
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

async function buildAuditMetrics(entries = [], options = {}) {
  const trustScores = [];
  let blocked = 0;
  let approved = 0;
  let approvalRequired = 0;
  let errors = 0;

  for (const entry of entries) {
    const result = entry && entry.result && typeof entry.result === 'object' ? entry.result : {};
    const data = result.data && typeof result.data === 'object' ? result.data : {};
    const score = typeof result.trustScore === 'number'
      ? result.trustScore
      : typeof data.trustScore === 'number'
        ? data.trustScore
        : null;

    if (typeof score === 'number') {
      trustScores.push(score);
    }

    if (
      result.success === false ||
      result.status === 'BLOCKED' ||
      result.status === 'blocked' ||
      result.decision === 'block' ||
      result.error
    ) {
      blocked += 1;
    }

    if (
      result.success === true ||
      result.status === 'SUCCESS' ||
      result.status === 'approved' ||
      entry.command === 'approval.approved'
    ) {
      approved += 1;
    }

    if (result.approvalRequired === true || (result.policy && result.policy.approvalRequired === true)) {
      approvalRequired += 1;
    }

    if (entry.command === 'system.audit.persist_failed') {
      errors += 1;
    }
  }

  const avgTrustScore = trustScores.length
    ? Math.round(trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length)
    : null;

  return {
    totalEvents: entries.length,
    blocked,
    approved,
    approvalRequired,
    errors,
    avgTrustScore,
    trustScoreSamples: trustScores.length,
    events: {
      total: entries.length,
      approved,
      blocked,
      approvalRequired,
      errors
    },
    trust: {
      avg: avgTrustScore,
      samples: trustScores.length
    },
    governanceSignals: await buildGovernanceSignalMetrics({ tenant: options.tenant || null })
  };
}

function getRequestApiKey(req, requestUrl) {
  const authorization = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const bearerPrefix = 'Bearer ';
  const bearerToken = authorization.startsWith(bearerPrefix)
    ? authorization.slice(bearerPrefix.length).trim()
    : null;

  return (
    req.headers['x-api-key'] ||
    bearerToken ||
    requestUrl.searchParams.get('apiKey') ||
    requestUrl.searchParams.get('key')
  );
}

function authorizeStream(req, res, requestUrl, command) {
  const tenant = requestUrl.searchParams.get('tenant');
  const resolved = resolveApiKey(getRequestApiKey(req, requestUrl));

  if (!resolved.ok) {
    sendJson(res, 401, {
      status: 'blocked',
      error: 'Unauthorized',
      reason: resolved.error
    });
    return null;
  }

  const principal = resolved.principal;
  const policyContext = buildPolicyContext({}, principal, {
    tenant: tenant || principal.tenant,
    command,
    requiredScope: 'audit:read'
  });
  const policy = evaluatePolicy(policyContext);

  if (!policy.allowed) {
    sendJson(res, policy.statusCode || 403, {
      status: 'blocked',
      error: policy.reason,
      policy
    });
    return null;
  }

  return {
    tenant,
    principal
  };
}

function sendAuditStream(req, res, requestUrl) {
  const access = authorizeStream(req, res, requestUrl, 'audit.read');
  if (!access) {
    return;
  }
  const { tenant, principal } = access;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  sendSse(res, {
    type: 'stream.connected',
    tenant: tenant || principal.tenant,
    timestamp: new Date().toISOString()
  });

  const unsubscribe = subscribeAuditEvents((entry) => {
    if (tenant && entry.tenant !== tenant) {
      return;
    }

    sendSse(res, {
      type: 'audit.event',
      eventId: entry.eventId || null,
      command: entry.command,
      tenant: entry.tenant || null,
      actor: entry.actor || null,
      result: entry.result || {},
      trustScore:
        entry.result && typeof entry.result.trustScore === 'number'
          ? entry.result.trustScore
          : entry.result && entry.result.data && typeof entry.result.data.trustScore === 'number'
            ? entry.result.data.trustScore
            : null,
      reasons:
        entry.result && Array.isArray(entry.result.reasons)
          ? entry.result.reasons
          : entry.result && entry.result.data && Array.isArray(entry.result.data.reasons)
            ? entry.result.data.reasons
            : [],
      governanceSignals:
        entry.result && Array.isArray(entry.result.governanceSignals)
          ? entry.result.governanceSignals
          : [],
      timestamp: entry.timestamp || new Date().toISOString(),
      auditHash: entry.auditHash || null
    });
  });

  const heartbeat = setInterval(() => {
    sendSse(res, {
      type: 'stream.heartbeat',
      tenant: tenant || principal.tenant,
      timestamp: new Date().toISOString()
    });
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}

function sendSignalStream(req, res, requestUrl) {
  const access = authorizeStream(req, res, requestUrl, 'signals.read');
  if (!access) {
    return;
  }
  const { tenant, principal } = access;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  sendSse(res, {
    type: 'signals.connected',
    tenant: tenant || principal.tenant,
    timestamp: new Date().toISOString()
  });

  const unsubscribe = subscribeGovernanceSignals((signal) => {
    if (tenant && signal.tenant !== tenant) {
      return;
    }

    sendSse(res, {
      type: 'governance.signal',
      signal,
      timestamp: signal.timestamp || new Date().toISOString()
    });
  });

  const heartbeat = setInterval(() => {
    sendSse(res, {
      type: 'signals.heartbeat',
      tenant: tenant || principal.tenant,
      timestamp: new Date().toISOString()
    });
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}

function buildWorkflowInitPayload(body, principal) {
  const rawTasks = Array.isArray(body && body.tasks) ? body.tasks : [];
  const tasks = rawTasks.map((task, index) => {
    const type =
      typeof task.type === 'string' && task.type.trim()
        ? task.type.trim()
        : typeof task.command === 'string' && task.command.trim()
          ? task.command.trim()
          : typeof task.title === 'string' && task.title.trim()
            ? task.title.trim()
            : `workflow.step.${index + 1}`;
    const isDealExecution = type === 'deal.execute' || type.includes('deal.execute');
    const isBillingCheckout = type === 'billing.checkout.create' || type.includes('billing.checkout');
    const isApproval = isDealExecution || isBillingCheckout || task.approvalRequired === true;

    return {
      id:
        typeof task.id === 'string' && task.id.trim()
          ? task.id.trim()
          : `step_${type.replace(/[^a-zA-Z0-9]+/g, '_')}_${index + 1}`,
      title: task.title || type,
      category: isBillingCheckout ? 'billing_checkout' : isApproval ? 'conditional' : 'mapping',
      source: task.source || null,
      xeRequired: task.xeRequired !== false,
      approvalRequired: isApproval,
      metadata: {
        ...task,
        type
      },
      nextStep: isApproval
        ? isBillingCheckout
          ? 'Approve Stripe pricing/configuration before creating a checkout session.'
          : 'Route for human approval before execution.'
        : 'Ready for governed XE assistance.'
    };
  });

  return {
    tenant: body && typeof body.tenant === 'string' ? body.tenant : principal.tenant,
    runId:
      body && typeof body.runId === 'string' && body.runId.trim()
        ? body.runId.trim()
        : `pilot_run_${crypto.randomUUID()}`,
    createApprovals: body && body.createApprovals === false ? false : true,
    telemetryState: body && typeof body.telemetryState === 'string' ? body.telemetryState : 'LIMITED',
    tasks
  };
}

function sendWorkflowInitResponse(res, run, statusCode = 200) {
  return sendJson(res, statusCode, {
    status: run.summary.approvalsCreated ? 'pending_approval' : 'orchestrated',
    runId: run.runId,
    executionSession: run.runId,
    timeline: run.boundary.timeline,
    requiresApproval: run.boundary.requiresApproval,
    xeActions: run.boundary.xeActions,
    blockedActions: run.boundary.blockedActions,
    allowedActions: run.boundary.allowedActions,
    approvals: run.approvalRecords,
    telemetry: run.telemetryReview,
    run
  });
}

async function resolveWorkflowStepExecution(req, res, route, body, access) {
  const runId = typeof body.runId === 'string' ? body.runId.trim() : '';
  const step = typeof body.step === 'string' ? body.step.trim() : '';

  if (!runId || !step) {
    return sendJson(res, 400, {
      status: 'error',
      error: 'Required fields missing',
      required: ['runId', 'step']
    });
  }

  const run = getTaskTemplateRun(runId);

  if (!run || (access.principal.tenant !== 'platform' && run.tenant !== access.principal.tenant)) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Execution session not found'
    });
  }

  const task = run.tasks.find((item) => item.id === step || item.title === step || item.metadata && item.metadata.type === step);

  if (!task) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Workflow step not found'
    });
  }

  const approvalStatusByTaskId = {};

  for (const record of run.approvalRecords || []) {
    if (record.taskId !== task.id) {
      continue;
    }

    const approval = await getApproval(
      record.approvalId,
      access.principal.tenant === 'platform' ? run.tenant : access.principal.tenant
    );
    approvalStatusByTaskId[record.taskId] = approval ? approval.status : record.status;
  }

  const result = executeTaskStep(task, { approvalStatusByTaskId });

  await auditLogger.log({
    tenant: run.tenant,
    command: 'task.template.execute',
    payload: {
      route,
      runId: run.runId,
      taskId: task.id,
      step,
      title: task.title,
      category: task.category
    },
    result,
    actor: access.principal.actor,
    timestamp: new Date().toISOString()
  });

  return sendJson(res, result.success ? 200 : 423, result);
}

async function resolvePilotApproval(req, res, route, body, access) {
  const runId = typeof body.runId === 'string' ? body.runId.trim() : '';
  const step = typeof body.step === 'string' ? body.step.trim() : '';
  const approved = body.approved === true;

  if (!runId || !step || typeof body.approved !== 'boolean') {
    return sendJson(res, 400, {
      status: 'error',
      error: 'Required fields missing',
      required: ['runId', 'step', 'approved']
    });
  }

  const run = getTaskTemplateRun(runId);

  if (!run || (access.principal.tenant !== 'platform' && run.tenant !== access.principal.tenant)) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Execution session not found'
    });
  }

  const task = run.tasks.find((item) => item.id === step || item.title === step || item.metadata && item.metadata.type === step);

  if (!task) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Workflow step not found'
    });
  }

  const record = (run.approvalRecords || []).find((item) => item.taskId === task.id);

  if (!record) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Approval not found for workflow step'
    });
  }

  const metadata = {
    actor: access.principal.actor,
    reason: typeof body.reason === 'string' ? body.reason : 'Pilot approval resolution'
  };
  const tenant = access.principal.tenant === 'platform' ? run.tenant : access.principal.tenant;
  const approval = approved
    ? await approveRequest(record.approvalId, metadata, tenant)
    : await rejectRequest(record.approvalId, metadata, tenant);

  if (!approval) {
    return sendJson(res, 404, {
      status: 'error',
      error: 'Approval not found'
    });
  }

  updateTaskApprovalStatus(approval.id, approval.status);

  await auditLogger.log({
    tenant: approval.context && approval.context.tenant ? approval.context.tenant : run.tenant,
    command: approved ? 'approval.approved' : 'approval.rejected',
    payload: {
      route,
      runId,
      step,
      approvalId: approval.id,
      reason: metadata.reason
    },
    result: {
      success: true,
      status: approval.status,
      approvalId: approval.id
    },
    actor: metadata.actor,
    timestamp: new Date().toISOString()
  });

  return sendJson(res, 200, {
    status: 'ok',
    runId,
    step,
    approval
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/' && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'landing');
    return sendHtmlFile(res, LANDING_PAGE_PATH);
  }

  if (pathname === '/proof' && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'proof');
    return sendHtmlFile(res, PROOF_PAGE_PATH);
  }

  if (pathname === '/mission-control' && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'mission-control');
    return sendHtmlFile(res, MISSION_CONTROL_PATH);
  }

  if (pathname === '/operator-escalations' && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'operator-escalations');
    return sendHtmlFile(res, OPERATOR_ESCALATIONS_PATH);
  }

  if ((pathname === '/billing/checkout' || pathname === '/billing/checkout.html') && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'billing-checkout');
    return sendHtmlFile(res, STRIPE_CHECKOUT_PAGE_PATH);
  }

  if ((pathname === '/billing/complete' || pathname === '/billing/complete.html') && req.method === 'GET') {
    auditSurfaceView(req, requestUrl, pathname, 'billing-complete');
    return sendHtmlFile(res, STRIPE_COMPLETE_PAGE_PATH);
  }

  if (pathname === '/api/control/execute' && req.method === 'POST') {
    return readJsonBody(req, async (error, body) => {
      if (error) {
        emitSecurityEvent('control_plane.request.invalid_json', {
          route: '/api/control/execute',
          method: req.method
        });

        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      try {
        const apiKey = getRequestApiKey(req, requestUrl);
        const result = await executeIntent(body, {
          endpoint: `${getRequestOrigin(req)}/v1/command`,
          headers: apiKey ? { 'x-api-key': apiKey } : {}
        });

        const demoResult = normalizeDemoControlResult(result.result);

        return sendJson(res, 200, {
          envelope: result.envelope,
          ...demoResult,
          result: demoResult
        });
      } catch (controlError) {
        const demoResult = normalizeDemoControlResult({
          status: 'blocked',
          error: controlError instanceof Error ? controlError.message : 'Control Plane execution failed',
          trustScore: 35
        });

        return sendJson(res, 200, {
          ...demoResult,
          result: demoResult
        });
      }
    });
  }

  if (pathname === '/billing/stripe-checkout.js' && req.method === 'GET') {
    return sendStaticFile(res, STRIPE_CHECKOUT_JS_PATH, 'application/javascript; charset=utf-8');
  }

  if (pathname === '/billing/stripe-complete.js' && req.method === 'GET') {
    return sendStaticFile(res, STRIPE_COMPLETE_JS_PATH, 'application/javascript; charset=utf-8');
  }

  if (pathname === '/billing/stripe-checkout.css' && req.method === 'GET') {
    return sendStaticFile(res, STRIPE_CHECKOUT_CSS_PATH, 'text/css; charset=utf-8');
  }

  if (pathname === '/billing/stripe-complete.css' && req.method === 'GET') {
    return sendStaticFile(res, STRIPE_COMPLETE_CSS_PATH, 'text/css; charset=utf-8');
  }

  if (pathname === '/health' && req.method === 'GET') {
    const deploymentTier = resolveTier({});
    return sendJson(res, 200, {
      status: 'ok',
      service: 'sentinel-api',
      mode: 'non-demo',
      tier: deploymentTier.tier,
      tierLabel: deploymentTier.definition.label,
      sovereign: deploymentTier.tier === TIERS.SOVEREIGN,
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/ready' && req.method === 'GET') {
    const governanceStatus = buildGovernanceStatus({
      databaseStatus: getDatabaseStatus(),
      surfaceRegistry: getSurfaceRegistry(),
      includeScheduler: false,
      activeFaceplanes: getActiveFaceplaneSummary()
    });
    const checks = {
      database: governanceStatus.database !== 'disabled' ? 'ok' : 'missing',
      policyPack: governanceStatus.failedChecks.includes('drift_monitor_config') ? 'missing' : 'loaded',
      auditStore: 'ok',
      signalsStore: 'ok',
      tenantIsolation: governanceStatus.failedChecks.includes('tenant_isolation_config') ? 'missing' : 'ok',
      baseline: governanceStatus.failedChecks.includes('baseline_checksum') ? 'missing' : 'ok',
      ledger: governanceStatus.failedChecks.includes('drift_policy_ledger_chain') ? 'missing' : 'ok'
    };

    return sendJson(res, governanceStatus.ready ? 200 : 503, {
      status: governanceStatus.ready ? 'ok' : 'degraded',
      ready: governanceStatus.ready,
      service: 'sentinel-api',
      mode: 'non-demo',
      checks,
      database: governanceStatus.database,
      failedChecks: governanceStatus.failedChecks,
      version: process.env.npm_package_version || '0.1.0',
      commit: process.env.GIT_SHA || process.env.WEBSITE_SITE_NAME || 'unknown',
      timestamp: governanceStatus.timestamp
    });
  }

  if (pathname === '/governance/status' && req.method === 'GET') {
    const access = authorizeRoute(req, res, '/governance/status', {
      command: 'audit.read',
      requiredScope: 'audit:read'
    });

    if (!access) {
      return;
    }

    const governanceStatus = buildGovernanceStatus({
      databaseStatus: getDatabaseStatus(),
      surfaceRegistry: getSurfaceRegistry(),
      activeFaceplanes: getActiveFaceplaneSummary()
    });

    return sendJson(res, governanceStatus.ready ? 200 : 503, governanceStatus);
  }

  if (pathname === '/system/status' && req.method === 'GET') {
    const deploymentTier = resolveTier({});
    return sendJson(res, 200, {
      status: 'ok',
      service: 'sentinel-api',
      mode: 'non-demo',
      tier: deploymentTier.tier,
      tierLabel: deploymentTier.definition.label,
      sovereign: deploymentTier.tier === TIERS.SOVEREIGN,
      platformConnected: deploymentTier.definition.platformConnected,
      database: getDatabaseStatus(),
      surfaces: getSurfaceSummary(),
      routes: {
        health: '/health',
        command: '/v1/command',
        policy: '/policy/evaluate',
        audit: '/audit/events',
        receipts: '/v1/receipts/:receiptId',
        openaiFaceplane: '/faceplane/openai/execute',
        agent: '/agent/run',
        approvals: '/approvals',
        taskTemplates: '/task-templates/ingest',
        telemetryHarmonizer: '/telemetry/harmonize',
        billingCheckout: '/billing/checkout',
        learning: '/learning/suggestions',
        analysis: '/learning/suggestions'
      },
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/billing/checkout/config' && req.method === 'GET') {
    const readiness = getStripeReadiness();
    const config = getStripeCheckoutConfig();
    return sendJson(res, 200, {
      status: readiness.status,
      enabled: readiness.enabled,
      publishableKey: config.publishableKey || null,
      missing: readiness.missing,
      routes: readiness.routes,
      safeguards: readiness.safeguards
    });
  }

  if (pathname === '/billing/checkout/readiness' && req.method === 'GET') {
    return sendJson(res, 200, getStripeReadiness());
  }

  if (pathname === '/billing/checkout/session' && req.method === 'POST') {
    if (!enforceRateLimit(req, '/billing/checkout/session', res, null)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      try {
        const result = await createStripeCheckoutSession(req, body);
        let approval = null;

        if (result.statusCode !== 200 && result.payload && result.payload.status === 'BLOCKED') {
          approval = await createApprovalRequest(
            {
              decision: 'review',
              executionMode: 'approval_required',
              approvalRequired: true,
              riskLevel: 'high',
              reason: result.payload.reason || 'Stripe checkout requires configuration approval'
            },
            {
              tenant: body && typeof body.tenant === 'string' ? body.tenant : 'public',
              route: '/billing/checkout/session',
              approvalType: 'billing_checkout_approval',
              action: 'billing.checkout.create',
              requiredConfig: result.payload.requiredConfig || [],
              nextStep: 'Approve Stripe checkout configuration before enabling revenue execution.',
              badge: '[APPROVE:BILLING]'
            }
          );

          result.payload.approval = {
            approvalId: approval.id,
            status: approval.status,
            type: 'billing_checkout_approval',
            nextStep: 'Approve Stripe checkout configuration before enabling revenue execution.'
          };
        }

        await auditLogger.log({
          tenant: body && typeof body.tenant === 'string' ? body.tenant : 'public',
          command: 'billing.checkout.session.create',
          payload: {
            route: '/billing/checkout/session',
            emailProvided: Boolean(body && body.email),
            source: 'stripe-checkout-ingested'
          },
          result: {
            success: result.statusCode === 200,
            checkoutSessionId: result.payload.checkoutSessionId || null,
            livemode: result.payload.livemode || null,
            blockedReason: result.payload.reason || result.payload.error || null,
            approvalId: approval ? approval.id : null,
            requiredConfig: result.payload.requiredConfig || []
          },
          actor: body && typeof body.email === 'string' ? body.email : 'public.checkout',
          timestamp: new Date().toISOString()
        });

        return sendJson(res, result.statusCode, result.payload);
      } catch (stripeError) {
        await auditLogger.log({
          tenant: body && typeof body.tenant === 'string' ? body.tenant : 'public',
          command: 'billing.checkout.session.create',
          payload: {
            route: '/billing/checkout/session',
            source: 'stripe-checkout-ingested'
          },
          result: {
            success: false,
            error: stripeError instanceof Error ? stripeError.message : 'Stripe checkout failed'
          },
          actor: body && typeof body.email === 'string' ? body.email : 'public.checkout',
          timestamp: new Date().toISOString()
        });

        return sendJson(res, stripeError.statusCode || 502, {
          status: 'error',
          error: stripeError instanceof Error ? stripeError.message : 'Stripe checkout failed'
        });
      }
    });
  }

  if (pathname === '/billing/session-status' && req.method === 'GET') {
    if (!enforceRateLimit(req, '/billing/session-status', res, null)) {
      return;
    }

    const sessionId = requestUrl.searchParams.get('session_id') || '';

    try {
      const result = await retrieveStripeCheckoutSession(sessionId);
      await auditLogger.log({
        tenant: 'public',
        command: 'billing.checkout.session.status',
        payload: {
          route: '/billing/session-status',
          sessionId
        },
        result: {
          success: result.statusCode === 200,
          status: result.payload.status || null,
          paymentStatus: result.payload.payment_status || null,
          blockedReason: result.payload.error || null
        },
        actor: 'public.checkout',
        timestamp: new Date().toISOString()
      });

      return sendJson(res, result.statusCode, result.payload);
    } catch (stripeError) {
      await auditLogger.log({
        tenant: 'public',
        command: 'billing.checkout.session.status',
        payload: {
          route: '/billing/session-status',
          sessionId
        },
        result: {
          success: false,
          error: stripeError instanceof Error ? stripeError.message : 'Stripe status lookup failed'
        },
        actor: 'public.checkout',
        timestamp: new Date().toISOString()
      });

      return sendJson(res, stripeError.statusCode || 502, {
        status: 'error',
        error: stripeError instanceof Error ? stripeError.message : 'Stripe status lookup failed'
      });
    }
  }

  if ((pathname === '/anchors' || pathname === '/v1/anchors') && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      anchors: listAnchors()
    });
  }

  if ((pathname === '/anchors/system-release' || pathname === '/v1/anchors/system-release') && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      anchor: getSystemReleaseAnchor()
    });
  }

  if ((pathname === '/anchors/system-release/external' || pathname === '/v1/anchors/system-release/external') && req.method === 'POST') {
    const access = authorizeRoute(req, res, pathname, {
      command: 'platform.admin',
      requiredScope: 'platform:admin'
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

      const txId = body && typeof body.txId === 'string' ? body.txId.trim() : '';
      const blockNumber = body && (typeof body.blockNumber === 'number' || typeof body.blockNumber === 'string')
        ? String(body.blockNumber).trim()
        : '';

      if (!txId || !blockNumber) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Required fields missing',
          required: ['txId', 'blockNumber']
        });
      }

      const anchor = updateExternalAnchor('SYSTEM_RELEASE', {
        txId,
        blockNumber,
        anchoredAt: body && typeof body.anchoredAt === 'string' ? body.anchoredAt : new Date().toISOString()
      });

      await auditLogger.log({
        tenant: access.principal.tenant,
        command: 'STATE_ANCHORED',
        payload: {
          type: anchor.type,
          reference: 'SYSTEM_RELEASE',
          hash: anchor.hash
        },
        result: {
          success: true,
          status: anchor.status,
          txId: anchor.external.txId,
          blockNumber: anchor.external.blockNumber
        },
        actor: access.principal.actor,
        timestamp: anchor.external.anchoredAt || new Date().toISOString()
      });

      return sendJson(res, 200, {
        status: 'ok',
        anchor
      });
    });
  }

  if (pathname === '/v1/audit' && req.method === 'GET') {
    return sendAuditEvents(req, res, '/v1/audit', requestUrl);
  }

  if (pathname === '/v1/audit/stream' && req.method === 'GET') {
    return sendAuditStream(req, res, requestUrl);
  }

  if (pathname === '/v1/metrics' && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/v1/metrics', {
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
      metrics: await buildAuditMetrics(entries, { tenant }),
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/v1/signals/stream' && req.method === 'GET') {
    return sendSignalStream(req, res, requestUrl);
  }

  if (pathname === '/v1/alerts' && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/v1/alerts', {
      tenant: tenant || undefined,
      command: 'audit.read',
      requiredScope: 'audit:read'
    });

    if (!access) {
      return;
    }

    const signals = await getGovernanceSignals({ tenant });
    return sendJson(res, 200, {
      status: 'ok',
      tenant: tenant || null,
      count: signals.length,
      alerts: signals,
      signals,
      metrics: await buildGovernanceSignalMetrics({ tenant }),
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/audit/events' && req.method === 'GET') {
    return sendAuditEvents(req, res, '/audit/events', requestUrl);
  }

  if (pathname === '/api/authority/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      ...getAuthorityStatus(),
      status: 'ok'
    });
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
    const run = getTaskTemplateRun(applicationId);

    if (run) {
      const entries = (tenant ? auditLogger.getByTenant(tenant) : auditLogger.getAll()).filter((entry) => (
        entry && entry.payload && entry.payload.runId === applicationId
      ));

      return sendJson(res, 200, {
        status: 'ok',
        tenant: tenant || run.tenant || null,
        runId: applicationId,
        executionHistory: entries,
        approvals: run.approvalRecords || [],
        telemetry: run.telemetryReview || null,
        audit: {
          count: entries.length,
          entries
        }
      });
    }

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

      let requestBody;

      try {
        requestBody = signExecutionPassport({
          ...body,
          tenant: body.tenant || principal.tenant,
          source: 'sentinel',
          meta: {
            tenantId: body.tenant || principal.tenant,
            surface: DEFAULT_SURFACE
          },
          metadata: {
            ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
            source: 'sentinel',
            actor: principal.actor,
            role: principal.role,
            keyId: principal.keyId,
            scopes: principal.scopes
          }
        });
      } catch (passportError) {
        emitSecurityEvent('command.passport.signing_failed', {
          route: '/v1/command',
          method: req.method,
          reason: passportError.message
        });

        return sendJson(res, 500, {
          status: 'blocked',
          error: 'PASSPORT_SIGNING_FAILED',
          reason: 'missing_execution_passport_secret'
        });
      }
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
        principal,
        route: '/v1/command',
        source: 'sentinel'
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

  if (pathname === '/operator/escalations' && req.method === 'GET') {
    const access = authorizeRoute(req, res, '/operator/escalations', {
      command: 'approval.read',
      requiredScope: 'approval:read'
    });

    if (!access) {
      return;
    }

    const cases = listOperatorCases();

    return sendJson(res, 200, {
      status: 'ok',
      count: cases.length,
      cases
    });
  }

  if (pathname === '/v1/workflow/init' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/v1/workflow/init', {
      command: 'task.template.orchestrate',
      requiredScope: 'task:orchestrate'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/v1/workflow/init', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const run = await orchestrateTaskTemplates(
        buildWorkflowInitPayload(body, access.principal),
        {
          tenant: access.principal.tenant,
          route: '/v1/workflow/init',
          createApprovalRequest,
          principal: access.principal
        }
      );

      await auditLogger.log({
        tenant: run.tenant,
        command: 'pilot.workflow.initialized',
        payload: {
          route: '/v1/workflow/init',
          runId: run.runId,
          taskCount: run.summary.taskCount
        },
        result: {
          success: true,
          approvalsNeeded: run.summary.approvalsNeeded,
          telemetrySummary: run.telemetryReview ? run.telemetryReview.summary : null,
          auditHash: run.auditHash
        },
        actor: access.principal.actor,
        timestamp: run.createdAt
      });

      return sendWorkflowInitResponse(res, run, run.summary.approvalsCreated ? 202 : 200);
    });
  }

  if (pathname === '/v1/workflow/execute' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/v1/workflow/execute', {
      command: 'task.template.execute',
      requiredScope: 'task:execute'
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

      return resolveWorkflowStepExecution(req, res, '/v1/workflow/execute', body, access);
    });
  }

  if ((pathname === '/v1/approvals/resolve' || pathname === '/approvals/resolve') && req.method === 'POST') {
    const access = authorizeRoute(req, res, pathname, {
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

      return resolvePilotApproval(req, res, pathname, body, access);
    });
  }

  if (pathname === '/task-templates/runs' && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/task-templates/runs', {
      tenant: tenant || undefined,
      command: 'task.template.read',
      requiredScope: 'task:read'
    });

    if (!access) {
      return;
    }

    const runs = listTaskTemplateRuns().filter((run) => {
      if (!tenant) {
        return access.principal.tenant === 'platform' || run.tenant === access.principal.tenant;
      }

      return run.tenant === tenant;
    });

    return sendJson(res, 200, {
      status: 'ok',
      count: runs.length,
      runs
    });
  }

  if (pathname.startsWith('/task-templates/runs/') && req.method === 'GET') {
    const parts = pathname.split('/').filter(Boolean);
    const runId = parts[2];

    if (!runId || parts.length !== 3) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, '/task-templates/runs/:runId', {
      command: 'task.template.read',
      requiredScope: 'task:read'
    });

    if (!access) {
      return;
    }

    const run = getTaskTemplateRun(decodeURIComponent(runId));

    if (!run || (access.principal.tenant !== 'platform' && run.tenant !== access.principal.tenant)) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Task template run not found'
      });
    }

    return sendJson(res, 200, {
      status: 'ok',
      run,
      boundary: buildBoundaryOutput(run)
    });
  }

  if (pathname.startsWith('/task-templates/runs/') && pathname.includes('/steps/') && pathname.endsWith('/execute') && req.method === 'POST') {
    const parts = pathname.split('/').filter(Boolean);
    const runId = parts[2];
    const taskId = parts[4];

    if (!runId || !taskId || parts.length !== 6 || parts[3] !== 'steps' || parts[5] !== 'execute') {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, '/task-templates/runs/:runId/steps/:taskId/execute', {
      command: 'task.template.execute',
      requiredScope: 'task:execute'
    });

    if (!access) {
      return;
    }

    const run = getTaskTemplateRun(decodeURIComponent(runId));

    if (!run || (access.principal.tenant !== 'platform' && run.tenant !== access.principal.tenant)) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Execution session not found'
      });
    }

    const decodedTaskId = decodeURIComponent(taskId);
    const task = run.tasks.find((item) => item.id === decodedTaskId);

    if (!task) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Workflow step not found'
      });
    }

    const approvalStatusByTaskId = {};

    for (const record of run.approvalRecords || []) {
      if (record.taskId !== task.id) {
        continue;
      }

      const approval = await getApproval(
        record.approvalId,
        access.principal.tenant === 'platform' ? run.tenant : access.principal.tenant
      );
      approvalStatusByTaskId[record.taskId] = approval ? approval.status : record.status;
    }

    const result = executeTaskStep(task, { approvalStatusByTaskId });

    await auditLogger.log({
      tenant: run.tenant,
      command: 'task.template.execute',
      payload: {
        runId: run.runId,
        taskId: task.id,
        title: task.title,
        category: task.category
      },
      result,
      actor: access.principal.actor,
      timestamp: new Date().toISOString()
    });

    return sendJson(res, result.success ? 200 : 423, {
      status: result.success ? 'executed' : 'blocked',
      result
    });
  }

  if (pathname === '/task-templates/ingest' && req.method === 'POST') {
    const access = authorizeRoute(req, res, '/task-templates/ingest', {
      command: 'task.template.orchestrate',
      requiredScope: 'task:orchestrate'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, '/task-templates/ingest', res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const run = await orchestrateTaskTemplates(
        {
          ...(body && typeof body === 'object' ? body : {}),
          tenant: body && typeof body.tenant === 'string' ? body.tenant : access.principal.tenant
        },
        {
          tenant: access.principal.tenant,
          route: '/task-templates/ingest',
          createApprovalRequest,
          principal: access.principal
        }
      );

      await auditLogger.log({
        tenant: run.tenant,
        command: 'task.template.orchestrated',
        payload: {
          runId: run.runId,
          taskCount: run.summary.taskCount,
          createApprovals: Boolean(body && body.createApprovals)
        },
        result: {
          success: true,
          approvalsNeeded: run.summary.approvalsNeeded,
          approvalsCreated: run.summary.approvalsCreated,
          xeActionsNeeded: run.summary.xeActionsNeeded,
          telemetrySummary: run.telemetryReview ? run.telemetryReview.summary : null,
          auditHash: run.auditHash
        },
        actor: access.principal.actor,
        timestamp: run.createdAt
      });

      return sendJson(res, run.summary.approvalsCreated ? 202 : 200, {
        status: run.summary.approvalsCreated ? 'pending_approval' : 'orchestrated',
        label: 'Orchestrated Workflow Engine',
        action: 'Initialize Workflow',
        executionSession: run.runId,
        timeline: run.boundary.timeline,
        requiresApproval: run.boundary.requiresApproval,
        xeActions: run.boundary.xeActions,
        blockedActions: run.boundary.blockedActions,
        allowedActions: run.boundary.allowedActions,
        telemetryReview: run.telemetryReview,
        approvalRecords: run.approvalRecords,
        boundary: run.boundary,
        run
      });
    });
  }

  if ((pathname === '/telemetry/harmonize' || pathname === '/v1/telemetry/harmonize') && req.method === 'POST') {
    const routeName = pathname === '/v1/telemetry/harmonize' ? '/v1/telemetry/harmonize' : '/telemetry/harmonize';
    const access = authorizeRoute(req, res, routeName, {
      command: 'telemetry.metric.write',
      requiredScope: 'telemetry:write'
    });

    if (!access) {
      return;
    }

    if (!enforceRateLimit(req, routeName, res, access.principal)) {
      return;
    }

    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const telemetryState = body && typeof body.telemetryState === 'string'
        ? body.telemetryState
        : body && typeof body.state === 'string'
          ? body.state
          : 'LIMITED';
      const result = handleTelemetryState(telemetryState, {
        ...(body && typeof body === 'object' ? body : {}),
        tenant: body && typeof body.tenant === 'string' ? body.tenant : access.principal.tenant,
        principal: access.principal
      });

      await auditLogger.log({
        tenant: body && typeof body.tenant === 'string' ? body.tenant : access.principal.tenant,
        command: 'telemetry.harmonized',
        payload: {
          telemetryState,
          activityCount: Array.isArray(body && body.activities) ? body.activities.length : 0
        },
        result: {
          success: true,
          summary: result.summary,
          mode: result.mode,
          auditArtifact: result.auditArtifact || null,
          auditHash: result.auditHash || null
        },
        actor: access.principal.actor,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, result);
    });
  }

  if (pathname === '/faceplane/openai/config' && req.method === 'GET') {
    const tenantId = requestUrl.searchParams.get('tenantId');
    const access = authorizeRoute(req, res, '/faceplane/openai/config', {
      tenant: tenantId || undefined,
      command: 'openai.faceplane.read',
      requiredScope: 'openai:read'
    });

    if (!access) {
      return;
    }

    const result = getOpenAIConfigForTenant(tenantId, access.principal);

    if (!result.ok) {
      return sendJson(res, result.statusCode || 400, {
        status: 'blocked',
        error: result.error
      });
    }

    return sendJson(res, 200, {
      status: 'ok',
      config: result.config
    });
  }

  if (pathname === '/faceplane/openai/status' && req.method === 'GET') {
    const tenantId = requestUrl.searchParams.get('tenantId');
    const access = authorizeRoute(req, res, '/faceplane/openai/status', {
      tenant: tenantId || undefined,
      command: 'openai.faceplane.read',
      requiredScope: 'openai:read'
    });

    if (!access) {
      return;
    }

    const effectiveTenantId = access.principal.tenant === 'platform'
      ? tenantId
      : (tenantId || access.principal.tenant);

    if (effectiveTenantId) {
      const result = getOpenAIConfigForTenant(effectiveTenantId, access.principal);

      if (!result.ok) {
        return sendJson(res, result.statusCode || 400, {
          status: 'blocked',
          error: result.error
        });
      }
    }

    return sendJson(res, 200, {
      status: 'ok',
      faceplane: getOpenAIFaceplaneStatus({ tenantId: effectiveTenantId || undefined })
    });
  }

  if (pathname === '/faceplane/openai/execute' && req.method === 'POST') {
    return readJsonBody(req, async (error, body) => {
      if (error) {
        return sendJson(res, 400, {
          status: 'error',
          error: 'Invalid JSON body'
        });
      }

      const access = authorizeRoute(req, res, '/faceplane/openai/execute', {
        tenant: body.tenantId,
        command: 'openai.faceplane.execute',
        requiredScope: 'openai:execute'
      });

      if (!access) {
        return;
      }

      const result = executeOpenAIWorkflow(body, access.principal);

      if (!result.ok) {
        return sendJson(res, result.statusCode || 400, {
          status: 'blocked',
          error: result.error,
          ...(result.tokenEstimate ? { tokenEstimate: result.tokenEstimate } : {}),
          ...(result.maxTokenLimit ? { maxTokenLimit: result.maxTokenLimit } : {})
        });
      }

      await auditLogger.log({
        tenant: result.tenantId,
        command: 'openai.faceplane.execute',
        payload: {
          workflowId: result.workflowId,
          promptHash: result.auditEntry.promptHash,
          modelVersion: result.modelVersion,
          metadata: body.metadata || {}
        },
        result: {
          success: true,
          riskIndex: result.risk.riskIndex,
          escalationState: result.risk.state,
          escalationRequired: Boolean(result.escalationCase),
          ledgerHash: result.auditEntry.hash
        },
        actor: access.principal.actor,
        timestamp: result.auditEntry.timestamp
      });

      return sendJson(res, result.statusCode, {
        status: result.escalationCase ? 'pending_review' : 'ok',
        workflowId: result.workflowId,
        tenantId: result.tenantId,
        faceplane: result.faceplane,
        gaasTier: result.gaasTier,
        modelVersion: result.modelVersion,
        risk: result.risk,
        escalationCase: result.escalationCase,
        response: result.response,
        auditEntry: result.auditEntry
      });
    });
  }

  if (pathname.startsWith('/operator/escalations/') && req.method === 'GET') {
    const parts = pathname.split('/').filter(Boolean);
    const workflowId = parts[2];

    if (!workflowId || parts.length !== 3) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, '/operator/escalations/:workflowId', {
      command: 'approval.read',
      requiredScope: 'approval:read'
    });

    if (!access) {
      return;
    }

    const operatorCase = getOperatorCase(decodeURIComponent(workflowId));

    if (!operatorCase) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Case not found'
      });
    }

    return sendJson(res, 200, {
      status: 'ok',
      case: operatorCase
    });
  }

  if (pathname.startsWith('/operator/escalations/') && pathname.endsWith('/decision') && req.method === 'POST') {
    const parts = pathname.split('/').filter(Boolean);
    const workflowId = parts[2];

    if (!workflowId || parts.length !== 4) {
      return sendJson(res, 404, {
        status: 'error',
        error: 'Not Found'
      });
    }

    const access = authorizeRoute(req, res, '/operator/escalations/:workflowId/decision', {
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

      const result = submitOperatorDecision(
        decodeURIComponent(workflowId),
        body,
        access.principal
      );

      if (!result.ok) {
        return sendJson(res, result.statusCode || 400, {
          status: 'blocked',
          error: result.error,
          ...(result.required ? { required: result.required } : {})
        });
      }

      await auditLogger.log({
        tenant: access.principal.tenant,
        command: 'operator.vendor_onboarding.decision',
        payload: {
          workflowId,
          decision: result.decision.decision,
          policyReferenceCode: result.decision.policyReferenceCode,
          overrideFlag: result.decision.overrideFlag
        },
        result: {
          success: true,
          decisionHash: result.decision.decisionHash,
          transition: result.decision.transition,
          ledgerHash: result.decision.ledgerEntry.hash
        },
        actor: access.principal.actor,
        timestamp: result.decision.decisionTimestamp
      });

      return sendJson(res, 200, {
        status: 'ok',
        case: result.case,
        decision: result.decision
      });
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
      updateTaskApprovalStatus(approval.id, approval.status);

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

  if (pathname === '/drift/analyze' && req.method === 'GET') {
    const tenant = requestUrl.searchParams.get('tenant');
    const access = authorizeRoute(req, res, '/drift/analyze', {
      tenant: tenant || undefined,
      command: 'learning.read',
      requiredScope: 'learning:read'
    });

    if (!access) {
      return;
    }

    const shouldRoute = requestUrl.searchParams.get('routeApprovals') !== 'false';

    return analyzeDrift(auditLogger.getAll(), {
      tenant,
      emitSecurityEvent,
      createApprovalRequest: shouldRoute ? createApprovalRequest : null,
      routeApprovals: shouldRoute
    })
      .then((result) => {
        auditLogger.log({
          tenant: tenant || null,
          command: 'drift.analyzed',
          payload: { tenant, routeApprovals: shouldRoute },
          result: {
            success: true,
            status: result.status,
            signalCount: result.summary ? result.summary.signalCount : 0,
            recommendationCount: result.summary ? result.summary.recommendationCount : 0
          },
          actor: access.principal.actor,
          timestamp: new Date().toISOString()
        }).catch(() => {});

        return sendJson(res, 200, result);
      })
      .catch((error) => sendJson(res, 500, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Drift analysis failed'
      }));
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
  requireAuthoritySecret();
  enforceProductionBoundary();
  enforceSovereignBoot();

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
