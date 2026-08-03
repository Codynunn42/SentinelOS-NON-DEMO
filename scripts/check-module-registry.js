'use strict';

// C5.1-C5.3 — Institutional Module Layer Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all C5 module layer deliverables:
//
//   C5.1 / C5.2 — Module Registry + Taxonomy:
//     - modules/registry.js exports required functions
//     - All 6 initial modules registered and active
//     - Each module has required fields (moduleId, displayName, capabilities, providers, governance)
//     - resolveCapabilityToModule maps capability IDs to the correct module
//
//   Module Resolver (C5.2):
//     - modules/resolver.js exports getModuleSummary, listModuleSummaries, resolveCapabilityToModule
//     - computeModuleHealth returns 'healthy' | 'degraded' | 'unknown'
//     - listModuleSummaries returns all active modules without exposing provider names
//     - getModuleSummary returns correct shape for a single module
//
//   C5.3 — AI Operations Module:
//     - modelRegistry.js exports registerModel, getModel, listModels, getModelRegistrySummary
//     - 4 AI models registered: AI-PLAN-001, AI-RESEARCH-001, AI-ANALYSIS-001, AI-WRITE-001
//     - modelBroker.js exports brokerAICapability, scoreModelCandidate, listApprovedModels
//     - brokerAICapability routes to best model by capability + data classification
//     - Data classification policy correctly blocks confidential from public-only models
//     - Missing capability returns AI_CAPABILITY_REQUIRED
//     - Missing classification returns DATA_CLASSIFICATION_REQUIRED
//
//   C5.4 — server.js /api/v1/modules route:
//     - Route registered in server.js
//     - Route calls listModuleSummaries
//
//   C5.4 — executive.ts:
//     - institutionalModules field present
//     - ModuleSummary interface exported
//
//   C5.4 — nexus-executive.html:
//     - institutionalModulesPanel element present
//     - loadModules() function present
//     - /api/v1/modules call present

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// C5.1 — Module Registry exports
// ---------------------------------------------------------------------------

const {
  MODULE_HEALTH_AGGREGATION,
  MODULE_LIFECYCLE,
  registerModule,
  getModule,
  listModules,
  resolveCapabilityToModule
} = require('../apps/sentinel/src/modules/registry');

assert(typeof registerModule === 'function', 'registry must export registerModule');
assert(typeof getModule === 'function', 'registry must export getModule');
assert(typeof listModules === 'function', 'registry must export listModules');
assert(typeof resolveCapabilityToModule === 'function', 'registry must export resolveCapabilityToModule');
assert(MODULE_HEALTH_AGGREGATION, 'registry must export MODULE_HEALTH_AGGREGATION');
assert(MODULE_LIFECYCLE, 'registry must export MODULE_LIFECYCLE');

console.log('  - modules/registry.js exports verified ✓');

// ---------------------------------------------------------------------------
// C5.2 — Initial module taxonomy: 6 modules registered
// ---------------------------------------------------------------------------

const EXPECTED_MODULES = [
  'executive-operations',
  'workflow-orchestration',
  'communications',
  'projects',
  'business-operations',
  'ai-operations'
];

const allModules = listModules();
assert(
  allModules.length >= EXPECTED_MODULES.length,
  `Expected at least ${EXPECTED_MODULES.length} modules, got ${allModules.length}`
);

EXPECTED_MODULES.forEach((moduleId) => {
  const mod = getModule(moduleId);
  assert(mod, `Module '${moduleId}' not registered`);
  assert(mod.displayName, `Module '${moduleId}' missing displayName`);
  assert(Array.isArray(mod.capabilities) && mod.capabilities.length > 0,
    `Module '${moduleId}' missing capabilities`);
  assert(Array.isArray(mod.providers) && mod.providers.length > 0,
    `Module '${moduleId}' missing providers`);
  assert(mod.governance && mod.governance.minimumRole,
    `Module '${moduleId}' missing governance.minimumRole`);
  assert(mod.lifecycleStatus === MODULE_LIFECYCLE.ACTIVE,
    `Module '${moduleId}' not active`);
});

