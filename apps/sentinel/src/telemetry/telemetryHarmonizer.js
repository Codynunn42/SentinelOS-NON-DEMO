const crypto = require('crypto');
const { buildPolicyContext, evaluatePolicy } = require('../governance/policyEngine');
const { TELEMETRY_STATUSES, createTelemetryResponse } = require('./telemetrySchema');

const TELEMETRY_ACTION_MAP = {
  'workflow.metrics': {
    command: 'telemetry.metric.write',
    riskLevel: 'low',
    reason: 'Operational metrics can be sent when tenant and scope policy allow.'
  },
  'audit.summary': {
    command: 'telemetry.audit.summary',
    riskLevel: 'low',
    reason: 'Audit summaries are safe when scoped and non-sensitive.'
  },
  'deal.execution': {
    command: 'deal.execute',
    riskLevel: 'medium',
    approvalRequired: true,
    reason: 'Financial execution visibility requires human approval.'
  },
  'approval.state': {
    command: 'approval.read',
    riskLevel: 'medium',
    reason: 'Approval state visibility is read-scoped and tenant-bound.'
  },
  'external.export': {
    command: 'telemetry.export.external',
    riskLevel: 'high',
    forceBlock: true,
    reason: 'External export is blocked when telemetry is off or limited.'
  },
  'sensitive.payload': {
    command: 'telemetry.payload.sensitive',
    riskLevel: 'high',
    forceBlock: true,
    reason: 'Sensitive payload telemetry cannot be sent without explicit external export approval.'
  }
};

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
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

