const { principalHasScope } = require('../security/keyRegistry');

const commandScopes = {
  'application.submit': 'application:submit',
  'application.evaluate': 'application:evaluate',
  'deal.submit': 'deal:submit',
  'deal.approve': 'deal:approve',
  'deal.execute': 'deal:execute',
  'audit.read': 'audit:read',
  'receipt.read': 'receipt:read',
  'approval.read': 'approval:read',
  'approval.review': 'approval:review',
  'tenant.admin': 'tenant:admin',
  'platform.admin': 'platform:admin',
  'learning.read': 'learning:read',
  'learning.write': 'learning:write',
  'media.polish': 'media:polish',
  'sentinel.media.polish': 'media:polish',
  'openai.faceplane.execute': 'openai:execute',
  'openai.faceplane.read': 'openai:read',
  'task.template.orchestrate': 'task:orchestrate',
  'task.template.read': 'task:read',
  'task.template.execute': 'task:execute',
  'telemetry.metric.write': 'telemetry:write',
  'telemetry.audit.summary': 'telemetry:write',
  'telemetry.harmonize': 'telemetry:write',
  'telemetry.export.external': 'telemetry:export',
  'telemetry.payload.sensitive': 'telemetry:export',
  'billing.checkout.session.create': 'billing:write',
  'billing.checkout.session.status': 'billing:read',
  'billing.webhook.receive': 'billing:webhook',
  'system.reframe.product': 'platform:admin',
  'repo.update.structure': 'platform:admin',
  'system.validate.integrity': 'platform:admin',
  'dealFlow.run.demo': 'platform:admin',
  'ui.sync.labels': 'platform:admin',
  'security.write': 'security:write',
  'policy.evaluate': 'policy:evaluate',
  'cdnlux.token.evaluate': 'platform:admin',
  'cdnlux.contract.evaluate': 'platform:admin',
  'docking.evaluate': 'platform:admin'
};

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function blocked(state, riskLevel, reason, details = {}) {
  return {
    allowed: false,
    state,
    riskLevel,
    decision: 'block',
    reason,
    approvalRequired: Boolean(details.approvalRequired),
    receiptRequired: details.receiptRequired !== false,
    statusCode: details.statusCode || 400,
    details
  };
}

function allowed() {
  return {
    allowed: true,
    state: 'clean',
    riskLevel: 'low',
    decision: 'allow',
    approvalRequired: false,
    receiptRequired: true
  };
}

function getRequiredScope(command) {
  return commandScopes[command] || null;
}

function buildPolicyContext(envelope = {}, principal = null, options = {}) {
  const command = options.command || envelope.command;
  const tenant = options.tenant || envelope.tenant || (principal ? principal.tenant : null);
  const actor =
    options.actor ||
    (principal ? principal.actor : null) ||
    (envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : null);
  const role =
    options.role ||
    (principal ? principal.role : null) ||
    (envelope.metadata && envelope.metadata.role ? envelope.metadata.role : null);
  const scopes =
    options.scopes ||
    (principal && Array.isArray(principal.scopes)
      ? principal.scopes
      : envelope.metadata && Array.isArray(envelope.metadata.scopes)
        ? envelope.metadata.scopes
        : []);
  const requiredScope = options.requiredScope || getRequiredScope(command);

  return {
    tenant,
    actor,
    role,
    scopes,
    command,
    requiredScope,
    principal,
    signals: options.signals || {}
  };
}

function evaluatePolicy(input = {}, signals = {}) {
  const ctx = input.command || input.actor || input.role || input.scopes
    ? {
        ...input,
        signals: input.signals || signals
      }
    : buildPolicyContext(input, null, { signals });
  ctx.requiredScope = ctx.requiredScope || getRequiredScope(ctx.command);
  const missing = [];

  if (!hasText(ctx.tenant)) {
    missing.push('TENANT_REQUIRED');
  }

  if (!hasText(ctx.command)) {
    missing.push('COMMAND_REQUIRED');
  }

  if (!hasText(ctx.actor)) {
    missing.push('ACTOR_REQUIRED');
  }

  if (!hasText(ctx.role)) {
    missing.push('ROLE_REQUIRED');
  }

  if (!Array.isArray(ctx.scopes) || ctx.scopes.length === 0) {
    missing.push('SCOPES_REQUIRED');
  }

  if (missing.length) {
    return blocked('invalid', 'low', missing.join(','), {
      required: ['tenant', 'command', 'actor', 'role', 'scopes'],
      missing,
      approvalRequired: false,
      statusCode: 400
    });
  }

  if (!ctx.requiredScope) {
    return blocked('invalid', 'medium', 'SCOPE_MAPPING_REQUIRED', {
      command: ctx.command,
      approvalRequired: false,
      statusCode: 400
    });
  }

  if (ctx.command === 'telemetry.export.external' || ctx.command === 'telemetry.payload.sensitive') {
    return blocked('visibility', 'high', 'Telemetry export requires approval', {
      requiredScope: ctx.requiredScope,
      command: ctx.command,
      approvalRequired: true,
      statusCode: 403
    });
  }

  if (
    ctx.principal &&
    ctx.principal.tenant !== 'platform' &&
    ctx.tenant !== ctx.principal.tenant
  ) {
    return blocked('restricted', 'medium', 'TENANT_MISMATCH', {
      principalTenant: ctx.principal.tenant,
      requestTenant: ctx.tenant,
      approvalRequired: false,
      statusCode: 403
    });
  }

  if (ctx.requiredScope && !principalHasScope(ctx.principal || ctx, ctx.requiredScope)) {
    return blocked('restricted', 'medium', 'SCOPE_REQUIRED', {
      requiredScope: ctx.requiredScope,
      scopes: ctx.scopes,
      approvalRequired: false,
      statusCode: 403
    });
  }

  if (ctx.signals && ctx.signals.identity && ctx.signals.identity.impossibleTravel === true) {
    return blocked('drift', 'high', 'impossible_travel', {
      actor: ctx.actor,
      approvalRequired: true,
      statusCode: 403
    });
  }

  if (ctx.command === 'deal.execute' && ctx.role !== 'approver' && ctx.role !== 'platform') {
    return blocked('restricted', 'medium', 'ROLE_REQUIRED', {
      requiredRole: 'approver',
      actor: ctx.actor,
      role: ctx.role,
      approvalRequired: true,
      statusCode: 403
    });
  }

  return allowed();
}

module.exports = {
  buildPolicyContext,
  commandScopes,
  evaluatePolicy,
  getRequiredScope
};