console.log(`  - All ${EXPECTED_MODULES.length} initial modules registered with required fields ✓`);

// ---------------------------------------------------------------------------
// C5.2 — resolveCapabilityToModule
// ---------------------------------------------------------------------------

const nexusModule = resolveCapabilityToModule('NEXUS-READ-001');
assert(nexusModule, 'NEXUS-READ-001 should resolve to a module');
assert.strictEqual(nexusModule.moduleId, 'executive-operations',
  `Expected executive-operations, got ${nexusModule && nexusModule.moduleId}`);

const tildaModule = resolveCapabilityToModule('TILDA-EXECUTE-001');
assert(tildaModule, 'TILDA-EXECUTE-001 should resolve to a module');
assert.strictEqual(tildaModule.moduleId, 'workflow-orchestration',
  `Expected workflow-orchestration, got ${tildaModule && tildaModule.moduleId}`);

const githubModule = resolveCapabilityToModule('GITHUB-READ-001');
assert(githubModule, 'GITHUB-READ-001 should resolve to a module');
assert.strictEqual(githubModule.moduleId, 'projects',
  `Expected projects, got ${githubModule && githubModule.moduleId}`);

const unknownModule = resolveCapabilityToModule('NO-SUCH-CAP-999');
assert.strictEqual(unknownModule, null, 'Unknown capability should return null');

console.log('  - resolveCapabilityToModule correctly maps capabilities to modules ✓');

// ---------------------------------------------------------------------------
// C5.2 — Module Resolver exports
// ---------------------------------------------------------------------------

const {
  getModuleSummary,
  listModuleSummaries,
  computeModuleHealth
} = require('../apps/sentinel/src/modules/resolver');

assert(typeof getModuleSummary === 'function', 'resolver must export getModuleSummary');
assert(typeof listModuleSummaries === 'function', 'resolver must export listModuleSummaries');
assert(typeof computeModuleHealth === 'function', 'resolver must export computeModuleHealth');

console.log('  - modules/resolver.js exports verified ✓');

// ---------------------------------------------------------------------------
// C5.2 — getModuleSummary
// ---------------------------------------------------------------------------

const execOpsSummary = getModuleSummary('executive-operations');
assert(execOpsSummary, 'getModuleSummary should return a summary for executive-operations');
assert.strictEqual(execOpsSummary.moduleId, 'executive-operations');
assert(execOpsSummary.displayName, 'summary must have displayName');
assert(typeof execOpsSummary.capabilityCount === 'number', 'summary must have capabilityCount');
assert(['healthy', 'degraded', 'unknown'].includes(execOpsSummary.health),
  `summary.health must be healthy|degraded|unknown, got ${execOpsSummary.health}`);
assert(!('providers' in execOpsSummary),
  'getModuleSummary must NOT expose provider names to the institution');

console.log('  - getModuleSummary returns correct shape and does NOT expose provider names ✓');

// ---------------------------------------------------------------------------
// C5.2 — listModuleSummaries: returns all active without provider names
// ---------------------------------------------------------------------------

const summaries = listModuleSummaries();
assert(summaries.length >= EXPECTED_MODULES.length,
  `listModuleSummaries should return at least ${EXPECTED_MODULES.length} summaries`);

summaries.forEach((s) => {
  assert(s.moduleId, 'summary must have moduleId');
  assert(s.displayName, 'summary must have displayName');
  assert(typeof s.capabilityCount === 'number', 'summary must have capabilityCount');
  assert(['healthy', 'degraded', 'unknown'].includes(s.health),
    `summary.health must be in allowed set, got ${s.health}`);
  assert(!('providers' in s),
    `summary for ${s.moduleId} must NOT expose providers`);
});

console.log(`  - listModuleSummaries returns ${summaries.length} summaries, no provider names exposed ✓`);

// ---------------------------------------------------------------------------
// C5.3 — AI Operations: Model Registry
// ---------------------------------------------------------------------------

