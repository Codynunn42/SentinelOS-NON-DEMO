const { getSurfaceRegistry } = require('./registry');
const { normalizeCommandEnvelope } = require('../types/command');
const { auditLogger } = require('../audit/auditLogger');
const { governanceCheck } = require('../governance/preflight');

async function auditGovernanceBlock(envelope, result) {
  await auditLogger.log({
    tenant: envelope.tenant || null,
    command: envelope.command || envelope.legacyCommand || 'unknown',
    payload: envelope.payload,
    result: {
      governance: 'preflight',
      ...result
    },
    actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
    timestamp: new Date().toISOString()
  });
}

async function auditPolicyAllow(envelope, policy, policyContext) {
  await auditLogger.log({
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
  const envelope = normalizeCommandEnvelope(body);

  const governance = governanceCheck(envelope, context && context.signals ? context.signals : {}, context ? context.principal : null);
  if (!governance.allowed) {
    const failure = {
      success: false,
      statusCode: governance.statusCode,
      error: governance.error,
      details: governance.details
    };

    await auditGovernanceBlock(envelope, failure);
    return failure;
  }

  await auditPolicyAllow(envelope, governance.policy, governance.policyContext);

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

  try {
    const result = await handler(
      envelope.payload,
      {
        ...context,
        tenant: envelope.tenant
      },
      envelope
    );

    await auditLogger.log({
      tenant: envelope.tenant,
      command: envelope.command,
      payload: envelope.payload,
      result,
      actor: envelope.metadata && envelope.metadata.actor ? envelope.metadata.actor : undefined,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    const failure = {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Execution error'
    };

    await auditLogger.log({
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
