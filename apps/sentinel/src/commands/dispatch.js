const { getSurfaceRegistry } = require('./registry');
const { handleCustomerOps } = require('./customeropsHandlers');
const { normalizeCommandEnvelope } = require('../types/command');
const { auditLogger } = require('../audit/auditLogger');
const { enforceSentinelExecution } = require('../governance/executionGuard');
const { governanceCheck } = require('../governance/preflight');
const { buildCommandTrustInput, buildTrustScoreResult } = require('../trustScore');
const { verifyDecision } = require('../security/signing');
const crypto = require('crypto');

const SIGNING_KEY = process.env.SENTINEL_SIGNING_KEY || '';

function generateCorrelationId() {
  return `corr_${crypto.randomUUID()}`;
}

function emitBlockedPathEvent(envelope, reason, details = {}) {
  // Emit distinct Log Analytics telemetry marker for governance denials
  const blockedPathEvent = {
    source: 'sentinel-api',
    category: 'governance',
    eventType: 'blocked-path',
    timestamp: new Date().toISOString(),
    command: envelope.command || envelope.legacyCommand || 'unknown',
    tenant: envelope.tenant || null,
    actor: (envelope.metadata && envelope.metadata.actor) || null,
    reason,
    trustScore: details.trustScore || 0,
    blockingPolicy: details.blockingPolicy || null,
    executionPath: details.executionPath || null,
    ...details
  };

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