const {
  MODEL_DATA_CLASSIFICATION,
  MODEL_LIFECYCLE: ML,
  registerModel: _reg,
  getModel,
  listModels: listAIModels,
  getModelRegistrySummary
} = require('../apps/sentinel/src/modules/ai-operations/modelRegistry');

assert(typeof getModel === 'function', 'modelRegistry must export getModel');
assert(typeof listAIModels === 'function', 'modelRegistry must export listModels');
assert(typeof getModelRegistrySummary === 'function', 'modelRegistry must export getModelRegistrySummary');
assert(MODEL_DATA_CLASSIFICATION, 'modelRegistry must export MODEL_DATA_CLASSIFICATION');

console.log('  - modules/ai-operations/modelRegistry.js exports verified ✓');

const EXPECTED_AI_MODELS = ['AI-PLAN-001', 'AI-RESEARCH-001', 'AI-ANALYSIS-001', 'AI-WRITE-001'];

EXPECTED_AI_MODELS.forEach((modelId) => {
  const m = getModel(modelId);
  assert(m, `Model '${modelId}' not registered`);
  assert(m.provider, `Model '${modelId}' missing provider`);
  assert(Array.isArray(m.capabilities) && m.capabilities.length > 0, `Model '${modelId}' missing capabilities`);
  assert(Array.isArray(m.approvedDataClassifications) && m.approvedDataClassifications.length > 0,
    `Model '${modelId}' missing approvedDataClassifications`);
  assert(m.governance && m.governance.evidenceRequired === true,
    `Model '${modelId}' must have evidenceRequired: true`);
});

console.log(`  - All ${EXPECTED_AI_MODELS.length} AI models registered with required fields ✓`);

const aiSummary = getModelRegistrySummary();
assert(aiSummary.totalModels >= EXPECTED_AI_MODELS.length, 'getModelRegistrySummary must include all models');
assert(Array.isArray(aiSummary.providers), 'getModelRegistrySummary must include providers array');
assert(aiSummary.providers.includes('azure-openai'), 'AI registry must include azure-openai provider');
assert(aiSummary.providers.includes('openai'), 'AI registry must include openai provider');

console.log('  - getModelRegistrySummary returns correct shape ✓');

// ---------------------------------------------------------------------------
// C5.3 — AI Operations: Model Broker
// ---------------------------------------------------------------------------

const {
  scoreModelCandidate,
  brokerAICapability,
  listApprovedModels
} = require('../apps/sentinel/src/modules/ai-operations/modelBroker');

assert(typeof scoreModelCandidate === 'function', 'modelBroker must export scoreModelCandidate');
assert(typeof brokerAICapability === 'function', 'modelBroker must export brokerAICapability');
assert(typeof listApprovedModels === 'function', 'modelBroker must export listApprovedModels');

console.log('  - modules/ai-operations/modelBroker.js exports verified ✓');

// scoreModelCandidate: healthy scores higher than degraded
const healthyModel = { providerHealth: 'healthy', governance: { evidenceRequired: true }, cost: 3, latencyMs: 200 };
const degradedModel = { providerHealth: 'degraded', governance: { evidenceRequired: true }, cost: 3, latencyMs: 200 };
assert(
  scoreModelCandidate(healthyModel) > scoreModelCandidate(degradedModel),
  'healthy model must score higher than degraded model'
);

console.log('  - scoreModelCandidate: healthy > degraded ✓');

// brokerAICapability: missing capability returns AI_CAPABILITY_REQUIRED
const missingCap = brokerAICapability({ capability: '', dataClassification: 'public', role: 'operator' });
assert.strictEqual(missingCap.routed, false);
assert.strictEqual(missingCap.reason, 'AI_CAPABILITY_REQUIRED');

console.log('  - brokerAICapability: AI_CAPABILITY_REQUIRED for empty capability ✓');

// brokerAICapability: missing classification returns DATA_CLASSIFICATION_REQUIRED
const missingClass = brokerAICapability({ capability: 'planning', dataClassification: '', role: 'operator' });
assert.strictEqual(missingClass.routed, false);
assert.strictEqual(missingClass.reason, 'DATA_CLASSIFICATION_REQUIRED');

