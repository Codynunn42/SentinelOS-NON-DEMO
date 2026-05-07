const assert = require('assert');
const fs = require('fs');
const {
  getOpenAIFaceplaneConfig,
  getOpenAIFaceplaneStatus,
  INTERNAL_TENANT_ID
} = require('../apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig');
const {
  executeOpenAIWorkflow,
  evaluateOpenAIRisk
} = require('../apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine');
const {
  listOpenAIEscalations,
  resetOpenAIEscalations
} = require('../apps/sentinel/src/faceplanes/openai/openaiEscalationAdapter');
const {
  readOpenAIAuditEntries,
  verifyOpenAIAuditLedger
} = require('../apps/sentinel/src/faceplanes/openai/openaiAuditAdapter');
const { evaluateDrift } = require('../apps/sentinel/src/governance/core/driftMonitor');

const ledgerPath = '/private/tmp/sentinel_openai_faceplane_check_ledger.jsonl';
fs.rmSync(ledgerPath, { force: true });
resetOpenAIEscalations();

const principal = {
  tenant: INTERNAL_TENANT_ID,
  actor: 'sentinel.operator@nunn.local',
  role: 'governance_operator',
  scopes: ['openai:execute', 'openai:read', 'audit:read']
};

const config = getOpenAIFaceplaneConfig(INTERNAL_TENANT_ID);
assert(config);
assert.strictEqual(config.gaasTier, 'internal_governance_lab');
assert.strictEqual(config.driftTrackingEnabled, true);
assert.strictEqual(config.auditLogEnabled, true);

const status = getOpenAIFaceplaneStatus();
assert.strictEqual(status.tenantsActive, 1);
assert.strictEqual(status.validationMode, 'internal_only');
assert.strictEqual(status.rbacEnforced, true);

const crossTenant = executeOpenAIWorkflow({
  tenantId: 'external-tenant',
  prompt: 'Summarize this vendor risk note.'
}, principal, { ledgerPath });
assert.strictEqual(crossTenant.ok, false);
assert.strictEqual(crossTenant.error, 'FACEPLANE_TENANT_NOT_ACTIVE');

const tenantMismatch = executeOpenAIWorkflow({
  tenantId: INTERNAL_TENANT_ID,
  prompt: 'Summarize this vendor risk note.'
}, { ...principal, tenant: 'ownerfi' }, { ledgerPath });
assert.strictEqual(tenantMismatch.ok, false);
assert.strictEqual(tenantMismatch.error, 'TENANT_MISMATCH');

const lowRisk = executeOpenAIWorkflow({
  tenantId: INTERNAL_TENANT_ID,
  workflowId: 'wf_openai_low_risk',
  prompt: 'Draft a neutral status sentence for an internal governance note.',
  metadata: {
    confidenceScore: 0.92,
    impactRating: 1,
    domainTier: 1,
    verifiabilityScore: 0.9
  }
}, principal, { ledgerPath });
assert.strictEqual(lowRisk.ok, true);
assert.strictEqual(lowRisk.statusCode, 200);
assert.strictEqual(lowRisk.response.stubbed, true);
assert.strictEqual(lowRisk.escalationCase, null);
assert(lowRisk.risk.riskIndex <= 0.5);

const highRisk = executeOpenAIWorkflow({
  tenantId: INTERNAL_TENANT_ID,
  workflowId: 'wf_openai_high_risk',
  prompt: 'Generate an external procurement recommendation with uncertain source material.',
  metadata: {
    confidenceScore: 0.35,
    impactRating: 4,
    domainTier: 4,
    verifiabilityScore: 0.3,
    domainSensitivity: 'high'
  }
}, principal, { ledgerPath });
assert.strictEqual(highRisk.ok, true);
assert.strictEqual(highRisk.statusCode, 202);
assert.strictEqual(highRisk.response, null);
assert(highRisk.risk.riskIndex > 3);
assert.strictEqual(highRisk.risk.state, 3);
assert(highRisk.escalationCase);
assert.strictEqual(highRisk.escalationCase.operatorQueue, 'operator.openai');
assert.strictEqual(listOpenAIEscalations(INTERNAL_TENANT_ID).length, 1);

const risk = evaluateOpenAIRisk('High impact unverifiable task', {
  confidenceScore: 0.5,
  impactRating: 4,
  domainTier: 3,
  verifiabilityScore: 0.4
}, config);
assert(risk.riskIndex >= 1.3);
assert(risk.escalationRequired);

const entries = readOpenAIAuditEntries(ledgerPath);
assert.strictEqual(entries.length, 2);
assert(entries.every((entry) => entry.faceplane === 'openai'));
assert(entries.every((entry) => entry.tenantId === INTERNAL_TENANT_ID));
assert(entries.every((entry) => entry.promptHash && entry.promptHash.length === 64));
assert.strictEqual(verifyOpenAIAuditLedger(ledgerPath).ok, true);

const drift = evaluateDrift({
  case_count: 1000,
  escalation_rate: 0.03,
  nvop_state_distribution: {
    0: 901,
    1: 69,
    2: 24,
    3: 6
  },
  operator_override_rate: 0.02,
  average_latency_seconds_by_state: {
    2: 19.38
  }
});
assert.strictEqual(drift.observationalOnly, true);
assert.strictEqual(drift.posture, 'stable');

console.log('OpenAI faceplane check passed');
