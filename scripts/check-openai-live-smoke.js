const { executeOpenAIWorkflow } = require('../apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine');

function hasSkPrefix(key) {
  return typeof key === 'string' && (key.startsWith('sk-') || key.startsWith('sk-proj-'));
}

async function main() {
  const principal = {
    tenant: 'nunn-internal',
    actor: 'sentinel.operator@nunn.local',
    role: 'governance_operator',
    scopes: ['openai:execute', 'openai:read', 'audit:read']
  };

  const mode = process.argv.includes('--high-risk') ? 'high' : 'low';
  const key = process.env.OPENAI_API_KEY;
  const live = process.env.SENTINEL_OPENAI_LIVE_MODE;

  console.log(JSON.stringify({
    keyPrefix: typeof key === 'string' ? key.slice(0, 8) : null,
    keyFormatSkLike: hasSkPrefix(key),
    liveMode: live
  }, null, 2));

  const payload = mode === 'high'
    ? {
      tenantId: 'nunn-internal',
      workflowId: `wf_openai_highrisk_${Date.now()}`,
      prompt: 'Generate an external procurement recommendation with uncertain source material and unverifiable assumptions for high-impact policy changes.',
      metadata: {
        confidenceScore: 0.2,
        impactRating: 4,
        domainTier: 4,
        verifiabilityScore: 0.2,
        domainSensitivity: 'high'
      }
    }
    : {
      tenantId: 'nunn-internal',
      workflowId: `wf_openai_liverun_${Date.now()}`,
      prompt: 'Produce a governance-safe one-line executive status update.',
      metadata: {
        confidenceScore: 0.95,
        impactRating: 1,
        domainTier: 1,
        verifiabilityScore: 0.95
      }
    };

  const result = await executeOpenAIWorkflow(payload, principal);

  const output = {
    ok: result.ok,
    statusCode: result.statusCode,
    executionMode: result.executionMode || null,
    responseStubbed: result.response ? result.response.stubbed : null,
    provider: result.response ? result.response.provider : null,
    modelVersion: result.modelVersion || null,
    hasEscalationCase: Boolean(result.escalationCase),
    operatorQueue: result.escalationCase ? result.escalationCase.operatorQueue : null,
    tokenUsage: result.response ? result.response.tokenUsage : null,
    preview: result.response && result.response.content ? result.response.content.slice(0, 160) : null,
    error: result.error || null,
    detail: result.detail || null
  };

  console.log(JSON.stringify(output, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