console.log('  - brokerAICapability: DATA_CLASSIFICATION_REQUIRED for empty classification ✓');

// brokerAICapability: routes planning + public correctly
const planResult = brokerAICapability({ capability: 'planning', dataClassification: 'public', role: 'operator', tenant: 'nexus' });
assert.strictEqual(planResult.routed, true, `planning/public should route; got reason: ${planResult.reason}`);
assert(planResult.modelId, 'should have a selected modelId');
assert(planResult.selected, 'should have selected object');
assert(planResult.evidenceRef, 'should have evidenceRef for ledger entry');
assert(planResult.governanceAdvice && planResult.governanceAdvice.evidenceRequired === true,
  'governanceAdvice must have evidenceRequired: true');

console.log('  - brokerAICapability routes planning/public to a model with evidence ref ✓');

// brokerAICapability: confidential classification blocks public-only models
const confidentialResult = brokerAICapability({ capability: 'analysis', dataClassification: 'confidential', role: 'operator' });
assert.strictEqual(confidentialResult.routed, false,
  `analysis/confidential should be blocked by classification policy`);
assert.strictEqual(confidentialResult.reason, 'DATA_CLASSIFICATION_POLICY_DENIED',
  `Expected DATA_CLASSIFICATION_POLICY_DENIED, got ${confidentialResult.reason}`);

console.log('  - brokerAICapability: confidential data blocked by classification policy ✓');

// brokerAICapability: candidates ranked by score descending
const researchResult = brokerAICapability({ capability: 'research', dataClassification: 'public', role: 'operator' });
if (researchResult.routed && researchResult.candidates && researchResult.candidates.length >= 2) {
  const scores = researchResult.candidates.map((c) => c.score);
  for (let i = 0; i < scores.length - 1; i++) {
    assert(scores[i] >= scores[i + 1], `candidates not ranked by score: ${scores}`);
  }
  console.log('  - brokerAICapability candidates ranked by score descending ✓');
} else {
  console.log('  - brokerAICapability ranking: single candidate (no ordering check needed) ✓');
}

// listApprovedModels: returns only public models when asked
const publicModels = listApprovedModels({ capability: 'planning', dataClassification: 'public' });
assert(Array.isArray(publicModels), 'listApprovedModels must return an array');
assert(publicModels.length >= 1, 'Should have at least 1 approved planning model for public data');
publicModels.forEach((m) => {
  assert(m.approvedDataClassifications.includes('public'),
    `Model ${m.modelId} should be approved for public data`);
});

console.log('  - listApprovedModels filters by capability and data classification ✓');

// ---------------------------------------------------------------------------
// C5.4 — server.js /api/v1/modules route
// ---------------------------------------------------------------------------

const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');
const serverSource = fs.readFileSync(serverPath, 'utf8');

assert(
  serverSource.includes("pathname === '/api/v1/modules'"),
  "server.js missing /api/v1/modules route"
);
assert(
  serverSource.includes('listModuleSummaries'),
  "server.js /api/v1/modules must call listModuleSummaries"
);

console.log('  - /api/v1/modules route registered in server.js ✓');

// ---------------------------------------------------------------------------
// C5.4 — executive.ts: institutionalModules field + ModuleSummary interface
// ---------------------------------------------------------------------------

const execTsPath = path.join(ROOT, 'apps', 'sentinel', 'src', 'planes', 'executive.ts');
const execTs = fs.readFileSync(execTsPath, 'utf8');

assert(execTs.includes('institutionalModules'), 'executive.ts missing institutionalModules field');
assert(execTs.includes('ModuleSummary'), 'executive.ts missing ModuleSummary interface');
assert(execTs.includes('listModuleSummaries'), 'executive.ts missing listModuleSummaries call');

console.log('  - executive.ts institutionalModules field and ModuleSummary interface present ✓');

// ---------------------------------------------------------------------------
// C5.4 — nexus-executive.html: Institutional Modules panel + loadModules()
// ---------------------------------------------------------------------------

