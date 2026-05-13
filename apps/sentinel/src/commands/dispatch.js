const { getSurfaceRegistry } = require('./registry');
const { handleCustomerOps } = require('./customeropsHandlers');
const { mockHandlers } = require('./mockHandlers');
const { normalizeCommandEnvelope } = require('../types/command');
const { auditLogger } = require('../audit/auditLogger');
const { enforceSentinelExecution } = require('../governance/executionGuard');
const { governanceCheck } = require('../governance/preflight');
const { buildCommandTrustInput, buildTrustScoreResult } = require('../trustScore');
const { verifyDecision } = require('../security/signing');
const { buildBlockedPathEvent } = require('../shared/telemetryEventBuilder');
const { createApprovalRequest, getApproval } = require('../approval/approval');
const crypto = require('crypto');

const SIGNING_KEY = process.env.SENTINEL_SIGNING_KEY || '';

function generateCorrelationId() {
  return `corr_${crypto.randomUUID()}`;
}

function emitBlockedPathEvent(envelope, reason, details = {}) {
  const blockedPathEvent = buildBlockedPathEvent(envelope, reason, details);

  // Log to console for Container App capture and Log Analytics ingestion
  console.log(JSON.stringify(blockedPathEvent));
}

async function auditGovernanceBlock(envelope, result, trust = null) {
  await auditLogger.log({
    correlationId: envelope.correlationId || null,
    tenant: envelope.tenant || null,
    command: envelope.command || envelope.legacyCommand || 'unknown',
    payload: envelope.payload,
    result: {
      governance: 'preflight',
      trustScore: trust ? trust.trustScore : null,
      reasons: trust ? trust.reasons : [],
      ...result
    },
    actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
    timestamp: new Date().toISOString()
  });
}

async function auditPolicyAllow(envelope, policy, policyContext) {
  await auditLogger.log({
    correlationId: envelope.correlationId || null,
    tenant: envelope.tenant || null,
    command: 'policy.preflight',
    payload: {
      command: envelope.command || envelope.legacyCommand || 'unknown',
      requiredScope: policyContext && policyContext.requiredScope ? policyContext.requiredScope : null
    },
    result: {
      success: true,
      decision: policy.decision,
      state: policy.state,
      riskLevel: policy.riskLevel,
      approvalRequired: policy.approvalRequired,
      receiptRequired: policy.receiptRequired
    },
    actor: policyContext && policyContext.actor ? policyContext.actor : undefined,
    timestamp: new Date().toISOString()
  });
}

function getEnvelopeApprovalId(envelope = {}) {
  if (envelope.metadata && typeof envelope.metadata.approvalId === 'string') {
    return envelope.metadata.approvalId.trim();
  }

  if (envelope.payload && typeof envelope.payload.approvalId === 'string') {
    return envelope.payload.approvalId.trim();
  }

  return '';
}

async function checkApprovalUnlock(envelope, policy, policyContext) {
  const approvalId = getEnvelopeApprovalId(envelope);

  if (!approvalId) {
    return {
      unlocked: false,
      approval: null,
      approvalId: null
    };
  }

  const tenant = policyContext && policyContext.tenant ? policyContext.tenant : envelope.tenant || null;
  const approval = await getApproval(approvalId, tenant);

  return {
    unlocked: Boolean(approval && approval.status === 'approved'),
    approval,
    approvalId
  };
}

