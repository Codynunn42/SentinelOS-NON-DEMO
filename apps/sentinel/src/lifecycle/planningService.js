const crypto = require('crypto');
const { governanceCheck } = require('../governance/preflight');
const { createApprovalRequest } = require('../approval/approval');
const { auditLogger } = require('../audit/auditLogger');
const { createTrace, recordStage, completeTrace } = require('../audit/executionTrace');
const { validateSchema } = require('../schemas/validateSchema');
const {
  LifecycleConflictError,
  LifecycleValidationError
} = require('./lifecycleErrors');
const { LIFECYCLE_STATES } = require('./lifecycleStates');
const {
  createLifecycleRecord,
  getLifecycleByCommandId,
  getLifecycleByIdempotencyKey,
  recordLifecycleEvent,
  transitionLifecycleRecord
} = require('./transitionService');

const PLANNING_INVARIANTS = Object.freeze({
  runtimeMutationAllowed: false,
  connectorInvocationAllowed: false,
  executionDispatchAllowed: false,
  approvalCreationAllowed: true,
  auditWriteRequired: true,
  evidenceLinkRequired: true
});

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

function hashEnvelope(envelope) {
  return crypto.createHash('sha256').update(stableStringify(envelope)).digest('hex');
}

function getEnvelopeVersion(envelope = {}) {
  if (typeof envelope.envelopeVersion === 'string' && envelope.envelopeVersion.trim() !== '') {
    return envelope.envelopeVersion.trim();
  }

  if (envelope.meta && typeof envelope.meta.envelopeVersion === 'string' && envelope.meta.envelopeVersion.trim() !== '') {
    return envelope.meta.envelopeVersion.trim();
  }

  return '1.0.0';
}

function getEvidenceLinks(envelope = {}) {
  const links = envelope.payload
    && envelope.payload.governance
    && Array.isArray(envelope.payload.governance.evidenceLinks)
    ? envelope.payload.governance.evidenceLinks.filter((link) => typeof link === 'string' && link.trim() !== '')
    : [];

  return links;
}

function buildScopedIdempotencyKey(envelope, principal) {
  const rawKey = envelope.metadata && typeof envelope.metadata.idempotencyKey === 'string'
    ? envelope.metadata.idempotencyKey.trim()
    : '';

  if (!rawKey) {
    throw new LifecycleValidationError('Planning requests require metadata.idempotencyKey');
  }

  return `${envelope.tenant}:${envelope.command}:${principal.keyId}:${rawKey}`;
}

function buildPlanningEnvelope(body, principal, normalizeCommandEnvelope) {
  const metadata = body && typeof body.metadata === 'object' ? body.metadata : {};
  return normalizeCommandEnvelope({
    ...body,
    tenant: body && typeof body.tenant === 'string' && body.tenant.trim() !== '' ? body.tenant : principal.tenant,
    metadata: {
      ...metadata,
      actor: principal.actor,
      role: principal.role,
      keyId: principal.keyId,
      scopes: principal.scopes,
      source: metadata.source || 'sentinel',
      idempotencyKey:
        typeof metadata.idempotencyKey === 'string' && metadata.idempotencyKey.trim() !== ''
          ? metadata.idempotencyKey.trim()
          : typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim() !== ''
            ? body.idempotencyKey.trim()
            : undefined
    }
  });
}

function mapPolicyDecision(governanceDecision) {
  const basePolicy = governanceDecision && governanceDecision.allowed
    ? governanceDecision.policy || {}
    : governanceDecision && governanceDecision.details && governanceDecision.details.policy
      ? governanceDecision.details.policy
      : {};

  if (governanceDecision && governanceDecision.allowed) {
    return {
      decision: 'ALLOW_WITH_APPROVAL',
      riskLevel: basePolicy.riskLevel || 'medium',
      approvalRequired: true,
      reason: basePolicy.reason || 'Planning accepted and awaiting human approval'
    };
  }

  if (basePolicy.approvalRequired) {
    return {
      decision: 'REVIEW_REQUIRED',
      riskLevel: basePolicy.riskLevel || 'high',
      approvalRequired: true,
      reason: basePolicy.reason || governanceDecision.error || 'Human approval required'
    };
  }

  return {
    decision: 'DENY',
    riskLevel: basePolicy.riskLevel || 'medium',
    approvalRequired: false,
    reason: governanceDecision && (governanceDecision.error || basePolicy.reason) || 'Planning request denied'
  };
}

function buildLifecycleResponse(record, policyDecision, status, extras = {}) {
  return {
    status,
    commandId: record.commandId,
    planningId: record.planningId,
    state: record.currentState,
    nextAction: record.nextAction,
    policyDecision,
    traceId: record.traceId,
    createdAt: record.createdAt,
    ...(record.approvalId ? { approvalId: record.approvalId } : {}),
    ...extras
  };
}

