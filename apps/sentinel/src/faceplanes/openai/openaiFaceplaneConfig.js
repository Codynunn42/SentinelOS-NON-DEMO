const { hasText } = require('../../shared/validation');
const INTERNAL_TENANT_ID = 'nunn-internal';
const FACEPLANE_NAME = 'openai';
const FACEPLANE_VERSION = 'Faceplane_OpenAI_v1';
const INTERNAL_GOVERNANCE_LAB_TIER = 'internal_governance_lab';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_AZURE_OPENAI_API_VERSION = '2024-10-21';

const OPENAI_FACEPLANE_CONFIGS = Object.freeze({
  [INTERNAL_TENANT_ID]: Object.freeze({
    tenantId: INTERNAL_TENANT_ID,
    gaasTier: INTERNAL_GOVERNANCE_LAB_TIER,
    openaiModelVersion: 'stubbed-openai-v1',
    maxTokenLimit: 2048,
    escalationSensitivityMultiplier: 1.25,
    humanApprovalRequired: true,
    driftTrackingEnabled: true,
    auditLogEnabled: true,
    validationMode: 'internal_only',
    verboseLoggingEnabled: true,
    productionSlaClaimsEnabled: false,
    thresholdExperimentationAllowed: true
  })
});

function listOpenAIFaceplaneConfigs() {
  return Object.values(OPENAI_FACEPLANE_CONFIGS);
}

