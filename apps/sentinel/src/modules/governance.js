const { emitModuleEvidence } = require('../evidence/module');

function emitModuleGovernanceDenialEvidence(moduleId, capabilityId, reason = 'capability-not-in-module') {
  return emitModuleEvidence({
    type: 'module-governance-denial',
    moduleId,
    capabilityId,
    reason
  });
}

function enforceModuleGovernance(module, capabilityId) {
  const moduleId = module && module.moduleId ? module.moduleId : 'unknown-module';
  const capabilities = Array.isArray(module && module.capabilities) ? module.capabilities : [];

  if (!capabilities.includes(capabilityId)) {
    emitModuleGovernanceDenialEvidence(moduleId, capabilityId, 'capability-not-in-module');
    throw new Error(`Capability ${capabilityId} not allowed for module ${moduleId}`);
  }

  return true;
}

module.exports = {
  emitModuleGovernanceDenialEvidence,
  enforceModuleGovernance
};