async function writePlanningAudit(entry) {
  await auditLogger.log(entry);
}

async function planCommand(body, options = {}) {
  const principal = options.principal;
  const normalizeCommandEnvelope = options.normalizeCommandEnvelope;
  if (!principal || !normalizeCommandEnvelope) {
    throw new LifecycleValidationError('Planning service requires principal and normalizeCommandEnvelope');
  }

  const envelope = buildPlanningEnvelope(body, principal, normalizeCommandEnvelope);
  const envelopeValidation = validateSchema('command-envelope', envelope);
  if (!envelopeValidation.valid) {
    return {
      statusCode: 400,
      payload: {
        status: 'blocked',
        error: 'INVALID_ENVELOPE',
        state: LIFECYCLE_STATES.FAILED,
        details: envelopeValidation.errors
      }
    };
  }

  const planningValidation = validateSchema('planning-request', envelope);
  if (!planningValidation.valid) {
    return {
      statusCode: 400,
      payload: {
        status: 'blocked',
        error: 'INVALID_PLANNING_REQUEST',
        state: LIFECYCLE_STATES.FAILED,
        details: planningValidation.errors
      }
    };
  }

  const requestHash = hashEnvelope(envelope);
  const scopedIdempotencyKey = buildScopedIdempotencyKey(envelope, principal);
  const existingByCommandId = await getLifecycleByCommandId(envelope.commandId);
  const existingByIdempotencyKey = await getLifecycleByIdempotencyKey(scopedIdempotencyKey);
  const existing = existingByCommandId || existingByIdempotencyKey;

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new LifecycleConflictError(existingByCommandId ? 'Duplicate commandId conflict' : 'Duplicate idempotency key conflict', {
        error: existingByCommandId ? 'COMMAND_ID_CONFLICT' : 'IDEMPOTENCY_CONFLICT',
        commandId: envelope.commandId,
        idempotencyKey: scopedIdempotencyKey
      });
    }

    return {
      statusCode: existing.currentState === LIFECYCLE_STATES.REJECTED ? 403 : 202,
      payload: buildLifecycleResponse(existing, existing.policyDecision || mapPolicyDecision({ allowed: true, policy: {} }), existing.currentState === LIFECYCLE_STATES.REJECTED ? 'rejected' : 'accepted', {
        idempotentReplay: true
      })
    };
  }

  const traceId = `trace_${crypto.randomUUID()}`;
  const trace = createTrace(traceId, envelope);
  recordStage(traceId, 'api', {
    route: options.route || '/api/v1/planning',
    status: 'received'
  });

  const planningId = `plan_${crypto.randomUUID()}`;
  const actorId = principal.actor || 'system';
  const now = new Date().toISOString();
  const createdRecord = await createLifecycleRecord({
    commandId: envelope.commandId,
    planningId,
    tenant: envelope.tenant,
    command: envelope.command,
    actorId,
    envelopeVersion: getEnvelopeVersion(body),
    currentState: LIFECYCLE_STATES.RECEIVED,
    stateVersion: 0,
    idempotencyKey: scopedIdempotencyKey,
    requestHash,
    traceId,
    requestPayload: envelope,
    createdAt: now,
    updatedAt: now
  });

  await recordLifecycleEvent({
    commandId: createdRecord.commandId,
    planningId: createdRecord.planningId,
    eventType: 'COMMAND_RECEIVED',
    previousState: null,
    nextState: LIFECYCLE_STATES.RECEIVED,
    actorType: 'user',
    actorId,
    metadata: {
      invariants: PLANNING_INVARIANTS
    },
    traceId,
    occurredAt: now
  });

  const planningRecord = await transitionLifecycleRecord({
    commandId: createdRecord.commandId,
    expectedState: LIFECYCLE_STATES.RECEIVED,
    expectedVersion: createdRecord.stateVersion,
    nextState: LIFECYCLE_STATES.PLANNING,
    eventType: 'PLANNING_STARTED',
    actorType: 'user',
    actorId,
    metadata: {
      route: options.route || '/api/v1/planning'
    },
    traceId
  });

  const governanceDecision = governanceCheck(envelope, {}, principal);
  const policyDecision = mapPolicyDecision(governanceDecision);
  recordStage(traceId, 'governance', {
    allowed: governanceDecision.allowed,
    decision: policyDecision.decision,
    riskLevel: policyDecision.riskLevel
  });

  await recordLifecycleEvent({
    commandId: planningRecord.commandId,
    planningId: planningRecord.planningId,
    eventType: 'POLICY_EVALUATED',
    previousState: planningRecord.currentState,
    nextState: planningRecord.currentState,
    actorType: 'system',
    actorId: 'governance-preflight',
    metadata: {
      decision: policyDecision.decision,
      riskLevel: policyDecision.riskLevel,
      approvalRequired: policyDecision.approvalRequired,
      policy: governanceDecision.allowed ? governanceDecision.policy : governanceDecision.details.policy,
      invariants: PLANNING_INVARIANTS
    },
    traceId
  });

  if (!governanceDecision.allowed && !policyDecision.approvalRequired) {
    const rejectedRecord = await transitionLifecycleRecord({
      commandId: planningRecord.commandId,
      expectedState: LIFECYCLE_STATES.PLANNING,
      expectedVersion: planningRecord.stateVersion,
      nextState: LIFECYCLE_STATES.REJECTED,
      eventType: 'PLANNING_REJECTED',
      actorType: 'system',
      actorId: 'governance-preflight',
      metadata: {
        reason: policyDecision.reason,
        invariants: PLANNING_INVARIANTS
      },
      traceId,
      policyDecision,
      nextAction: 'REQUEST_DENIED'
    });

    await writePlanningAudit({
      tenant: envelope.tenant,
      command: envelope.command,
      payload: {
        route: options.route || '/api/v1/planning',
        commandId: envelope.commandId,
        planningId: rejectedRecord.planningId,
        evidenceLinks: getEvidenceLinks(envelope),
        invariants: PLANNING_INVARIANTS
      },
      result: {
        success: false,
        state: rejectedRecord.currentState,
        nextAction: rejectedRecord.nextAction,
        policyDecision,
        traceId
      },
      actor: actorId,
      timestamp: new Date().toISOString()
    });

    completeTrace(traceId, {
      status: 'rejected',
      state: rejectedRecord.currentState,
      planningId: rejectedRecord.planningId
    });

    return {
      statusCode: governanceDecision.statusCode || 403,
      payload: buildLifecycleResponse(rejectedRecord, policyDecision, 'rejected')
    };
  }

  const approval = await createApprovalRequest({
    decision: policyDecision.decision,
    executionMode: 'approval_required',
    approvalRequired: true,
    riskLevel: policyDecision.riskLevel,
    reason: policyDecision.reason
  }, {
    tenant: envelope.tenant,
    route: options.route || '/api/v1/planning',
    planningId: planningRecord.planningId,
    commandId: envelope.commandId,
    action: envelope.command,
    approvalType: 'planning_approval',
    requestHash,
    evidenceLinks: getEvidenceLinks(envelope),
    nextStep: 'Human approval required before any execution activity.',
    badge: '[APPROVE:PLANNING]'
  });

  recordStage(traceId, 'approval', {
    approvalId: approval.id,
    status: approval.status
  });

  await recordLifecycleEvent({
    commandId: planningRecord.commandId,
    planningId: planningRecord.planningId,
    eventType: 'APPROVAL_CREATED',
    previousState: planningRecord.currentState,
    nextState: planningRecord.currentState,
    actorType: 'system',
    actorId: 'approval-service',
    metadata: {
      approvalId: approval.id,
      approvalStatus: approval.status,
      requestHash
    },
    traceId
  });

  const awaitingApprovalRecord = await transitionLifecycleRecord({
    commandId: planningRecord.commandId,
    expectedState: LIFECYCLE_STATES.PLANNING,
    expectedVersion: planningRecord.stateVersion,
    nextState: LIFECYCLE_STATES.AWAITING_APPROVAL,
    eventType: 'AWAITING_HUMAN_APPROVAL',
    actorType: 'system',
    actorId: 'approval-service',
    metadata: {
      approvalId: approval.id,
      invariants: PLANNING_INVARIANTS
    },
    traceId,
    policyDecision,
    nextAction: 'HUMAN_APPROVAL_REQUIRED',
    approvalId: approval.id
  });

  await writePlanningAudit({
    tenant: envelope.tenant,
    command: envelope.command,
    payload: {
      route: options.route || '/api/v1/planning',
      commandId: envelope.commandId,
      planningId: awaitingApprovalRecord.planningId,
      approvalId: approval.id,
      evidenceLinks: getEvidenceLinks(envelope),
      invariants: PLANNING_INVARIANTS
    },
    result: {
      success: true,
      state: awaitingApprovalRecord.currentState,
      nextAction: awaitingApprovalRecord.nextAction,
      policyDecision,
      approvalId: approval.id,
      traceId
    },
    actor: actorId,
    timestamp: new Date().toISOString()
  });

  completeTrace(traceId, {
    status: 'accepted',
    state: awaitingApprovalRecord.currentState,
    planningId: awaitingApprovalRecord.planningId,
    approvalId: approval.id
  });

  return {
    statusCode: 202,
    payload: buildLifecycleResponse(awaitingApprovalRecord, policyDecision, 'accepted')
  };
}

module.exports = {
  PLANNING_INVARIANTS,
  buildPlanningEnvelope,
  buildScopedIdempotencyKey,
  planCommand
};
