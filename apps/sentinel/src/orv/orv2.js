const { getSNCSForCapability } = require('../evidence/sncs');
const { getModuleEvidence } = require('../evidence/module');
const { getAIRoutingEvidence } = require('../evidence/ai');
const { computeEvidenceStatus } = require('../evidence/status');
const { listModules } = require('../modules/resolver');

function scoreEvidenceCompleteness() {
  let score = 0;
  let total = 0;

  const modules = listModules();

  modules.forEach((module) => {
    (module.capabilities || []).forEach((capabilityId) => {
      total += 1;

      const status = computeEvidenceStatus(capabilityId);
      if (status === 'verified') {
        score += 1;
      }
    });
  });

  return {
    score,
    total,
    percent: total > 0 ? Math.round((score / total) * 100) : 0
  };
}

function scoreModuleLayer() {
  const evidence = getModuleEvidence();
  const resolution = evidence.filter((entry) => entry.type === 'module-resolution').length;
  const health = evidence.filter((entry) => entry.type === 'module-health').length;
  const denial = evidence.filter((entry) => entry.type === 'module-governance-denial').length;

  const passed = resolution > 0 && health > 0 && denial > 0;

  return {
    resolution,
    health,
    denial,
    passed
  };
}

function scoreAIRouting() {
  const ai = getAIRoutingEvidence();
  const passed = ai.length > 0;

  return {
    count: ai.length,
    passed
  };
}

function runORV2() {
  const evidence = scoreEvidenceCompleteness();
  const moduleLayer = scoreModuleLayer();
  const ai = scoreAIRouting();

  const passed = evidence.percent >= 90 && moduleLayer.passed && ai.passed;

  return {
    evidence,
    moduleLayer,
    ai,
    passed
  };
}

module.exports = {
  runORV2,
  scoreEvidenceCompleteness,
  scoreModuleLayer,
  scoreAIRouting
};
