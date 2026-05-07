const {
  getOpenAIFaceplaneConfig,
  getOpenAIFaceplaneStatus
} = require('./openaiFaceplaneConfig');
const { executeOpenAIWorkflow } = require('./openaiWorkflowEngine');

function getOpenAIConfigForTenant(tenantId, principal) {
  const config = getOpenAIFaceplaneConfig(tenantId);

  if (!config) {
    return {
      ok: false,
      statusCode: tenantId ? 404 : 400,
      error: tenantId ? 'FACEPLANE_TENANT_NOT_ACTIVE' : 'TENANT_ID_REQUIRED'
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

module.exports = {
  executeOpenAIWorkflow,
  getOpenAIConfigForTenant,
  getOpenAIFaceplaneStatus
};