async function createCommandApproval(envelope, policy, policyContext) {
  const approval = await createApprovalRequest(
    {
      state: policy.state,
      riskLevel: policy.riskLevel,
      decision: policy.decision,
      reason: policy.reason,
      approvalRequired: true,
      unlockOnApproval: true,
      status: 'awaiting_approval',
      executionStatus: 'awaiting_approval'
    },
    {
      tenant: policyContext && policyContext.tenant ? policyContext.tenant : envelope.tenant || null,
      actor: policyContext && policyContext.actor ? policyContext.actor : undefined,
      command: envelope.command || envelope.legacyCommand || 'unknown',
      approvalType: 'command_execution_unlock',
      originalCommand: {
        tenant: envelope.tenant || null,
        command: envelope.command || envelope.legacyCommand || null,
        payload: envelope.payload || {},
        metadata: {
          actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : null,
          role: envelope.metadata && envelope.metadata.role ? envelope.metadata.role : null,
          keyId: envelope.metadata && envelope.metadata.keyId ? envelope.metadata.keyId : null
        }
      }
    }
  );

  approval.decision = {
    ...(approval.decision || {}),
    approvalId: approval.id
  };

  return approval;
}

async function dispatchCommand(body, context) {
  const startTime = Date.now();
  const correlationId = (context && context.correlationId) || generateCorrelationId();
  const envelope = normalizeCommandEnvelope(body);
  envelope.correlationId = correlationId;
  const executionGuard = enforceSentinelExecution(envelope, context);

  if (!executionGuard.allowed) {
    const failure = {
      success: false,
      statusCode: executionGuard.statusCode,
      error: executionGuard.error,
      details: executionGuard.details,
      data: {
        trustScore: 0,
        reasons: ['execution_guard_block']
      }
    };

    emitBlockedPathEvent(envelope, 'execution_guard_block', {
      trustScore: 0,
      executionPath: executionGuard.details && executionGuard.details.executionPath
    });

    await auditGovernanceBlock(envelope, failure, {
      trustScore: 0,
      reasons: ['execution_guard_block']
    });
    return failure;
  }

  const governance = governanceCheck(envelope, context && context.signals ? context.signals : {}, context ? context.principal : null);

  // ENV-003: verify decision signature if present
  if (governance.decision && governance.decision.signature !== undefined) {
    if (SIGNING_KEY && !verifyDecision(governance.decision, SIGNING_KEY)) {
      const sigFailure = {
        success: false,
        statusCode: 403,
        error: 'SIGNATURE_VERIFICATION_FAILED',
        details: { reason: 'tampered_or_unsigned_decision', correlationId }
      };
      emitBlockedPathEvent(envelope, 'signature_verification_failed', {
        trustScore: 0,
        correlationId,
        severity: 'critical'
      });
      await auditGovernanceBlock(envelope, sigFailure, { trustScore: 0, reasons: ['signature_verification_failed'] });
      return sigFailure;
    }
  }
  if (!governance.allowed) {
    const blockedPolicy = governance.policy || (governance.details && governance.details.policy) || {};
    const blockedPolicyContext = governance.policyContext || (governance.details && governance.details.policyContext) || {};

    if (blockedPolicy.approvalRequired) {
      const approvalUnlock = await checkApprovalUnlock(envelope, blockedPolicy, blockedPolicyContext);

      if (approvalUnlock.unlocked) {
        governance.allowed = true;
        governance.policy = {
          ...blockedPolicy,
          allowed: true,
          decision: 'allow',
          approvalRequired: false,
          approvalId: approvalUnlock.approvalId,
          unlockOnApproval: true,
          executionStatus: 'allowed'
        };
        governance.policyContext = blockedPolicyContext;
      } else {
        const approval = approvalUnlock.approval || await createCommandApproval(envelope, blockedPolicy, blockedPolicyContext);
        const failure = {
          success: false,
          statusCode: 423,
          error: 'APPROVAL_REQUIRED',
          details: {
            ...(governance.details || {}),
            approvalRequired: true,
            approvalId: approval.id,
            unlockOnApproval: true,
            executionStatus: 'awaiting_approval',
            approvalStatus: approval.status
          },
          data: {
            approvalRequired: true,
            approvalId: approval.id,
            unlockOnApproval: true,
            executionStatus: 'awaiting_approval',
            approvalStatus: approval.status,
            trustScore: 0,
            reasons: ['approval_required']
          }
        };

        emitBlockedPathEvent(envelope, blockedPolicy.reason || 'approval_required', {
          approvalId: approval.id,
          approvalStatus: approval.status,
          blockingPolicy: blockedPolicy
        });

        await auditGovernanceBlock(envelope, failure, {
          trustScore: 0,
          reasons: ['approval_required']
        });
        return failure;
      }
    }
  }

  if (!governance.allowed) {
    const blockedPolicy = governance.policy || (governance.details && governance.details.policy) || {};
    const blockedPolicyContext = governance.policyContext || (governance.details && governance.details.policyContext) || {};
    const trust = buildTrustScoreResult(buildCommandTrustInput({
      envelope,
      policy: blockedPolicy,
      policyContext: blockedPolicyContext,
      latencyMs: Date.now() - startTime,
      result: { success: false }
    }));
    const failure = {
      success: false,
      statusCode: governance.statusCode,
      error: governance.error,
      details: governance.details,
      data: {
        trustScore: trust.trustScore,
        reasons: trust.reasons
      }
    };

    emitBlockedPathEvent(envelope, governance.policy ? governance.policy.reason : 'governance_preflight_block', {
      trustScore: trust.trustScore,
      blockingPolicy: blockedPolicy,
      reasons: trust.reasons
    });

    await auditGovernanceBlock(envelope, failure, trust);
    return failure;
  }

  await auditPolicyAllow(envelope, governance.policy, governance.policyContext);

  if (envelope.command && envelope.command.startsWith('support.')) {
    return executeHandler({
      envelope,
      context,
      governance,
      startTime,
      handler: () => handleCustomerOps(envelope, {
        ...context,
        tenant: envelope.tenant
      })
    });
  }

  if (envelope.command && envelope.command.startsWith('faceplane.mock.')) {
    const mockHandler = mockHandlers[envelope.command];

    if (!mockHandler) {
      return {
        success: false,
        statusCode: 400,
        error: `Unknown command: ${envelope.command}`
      };
    }

    return executeHandler({
      envelope,
      context,
      governance,
      startTime,
      handler: () => mockHandler(envelope.payload, {
        ...context,
        tenant: envelope.tenant
      })
    });
  }

  const surfaceRegistry = getSurfaceRegistry();
  const surface = surfaceRegistry[envelope.tenant];
  if (!surface) {
    return {
      success: false,
      statusCode: 400,
      error: `Unknown tenant: ${envelope.tenant}`
    };
  }

  const handler = surface.handlers[envelope.command];
  if (!handler) {
    return {
      success: false,
      statusCode: 400,
      error: `Unknown command: ${envelope.command}`
    };
  }

  return executeHandler({
    envelope,
    context,
    governance,
    startTime,
    handler: () => handler(
      envelope.payload,
      {
        ...context,
        tenant: envelope.tenant
      },
      envelope
    )
  });
}

async function executeHandler({ envelope, context, governance, startTime, handler }) {
  try {
    const result = await handler();
    const trust = buildTrustScoreResult(buildCommandTrustInput({
      envelope,
      policy: governance.policy,
      policyContext: governance.policyContext,
      latencyMs: Date.now() - startTime,
      result
    }));
    const enrichedResult = {
      ...result,
      data: {
        ...(result && result.data && typeof result.data === 'object' ? result.data : {}),
        trustScore: trust.trustScore,
        reasons: trust.reasons
      }
    };

    await auditLogger.log({
      correlationId: envelope.correlationId || null,
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result: enrichedResult,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return enrichedResult;
  } catch (error) {
    const trust = buildTrustScoreResult(buildCommandTrustInput({
      envelope,
      policy: governance.policy,
      policyContext: governance.policyContext,
      latencyMs: Date.now() - startTime,
      result: { success: false }
    }));
    const failure = {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Execution error',
      data: {
        trustScore: trust.trustScore,
        reasons: trust.reasons
      }
    };

    await auditLogger.log({
      correlationId: envelope.correlationId || null,
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result: failure,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return failure;
  }
}

module.exports = {
  dispatchCommand
};
