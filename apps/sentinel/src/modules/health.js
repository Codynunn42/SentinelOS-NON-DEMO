const { emitModuleEvidence } = require('../evidence/module');

function emitModuleHealthEvidence(moduleId, healthStatus) {
  return emitModuleEvidence({
    type: 'module-health',
    moduleId,
    healthStatus
  });
}

function computeModuleHealth(module) {
  const moduleId = module && module.moduleId ? module.moduleId : 'unknown-module';
  const healthStatus = module && module.healthStatus ? module.healthStatus : 'healthy';

  return emitModuleHealthEvidence(moduleId, healthStatus);
}

module.exports = {
  emitModuleHealthEvidence,
  computeModuleHealth
};