function hashObject(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function normalizeActivity(item = {}, index = 0) {
  const type = hasText(item.type)
    ? item.type.trim()
    : hasText(item.command)
      ? item.command.trim()
      : hasText(item.category)
        ? item.category.trim()
        : 'workflow.metrics';
  const mapped = TELEMETRY_ACTION_MAP[type] || {
    command: type,
    riskLevel: hasText(item.riskLevel) ? item.riskLevel.trim().toLowerCase() : 'medium',
    reason: 'Unmapped telemetry activity requires policy review.'
  };

  return {
    id: hasText(item.id) ? item.id.trim() : `telemetry_${hashObject({ type, index }).slice(0, 12)}`,
    type,
    action: mapped.command,
    label: hasText(item.name) ? item.name.trim() : hasText(item.title) ? item.title.trim() : type,
    payload: item.payload && typeof item.payload === 'object' ? item.payload : item,
    tenant: hasText(item.tenant) ? item.tenant.trim() : null,
    riskLevel: hasText(item.riskLevel) ? item.riskLevel.trim().toLowerCase() : mapped.riskLevel,
    reason: hasText(item.reason) ? item.reason.trim() : mapped.reason,
    approvalRequired: item.approvalRequired === true || mapped.approvalRequired === true,
    forceBlock: item.forceBlock === true || mapped.forceBlock === true
  };
}

function buildPrincipal(context = {}) {
  if (context.principal && typeof context.principal === 'object') {
    return context.principal;
  }

  return {
    tenant: context.tenant || 'ownerfi',
    actor: context.actor || 'sentinel.telemetry@nunn.local',
    role: context.role || 'observer',
    scopes: Array.isArray(context.scopes)
      ? context.scopes
      : ['telemetry:write', 'audit:read', 'approval:read']
  };
}

function classifyActivity(activity, context = {}) {
  const principal = buildPrincipal({
    ...context,
    tenant: activity.tenant || context.tenant
  });
  const policyContext = buildPolicyContext(
    {
      tenant: activity.tenant || context.tenant || principal.tenant,
      command: activity.action,
      payload: activity.payload
    },
    principal,
    {
      tenant: activity.tenant || context.tenant || principal.tenant,
      command: activity.action,
      signals: context.signals || {}
    }
  );
  const policy = evaluatePolicy(policyContext);

  if (activity.forceBlock) {
    const timestamp = new Date().toISOString();
    return {
      type: 'BLOCKED',
      status: TELEMETRY_STATUSES.blocked,
      item: activity.type,
      action: activity.action,
      reason: activity.reason,
      timestamp,
      activity,
      policy: {
        ...policy,
        decision: 'block',
        approvalRequired: false
      }
    };
  }

  if (activity.approvalRequired || policy.approvalRequired) {
    const timestamp = new Date().toISOString();
    return {
      type: 'APPROVAL_REQUIRED',
      status: TELEMETRY_STATUSES.approval,
      item: activity.type,
      action: activity.action,
      reason: activity.reason || policy.reason || 'Requires approval',
      timestamp,
      activity,
      policy
    };
  }

  if (policy.allowed) {
    const timestamp = new Date().toISOString();
    return {
      type: 'SAFE_TO_SEND',
      status: TELEMETRY_STATUSES.safe,
      item: activity.type,
      action: activity.action,
      reason: activity.reason || 'allowed',
      timestamp,
      activity,
      policy
    };
  }

  const timestamp = new Date().toISOString();
  return {
    type: 'BLOCKED',
    status: TELEMETRY_STATUSES.blocked,
    item: activity.type,
    action: activity.action,
    reason: policy.reason || activity.reason || 'policy violation',
    timestamp,
    activity,
    policy
  };
}

function summarize(findings) {
  return findings.reduce(
    (summary, finding) => {
      if (finding.type === 'SAFE_TO_SEND') summary.safe += 1;
      if (finding.type === 'APPROVAL_REQUIRED') summary.requiresApproval += 1;
      if (finding.type === 'BLOCKED') summary.blocked += 1;
      return summary;
    },
    { safe: 0, requiresApproval: 0, blocked: 0 }
  );
}

function runTelemetryHarmonizer(context = {}) {
  const activities = Array.isArray(context.activities) ? context.activities : [];
  const normalized = activities.map(normalizeActivity);
  const details = normalized.map((activity) => classifyActivity(activity, context));
  const summary = summarize(details);
  const telemetryState = context.telemetryState || 'LIMITED';
  const safeToSend = details.filter((finding) => finding.type === 'SAFE_TO_SEND');
  const requiresApproval = details.filter((finding) => finding.type === 'APPROVAL_REQUIRED');
  const blocked = details.filter((finding) => finding.type === 'BLOCKED');
  const auditArtifact = {
    artifactType: 'governed_telemetry_harmonization',
    telemetryState,
    actor: context.principal && context.principal.actor ? context.principal.actor : context.actor || 'sentinel.telemetry@nunn.local',
    tenant: context.tenant || (context.principal && context.principal.tenant) || null,
    summary,
    decisions: details.map((detail) => ({
      action: detail.action,
      item: detail.item,
      status: detail.status,
      reason: detail.reason || null,
      timestamp: detail.timestamp
    })),
    timestamp: new Date().toISOString()
  };
  const auditHash = hashObject({ telemetryState, details, auditArtifact });

  return createTelemetryResponse({
    status: 'HARMONIZED',
    mode: 'GUARDED_VISIBILITY',
    telemetryState,
    summary,
    details,
    safeToSend,
    requiresApproval,
    blocked,
    auditArtifact,
    auditHash
  });
}

function handleTelemetryState(state, context = {}) {
  if (state === 'OFF' || state === 'LIMITED') {
    const harmonized = runTelemetryHarmonizer({
      ...context,
      telemetryState: state
    });

    return {
      ...harmonized,
      mode: 'GUARDED_VISIBILITY',
      harmonized
    };
  }

  return createTelemetryResponse({
    status: 'NORMAL',
    mode: 'DIRECT_TELEMETRY',
    telemetryState: state || 'ON',
    summary: {
      safe: 0,
      requiresApproval: 0,
      blocked: 0
    },
    details: []
  });
}

module.exports = {
  TELEMETRY_ACTION_MAP,
  classifyActivity,
  handleTelemetryState,
  normalizeActivity,
  runTelemetryHarmonizer
};
