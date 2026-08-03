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

console.log('\nALL C5 INSTITUTIONAL MODULE LAYER CHECKS PASSED ✓');
