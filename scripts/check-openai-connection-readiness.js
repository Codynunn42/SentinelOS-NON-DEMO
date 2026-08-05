const {
  INTERNAL_TENANT_ID,
  getOpenAIFaceplaneRuntimeStatus,
  getOpenAIFaceplaneStatus
} = require('../apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig');

function buildGapList(runtime) {
  const gaps = [];

  if (runtime.liveModeRequested && !runtime.hasCredentials) {
    gaps.push('Missing API credentials: set OPENAI_API_KEY or AZURE_OPENAI_API_KEY.');
  }

  if (runtime.provider === 'azure_openai') {
    if (!runtime.azureEndpointConfigured) {
      gaps.push('Azure provider selected but AZURE_OPENAI_ENDPOINT is not configured.');
    }

    if (!runtime.azureDeploymentConfigured) {
      gaps.push('Azure provider selected but AZURE_OPENAI_DEPLOYMENT is not configured.');
    }
  }

  if (runtime.provider === 'openai' && runtime.hasCredentials && runtime.openAIKeyFormatValid === false) {
    gaps.push('OpenAI provider selected but OPENAI_API_KEY format is invalid; expected sk- or sk-proj-.');
  }

  if (runtime.liveModeRequested && !runtime.liveConnectionReady) {
    gaps.push('Live mode requested but runtime connection is not ready; Sentinel remains in stubbed execution mode.');
  }

  return gaps;
}

function main() {
  const status = getOpenAIFaceplaneStatus({ tenantId: INTERNAL_TENANT_ID });
  const runtime = getOpenAIFaceplaneRuntimeStatus(INTERNAL_TENANT_ID);

  if (!runtime) {
    console.log('OpenAI faceplane runtime status unavailable for tenant.');
    process.exitCode = 1;
    return;
  }

  const gaps = buildGapList(runtime);
  const report = {
    timestamp: new Date().toISOString(),
    tenantId: INTERNAL_TENANT_ID,
    faceplane: status.name,
    version: status.version,
    provider: runtime.provider,
    executionMode: runtime.executionMode,
    liveModeRequested: runtime.liveModeRequested,
    liveConnectionReady: runtime.liveConnectionReady,
    hasCredentials: runtime.hasCredentials,
    modelVersion: runtime.modelVersion,
    requestTimeoutMs: runtime.requestTimeoutMs,
    maxCompletionTokens: runtime.maxCompletionTokens,
    gapCount: gaps.length,
    gaps
  };

  console.log(JSON.stringify(report, null, 2));

  if (runtime.liveModeRequested && gaps.length > 0) {
    process.exitCode = 1;
  }
}

main();