const execHtmlPath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-executive.html');
const execHtml = fs.readFileSync(execHtmlPath, 'utf8');

[
  'institutionalModulesPanel',
  'loadModules',
  '/api/v1/modules',
  'Institutional Modules',
  'module-card',
  'module-name',
  'module-badge'
].forEach((needle) => {
  assert(execHtml.includes(needle), `nexus-executive.html missing: ${needle}`);
});

console.log('  - nexus-executive.html Institutional Modules panel and loadModules() present ✓');

// ---------------------------------------------------------------------------
// Constitution document
// ---------------------------------------------------------------------------

const constitutionPath = path.join(ROOT, 'docs', 'SENTINELOS_CONSTITUTION.md');
assert(fs.existsSync(constitutionPath), 'SENTINELOS_CONSTITUTION.md missing');

const constitution = fs.readFileSync(constitutionPath, 'utf8');
[
  'Principle of Institutional Simplicity',
  'Principle of Provider Abstraction',
  'Principle of Governed Capability',
  'Principle of Evidence Integrity',
  'Principle of Modular Coherence',
  'Principle of AI Governance',
  'Principle of Sovereign Runtime Stability',
  'Principle of Executive Oversight',
  'Principle of Operational Readiness',
  'Principle of Institutional Continuity',
  'Principle of Sovereign Expansion',
  'Principle of Constitutional Supremacy'
].forEach((principle) => {
  assert(constitution.includes(principle), `Constitution missing: ${principle}`);
});

console.log('  - SENTINELOS_CONSTITUTION.md present with all 12 principles ✓');

// ---------------------------------------------------------------------------
// C5.2 — Systematic Module Registry cross-validation
//
// Rules enforced:
//   1. Every capability referenced by a module exists in the Capability
//      Registry (technical caps) or the Model Registry (AI caps).
//   2. Every provider referenced by a module exists in the Provider Registry.
//   3. No capability is assigned to more than one module (no duplicate
//      capability assignments across modules).
//   4. healthAggregation values are valid ('all' | 'any').
//   5. All modules carry governance.minimumRole.
// ---------------------------------------------------------------------------

const { listCapabilities: listAllCaps } = require('../apps/sentinel/src/capabilities/registry');
const { listModels: listAllModels } = require('../apps/sentinel/src/modules/ai-operations/modelRegistry');
const { getProvider, listProviders } = require('../apps/sentinel/src/providers/registry');

const knownCapabilityIds = new Set(listAllCaps().map((c) => c.capabilityId));
const knownModelIds = new Set(listAllModels().map((m) => m.modelId));
const allKnownIds = new Set([...knownCapabilityIds, ...knownModelIds]);

const VALID_HEALTH_AGGREGATIONS = new Set(['all', 'any']);

const allRegisteredModules = listModules();
const capabilityAssignments = new Map(); // capabilityId -> moduleId (first seen)

let c52Errors = 0;

allRegisteredModules.forEach((mod) => {
  // Rule 4: healthAggregation is valid
  assert(
    VALID_HEALTH_AGGREGATIONS.has(mod.healthAggregation),
    `Module '${mod.moduleId}' has invalid healthAggregation: '${mod.healthAggregation}'`
  );

  // Rule 5: governance.minimumRole is present
  assert(
    mod.governance && mod.governance.minimumRole,
    `Module '${mod.moduleId}' missing governance.minimumRole`
  );

  // Rule 1: every capability ID exists in capability or model registry
  mod.capabilities.forEach((capId) => {
    if (!allKnownIds.has(capId)) {
      console.error(`  ❌ Module '${mod.moduleId}': unknown capabilityId '${capId}'`);
      c52Errors++;
    }

    // Rule 3: no duplicate capability assignment across modules
    if (capabilityAssignments.has(capId)) {
      console.error(
        `  ❌ Duplicate capability '${capId}' — assigned to both '${capabilityAssignments.get(capId)}' and '${mod.moduleId}'`
      );
      c52Errors++;
    } else {
      capabilityAssignments.set(capId, mod.moduleId);
    }
  });

  // Rule 2: every provider ID exists in the Provider Registry
  mod.providers.forEach((providerId) => {
    const p = getProvider(providerId);
    if (!p) {
      console.error(`  ❌ Module '${mod.moduleId}': unknown providerId '${providerId}'`);
      c52Errors++;
    }
  });
});

