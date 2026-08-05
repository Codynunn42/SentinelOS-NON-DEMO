const { runORV2 } = require('../orv/orv2');
const { listModules } = require('../modules/resolver');
const { computeEvidenceStatus } = require('../evidence/status');
const { getModuleEvidence } = require('../evidence/module');
const { getAIRoutingEvidence } = require('../evidence/ai');

function buildOutcomeBriefing() {
  const orv = runORV2();
  const modules = listModules();

  const moduleSummaries = modules.map((module) => ({
    moduleId: module.moduleId,
    displayName: module.displayName,
    healthStatus: module.healthStatus,
    evidence: getModuleEvidence().filter((entry) => entry.moduleId === module.moduleId),
    capabilities: (module.capabilities || []).map((capabilityId) => ({
      capabilityId,
      evidenceStatus: computeEvidenceStatus(capabilityId)
    }))
  }));

  return {
    title: 'Phase 2 Evidence Outcome Briefing',
    generatedAt: new Date().toISOString(),
    orv2: orv,
    modules: moduleSummaries,
    aiRoutingEvidence: getAIRoutingEvidence(),
    readiness: orv.passed ? 'ready-for-declaration' : 'not-ready'
  };
}

module.exports = {
  buildOutcomeBriefing
};