function parseBooleanEnv(value) {
  if (!hasText(value)) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function isOpenAISecretKeyFormat(apiKey) {
  if (!hasText(apiKey)) {
    return false;
  }

  const trimmed = apiKey.trim();
  return trimmed.startsWith('sk-') || trimmed.startsWith('sk-proj-');
}

function getOpenAIRuntimeConnection(config) {
  const provider = hasText(process.env.AZURE_OPENAI_ENDPOINT) ? 'azure_openai' : 'openai';
  const liveModeRequested = parseBooleanEnv(process.env.SENTINEL_OPENAI_LIVE_MODE);
  const apiKey = hasText(process.env.AZURE_OPENAI_API_KEY)
    ? process.env.AZURE_OPENAI_API_KEY
    : process.env.OPENAI_API_KEY;
  const hasCredentials = hasText(apiKey);

  const openaiBaseUrl = hasText(process.env.OPENAI_BASE_URL)
    ? process.env.OPENAI_BASE_URL.trim().replace(/\/$/, '')
    : DEFAULT_OPENAI_BASE_URL;
  const openaiModel = hasText(process.env.OPENAI_MODEL)
    ? process.env.OPENAI_MODEL.trim()
    : DEFAULT_OPENAI_MODEL;
  const openAIKeyFormatValid = isOpenAISecretKeyFormat(apiKey);

  const azureEndpoint = hasText(process.env.AZURE_OPENAI_ENDPOINT)
    ? process.env.AZURE_OPENAI_ENDPOINT.trim().replace(/\/$/, '')
    : '';
  const azureDeployment = hasText(process.env.AZURE_OPENAI_DEPLOYMENT)
    ? process.env.AZURE_OPENAI_DEPLOYMENT.trim()
    : '';
  const azureApiVersion = hasText(process.env.AZURE_OPENAI_API_VERSION)
    ? process.env.AZURE_OPENAI_API_VERSION.trim()
    : DEFAULT_AZURE_OPENAI_API_VERSION;
  const azureReady = hasText(azureEndpoint) && hasText(azureDeployment) && hasCredentials;
  const openAIReady = hasText(openaiBaseUrl) && hasText(openaiModel) && hasCredentials && openAIKeyFormatValid;
  const liveConnectionReady = provider === 'azure_openai' ? azureReady : openAIReady;

  return {
    provider,
    executionMode: liveModeRequested && liveConnectionReady ? 'live' : 'stubbed',
    liveModeRequested,
    liveConnectionReady,
    hasCredentials,
    openAIKeyFormatValid,
    modelVersion: openaiModel,
    openaiBaseUrl,
    azureEndpoint,
    azureDeployment,
    azureApiVersion,
    requestTimeoutMs: Number.parseInt(process.env.SENTINEL_OPENAI_TIMEOUT_MS || '30000', 10) || 30000,
    maxCompletionTokens: Number.parseInt(process.env.SENTINEL_OPENAI_MAX_COMPLETION_TOKENS || '512', 10) || 512,
    apiKey
  };
}

function getOpenAIFaceplaneRuntimeStatus(tenantId) {
  const config = getOpenAIFaceplaneConfig(tenantId || INTERNAL_TENANT_ID);
  if (!config) {
    return null;
  }

  const runtime = getOpenAIRuntimeConnection(config);
  return {
    provider: runtime.provider,
    executionMode: runtime.executionMode,
    liveModeRequested: runtime.liveModeRequested,
    liveConnectionReady: runtime.liveConnectionReady,
    hasCredentials: runtime.hasCredentials,
    openAIKeyFormatValid: runtime.provider === 'openai' ? runtime.openAIKeyFormatValid : undefined,
    modelVersion: runtime.modelVersion,
    openaiBaseUrl: runtime.provider === 'openai' ? runtime.openaiBaseUrl : undefined,
    azureEndpointConfigured: runtime.provider === 'azure_openai' ? hasText(runtime.azureEndpoint) : undefined,
    azureDeploymentConfigured: runtime.provider === 'azure_openai' ? hasText(runtime.azureDeployment) : undefined,
    requestTimeoutMs: runtime.requestTimeoutMs,
    maxCompletionTokens: runtime.maxCompletionTokens
  };
}

function getOpenAIFaceplaneConfig(tenantId) {
  if (!hasText(tenantId)) {
    return null;
  }

  return OPENAI_FACEPLANE_CONFIGS[tenantId.trim()] || null;
}

function assertTenantScope({ tenantId, principal } = {}) {
  if (!hasText(tenantId)) {
    return {
      ok: false,
      statusCode: 400,
      error: 'TENANT_ID_REQUIRED'
    };
  }

  const config = getOpenAIFaceplaneConfig(tenantId);

  if (!config) {
    return {
      ok: false,
      statusCode: 404,
      error: 'FACEPLANE_TENANT_NOT_ACTIVE'
    };
  }

  if (principal && principal.tenant !== 'platform' && principal.tenant !== tenantId) {
    return {
      ok: false,
      statusCode: 403,
      error: 'TENANT_MISMATCH'
    };
  }

  return {
    ok: true,
    config
  };
}

function getOpenAIFaceplaneStatus(options = {}) {
  const activeConfigs = options.tenantId
    ? listOpenAIFaceplaneConfigs().filter((config) => config.tenantId === options.tenantId)
    : listOpenAIFaceplaneConfigs();
  const validationModes = [...new Set(activeConfigs.map((config) => config.validationMode))];
  const runtime = options.tenantId ? getOpenAIFaceplaneRuntimeStatus(options.tenantId) : null;

  return {
    name: FACEPLANE_NAME,
    version: FACEPLANE_VERSION,
    tenantsActive: activeConfigs.length,
    validationMode: validationModes.length === 1 ? validationModes[0] : 'mixed',
    driftTracking: activeConfigs.every((config) => config.driftTrackingEnabled === true),
    auditLogging: activeConfigs.every((config) => config.auditLogEnabled === true),
    rbacEnforced: true,
    runtime,
    tenants: activeConfigs.map((config) => ({
      tenantId: config.tenantId,
      gaasTier: config.gaasTier,
      validationMode: config.validationMode,
      humanApprovalRequired: config.humanApprovalRequired,
      runtime: getOpenAIFaceplaneRuntimeStatus(config.tenantId)
    }))
  };
}

module.exports = {
  FACEPLANE_NAME,
  FACEPLANE_VERSION,
  INTERNAL_GOVERNANCE_LAB_TIER,
  INTERNAL_TENANT_ID,
  assertTenantScope,
  getOpenAIRuntimeConnection,
  getOpenAIFaceplaneConfig,
  getOpenAIFaceplaneRuntimeStatus,
  getOpenAIFaceplaneStatus,
  isOpenAISecretKeyFormat,
  listOpenAIFaceplaneConfigs
};
