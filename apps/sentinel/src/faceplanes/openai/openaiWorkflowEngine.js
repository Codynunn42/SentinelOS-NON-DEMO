const crypto = require('crypto');
const { NVOP_FORMULA, NVOP_THRESHOLDS } = require('../../governance/vendorOnboarding/nvopConfig');
const {
  assertTenantScope,
  getOpenAIFaceplaneConfig
} = require('./openaiFaceplaneConfig');
const { appendOpenAIAuditEntry } = require('./openaiAuditAdapter');
const { routeOpenAIEscalation } = require('./openaiEscalationAdapter');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRiskState(riskIndex) {
  const threshold = NVOP_THRESHOLDS.find((item) => {
    return riskIndex > item.minExclusive && riskIndex <= item.maxInclusive;
  });

  return threshold || NVOP_THRESHOLDS[NVOP_THRESHOLDS.length - 1];
}

function buildRiskInputs(prompt, metadata = {}, config) {
  const defaultImpact = prompt.length > 600 ? 3 : 2;
  const defaultDomain = metadata.domainSensitivity === 'high' ? 3 : 2;

  return {
    C: clamp(asNumber(metadata.confidenceScore, 0.72), 0, 1),
    I: clamp(asNumber(metadata.impactRating, defaultImpact), 1, 4),
    D: clamp(asNumber(metadata.domainTier, defaultDomain), 1, 4),
    V: clamp(asNumber(metadata.verifiabilityScore, 0.62), 0, 1),
    M: config.escalationSensitivityMultiplier
  };
}

function evaluateOpenAIRisk(prompt, metadata = {}, config) {
  const inputs = buildRiskInputs(prompt, metadata, config);
  const riskIndex = round((1 - inputs.C) * inputs.I * inputs.D * (1 - inputs.V) * inputs.M);
  const mapped = mapRiskState(riskIndex);
  const triggeredRules = [];

  if (metadata.domainSensitivity === 'high' || inputs.D >= 3) {
    triggeredRules.push('OPENAI-RISK-DOMAIN-SENSITIVITY');
  }

  if (inputs.V < 0.5) {
    triggeredRules.push('OPENAI-RISK-LOW-VERIFIABILITY');
  }

  if (inputs.I >= 4) {
    triggeredRules.push('OPENAI-RISK-HIGH-IMPACT');
  }

  return {
    formula: `${NVOP_FORMULA} * escalationSensitivityMultiplier`,
    riskIndex,
    state: mapped.state,
    stateLabel: mapped.label,
    inputs,
    triggeredRules,
    escalationRequired: config.humanApprovalRequired && mapped.state >= 2
  };
}

function callStubbedOpenAIAdapter({ prompt, config }) {
  return Object.freeze({
    provider: 'openai',
    modelVersion: config.openaiModelVersion,
    stubbed: true,
    content: `Governed stub response accepted for prompt hash ${sha256(prompt).slice(0, 12)}.`,
    tokenUsage: {
      promptTokens: Math.ceil(prompt.length / 4),
      completionTokens: 24,
      maxTokenLimit: config.maxTokenLimit
    }
  });
}

function executeOpenAIWorkflow(input = {}, principal = {}, options = {}) {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  const tenantId = typeof input.tenantId === 'string' ? input.tenantId.trim() : '';
  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
  const workflowId = input.workflowId || `wf_openai_${crypto.randomUUID()}`;
  const scope = assertTenantScope({ tenantId, principal });

  if (!scope.ok) {
    return {
      ok: false,
      statusCode: scope.statusCode,
      error: scope.error
    };
  }

  if (!prompt) {
    return {
      ok: false,
      statusCode: 400,
      error: 'PROMPT_REQUIRED'
    };
  }

  const config = getOpenAIFaceplaneConfig(tenantId);
  const promptTokens = Math.ceil(prompt.length / 4);

  if (promptTokens > config.maxTokenLimit) {
    return {
      ok: false,
      statusCode: 400,
      error: 'TOKEN_LIMIT_EXCEEDED',
      tokenEstimate: promptTokens,
      maxTokenLimit: config.maxTokenLimit
    };
  }

  const risk = evaluateOpenAIRisk(prompt, metadata, config);
  const workflow = {
    workflowId,
    tenantId,
    promptHash: sha256(prompt),
    metadata,
    createdAt: new Date().toISOString()
  };
  const escalationCase = risk.escalationRequired
    ? routeOpenAIEscalation({ workflow, risk, config, principal })
    : null;
  const response = escalationCase ? null : callStubbedOpenAIAdapter({ prompt, config });
  const auditEntry = appendOpenAIAuditEntry({
    workflowId,
    tenantId,
    gaasTier: config.gaasTier,
    promptHash: workflow.promptHash,
    modelVersion: config.openaiModelVersion,
    riskIndex: risk.riskIndex,
    escalationState: risk.state,
    auditLogEnabled: config.auditLogEnabled,
    driftTrackingEnabled: config.driftTrackingEnabled
  }, {
    ledgerPath: options.ledgerPath
  });

  return {
    ok: true,
    statusCode: escalationCase ? 202 : 200,
    workflowId,
    tenantId,
    faceplane: 'openai',
    gaasTier: config.gaasTier,
    modelVersion: config.openaiModelVersion,
    risk,
    escalationCase,
    response,
    auditEntry
  };
}

module.exports = {
  callStubbedOpenAIAdapter,
  evaluateOpenAIRisk,
  executeOpenAIWorkflow,
  mapRiskState
};
