const { getSurfaceRegistry } = require('./registry');
const { handleCustomerOps } = require('./customeropsHandlers');
const { mockHandlers } = require('./mockHandlers');
const { normalizeCommandEnvelope } = require('../types/command');
const { auditLogger } = require('../audit/auditLogger');
const { enforceSentinelExecution } = require('../governance/executionGuard');
const { governanceCheck } = require('../governance/preflight');
const { buildCommandTrustInput, buildTrustScoreResult } = require('../trustScore');
const { getDecisionSigningKey, verifyDecision } = require('../security/signing');
const { buildBlockedPathEvent } = require('../shared/telemetryEventBuilder');
const { createApprovalRequest, getApproval } = require('../approval/approval');
const crypto = require('crypto');

function generateCorrelationId() {
  return `corr_${crypto.randomUUID()}`;
}

function buildRetryGuidance(reason, details = {}) {
  if (reason === 'approval_required' || details.approvalRequired) {
    return {
      retryable: true,
      retryWhen: 'approval_approved',
      concept: 'approval_continuity',
      nextAction: 'wait_for_approval_then_resubmit_with_approval_id'
    };
  }

  if (reason === 'signature_verification_failed') {
    return {
      retryable: false,
      retryWhen: 'never',
      concept: 'execution_integrity',
      nextAction: 'regenerate_signed_decision_before_execution'
    };
  }

  if (reason === 'execution_guard_block') {
    return {
      retryable: false,
      retryWhen: 'never',
      concept: 'execution_authority',
      nextAction: 'route_through_signed_sentinel_command_path'
    };
  }

  if (reason === 'policy_blocked' || reason === 'governance_preflight_block') {
    return {
      retryable: false,
      retryWhen: 'policy_context_changes',
      concept: 'policy_boundary',
      nextAction: 'correct_scope_role_tenant_or_command_before_retry'
    };
  }

  if (reason === 'unknown_route') {
    return {
      retryable: false,
      retryWhen: 'command_registered',
      concept: 'surface_registry',
      nextAction: 'register_or_correct_tenant_command_mapping'
    };
  }

  return {
    retryable: false,
    retryWhen: 'operator_review',
    concept: 'workflow_control',
    nextAction: 'review_blocked_path_before_retry'
  };
}

function attachRetryGuidance(response, reason, details = {}) {
  const retry = buildRetryGuidance(reason, details);

  return {
    ...response,
    details: {
      ...(response.details || {}),
      retry
    },
    data: {
      ...(response.data || {}),
      retry
    }
  };
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
      signature: policyContext && policyContext.decision ? policyContext.decision.signature : null,
      signatureVersion: policyContext && policyContext.decision ? policyContext.decision.signatureVersion : null,
      signedAt: policyContext && policyContext.decision ? policyContext.decision.signedAt : null,
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
    const failure = attachRetryGuidance({
      success: false,
      statusCode: executionGuard.statusCode,
      error: executionGuard.error,
      details: executionGuard.details,
      data: {
        trustScore: 0,
        reasons: ['execution_guard_block']
      }
    }, 'execution_guard_block');

    emitBlockedPathEvent(envelope, 'execution_guard_block', {
      trustScore: 0,
      retry: failure.data.retry,
      executionPath: executionGuard.details && executionGuard.details.executionPath
    });

    await auditGovernanceBlock(envelope, failure, {
      trustScore: 0,
      reasons: ['execution_guard_block']
    });
    return failure;
  }

  const governance = governanceCheck(envelope, context && context.signals ? context.signals : {}, context ? context.principal : null);

  const signingKey = getDecisionSigningKey();
  const decisionVerified = signingKey && governance.decision && verifyDecision(governance.decision, signingKey);

  if (!decisionVerified) {
    const sigFailure = attachRetryGuidance({
      success: false,
      statusCode: 403,
      error: 'SIGNATURE_VERIFICATION_FAILED',
      details: { reason: 'tampered_or_unsigned_decision', correlationId }
    }, 'signature_verification_failed');
    emitBlockedPathEvent(envelope, 'signature_verification_failed', {
      trustScore: 0,
      correlationId,
      retry: sigFailure.data.retry,
      severity: 'critical'
    });
    await auditGovernanceBlock(envelope, sigFailure, { trustScore: 0, reasons: ['signature_verification_failed'] });
    return sigFailure;
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
        const failure = attachRetryGuidance({
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
        }, 'approval_required', { approvalRequired: true });

        emitBlockedPathEvent(envelope, blockedPolicy.reason || 'approval_required', {
          approvalId: approval.id,
          approvalStatus: approval.status,
          retry: failure.data.retry,
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
    const failure = attachRetryGuidance({
      success: false,
      statusCode: governance.statusCode,
      error: governance.error,
      details: governance.details,
      data: {
        trustScore: trust.trustScore,
        reasons: trust.reasons
      }
    }, 'policy_blocked');

    emitBlockedPathEvent(envelope, governance.policy ? governance.policy.reason : 'governance_preflight_block', {
      trustScore: trust.trustScore,
      blockingPolicy: blockedPolicy,
      retry: failure.data.retry,
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
      return attachRetryGuidance({
        success: false,
        statusCode: 400,
        error: `Unknown command: ${envelope.command}`
      }, 'unknown_route');
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
    return attachRetryGuidance({
      success: false,
      statusCode: 400,
      error: `Unknown tenant: ${envelope.tenant}`
    }, 'unknown_route');
  }

  const handler = surface.handlers[envelope.command];
  if (!handler) {
    return attachRetryGuidance({
      success: false,
      statusCode: 400,
      error: `Unknown command: ${envelope.command}`
    }, 'unknown_route');
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
