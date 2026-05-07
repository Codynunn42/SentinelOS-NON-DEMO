const INTERNAL_TENANT_ID = 'nunn-internal';
const FACEPLANE_NAME = 'openai';
const FACEPLANE_VERSION = 'Faceplane_OpenAI_v1';
const INTERNAL_GOVERNANCE_LAB_TIER = 'internal_governance_lab';

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

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function listOpenAIFaceplaneConfigs() {
  return Object.values(OPENAI_FACEPLANE_CONFIGS);
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

  return {
    name: FACEPLANE_NAME,
    version: FACEPLANE_VERSION,
    tenantsActive: activeConfigs.length,
    validationMode: validationModes.length === 1 ? validationModes[0] : 'mixed',
    driftTracking: activeConfigs.every((config) => config.driftTrackingEnabled === true),
    auditLogging: activeConfigs.every((config) => config.auditLogEnabled === true),
    rbacEnforced: true,
    tenants: activeConfigs.map((config) => ({
      tenantId: config.tenantId,
      gaasTier: config.gaasTier,
      validationMode: config.validationMode,
      humanApprovalRequired: config.humanApprovalRequired
    }))
  };
}

module.exports = {
  FACEPLANE_NAME,
  FACEPLANE_VERSION,
  INTERNAL_GOVERNANCE_LAB_TIER,
  INTERNAL_TENANT_ID,
  assertTenantScope,
  getOpenAIFaceplaneConfig,
  getOpenAIFaceplaneStatus,
  listOpenAIFaceplaneConfigs
};