assert.strictEqual(c52Errors, 0, `C5.2 systematic validation failed with ${c52Errors} error(s) — see output above`);

console.log(`  - C5.2: all module capability IDs exist in Capability or Model Registry ✓`);
console.log(`  - C5.2: all module provider IDs exist in Provider Registry ✓`);
console.log(`  - C5.2: no duplicate capability assignments across modules ✓`);
console.log(`  - C5.2: all modules have valid healthAggregation and governance.minimumRole ✓`);

// Verify Provider Registry itself
const registeredProviders = listProviders();
assert(registeredProviders.length >= 7, `Provider Registry should have at least 7 providers`);

const EXPECTED_PROVIDERS = ['nexus', 'tilda', 'microsoft365', 'github', 'ownerfi', 'azure-openai', 'openai'];
EXPECTED_PROVIDERS.forEach((pid) => {
  const p = getProvider(pid);
  assert(p, `Provider '${pid}' not found in Provider Registry`);
  assert(p.displayName, `Provider '${pid}' missing displayName`);
  assert(p.type, `Provider '${pid}' missing type`);
  assert(p.lifecycleStatus, `Provider '${pid}' missing lifecycleStatus`);
});

console.log(`  - C5.2: Provider Registry has all ${EXPECTED_PROVIDERS.length} canonical providers ✓`);

// ---------------------------------------------------------------------------
// C5.3 — AI Operations Module extension validation
//
// Validates:
//   1. Extended data classifications (financial, restricted, classified) exist
//   2. New C5.3 models registered (azure-gpt-4o, openai-gpt-4o, local-embassy, agency-cleared)
//   3. C5.3 providers registered (local, agency-approved)
//   4. providers/health.js exports getProviderHealth and returns correct values
//   5. evidence/emit.js exports emitEvidence, getEvidenceLog, getEvidenceCount
//   6. modelBroker exports routeModel
//   7. routeModel gates: missing capabilityId → AI_CAPABILITY_REQUIRED
//   8. routeModel gates: missing dataClassification → DATA_CLASSIFICATION_REQUIRED
//   9. routeModel gates: missing sessionId → SESSION_ID_REQUIRED
//  10. routeModel routes ai-planning/public with evidence emission
//  11. routeModel blocks financial data from public-only models
//  12. routeModel selects local-embassy for financial classification
//  13. routeModel selects agency-cleared for classified data
// ---------------------------------------------------------------------------

const { MODEL_DATA_CLASSIFICATION: MDC } = require('../apps/sentinel/src/modules/ai-operations/modelRegistry');

// 1. Extended data classifications
['financial', 'restricted', 'classified'].forEach((cls) => {
  const key = cls.toUpperCase();
  assert(
    Object.values(MDC).includes(cls),
    `MODEL_DATA_CLASSIFICATION missing '${cls}' value`
  );
});
console.log('  - C5.3: MODEL_DATA_CLASSIFICATION includes financial, restricted, classified ✓');

// 2. New C5.3 models registered
const C53_MODELS = ['azure-gpt-4o', 'azure-gpt-4o-mini', 'openai-gpt-4o', 'openai-gpt-4o-mini', 'local-embassy', 'agency-cleared'];
C53_MODELS.forEach((modelId) => {
  const m = getModel(modelId);
  assert(m, `C5.3 model '${modelId}' not registered`);
  assert(m.provider, `C5.3 model '${modelId}' missing provider`);
  assert(Array.isArray(m.capabilities) && m.capabilities.length > 0, `C5.3 model '${modelId}' missing capabilities`);
  assert(Array.isArray(m.approvedDataClassifications) && m.approvedDataClassifications.length > 0,
    `C5.3 model '${modelId}' missing approvedDataClassifications`);
  assert(m.governance && m.governance.evidenceRequired === true, `C5.3 model '${modelId}' must have evidenceRequired: true`);
});
console.log(`  - C5.3: all ${C53_MODELS.length} C5.3 models registered ✓`);

// local-embassy: financial + restricted only
const localEmbassy = getModel('local-embassy');
assert(localEmbassy.approvedDataClassifications.includes('financial'), 'local-embassy must be approved for financial');
assert(localEmbassy.approvedDataClassifications.includes('restricted'), 'local-embassy must be approved for restricted');
assert(!localEmbassy.approvedDataClassifications.includes('public'), 'local-embassy must NOT be approved for public');
console.log('  - C5.3: local-embassy approved for financial + restricted only ✓');

// agency-cleared: classified only
const agencyCleared = getModel('agency-cleared');
assert(agencyCleared.approvedDataClassifications.includes('classified'), 'agency-cleared must be approved for classified');
assert(!agencyCleared.approvedDataClassifications.includes('public'), 'agency-cleared must NOT be approved for public');
console.log('  - C5.3: agency-cleared approved for classified only ✓');

// 3. C5.3 providers in Provider Registry
['local', 'agency-approved'].forEach((pid) => {
  const p = getProvider(pid);
  assert(p, `C5.3 provider '${pid}' not found in Provider Registry`);
  assert(p.type === 'ai', `C5.3 provider '${pid}' must be type 'ai'`);
});
console.log('  - C5.3: local and agency-approved in Provider Registry ✓');

// 4. providers/health.js — getProviderHealth
const { getProviderHealth } = require('../apps/sentinel/src/providers/health');
assert(typeof getProviderHealth === 'function', 'providers/health.js must export getProviderHealth');

const nexusHealth = getProviderHealth('nexus');
assert(['healthy', 'degraded', 'unknown'].includes(nexusHealth),
  `getProviderHealth('nexus') returned invalid value: ${nexusHealth}`);

const azureHealth = getProviderHealth('azure-openai');
assert(['healthy', 'degraded', 'unknown'].includes(azureHealth),
  `getProviderHealth('azure-openai') returned invalid value: ${azureHealth}`);

const unknownProviderHealth = getProviderHealth('no-such-provider-xyz');
assert.strictEqual(unknownProviderHealth, 'unknown', 'unknown provider must return unknown');
console.log('  - C5.3: providers/health.js getProviderHealth returns correct values ✓');

// 5. evidence/emit.js exports
const { emitEvidence, getEvidenceLog, getEvidenceCount } = require('../apps/sentinel/src/evidence/emit');
assert(typeof emitEvidence === 'function', 'evidence/emit.js must export emitEvidence');
assert(typeof getEvidenceLog === 'function', 'evidence/emit.js must export getEvidenceLog');
assert(typeof getEvidenceCount === 'function', 'evidence/emit.js must export getEvidenceCount');

const testEvidence = emitEvidence({
  sessionId: 'test-session-001',
  capabilityId: 'ai-planning',
  modelId: 'azure-gpt-4o',
  provider: 'azure-openai',
  dataClassification: 'public',
  timestamp: new Date().toISOString()
});
assert(testEvidence.evidenceId, 'emitEvidence must return evidenceId');
assert(testEvidence.evidenceId.startsWith('ai-ev/'), `evidenceId must start with 'ai-ev/', got: ${testEvidence.evidenceId}`);
assert(getEvidenceCount() >= 1, 'evidence log must have at least 1 entry after emit');
assert(Array.isArray(getEvidenceLog()), 'getEvidenceLog must return array');
console.log('  - C5.3: evidence/emit.js exports verified and emitEvidence works ✓');

// 6. routeModel exported
const { routeModel } = require('../apps/sentinel/src/modules/ai-operations/modelBroker');
assert(typeof routeModel === 'function', 'modelBroker must export routeModel');
console.log('  - C5.3: routeModel exported from modelBroker ✓');

// 7. routeModel gate: missing capabilityId
const rmMissingCap = routeModel({ capabilityId: '', dataClassification: 'public', sessionId: 'sess-001' });
assert.strictEqual(rmMissingCap.routed, false);
assert.strictEqual(rmMissingCap.reason, 'AI_CAPABILITY_REQUIRED');
console.log('  - C5.3: routeModel returns AI_CAPABILITY_REQUIRED for empty capabilityId ✓');

// 8. routeModel gate: missing dataClassification
const rmMissingClass = routeModel({ capabilityId: 'ai-planning', dataClassification: '', sessionId: 'sess-001' });
assert.strictEqual(rmMissingClass.routed, false);
assert.strictEqual(rmMissingClass.reason, 'DATA_CLASSIFICATION_REQUIRED');
console.log('  - C5.3: routeModel returns DATA_CLASSIFICATION_REQUIRED for empty classification ✓');

// 9. routeModel gate: missing sessionId
const rmMissingSession = routeModel({ capabilityId: 'ai-planning', dataClassification: 'public', sessionId: '' });
assert.strictEqual(rmMissingSession.routed, false);
assert.strictEqual(rmMissingSession.reason, 'SESSION_ID_REQUIRED');
console.log('  - C5.3: routeModel returns SESSION_ID_REQUIRED for empty sessionId ✓');

// 10. routeModel routes ai-planning/public with evidence emission
const countBefore = getEvidenceCount();
const rmPlanPublic = routeModel({ capabilityId: 'ai-planning', dataClassification: 'public', sessionId: 'sess-c53-001', role: 'operator' });
assert.strictEqual(rmPlanPublic.routed, true, `ai-planning/public should route; got reason: ${rmPlanPublic.reason}`);
assert(rmPlanPublic.modelId, 'routeModel must return modelId');
assert(rmPlanPublic.provider, 'routeModel must return provider');
assert(rmPlanPublic.evidenceId, 'routeModel must return evidenceId');
assert(rmPlanPublic.evidenceId.startsWith('ai-ev/'), 'evidenceId must start with ai-ev/');
assert(getEvidenceCount() > countBefore, 'evidence log must grow after routeModel call');
console.log('  - C5.3: routeModel routes ai-planning/public and emits evidence ✓');

// 11. routeModel blocks financial data from public-only models
const rmFinancialPublic = routeModel({ capabilityId: 'ai-analysis', dataClassification: 'financial', sessionId: 'sess-c53-002', role: 'operator' });
// Should succeed via local-embassy which is approved for financial
assert.strictEqual(rmFinancialPublic.routed, true, `ai-analysis/financial should route to local-embassy; got reason: ${rmFinancialPublic.reason}`);
assert.strictEqual(rmFinancialPublic.modelId, 'local-embassy', `Expected local-embassy, got ${rmFinancialPublic.modelId}`);
console.log('  - C5.3: routeModel routes ai-analysis/financial to local-embassy ✓');

// 12. routeModel selects agency-cleared for classified data (executive role required)
const rmClassified = routeModel({ capabilityId: 'ai-planning', dataClassification: 'classified', sessionId: 'sess-c53-003', role: 'executive' });
assert.strictEqual(rmClassified.routed, true, `ai-planning/classified should route to agency-cleared; got reason: ${rmClassified.reason}`);
assert.strictEqual(rmClassified.modelId, 'agency-cleared', `Expected agency-cleared, got ${rmClassified.modelId}`);
console.log('  - C5.3: routeModel routes ai-planning/classified to agency-cleared ✓');

// 13. routeModel blocks classified without executive role
const rmClassifiedNoRole = routeModel({ capabilityId: 'ai-planning', dataClassification: 'classified', sessionId: 'sess-c53-004', role: 'operator' });
assert.strictEqual(rmClassifiedNoRole.routed, false);
assert.strictEqual(rmClassifiedNoRole.reason, 'INSUFFICIENT_ROLE', `Expected INSUFFICIENT_ROLE, got ${rmClassifiedNoRole.reason}`);
console.log('  - C5.3: routeModel blocks classified data without executive role ✓');

console.log('\nALL C5 INSTITUTIONAL MODULE LAYER CHECKS PASSED ✓');
